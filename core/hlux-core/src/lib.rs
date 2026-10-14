//! # hlux-core — le cœur d'HLuX (Harmonia LuX)
//!
//! Projet Personnalisé et Projet d'Établissement, posés sur le protocole **ad-hoc-ab-ante** :
//! journal local chaîné, consentement à quatre états, cristallisation, aucun score, verrou humain.
//!
//! La spécification fonctionnelle est l'Atlas V4 ; le cahier des charges est `CDC - HLuX.md`.

#![forbid(unsafe_code)]

pub mod act;
pub mod engine;
pub mod model;
pub mod state;
pub mod store;

pub use act::{FacilityAct, ProjectAct};
pub use engine::{consent_bring, consent_not_now, BridgeError, Engine, ForCollective, Who};
pub use state::{FacilityState, ProjectState};
pub use store::{SqliteStore, StoreError};
