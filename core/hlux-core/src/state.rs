//! L'état courant, reconstruit en rejouant le journal (`Journal::standing`).
//!
//! Les compensations (annuler = le même geste à l'envers) sont déjà écartées par ab-ante.

use std::collections::BTreeMap;

use ab_ante_core::{Entry, Provenance, Reducer};
use serde::Serialize;

use crate::act::{FacilityAct, ProjectAct};
use crate::model::*;

/// Une Carte, avec tout son parcours (« Ta Carte garde tout son parcours »).
#[derive(Debug, Clone, Default, Serialize)]
pub struct Card {
    pub title: String,
    pub picto: Option<String>,
    pub verbatim: String,
    pub lang: Option<Lang>,
    pub origin: Option<Origin>,
    pub said_with: Option<String>,
    /// Plus simple — à côté, jamais à la place.
    pub simpler: Option<String>,
    pub translations: Vec<(Lang, String)>,
    pub feeling: Option<Feeling>,
    /// Les moments datés, en mots.
    pub moments: Vec<String>,
    /// Une production de la machine attend-elle une validation ?
    pub awaiting_validation: bool,
}

/// Une idée, toujours liée à sa Carte.
#[derive(Debug, Clone, Serialize)]
pub struct Idea {
    pub title: String,
    pub from_card: Option<Id>,
    pub in_session: bool,
    pub spot: Spot,
}

/// Une invitation des Regards.
#[derive(Debug, Clone, Serialize)]
pub struct Invitation {
    pub guest: String,
    pub relation: String,
    pub idea: Id,
    pub axes: Vec<Circle>,
    pub lang: Lang,
    pub expires: String,
    pub channel: Option<Channel>,
    pub idea_text: Option<String>,
    /// La réponse n'est lisible qu'après « Nos regards réunis ».
    pub answered: bool,
    pub leans: Vec<(Circle, Lean)>,
    pub word: Option<String>,
}

/// Un nœud du chemin.
#[derive(Debug, Clone, Serialize)]
pub struct Node {
    pub lane: String,
    pub kind: NodeKind,
    pub label: String,
    pub when: String,
    pub thread: bool,
    /// La Carte dont l'étape est née.
    pub card: Option<Id>,
}

/// Un « Et si… ? » : question, déplacements sur la copie, récit, sortie (gardée / refermée).
pub type WhatIfView = (String, Vec<(Id, String)>, Option<String>, Option<bool>);

/// Une carte-solution : titre, modalité, rythme, regards (effet ?, qui, penchant).
pub type SolutionView = (String, String, String, Vec<(bool, String, Lean)>);

/// L'état du Projet Personnalisé.
#[derive(Debug, Clone, Default, Serialize)]
pub struct ProjectState {
    pub cards: BTreeMap<Id, Card>,
    pub ideas: BTreeMap<Id, Idea>,
    pub axis_ranks: BTreeMap<Circle, Rank>,
    /// (axe, auteur) → ordre des idées, de peu à beaucoup.
    pub lines: BTreeMap<String, Vec<Id>>,
    pub companion_order: Option<(String, Vec<(Circle, Rank)>)>,
    pub invitations: BTreeMap<Id, Invitation>,
    pub views_revealed: bool,
    pub nodes: BTreeMap<Id, Node>,
    pub links: Vec<(Id, Id, LinkKind)>,
    /// « Et si… ? » ouverts — sur copie, le vrai chemin ne bouge pas.
    pub what_ifs: BTreeMap<Id, WhatIfView>,
    pub plan: Plan,
    pub subjects: BTreeMap<Id, (Id, String, String)>,
    pub linked_proposals: Vec<(String, Id)>,
}

/// Le réducteur du Projet Personnalisé.
pub struct ProjectReducer;

impl Reducer<ProjectAct> for ProjectReducer {
    type State = ProjectState;
    type Key = String;

    fn initial(&self) -> ProjectState {
        ProjectState::default()
    }

