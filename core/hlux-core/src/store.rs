//! Le store SQLite : **une base par profil**, une table filée par espace (D14).
//!
//! ⛳ ab-ante ne permet pas de reconstruire une `Entry` depuis des octets (`EntryId` n'a pas de
//! constructeur public). On persiste donc **les gestes** (auteur, provenance, graine, charge ou
//! rang annulé) et on **rejoue** à l'ouverture : les identifiants sont dérivés, le rejeu est donc
//! exact. L'identifiant stocké sert de témoin : s'il diffère au rejeu, la base a été altérée.
//!
//! Chiffrement : la fonctionnalité `sqlcipher` (build mobile) ouvre la base avec `PRAGMA key`.
//! Sans elle (tests, poste de dev), la base est en clair.

use std::path::Path;

use ab_ante_core::{
    Actor, AsChainBytes, Authority, Body, Entry, Journal, Provenance, PurgeKey, Rank, Resolution, Seed, Space,
};
use rusqlite::{params, Connection};
use serde::{de::DeserializeOwned, Serialize};

/// Les erreurs du support — jamais mêlées aux refus du protocole.
#[derive(Debug, thiserror::Error)]
pub enum StoreError {
    #[error("sqlite : {0}")]
    Sql(#[from] rusqlite::Error),
    #[error("json : {0}")]
    Json(#[from] serde_json::Error),
    #[error("journal altéré au rang {0} : l'identifiant rejoué ne correspond pas")]
    Tampered(u64),
    #[error("refus du protocole : {0:?}")]
    Refused(ab_ante_core::Refusal),
}

/// Une base SQLite (chiffrée sur mobile) pour tous les espaces d'un profil.
pub struct SqliteStore {
    conn: Connection,
}

impl SqliteStore {
    /// Ouvre — ou crée — la base. `key` est la clé du profil (Keychain / Keystore).
    pub fn open(path: impl AsRef<Path>, key: Option<&str>) -> Result<Self, StoreError> {
        let conn = Connection::open(path)?;
        Self::init(conn, key)
    }

    /// Base en mémoire, pour les tests.
    pub fn in_memory() -> Result<Self, StoreError> {
        Self::init(Connection::open_in_memory()?, None)
    }

    fn init(conn: Connection, key: Option<&str>) -> Result<Self, StoreError> {
        if let Some(k) = key {
            // Sans SQLCipher, ce pragma est ignoré par SQLite : c'est voulu en dev, pas en prod.
            conn.pragma_update(None, "key", k)?;
        }
        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS gestures (
                space TEXT NOT NULL,
                rank INTEGER NOT NULL,
                id_hex TEXT NOT NULL,
                author TEXT NOT NULL,
                confirmed_by TEXT,
                provenance INTEGER NOT NULL,
                seed INTEGER NOT NULL,
                payload TEXT,
                undone INTEGER,
                PRIMARY KEY (space, rank)
            );",
        )?;
        Ok(Self { conn })
    }

    /// Persiste l'entrée que le journal vient de produire, sous **son** espace.
    pub fn append<P: Serialize>(&self, space: &Space, e: &Entry<P>) -> Result<(), StoreError> {
        let (payload, undone) = match &e.body {
            Body::Said(p) => (Some(serde_json::to_string(p)?), None),
            Body::Undone(r) => (None, Some(r.0 as i64)),
        };
        self.conn.execute(
            "INSERT INTO gestures (space, rank, id_hex, author, confirmed_by, provenance, seed, payload, undone)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            params![
                space.as_text(),
                e.rank.0 as i64,
                e.id.hex(),
                e.author.0,
                e.confirmed_by.as_ref().map(|a| a.0.clone()),
                e.provenance as u8,
                e.seed.0 as i64,
                payload,
                undone,
            ],
        )?;
        Ok(())
    }

