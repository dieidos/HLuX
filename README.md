# HLuX — Harmonia LuX

Application tablette (iPad + Android), puis mobile, pour le **Projet Personnalisé** d'une personne
accompagnée et le **Projet d'Établissement** de son CHRS. Un même fil, d'Amina au CHRS Les Lilas.

- **Spécification fonctionnelle** : l'Atlas V4 — https://dieidos.github.io/HLuX/
- **Cahier des charges** : `C:\Users\alexj\.claude\plans\CDC - HLuX.md` (fait foi ; tenu à jour à
  chaque lot)
- **Cœur métier** : le protocole [ad-hoc-ab-ante](https://github.com/Houngan/ad-hoc-ab-ante) (journal
  local chaîné, consentement à quatre états, cristallisation, aucun score, verrou humain)
- **Seul serveur** : dieidos-technology (authentification, tableau partagé trinity-mcp, aides IA).
  HLuX n'a pas de back-end propre ; le Projet Personnalisé est stocké sur l'appareil.

## Arborescence

| Dossier | Contenu |
|---|---|
| `core/hlux-core` | Rust : modèle, gestes (`act.rs`), états rejoués (`state.rs`), store SQLite (`store.rs`), moteur et sas (`engine.rs`) |
| `core/hlux-ffi` | Rust : pont UniFFI vers React Native (lot 2) |
| `app/` | Expo (SDK 57, React Native 0.86), Expo Router, tablette d'abord |
| `tokens/` | source unique des couleurs, polices, tailles → `app/src/design/tokens.ts` |
| `tools/` | gardes et générateurs (`derive_tokens.py`) |
| `docs/gouvernance/` | projets de décision et d'amendement à verser par le propriétaire |

## Commandes

```bash
# Cœur Rust (avec l'exemplaire local d'ab-ante : copier core/.cargo/config.toml.example en config.toml)
cd core && cargo test

# Jetons de design (et contrôle des contrastes AA)
python tools/derive_tokens.py --check

# Application
cd app && npx expo start
```

## Règles

- Code en anglais, textes lus par les personnes en français (et en arabe pour la personne).
- Aucun score, aucune moyenne, aucun vote : positions relatives, désaccords côte à côte.
- L'IA ne propose jamais d'idée ; toute production de la machine attend la validation d'un humain.
- Les mots du produit (Ikigai, idée…) restent dans ce dépôt, jamais dans dieidos-technology.