    fn fold(&self, s: &mut ProjectState, e: &Entry<ProjectAct>, act: &ProjectAct) {
        let pending = e.provenance == Provenance::Hypothesis;
        match act.clone() {
            ProjectAct::CardCreated { card, title, picto, verbatim, lang, origin, said_with, when } => {
                // Le moment dit comment la Carte est née : dite, écrite, ou choisie en image.
                let verb = match origin {
                    Origin::Spoken => "dite",
                    Origin::Written => "écrite",
                    Origin::Picture => "choisie",
                };
                let moment = match &said_with {
                    Some(w) => format!("{when} · {verb} avec {w}"),
                    None => when,
                };
                s.cards.insert(
                    card,
                    Card {
                        title,
                        picto,
                        verbatim,
                        lang: Some(lang),
                        origin: Some(origin),
                        said_with,
                        moments: vec![moment],
                        ..Card::default()
                    },
                );
            }
            // Une proposition de la machine (« hypothesis ») ne touche pas la Carte : elle attend un humain.
            // Validée, elle est ré-écrite en « generated » avec `confirmed_by`, et c'est celle-là qui compte.
            ProjectAct::CardSimpler { card, text } => {
                if let Some(c) = s.cards.get_mut(&card) {
                    if pending {
                        c.awaiting_validation = true;
                    } else {
                        c.simpler = Some(text);
                        c.awaiting_validation = false;
                    }
                }
            }
            ProjectAct::CardTranslated { card, lang, text } => {
                if let Some(c) = s.cards.get_mut(&card) {
                    if pending {
                        c.awaiting_validation = true;
                    } else {
                        c.translations.retain(|(l, _)| *l != lang);
                        c.translations.push((lang, text));
                        c.awaiting_validation = false;
                    }
                }
            }
            ProjectAct::CardFelt { card, feeling, when } => {
                if let Some(c) = s.cards.get_mut(&card) {
                    c.feeling = Some(feeling);
                    c.moments.push(format!("{when} · dans « {} »", feeling_words(feeling)));
                }
            }
            ProjectAct::CardBack { card, when } => {
                if let Some(c) = s.cards.get_mut(&card) {
                    c.feeling = None;
                    c.moments.push(format!("{when} · reposée dans la réserve"));
                }
            }
            ProjectAct::IdeaCreated { idea, title, from_card, in_session } => {
                s.ideas.insert(idea, Idea { title, from_card, in_session, spot: Spot::Tray });
            }
            ProjectAct::IdeaPlaced { idea, spot } => {
                if let Some(i) = s.ideas.get_mut(&idea) {
                    // Écartée par le bord : irréversible, l'écran l'a dit.
                    if i.spot != Spot::Discarded {
                        i.spot = spot;
                    }
                }
            }
            ProjectAct::AxisRanked { axis, rank } => {
                s.axis_ranks.insert(axis, rank);
            }
            ProjectAct::AxisUnranked { axis } => {
                s.axis_ranks.remove(&axis);
            }
            ProjectAct::LineOrdered { axis, author, order } => {
                s.lines.insert(line_key(axis, &author), order);
            }
            ProjectAct::CompanionOrder { by, ranks } => s.companion_order = Some((by, ranks)),
            ProjectAct::InvitationSent { invitation, guest, relation, idea, axes, lang, expires, channel, idea_text } => {
                s.invitations.insert(
                    invitation,
                    Invitation { guest, relation, idea, axes, lang, expires, channel, idea_text, answered: false, leans: vec![], word: None },
                );
            }
            ProjectAct::InvitationAnswered { invitation, leans, word } => {
                if let Some(i) = s.invitations.get_mut(&invitation) {
                    i.answered = true;
                    i.leans = leans;
                    i.word = word;
                }
            }
            ProjectAct::ViewsRevealed => s.views_revealed = true,
            ProjectAct::NodeSet { node, lane, kind, label, when, thread, card } => {
                s.nodes.insert(node, Node { lane, kind, label, when, thread, card });
            }
            ProjectAct::LinkSet { from, to, link } => {
                s.links.retain(|(f, t, _)| !(f == &from && t == &to));
                s.links.push((from, to, link));
            }
            ProjectAct::WhatIf { sim, question, moves, story } => {
                s.what_ifs.insert(sim, (question, moves, story, None));
            }
            ProjectAct::WhatIfClosed { sim, kept } => {
                if let Some(w) = s.what_ifs.get_mut(&sim) {
                    w.3 = Some(kept);
                }
            }
            ProjectAct::PlanSet { plan } => s.plan = plan,
            ProjectAct::SubjectPrepared { subject, card, mine, for_collective } => {
                s.subjects.insert(subject, (card, mine, for_collective));
            }
            ProjectAct::SubjectDeclined { card, when } => {
                if let Some(c) = s.cards.get_mut(&card) {
                    c.moments.push(format!("{when} · pas maintenant"));
                }
            }
            ProjectAct::ProposalLinked { proposal, node } => s.linked_proposals.push((proposal, node)),
        }
    }

