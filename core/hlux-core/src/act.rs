//! Les gestes, tels qu'ils entrent au journal ab-ante.
//!
//! Chaque geste de l'Atlas est **une entrée**. L'état se reconstruit en rejouant (voir `state`).
//! Annuler n'est pas un geste ici : c'est `Journal::undo_one`, une compensation.

use ab_ante_core::AsChainBytes;
use serde::{Deserialize, Serialize};

use crate::model::*;

/// Projet Personnalisé — espace `hlux.project:<personne>`, stocké sur l'appareil.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case", tag = "act")]
pub enum ProjectAct {
    // ── 01 Cartes ──
    /// Nouvelle Carte : je parle / j'écris / je choisis une image.
    CardCreated {
        card: Id,
        title: String,
        picto: Option<String>,
        verbatim: String,
        lang: Lang,
        origin: Origin,
        said_with: Option<String>,
        when: String,
    },
    /// Version « Plus simple » (FALC), affichée **à côté** du verbatim.
    CardSimpler { card: Id, text: String },
    /// Traduction, le verbatim d'origine reste.
    CardTranslated { card: Id, lang: Lang, text: String },

    // ── 02 Ressenti ──
    /// Prendre → poser dans une zone.
    CardFelt { card: Id, feeling: Feeling, when: String },
    /// La Carte est reposée dans la réserve : elle n'est plus posée, et son parcours le garde.
    CardBack { card: Id, when: String },

    // ── 03 Envies ──
    /// Une idée naît d'une Carte (ou de la séance).
    IdeaCreated { idea: Id, title: String, from_card: Option<Id>, in_session: bool },
    /// Posée sur l'Ikigai (déplaçable ; `Discarded` est irréversible).
    IdeaPlaced { idea: Id, spot: Spot },

    // ── 04 Priorités ──
    /// Volet A : un axe posé dans un rang (des ex æquo sont permis).
    AxisRanked { axis: Circle, rank: Rank },
    /// L'axe revient parmi ceux à ranger.
    AxisUnranked { axis: Circle },
    /// Volet B : l'ordre des idées sur une ligne, de gauche (peu) à droite (beaucoup).
    LineOrdered { axis: Circle, author: String, order: Vec<Id> },

    // ── 05 Regards ──
    /// L'ordre de Sarah : une autre lecture, qui ne déplace aucune marque.
    CompanionOrder { by: String, ranks: Vec<(Circle, Rank)> },
    /// Invitation d'un proche sur **une** idée (lien temporaire, sans compte).
    InvitationSent {
        invitation: Id,
        guest: String,
        relation: String,
        idea: Id,
        axes: Vec<Circle>,
        lang: Lang,
        /// Échéance (date ISO) : passé ce jour, l'invitation est expirée et le lien se repose.
        expires: String,
        /// Par où part le lien (absent dans les journaux d'avant le 2026-10-14).
        #[serde(default)]
        channel: Option<Channel>,
        /// L'idée dans la langue de l'invité, confirmée par la personne qui invite.
        #[serde(default)]
        idea_text: Option<String>,
    },
    /// Réponse d'un invité : un penchant par axe, et un mot libre facultatif.
    InvitationAnswered { invitation: Id, leans: Vec<(Circle, Lean)>, word: Option<String> },
    /// Tous les regards se découvrent ensemble.
    ViewsRevealed,

    // ── 06 Chemin ──
    /// Un nœud ◆ / ● sur un couloir.
    NodeSet { node: Id, lane: String, kind: NodeKind, label: String, when: String, thread: bool },
    /// Un lien entre deux nœuds.
    LinkSet { from: Id, to: Id, link: LinkKind },
    /// « Et si… ? » sur une copie : le vrai chemin ne bouge pas.
    WhatIf { sim: Id, question: String, moves: Vec<(Id, String)>, story: Option<String> },
    /// Sortie explicite d'un « Et si… ? » : garder l'idée ou refermer.
    WhatIfClosed { sim: Id, kept: bool },
    /// Le plan, en quatre cases, dans ses mots.
    PlanSet { plan: Plan },

