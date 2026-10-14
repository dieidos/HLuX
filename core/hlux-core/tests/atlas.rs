//! Le fil de l'Atlas V4, rejoué sur le cœur : d'Amina au CHRS Les Lilas.

use ab_ante_core::{control_arm_trial, PurgeKey, Timestamp};
use hlux_core::model::*;
use hlux_core::{consent_bring, consent_not_now, Engine, FacilityAct, ProjectAct, SqliteStore, Who};

fn amina() -> Engine {
    Engine::open(SqliteStore::in_memory().unwrap(), "amina", "les-lilas").unwrap()
}

fn card(e: &mut Engine) {
    e.act(
        &Who::dictated("amina"),
        ProjectAct::CardCreated {
            card: "papiers".into(),
            title: "Papiers".into(),
            picto: Some("papiers".into()),
            verbatim: "Les lettres de la CAF, je les laisse fermées.".into(),
            lang: Lang::Fr,
            origin: Origin::Spoken,
            said_with: Some("Sarah".into()),
            when: "mardi".into(),
        },
    )
    .unwrap();
}

#[test]
fn ecran_01_02_la_carte_garde_tout_son_parcours() {
    let mut e = amina();
    card(&mut e);
    e.act(&Who::hand("amina"), ProjectAct::CardFelt { card: "papiers".into(), feeling: Feeling::Hard, when: "aujourd'hui".into() })
        .unwrap();
    let s = e.project_state();
    let c = &s.cards["papiers"];
    assert_eq!(c.feeling, Some(Feeling::Hard));
    assert_eq!(c.moments, vec!["mardi · dite avec Sarah", "aujourd'hui · dans « c'est difficile »"]);
    // Le verbatim est gardé mot pour mot.
    assert_eq!(c.verbatim, "Les lettres de la CAF, je les laisse fermées.");
}

#[test]
fn annuler_est_le_meme_geste_a_l_envers() {
    let mut e = amina();
    card(&mut e);
    let felt = e
        .act(&Who::hand("amina"), ProjectAct::CardFelt { card: "papiers".into(), feeling: Feeling::Hard, when: "aujourd'hui".into() })
        .unwrap();
    e.undo("amina", felt.rank.0).unwrap();
    assert_eq!(e.project_state().cards["papiers"].feeling, None);
    // Rien ne s'efface : le journal garde le geste et sa compensation.
    assert_eq!(e.project_journal().entries().len(), 3);
}

#[test]
fn ecran_03_ecarter_par_le_bord_est_irreversible() {
    let mut e = amina();
    e.act(&Who::hand("amina"), ProjectAct::IdeaCreated { idea: "lire".into(), title: "Comprendre mes courriers seule".into(), from_card: Some("papiers".into()), in_session: false })
        .unwrap();
    e.act(&Who::hand("amina"), ProjectAct::IdeaPlaced { idea: "lire".into(), spot: Spot::Crossing(Crossing::Profession) }).unwrap();
    e.act(&Who::hand("amina"), ProjectAct::IdeaPlaced { idea: "lire".into(), spot: Spot::Discarded }).unwrap();
    e.act(&Who::hand("amina"), ProjectAct::IdeaPlaced { idea: "lire".into(), spot: Spot::Circle(Circle::Love) }).unwrap();
    assert_eq!(e.project_state().ideas["lire"].spot, Spot::Discarded);
}

