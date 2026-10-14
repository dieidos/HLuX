//! Le pont vers React Native (UniFFI 0.28 → uniffi-bindgen-react-native, TurboModule).
//!
//! Surface **volontairement étroite, en JSON** : un geste entre, un état sort. Les types métier
//! restent dans `hlux-core` ; l'interface TypeScript (`app/src/core/acts.ts`) parle déjà ce JSON
//! (mêmes étiquettes serde), si bien que le pont remplace le rejeu TypeScript sans toucher aux écrans.
//!
//! Une instance = un profil ouvert (une base, une clé). Fermer, c'est lâcher l'instance.

use std::sync::Mutex;

use ab_ante_core::Provenance;
use hlux_core::{Engine, FacilityAct, ProjectAct, SqliteStore, Who};

uniffi::setup_scaffolding!();

/// Ce que le pont refuse, en mots.
#[derive(Debug, thiserror::Error, uniffi::Error)]
pub enum HluxError {
    #[error("geste illisible : {0}")]
    BadGesture(String),
    #[error("stockage : {0}")]
    Store(String),
}

fn store_err(e: impl std::fmt::Display) -> HluxError {
    HluxError::Store(e.to_string())
}

fn who(author: &str, provenance: &str) -> Result<Who, HluxError> {
    let provenance = match provenance {
        "by_hand" => Provenance::ByHand,
        "dictated" => Provenance::Dictated,
        "hypothesis" => Provenance::Hypothesis,
        other => return Err(HluxError::BadGesture(format!("provenance inconnue `{other}`"))),
    };
    Ok(Who { author: author.into(), provenance })
}

/// Le moteur d'un profil, vu de JavaScript.
#[derive(uniffi::Object)]
pub struct HluxEngine {
    engine: Mutex<Engine>,
}

#[uniffi::export]
impl HluxEngine {
    /// Ouvre le profil `person` de l'établissement `facility`, dans la base `path` chiffrée par `key`.
    #[uniffi::constructor]
    pub fn open(path: String, key: Option<String>, person: String, facility: String) -> Result<std::sync::Arc<Self>, HluxError> {
        let store = SqliteStore::open(path, key.as_deref()).map_err(store_err)?;
        let engine = Engine::open(store, &person, &facility).map_err(store_err)?;
        Ok(std::sync::Arc::new(Self { engine: Mutex::new(engine) }))
    }

    /// Un geste du Projet Personnalisé (JSON de `ProjectAct`) ; rend le rang écrit.
    pub fn act(&self, author: String, provenance: String, act_json: String) -> Result<u64, HluxError> {
        let act: ProjectAct = serde_json::from_str(&act_json).map_err(|e| HluxError::BadGesture(e.to_string()))?;
        let w = who(&author, &provenance)?;
        let e = self.engine.lock().expect("moteur").act(&w, act).map_err(store_err)?;
        Ok(e.rank.0)
    }

    /// Un geste du Projet d'Établissement (JSON de `FacilityAct`), sur la copie locale.
    pub fn act_facility(&self, author: String, provenance: String, act_json: String) -> Result<u64, HluxError> {
        let act: FacilityAct = serde_json::from_str(&act_json).map_err(|e| HluxError::BadGesture(e.to_string()))?;
        let w = who(&author, &provenance)?;
        let e = self.engine.lock().expect("moteur").act_facility(&w, act).map_err(store_err)?;
        Ok(e.rank.0)
    }

    /// Annuler : le même geste à l'envers.
    pub fn undo(&self, author: String, rank: u64) -> Result<(), HluxError> {
        self.engine.lock().expect("moteur").undo(&author, rank).map_err(store_err)
    }

    /// Valider une proposition de la machine.
    pub fn confirm(&self, rank: u64, by: String) -> Result<u64, HluxError> {
        let e = self.engine.lock().expect("moteur").confirm(rank, &by).map_err(store_err)?;
        Ok(e.rank.0)
    }

    /// Annuler un geste du collectif.
    pub fn undo_facility(&self, author: String, rank: u64) -> Result<(), HluxError> {
        self.engine.lock().expect("moteur").undo_facility(&author, rank).map_err(store_err)
    }

    /// L'animateur valide un texte de l'aide, après accord du groupe.
    pub fn confirm_facility(&self, rank: u64, by: String) -> Result<u64, HluxError> {
        let e = self.engine.lock().expect("moteur").confirm_facility(rank, &by).map_err(store_err)?;
        Ok(e.rank.0)
    }

    /// Les propositions au collectif en attente : `[[rang, geste], …]` en JSON.
    pub fn pending_facility(&self) -> String {
        serde_json::to_string(&self.engine.lock().expect("moteur").pending_facility()).expect("attente sérialisable")
    }

    /// L'état du Projet Personnalisé, en JSON.
    pub fn project_state(&self) -> String {
        serde_json::to_string(&self.engine.lock().expect("moteur").project_state()).expect("état sérialisable")
    }

    /// L'état du Projet d'Établissement, en JSON.
    pub fn facility_state(&self) -> String {
        serde_json::to_string(&self.engine.lock().expect("moteur").facility_state()).expect("état sérialisable")
    }

    /// Les propositions en attente : `[[rang, geste], …]` en JSON.
    pub fn pending(&self) -> String {
        serde_json::to_string(&self.engine.lock().expect("moteur").pending()).expect("attente sérialisable")
    }

    /// La tête de la chaîne du Projet Personnalisé : un témoin, sans contenu.
    pub fn project_head(&self) -> String {
        self.engine.lock().expect("moteur").project_head()
    }
}
