# Harmonia LuX — HLuX

**Du Projet Personnalisé au Projet d'Établissement.** Un même fil, d'Amina au CHRS Les Lilas.

Ce dépôt contient deux choses :

1. **L'Atlas** : la démo interactive en 12 écrans, publiée sur GitHub Pages. C'est la spécification
   fonctionnelle de l'application. 👉 **https://dieidos.github.io/HLuX/**
2. **L'application HLuX** : tablette (iPad, Android) puis mobile. Elle est construite d'après l'Atlas
   et le cahier des charges `CDC - HLuX.md` (`C:\Users\alexj\.claude\plans\`), qui fait foi et est
   tenu à jour à chaque lot.

Les personnages et le CHRS Les Lilas sont imaginaires.

---

## 1. L'Atlas (démo)

À la racine du dépôt, servie telle quelle par GitHub Pages.

- **Lire** : faire défiler. Chaque texte joue son étape sur la tablette (Avant · Le geste · Après).
- **Présenter** : `Suivant ▸` ou la flèche → pour avancer, `←` pour revenir, `⛶` pour le plein écran.
- **En savoir plus** : le bouton près des flèches déplie, pour chaque étape, les explications
  *Conception · Garde-fou · Cadre*.
- **Sur tablette** : « Ajouter à l'écran d'accueil » installe l'atlas comme une application.
- Dans chaque maquette, les aides **Écouter**, **Plus simple** et **Langue** (arabe) sont actives.

`index.html` est générée : ne la modifiez pas directement. Les sources sont dans `src/` :

| Fichier | Contenu |
|---|---|
| `src/body.html` | Le contenu : couverture, écrans, maquettes |
| `src/style.css` | Les styles (couleurs dieidos, cartes, chemins) |
| `src/app.js` | Le moteur : défilement guidé, étapes, textes (`NOTES`), explications « En savoir plus » (`NOTE_WHY`), portraits, pictos |
| `src/logo.svg`, `src/aqua.ttf` | Le symbole dieidos et la police des titres |

```bash
python src/build.py
```

---

## 2. L'application HLuX

- **Cœur métier** : le protocole [ad-hoc-ab-ante](https://github.com/Houngan/ad-hoc-ab-ante) (journal
  local chaîné, consentement à quatre états, cristallisation, aucun score, verrou humain).
- **Seul serveur** : dieidos-technology (authentification, tableau partagé trinity-mcp, aides IA).
  Pas de back-end propre ; le Projet Personnalisé est stocké sur l'appareil.

| Dossier | Contenu |
|---|---|
| `core/hlux-core` | Rust : modèle, gestes (`act.rs`), états rejoués (`state.rs`), store SQLite (`store.rs`), moteur et sas (`engine.rs`) |
| `core/hlux-ffi` | Rust : pont UniFFI vers React Native (lot 2) |
| `app/` | Expo (SDK 57, React Native 0.86), Expo Router, tablette d'abord |
| `tokens/` | source unique des couleurs, polices, tailles → `app/src/design/tokens.ts` |
| `tools/` | gardes et générateurs (`derive_tokens.py`) |
| `docs/gouvernance/` | projets de décision et d'amendement à verser par le propriétaire |

```bash
# Cœur Rust (copier core/.cargo/config.toml.example en config.toml pour lire ab-ante en local)
cd core && cargo test

# Jetons de design (et contrôle des contrastes AA)
python tools/derive_tokens.py --check

# Application (aperçu web : --web)
cd app && npx expo start
```

### Règles

- Code en anglais, textes lus par les personnes en français (et en arabe pour la personne).
- Aucun score, aucune moyenne, aucun vote : positions relatives, désaccords côte à côte.
- L'IA ne propose jamais d'idée ; toute production de la machine attend la validation d'un humain.
- Les mots du produit (Ikigai, idée…) restent dans ce dépôt, jamais dans dieidos-technology.

## By dieidos