#[test]
fn le_collectif_valide_ce_que_l_aide_propose_et_deplacer_garde_la_qualification() {
    let mut e = amina();
    let placed = FacilityAct::FindingPlaced { finding: "c1".into(), title: "Les courriers".into(), zone: Feeling::Unsure, source: Source::Team, author: "Bruno".into(), picto: Some("papiers".into()) };
    e.act_facility(&Who::hand("bruno"), placed).unwrap();
    e.act_facility(&Who::hand("bruno"), FacilityAct::FindingQualified { finding: "c1".into(), level: Qualification::Confirmed }).unwrap();
    e.act_facility(&Who::hand("bruno"), FacilityAct::FindingPlaced { finding: "c1".into(), title: "Les courriers".into(), zone: Feeling::Hard, source: Source::Team, author: "Bruno".into(), picto: None }).unwrap();
    assert_eq!(e.facility_state().findings["c1"].level, Qualification::Confirmed);
    // L'image venue de la Carte reste sur la carte déplacée.
    assert_eq!(e.facility_state().findings["c1"].picto.as_deref(), Some("papiers"));
    // Un texte libre à la place d'une image ne passe pas.
    e.act_facility(&Who::hand("bruno"), FacilityAct::FindingPlaced { finding: "c9".into(), title: "x".into(), zone: Feeling::Unsure, source: Source::Team, author: "Bruno".into(), picto: Some("Amina a peur".into()) }).unwrap();
    assert_eq!(e.facility_state().findings["c9"].picto, None);

    let p = e.act_facility(&Who::machine(), FacilityAct::FindingPlaced { finding: "c2".into(), title: "Proposé".into(), zone: Feeling::Unsure, source: Source::Team, author: "".into(), picto: None }).unwrap();
    assert_eq!(e.pending_facility().len(), 1, "la proposition attend l'animateur");
    assert!(!e.facility_state().findings.contains_key("c2"));
    e.confirm_facility(p.rank.0, "Bruno").unwrap();
    assert!(e.pending_facility().is_empty());
    assert!(e.facility_state().findings.contains_key("c2"));
    let last = e.act_facility(&Who::hand("bruno"), FacilityAct::FindingQualified { finding: "c2".into(), level: Qualification::Confirmed }).unwrap();
    e.undo_facility("bruno", last.rank.0).unwrap();
    assert_eq!(e.facility_state().findings["c2"].level, Qualification::Individual);
}

#[test]
fn la_machine_propose_un_humain_valide() {
    let mut e = amina();
    card(&mut e);
    let p = e.act(&Who::machine(), ProjectAct::CardSimpler { card: "papiers".into(), text: "Les lettres me font peur.".into() }).unwrap();
    assert_eq!(e.pending().len(), 1, "la proposition attend un humain");
    assert!(e.project_state().cards["papiers"].awaiting_validation);
    e.confirm(p.rank.0, "amina").unwrap();
    assert!(e.pending().is_empty());
    let c = &e.project_state().cards["papiers"];
    assert_eq!(c.simpler.as_deref(), Some("Les lettres me font peur."));
    assert!(!c.awaiting_validation);
    // « Plus simple » est à côté du verbatim, jamais à sa place.
    assert_eq!(c.verbatim, "Les lettres de la CAF, je les laisse fermées.");
}

#[test]
fn ecran_07_le_sas_ne_laisse_passer_que_la_version_pour_le_collectif() {
    let mut e = amina();
    card(&mut e);
    let s = e
        .act(
            &Who::hand("amina"),
            ProjectAct::SubjectPrepared {
                subject: "courriers".into(),
                card: "papiers".into(),
                mine: "Les lettres de la CAF, je les laisse fermées.".into(),
                for_collective: "Comprendre les courriers administratifs est difficile pour plusieurs personnes.".into(),
            },
        )
        .unwrap();
    let now = Timestamp::from_raw(10);
    // « Pas maintenant » : rien ne passe.
    assert!(e.bring_subject(s.rank.0, &consent_not_now(), "les-lilas", "seance-12-janvier", now).is_err());
    // « Oui, j'apporte » : quatre champs, et seulement la version pour le collectif.
    let out = e.bring_subject(s.rank.0, &consent_bring(Timestamp::from_raw(100)), "les-lilas", "seance-12-janvier", now).unwrap().unwrap();
    assert_eq!(out.space, "hlux.facility:les-lilas");
    assert_eq!(out.content, "Comprendre les courriers administratifs est difficile pour plusieurs personnes.");
    assert!(!out.content.contains("CAF, je les laisse"));
    // Un consentement échu ne vaut plus.
    assert!(e.bring_subject(s.rank.0, &consent_bring(Timestamp::from_raw(5)), "les-lilas", "s", now).is_err());
    // Une Carte qui n'est pas un sujet ne traverse jamais.
    assert!(e.bring_subject(0, &consent_bring(Timestamp::from_raw(100)), "les-lilas", "s", now).is_err());
}

