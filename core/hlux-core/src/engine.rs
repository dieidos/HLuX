//! Le moteur d'un profil : un journal par espace, persisté geste par geste.
//!
//! - `hlux.project:<personne>` — Projet Personnalisé, sur l'appareil.
//! - `hlux.facility:<établissement>` — Projet d'Établissement, copie locale du collectif.
//!
//! Les productions de la machine entrent en `Provenance::Hypothesis` : elles attendent dans
//! `Journal::pending()` qu'un humain les valide (`confirm`), et sont alors ré-écrites en
//! `Provenance::Generated` avec `confirmed_by`.

use ab_ante_core::{
    Actor, Authority, Consent, ConsentKind, Crystallization, Entry, Journal, Provenance, Rank, Resolution, Seed,
    Space, Timestamp, Utterance,
};
use ab_ante_mcp::{project, Attachment, Capabilities, Outgoing, Session, SessionId};

use crate::act::{FacilityAct, ProjectAct};
use crate::state::{FacilityReducer, FacilityState, ProjectReducer, ProjectState};
use crate::store::{SqliteStore, StoreError};

/// Qui écrit, et d'où vient le geste.
#[derive(Debug, Clone)]
pub struct Who {
    /// Prénom choisi (jamais une preuve).
    pub author: String,
    /// À la main, dicté, ou proposé par la machine.
    pub provenance: Provenance,
}

impl Who {
    /// Un geste fait à la main.
    pub fn hand(author: &str) -> Self {
        Self { author: author.into(), provenance: Provenance::ByHand }
    }
    /// Un geste dicté.
    pub fn dictated(author: &str) -> Self {
        Self { author: author.into(), provenance: Provenance::Dictated }
    }
    /// Une proposition de la machine, en attente de validation.
    pub fn machine() -> Self {
        Self { author: "hlux-ia".into(), provenance: Provenance::Hypothesis }
    }
}

/// Le moteur d'un profil.
pub struct Engine {
    store: SqliteStore,
    project: Journal<ProjectAct>,
    facility: Journal<FacilityAct>,
    authority: Authority,
}

impl Engine {
    /// Ouvre un profil : rejoue les deux espaces depuis la base.
    ///
    /// L'autorité est `InProcess` sur la tablette (aucun serveur) ; les écritures du collectif
    /// hors ligne restent possibles et sont poussées à la reconnexion.
    pub fn open(store: SqliteStore, person: &str, facility: &str) -> Result<Self, StoreError> {
        let ps = Space::parse(&format!("hlux.project:{person}"));
        let fs = Space::parse(&format!("hlux.facility:{facility}"));
        let project = store.replay(&ps)?;
        let facility = store.replay(&fs)?;
        Ok(Self { store, project, facility, authority: Authority::InProcess })
    }

    /// La graine est le rang à venir **dans l'espace** (comme dieidos-lms) : sans horloge ni
    /// hasard, le rejeu est reproductible, pas seulement plausible.
    fn seed_of<P: ab_ante_core::AsChainBytes + Clone>(j: &Journal<P>) -> Seed {
        Seed(j.entries().len() as u64)
    }

    /// La tête de la chaîne du Projet Personnalisé : un témoin vérifiable, sans contenu.
    pub fn project_head(&self) -> String {
        self.project.head().hex()
    }

    /// La tête de la chaîne du Projet d'Établissement.
    pub fn facility_head(&self) -> String {
        self.facility.head().hex()
    }

    fn ticket(&self) -> Result<ab_ante_core::WriteTicket, StoreError> {
        self.authority.ticket(&Resolution::fresh()).map_err(StoreError::Refused)
    }

    /// Enregistre un geste du Projet Personnalisé.
    pub fn act(&mut self, who: &Who, act: ProjectAct) -> Result<Entry<ProjectAct>, StoreError> {
        let t = self.ticket()?;
        let seed = Self::seed_of(&self.project);
        let e = self.project.record(t, Actor(who.author.clone()), None, who.provenance, seed, act);
        self.store.append(self.project.space(), &e)?;
        Ok(e)
    }

    /// Enregistre un geste du Projet d'Établissement (copie locale).
    pub fn act_facility(&mut self, who: &Who, act: FacilityAct) -> Result<Entry<FacilityAct>, StoreError> {
        let t = self.ticket()?;
        let seed = Self::seed_of(&self.facility);
        let e = self.facility.record(t, Actor(who.author.clone()), None, who.provenance, seed, act);
        self.store.append(self.facility.space(), &e)?;
        Ok(e)
    }

    /// Annuler = le même geste à l'envers : une compensation, rien ne s'efface.
    pub fn undo(&mut self, author: &str, rank: u64) -> Result<(), StoreError> {
        let t = self.ticket()?;
        let seed = Self::seed_of(&self.project);
        let e = self.project.undo_one(t, Actor(author.into()), seed, Rank(rank)).map_err(StoreError::Refused)?;
        self.store.append(self.project.space(), &e)
    }