    fn key(&self, act: &ProjectAct) -> String {
        match act {
            ProjectAct::CardCreated { card, .. }
            | ProjectAct::CardSimpler { card, .. }
            | ProjectAct::CardTranslated { card, .. }
            | ProjectAct::CardFelt { card, .. }
            | ProjectAct::CardBack { card, .. } => format!("card:{card}"),
            ProjectAct::IdeaCreated { idea, .. } | ProjectAct::IdeaPlaced { idea, .. } => format!("idea:{idea}"),
            ProjectAct::AxisRanked { axis, .. } | ProjectAct::AxisUnranked { axis } => format!("axis:{axis:?}"),
            ProjectAct::LineOrdered { axis, author, .. } => format!("line:{}", line_key(*axis, author)),
            ProjectAct::CompanionOrder { .. } => "companion-order".into(),
            ProjectAct::InvitationSent { invitation, .. } | ProjectAct::InvitationAnswered { invitation, .. } => {
                format!("invitation:{invitation}")
            }
            ProjectAct::ViewsRevealed => "views".into(),
            ProjectAct::NodeSet { node, .. } => format!("node:{node}"),
            ProjectAct::LinkSet { from, to, .. } => format!("link:{from}>{to}"),
            ProjectAct::WhatIf { sim, .. } | ProjectAct::WhatIfClosed { sim, .. } => format!("whatif:{sim}"),
            ProjectAct::PlanSet { .. } => "plan".into(),
            ProjectAct::SubjectPrepared { subject, .. } => format!("subject:{subject}"),
            ProjectAct::SubjectDeclined { card, .. } => format!("card:{card}"),
            ProjectAct::ProposalLinked { proposal, .. } => format!("proposal:{proposal}"),
        }
    }

    fn key_said(&self, said: &str) -> Option<String> {
        // Le collectif ne lit jamais le chemin : seule une proposition peut revenir.
        said.strip_prefix("proposal:").map(|p| format!("proposal:{p}"))
    }
}

/// Les mots d'un lieu du Ressenti.
pub fn feeling_words(f: Feeling) -> &'static str {
    match f {
        Feeling::Fine => "ça va",
        Feeling::Unsure => "je ne sais pas",
        Feeling::Hard => "c'est difficile",
    }
}

fn line_key(axis: Circle, author: &str) -> String {
    format!("{axis:?}/{author}")
}

/// Une carte du constat.
#[derive(Debug, Clone, Serialize)]
pub struct Finding {
    pub title: String,
    pub zone: Feeling,
    pub source: Source,
    pub author: String,
    pub level: Qualification,
    pub picto: Option<String>,
}

/// Une orientation et ses placements.
#[derive(Debug, Clone, Default, Serialize)]
pub struct OrientationView {
    pub title: String,
    /// Qui a placé — visible avant la révélation.
    pub placed_by: Vec<String>,
    /// Les placements — vides tant que rien n'est révélé.
    pub placements: Vec<(Criterion, String, Lean)>,
    pub revealed: bool,
    pub readings: Vec<(bool, Vec<String>, Criterion, String)>,
    pub decision: Option<(String, String)>,
    #[serde(skip)]
    sealed: Vec<(Criterion, String, Lean)>,
}

/// Un engagement : texte, solution, fil (d'où il vient), quand en reparler, qui le porte.
pub type CommitmentRow = (String, Id, Vec<String>, String, Vec<String>);

/// L'état du Projet d'Établissement.
#[derive(Debug, Clone, Default, Serialize)]
pub struct FacilityState {
    pub agenda: Vec<(Id, String, Source, String)>,
    /// point de l'ordre du jour → l'image de la Carte d'où il vient.
    pub agenda_pictos: BTreeMap<Id, String>,
    pub attendance: Option<(String, Vec<String>, Vec<String>, String)>,
    pub floor: Option<String>,
    pub mandate: Option<String>,
    pub findings: BTreeMap<Id, Finding>,
    /// carte de cap → placements nominatifs (tous gardés, côte à côte).
    pub caps: BTreeMap<Id, (String, Vec<(String, Spot)>)>,
    pub expected_change: Option<(Id, String, bool)>,
    pub criteria: BTreeMap<Criterion, Rank>,
    pub orientations: BTreeMap<Id, OrientationView>,
    pub solutions: BTreeMap<Id, SolutionView>,
    pub commitments: BTreeMap<Id, CommitmentRow>,
    pub nodes: BTreeMap<Id, Node>,
    pub links: Vec<(Id, Id, LinkKind)>,
    pub loads: BTreeMap<Id, (String, Vec<String>, String)>,
    pub results: Vec<(String, bool, String)>,
    pub proposals: BTreeMap<Id, String>,
}

/// Le réducteur du Projet d'Établissement.
pub struct FacilityReducer;

impl Reducer<FacilityAct> for FacilityReducer {
    type State = FacilityState;
    type Key = String;

    fn initial(&self) -> FacilityState {
        FacilityState::default()
    }