    // ── 07 / 12 — le pont, côté personne ──
    /// Le sujet préparé pour le collectif (deux versions côte à côte).
    SubjectPrepared { subject: Id, card: Id, mine: String, for_collective: String },
    /// « Pas maintenant » : rien ne passe ; la Carte le garde dans son parcours.
    SubjectDeclined { card: Id, when: String },
    /// « Je le relie à mon chemin » — un seul sens, du collectif vers elle.
    ProposalLinked { proposal: String, node: Id },
}

/// Projet d'Établissement — espace `hlux.facility:<établissement>`, partagé via dieidos.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case", tag = "act")]
pub enum FacilityAct {
    // ── 07 Sujets ──
    /// Un sujet consenti entre à l'ordre du jour.
    AgendaItem { item: Id, title: String, source: Source, session: String },
    /// Présents et absents (« absente, c'est normal »).
    Attendance { session: String, present: Vec<String>, absent: Vec<String>, facilitator: String },

    // ── 08 Constat ──
    /// Tour de parole : la tablette circule.
    FloorGiven { session: String, to: String },
    /// Une carte posée sur la table au pluriel.
    FindingPlaced { finding: Id, title: String, zone: Feeling, source: Source, author: String },
    /// Qualification décidée par le groupe.
    FindingQualified { finding: Id, level: Qualification },
    /// Le mandat d'animation se retire et se redonne.
    MandateSet { to: String },

    // ── 09 Cap ──
    /// Une carte de cap, placée par une personne nommée (plusieurs placements gardés).
    CapPlaced { cap: Id, title: String, by: String, spot: Spot },
    /// Le changement attendu, dicté puis validé.
    ExpectedChange { cap: Id, text: String, validated: bool },

    // ── 10 Choix ──
    /// Le groupe range les six critères.
    CriterionRanked { criterion: Criterion, rank: Rank },
    /// Une orientation à discuter.
    Orientation { orientation: Id, title: String },
    /// Placement privé : scellé jusqu'à la révélation.
    PrivatePlacement { orientation: Id, criterion: Criterion, by: String, lean: Lean },
    /// Révélation simultanée.
    Revealed { orientation: Id },
    /// Phrase de convergence ou d'écart, validée (jamais un chiffre).
    Reading { orientation: Id, converge: bool, people: Vec<String>, criterion: Criterion, phrase: String },
    /// Notre décision : dictée, reformulée, validée par le groupe.
    Decision { orientation: Id, dictated: String, words: String },

    // ── 11 Actions ──
    /// Une carte-solution.
    Solution { solution: Id, title: String, modality: String, rhythm: String },
    /// Regards réunis sur effet ou faisabilité.
    SolutionLean { solution: Id, effect: bool, by: String, lean: Lean },
    /// La carte-engagement, avec son fil.
    Commitment {
        commitment: Id,
        text: String,
        solution: Id,
        thread: Vec<String>,
        review: String,
        /// Qui le porte (prénoms) ; absent des journaux d'avant le 2026-10-14.
        #[serde(default)]
        carriers: Vec<String>,
    },

    // ── 12 Suivi ──
    /// Chemin collectif : même grammaire que le chemin d'Amina.
    NodeSet { node: Id, lane: String, kind: NodeKind, label: String, when: String },
    /// Lien du chemin collectif.
    LinkSet { from: Id, to: Id, link: LinkKind },
    /// Ce que nous portons : prénoms et rythme, jamais de total.
    Load { load: Id, name: String, carriers: Vec<String>, rhythm: String },
    /// Le résultat, en mots ; peut renvoyer au constat.
    Result {
        text: String,
        back_to_finding: bool,
        /// Le jour, en mots ; absent des journaux d'avant le 2026-10-14.
        #[serde(default)]
        when: String,
    },
    /// Ce que le CHRS propose, visible depuis l'espace de la personne.
    Proposal { proposal: Id, text: String },
}

/// Les octets identifiants d'un geste : sa forme JSON canonique.
fn canonical<T: Serialize>(v: &T) -> Vec<u8> {
    serde_json::to_vec(v).expect("un geste se sérialise toujours")
}

impl AsChainBytes for ProjectAct {
    fn chain_bytes(&self) -> impl AsRef<[u8]> {
        canonical(self)
    }
}

impl AsChainBytes for FacilityAct {
    fn chain_bytes(&self) -> impl AsRef<[u8]> {
        canonical(self)
    }
}