    /// Valide une proposition de la machine : elle est ré-écrite, confirmée par un humain,
    /// et la proposition d'origine est compensée (elle ne reste pas « en attente »).
    pub fn confirm(&mut self, rank: u64, by: &str) -> Result<Entry<ProjectAct>, StoreError> {
        let original = self
            .project
            .pending()
            .into_iter()
            .find(|e| e.rank.0 == rank)
            .cloned()
            .ok_or(StoreError::Tampered(rank))?;
        let ab_ante_core::Body::Said(act) = original.body else { return Err(StoreError::Tampered(rank)) };
        let t = self.ticket()?;
        let seed = Self::seed_of(&self.project);
        let e = self.project.record(t, original.author.clone(), Some(Actor(by.into())), Provenance::Generated, seed, act);
        self.store.append(self.project.space(), &e)?;
        let t = self.ticket()?;
        let seed = Self::seed_of(&self.project);
        let u = self.project.undo_one(t, Actor(by.into()), seed, Rank(rank)).map_err(StoreError::Refused)?;
        self.store.append(self.project.space(), &u)?;
        Ok(e)
    }

    /// Les propositions de la machine en attente d'un humain.
    pub fn pending(&self) -> Vec<(u64, ProjectAct)> {
        self.project
            .pending()
            .into_iter()
            .filter_map(|e| match &e.body {
                ab_ante_core::Body::Said(a) => Some((e.rank.0, a.clone())),
                ab_ante_core::Body::Undone(_) => None,
            })
            .collect()
    }

    /// L'état du Projet Personnalisé.
    pub fn project_state(&self) -> ProjectState {
        self.project.standing(&ProjectReducer)
    }

    /// L'état du Projet d'Établissement.
    pub fn facility_state(&self) -> FacilityState {
        self.facility.standing(&FacilityReducer)
    }

    /// Le journal du Projet Personnalisé (lecture).
    pub fn project_journal(&self) -> &Journal<ProjectAct> {
        &self.project
    }

    /// Le sas (écran 07) : « Oui, j'apporte ».
    ///
    /// Seul le sujet préparé (version « pour le collectif ») traverse, et seulement si le
    /// consentement à publier est accordé à cet instant. Ce qui sort : 4 champs, pas un de plus.
    pub fn bring_subject(
        &self,
        subject_rank: u64,
        consent: &Consent,
        facility: &str,
        session: &str,
        now: Timestamp,
    ) -> Result<Option<Outgoing>, BridgeError> {
        let entry = self
            .project
            .entries()
            .iter()
            .find(|e| e.rank.0 == subject_rank)
            .ok_or(BridgeError::NoSuchSubject)?;
        if !matches!(&entry.body, ab_ante_core::Body::Said(ProjectAct::SubjectPrepared { .. })) {
            return Err(BridgeError::NoSuchSubject);
        }
        let target = Space::parse(&format!("hlux.facility:{facility}"));
        let c = Crystallization::from(consent, entry, target, now).map_err(BridgeError::Refused)?;
        let s = Session::open(SessionId(session.into()), Capabilities { elicitation: true }, Attachment::Attached)
            .map_err(|e| BridgeError::Session(e.to_string()))?;
        project(&s, &c, entry, &ForCollective).map_err(|e| BridgeError::Projection(format!("{e:?}")))
    }
}

/// Ce que le sas refuse.
#[derive(Debug, thiserror::Error)]
pub enum BridgeError {
    #[error("ce sujet n'existe pas")]
    NoSuchSubject,
    #[error("refus du protocole : {0:?}")]
    Refused(ab_ante_core::Refusal),
    #[error("session : {0}")]
    Session(String),
    #[error("projection : {0}")]
    Projection(String),
}

/// La phrase qui traverse : **seulement** la version « pour le collectif ».
pub struct ForCollective;

impl Utterance<ProjectAct> for ForCollective {
    fn say(&self, act: &ProjectAct) -> String {
        match act {
            ProjectAct::SubjectPrepared { for_collective, .. } => for_collective.clone(),
            // Rien d'autre du Projet Personnalisé n'a de phrase pour le collectif.
            _ => String::new(),
        }
    }
}

/// Consentement à publier, accordé jusqu'à une date (« Oui, j'apporte »).
pub fn consent_bring(until: Timestamp) -> Consent {
    Consent::granted_until(ConsentKind::Publish, None, until)
}

/// « Pas maintenant » : un refus explicite, distinct de « jamais demandé ».
pub fn consent_not_now() -> Consent {
    Consent { state: ab_ante_core::ConsentState::Declined, ..Consent::never_asked(ConsentKind::Publish) }
}
