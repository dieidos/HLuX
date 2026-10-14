//! Le pont parle le JSON de l'interface (`app/src/core/acts.ts`) : un geste écrit par l'app
//! entre tel quel, l'état sort en JSON, et tout survit à la réouverture de la base.
use hlux_ffi::HluxEngine;

const CARD: &str = r#"{"act":"card_created","card":"papiers","title":"Papiers","picto":"papiers","verbatim":"Les lettres de la CAF, je les laisse fermées.","lang":"fr","origin":"spoken","said_with":"Sarah","when":"mardi"}"#;

#[test]
fn un_geste_de_l_app_entre_et_l_etat_sort_puis_survit_a_la_reouverture() {
    let dir = std::env::temp_dir().join(format!("hlux-ffi-{}", std::process::id()));
    std::fs::create_dir_all(&dir).unwrap();
    let path = dir.join("amina.db").to_string_lossy().to_string();
    let _ = std::fs::remove_file(&path);

    let e = HluxEngine::open(path.clone(), None, "amina".into(), "les-lilas".into()).unwrap();
    assert_eq!(e.act("amina".into(), "dictated".into(), CARD.into()).unwrap(), 0);
    let felt = r#"{"act":"card_felt","card":"papiers","feeling":"hard","when":"aujourd'hui"}"#;
    e.act("amina".into(), "by_hand".into(), felt.into()).unwrap();
    let head = e.project_head();
    drop(e);

    let again = HluxEngine::open(path, None, "amina".into(), "les-lilas".into()).unwrap();
    assert_eq!(again.project_head(), head, "le rejeu redonne la même chaîne");
    let state: serde_json::Value = serde_json::from_str(&again.project_state()).unwrap();
    assert!(state.to_string().contains("Les lettres de la CAF"));
    assert!(state.to_string().contains("hard"));
}

#[test]
fn un_geste_illisible_est_refuse_en_mots() {
    let e = HluxEngine::open(":memory:".into(), None, "amina".into(), "les-lilas".into()).unwrap();
    let err = e.act("amina".into(), "by_hand".into(), r#"{"act":"vote"}"#.into()).unwrap_err();
    assert!(err.to_string().starts_with("geste illisible"));
    let err = e.act("amina".into(), "par_magie".into(), CARD.into()).unwrap_err();
    assert!(err.to_string().contains("provenance inconnue"));
}
