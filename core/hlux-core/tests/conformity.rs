//! Le banc de conformité d'ab-ante, rejoué **à travers le store d'HLuX** (persister → rejouer).
//!
//! Inspiré du banc de dieidos-lms (`engine/src/bin/conformity.rs`), mis à jour pour l'API et les
//! vecteurs actuels (A188 : clés anglaises). On lit **les entrées** `input.*`, on rejoue, et on compare
//! aux réponses du fichier. Fichier : `HLUX_ABANTE_VECTORS`, sinon le dépôt frère
//! `../../../ad-hoc-ab-ante/conformity/vectors.txt` (CI : extrait à côté).
//!
//! ⛔ Si le fichier est introuvable, le test **échoue** : un banc qui ne lit rien ne doit pas passer.

use std::collections::BTreeMap;

use ab_ante_core::{
    verify_chain, Actor, Authority, Consent, ConsentKind, Crystallization, Journal, Provenance, Resolution, Seed,
    Space, Timestamp, Utterance,
};
use ab_ante_mcp::{project, Attachment, Capabilities, Session, SessionId};
use hlux_core::SqliteStore;

struct InClear;
impl Utterance<String> for InClear {
    fn say(&self, p: &String) -> String {
        p.clone()
    }
}

fn vectors() -> BTreeMap<String, String> {
    let path = std::env::var("HLUX_ABANTE_VECTORS").unwrap_or_else(|_| {
        concat!(env!("CARGO_MANIFEST_DIR"), "/../../../../ad-hoc-ab-ante/conformity/vectors.txt").to_string()
    });
    let text = std::fs::read_to_string(&path).unwrap_or_else(|e| panic!("vecteurs illisibles `{path}` : {e}"));
    text.lines()
        .filter_map(|l| l.split_once('='))
        .map(|(k, v)| (k.trim().to_string(), v.trim_end_matches('\r').to_string()))
        .collect()
}

fn yes_no(b: bool) -> String {
    if b { "yes" } else { "no" }.into()
}

#[test]
fn les_vecteurs_d_ab_ante_passent_par_le_store_hlux() {
    let v = vectors();
    let space_txt = v["input.space"].clone();
    let space = Space::parse(&space_txt);
    let words: Vec<String> = v["input.words"].split(',').map(str::to_string).collect();
    let seeds: Vec<u64> = v["input.seeds"].split(',').map(|s| s.trim().parse().unwrap()).collect();
    let author = v["input.author"].clone();
    assert_eq!(words.len(), seeds.len(), "le fichier sous-déclare ses entrées");

    // Trajectoire : écrite par le journal, persistée dans SQLite, puis REJOUÉE depuis la base.
    let store = SqliteStore::in_memory().unwrap();
    let mut j: Journal<String> = Journal::new(space.clone());
    for (w, s) in words.iter().zip(&seeds) {
        let t = Authority::InProcess.ticket(&Resolution::fresh()).unwrap();
        let e = j.record(t, Actor(author.clone()), None, Provenance::ByHand, Seed(*s), w.clone());
        store.append(&space, &e).unwrap();
    }
    let replayed: Journal<String> = store.replay(&space).unwrap();
    let ids: Vec<String> = replayed.entries().iter().map(|e| e.id.hex()).collect();
    assert_eq!(ids.join(","), v["trajectory.ids"], "identifiants rejoués");
    assert_eq!(replayed.head().hex(), v["trajectory.head"], "tête rejouée");

    // Chaîne
    assert_eq!(yes_no(verify_chain(&space_txt, replayed.entries()).is_ok()), v["chain.intact"]);
    let mut cut = replayed.entries().to_vec();
    cut.remove(0);
    let broken = verify_chain(&space_txt, &cut).map_or_else(|r| r.to_string(), |_| "none".into());
    assert_eq!(broken, v["chain.broken_if_first_entry_removed"]);

    // Compensation, elle aussi persistée puis rejouée.
    let mut u = replayed.clone();
    let t = Authority::InProcess.ticket(&Resolution::fresh()).unwrap();
    let comp = u.undo(t, Actor(author.clone()), Seed(2000)).unwrap();
    store.append(&space, &comp).unwrap();
    let u: Journal<String> = store.replay(&space).unwrap();
    assert_eq!(u.entries().len().to_string(), v["compensation.entries_after"]);
    assert_eq!(comp.rank.0.to_string(), v["compensation.rank"]);
    assert_eq!(yes_no(verify_chain(&space_txt, u.entries()).is_ok()), v["compensation.chain_intact"]);

    // Projection : seuls 4 champs traversent, sous consentement à publier et avec élicitation.
    let session = Session::open(SessionId(v["projection.session_id"].clone()), Capabilities { elicitation: true }, Attachment::Attached).unwrap();
    let now = Timestamp::from_raw(0);
    let consent = Consent::granted(ConsentKind::Publish, None);
    let first = &replayed.entries()[0];
    let cr = Crystallization::from(&consent, first, space.clone(), now).unwrap();
    let out = project(&session, &cr, first, &InClear).unwrap().unwrap();
    assert_eq!(out.author, v["projection.author"]);
    assert_eq!(out.content, v["projection.content"]);
    assert_eq!(out.space, v["projection.space"]);
    assert_eq!(ab_ante_mcp::Outgoing::FIELDS.join(","), v["projection.fields"]);
    // La compensation ne traverse pas ; sa voisine, si.
    let cr_last = Crystallization::from(&consent, &u.entries()[2], space.clone(), now).unwrap();
    let crosses = project(&session, &cr_last, &comp, &InClear).unwrap().is_some();
    assert_eq!(yes_no(crosses), v["compensation.crosses"]);

    // Refus nommés
    let stale = Authority::RemoteCore.ticket(&Resolution::stale()).map_or_else(|r| r.to_string(), |_| "none".into());
    assert_eq!(stale, v["refusal.remote_stale_authority"]);
    let nc = Crystallization::from(&Consent::never_asked(ConsentKind::Publish), first, space.clone(), now)
        .map_or_else(|r| r.to_string(), |_| "none".into());
    assert_eq!(nc, v["refusal.crystallization_without_consent"]);
}