#[test]
fn ecran_10_on_voit_qui_a_place_jamais_ou_avant_la_revelation() {
    let mut e = amina();
    let w = |n: &str| Who::hand(n);
    e.act_facility(&w("aicha"), FacilityAct::Orientation { orientation: "courriers".into(), title: "Accompagner la lecture des courriers".into() }).unwrap();
    e.act_facility(&w("aicha"), FacilityAct::PrivatePlacement { orientation: "courriers".into(), criterion: Criterion::Effect, by: "Aïcha".into(), lean: Lean::Much }).unwrap();
    e.act_facility(&w("bruno"), FacilityAct::PrivatePlacement { orientation: "courriers".into(), criterion: Criterion::Effect, by: "Bruno".into(), lean: Lean::Much }).unwrap();
    let s = e.facility_state();
    let o = &s.orientations["courriers"];
    assert_eq!(o.placed_by, vec!["Aïcha", "Bruno"]);
    assert!(o.placements.is_empty(), "scellé tant que rien n'est révélé");
    e.act_facility(&w("aicha"), FacilityAct::Revealed { orientation: "courriers".into() }).unwrap();
    assert_eq!(e.facility_state().orientations["courriers"].placements.len(), 2);
}

#[test]
fn ecran_09_plusieurs_placements_restent_cote_a_cote() {
    let mut e = amina();
    for (by, c) in [("Aïcha", Crossing::Mission), ("Bruno", Crossing::Vocation)] {
        e.act_facility(&Who::hand(by), FacilityAct::CapPlaced { cap: "lecture".into(), title: "Accompagner la lecture des courriers".into(), by: by.into(), spot: Spot::Crossing(c) }).unwrap();
    }
    assert_eq!(e.facility_state().caps["lecture"].1.len(), 2);
}

#[test]
fn le_profil_se_rejoue_a_l_identique_depuis_la_base() {
    let dir = std::env::temp_dir().join(format!("hlux-test-{}", std::process::id()));
    let _ = std::fs::remove_file(&dir);
    {
        let mut e = Engine::open(SqliteStore::open(&dir, None).unwrap(), "amina", "les-lilas").unwrap();
        card(&mut e);
        e.act(&Who::hand("amina"), ProjectAct::CardFelt { card: "papiers".into(), feeling: Feeling::Hard, when: "aujourd'hui".into() }).unwrap();
    }
    let e = Engine::open(SqliteStore::open(&dir, None).unwrap(), "amina", "les-lilas").unwrap();
    assert_eq!(e.project_state().cards["papiers"].feeling, Some(Feeling::Hard));
    // Une altération de la base est détectée au rejeu.
    let conn = rusqlite::Connection::open(&dir).unwrap();
    conn.execute("UPDATE gestures SET author = 'quelqu''un' WHERE rank = 0", []).unwrap();
    drop(conn);
    assert!(Engine::open(SqliteStore::open(&dir, None).unwrap(), "amina", "les-lilas").is_err());
    let _ = std::fs::remove_file(&dir);
}

#[test]
fn depart_d_amina_la_purge_n_emporte_pas_le_voisin() {
    let mut store = SqliteStore::in_memory().unwrap();
    let r = control_arm_trial(&mut store, &PurgeKey("amina".into()), &PurgeKey("amin".into()), 3);
    assert!(r.is_ok(), "{r:?}");
}

#[test]
fn aucun_score_dans_le_modele() {
    // Aucune valeur numérique ne doit décrire une personne, une idée ou un avis.
    // On lit le code, pas les commentaires (qui expliquent l'interdit).
    let src: String = include_str!("../src/model.rs")
        .lines()
        .filter(|l| !l.trim_start().starts_with("//"))
        .collect::<Vec<_>>()
        .join("
");
    for t in [": u8", ": u16", ": u32", ": u64", ": i32", ": i64", ": f32", ": f64", "score", "moyenne", "average", "vote"] {
        assert!(!src.contains(t), "le modèle contient « {t} »");
    }
}