    /// Relit un espace en **rejouant** ses gestes, et vérifie chaque identifiant.
    pub fn replay<P>(&self, space: &Space) -> Result<Journal<P>, StoreError>
    where
        P: AsChainBytes + Clone + DeserializeOwned,
    {
        let mut stmt = self.conn.prepare(
            "SELECT rank, id_hex, author, confirmed_by, provenance, seed, payload, undone
             FROM gestures WHERE space = ?1 ORDER BY rank",
        )?;
        let rows = stmt.query_map(params![space.as_text()], |r| {
            Ok((
                r.get::<_, i64>(0)?,
                r.get::<_, String>(1)?,
                r.get::<_, String>(2)?,
                r.get::<_, Option<String>>(3)?,
                r.get::<_, u8>(4)?,
                r.get::<_, i64>(5)?,
                r.get::<_, Option<String>>(6)?,
                r.get::<_, Option<i64>>(7)?,
            ))
        })?;
        let mut j = Journal::<P>::new(space.clone());
        for row in rows {
            let (rank, id_hex, author, confirmed, prov, seed, payload, undone) = row?;
            let ticket = Authority::InProcess.ticket(&Resolution::fresh()).map_err(StoreError::Refused)?;
            let e = match (payload, undone) {
                (Some(p), _) => j.record(
                    ticket,
                    Actor(author),
                    confirmed.map(Actor),
                    provenance_of(prov),
                    Seed(seed as u64),
                    serde_json::from_str(&p)?,
                ),
                (None, Some(r)) => j
                    .undo_one(ticket, Actor(author), Seed(seed as u64), Rank(r as u64))
                    .map_err(StoreError::Refused)?,
                (None, None) => return Err(StoreError::Tampered(rank as u64)),
            };
            if e.id.hex() != id_hex {
                return Err(StoreError::Tampered(rank as u64));
            }
        }
        // La chaîne relue doit être intacte (comme `Chain::intact` de dieidos-lms).
        if let Err(r) = ab_ante_core::verify_chain(&space.as_text(), j.entries()) {
            return Err(StoreError::Refused(r));
        }
        Ok(j)
    }

    /// Les espaces présents dans la base.
    pub fn spaces(&self) -> Result<Vec<String>, StoreError> {
        let mut stmt = self.conn.prepare("SELECT DISTINCT space FROM gestures ORDER BY space")?;
        let v = stmt.query_map([], |r| r.get::<_, String>(0))?.collect::<Result<Vec<_>, _>>()?;
        Ok(v)
    }

    /// Efface tout ce qui appartient à une clé : une personne (`hlux.project:amina`, etc.).
    ///
    /// La clé est le **qualificatif** d'espace ; on efface les espaces dont le qualificatif est
    /// exactement la clé, jamais un voisin qui la contiendrait en préfixe.
    pub fn purge_key(&self, key: &PurgeKey) -> Result<usize, StoreError> {
        let n = self.conn.execute(
            "DELETE FROM gestures WHERE substr(space, instr(space, ':') + 1) = ?1",
            params![key.0],
        )?;
        Ok(n)
    }

    /// Nombre de gestes sous une clé.
    pub fn count_key(&self, key: &PurgeKey) -> Result<usize, StoreError> {
        let n: i64 = self.conn.query_row(
            "SELECT COUNT(*) FROM gestures WHERE substr(space, instr(space, ':') + 1) = ?1",
            params![key.0],
            |r| r.get(0),
        )?;
        Ok(n as usize)
    }
}

fn provenance_of(v: u8) -> Provenance {
    match v {
        1 => Provenance::Dictated,
        2 => Provenance::Hypothesis,
        3 => Provenance::Generated,
        _ => Provenance::ByHand,
    }
}

/// La purge, telle qu'ab-ante l'éprouve (`control_arm_trial`).
impl ab_ante_core::PurgeSubject for SqliteStore {
    type Error = StoreError;

    fn write_under(&mut self, key: &PurgeKey) -> Result<(), StoreError> {
        let space = Space::parse(&format!("hlux.project:{}", key.0));
        let n = self.count_key(key)? as i64;
        self.conn.execute(
            "INSERT INTO gestures (space, rank, id_hex, author, confirmed_by, provenance, seed, payload, undone)
             VALUES (?1, ?2, 'mark', 'trial', NULL, 0, 0, '\"mark\"', NULL)",
            params![space.as_text(), n],
        )?;
        Ok(())
    }

    fn count_under(&self, key: &PurgeKey) -> Result<usize, StoreError> {
        self.count_key(key)
    }

    fn purge(&mut self, key: &PurgeKey) -> Result<(), StoreError> {
        self.purge_key(key).map(|_| ())
    }
}