    fn fold(&self, s: &mut FacilityState, e: &Entry<FacilityAct>, act: &FacilityAct) {
        // Une proposition de la machine attend que l'animatrice la valide pour le groupe :
        // elle ne compte pas tant qu'elle n'est pas ré-écrite en « generated », confirmée.
        if e.provenance == Provenance::Hypothesis {
            return;
        }
        match act.clone() {
            FacilityAct::AgendaItem { item, title, source, session, picto } => {
                if let Some(p) = picto {
                    s.agenda_pictos.insert(item.clone(), p);
                }
                s.agenda.push((item, title, source, session));
            }
            FacilityAct::Attendance { session, present, absent, facilitator } => {
                s.attendance = Some((session, present, absent, facilitator));
            }
            FacilityAct::FloorGiven { to, .. } => s.floor = Some(to),
            FacilityAct::FindingPlaced { finding, title, zone, source, author, picto } => {
                // Déplacer une carte garde sa qualification : seul le groupe la change (FindingQualified).
                let level = s.findings.get(&finding).map(|f| f.level).unwrap_or(Qualification::Individual);
                let picto = picto.or_else(|| s.findings.get(&finding).and_then(|f| f.picto.clone()));
                s.findings.insert(finding, Finding { title, zone, source, author, level, picto });
            }
            FacilityAct::FindingQualified { finding, level } => {
                if let Some(f) = s.findings.get_mut(&finding) {
                    f.level = level;
                }
            }
            FacilityAct::MandateSet { to } => s.mandate = Some(to),
            FacilityAct::CapPlaced { cap, title, by, spot } => {
                let e = s.caps.entry(cap).or_insert_with(|| (title, vec![]));
                e.1.retain(|(who, _)| who != &by);
                e.1.push((by, spot));
            }
            FacilityAct::ExpectedChange { cap, text, validated } => s.expected_change = Some((cap, text, validated)),
            FacilityAct::CriterionRanked { criterion, rank } => {
                s.criteria.insert(criterion, rank);
            }
            FacilityAct::Orientation { orientation, title } => {
                s.orientations.entry(orientation).or_default().title = title;
            }
            FacilityAct::PrivatePlacement { orientation, criterion, by, lean } => {
                let o = s.orientations.entry(orientation).or_default();
                if !o.placed_by.contains(&by) {
                    o.placed_by.push(by.clone());
                }
                o.sealed.retain(|(c, who, _)| !(c == &criterion && who == &by));
                o.sealed.push((criterion, by, lean));
                if o.revealed {
                    o.placements = o.sealed.clone();
                }
            }
            FacilityAct::Revealed { orientation } => {
                let o = s.orientations.entry(orientation).or_default();
                o.revealed = true;
                o.placements = o.sealed.clone();
            }
            FacilityAct::Reading { orientation, converge, people, criterion, phrase } => {
                s.orientations.entry(orientation).or_default().readings.push((converge, people, criterion, phrase));
            }
            FacilityAct::Decision { orientation, dictated, words } => {
                s.orientations.entry(orientation).or_default().decision = Some((dictated, words));
            }
            FacilityAct::Solution { solution, title, modality, rhythm } => {
                s.solutions.insert(solution, (title, modality, rhythm, vec![]));
            }
            FacilityAct::SolutionLean { solution, effect, by, lean } => {
                if let Some(x) = s.solutions.get_mut(&solution) {
                    x.3.retain(|(e, who, _)| !(*e == effect && who == &by));
                    x.3.push((effect, by, lean));
                }
            }
            FacilityAct::Commitment { commitment, text, solution, thread, review, carriers } => {
                s.commitments.insert(commitment, (text, solution, thread, review, carriers));
            }
            FacilityAct::NodeSet { node, lane, kind, label, when } => {
                s.nodes.insert(node, Node { lane, kind, label, when, thread: false, card: None });
            }
            FacilityAct::LinkSet { from, to, link } => {
                s.links.retain(|(f, t, _)| !(f == &from && t == &to));
                s.links.push((from, to, link));
            }
            FacilityAct::Load { load, name, carriers, rhythm } => {
                s.loads.insert(load, (name, carriers, rhythm));
            }
            FacilityAct::Result { text, back_to_finding, when } => s.results.push((text, back_to_finding, when)),
            FacilityAct::Proposal { proposal, text } => {
                s.proposals.insert(proposal, text);
            }
        }
    }

    fn key(&self, act: &FacilityAct) -> String {
        serde_json::to_value(act)
            .ok()
            .and_then(|v| v.get("act").and_then(|a| a.as_str()).map(str::to_string))
            .unwrap_or_default()
    }

    fn key_said(&self, _said: &str) -> Option<String> {
        None
    }
}
