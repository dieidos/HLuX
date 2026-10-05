# Harmonia Lux · Atlas

**Du Projet Personnalisé au Projet d'Établissement.** Un atlas interactif en 12 écrans qui suit un même fil, d'Amina au CHRS Les Lilas. Il se présente sur tablette, étape par étape, et se lit seul, à son rythme : il suffit de faire défiler.

👉 **https://dieidos.github.io/HLuX/**

## Utiliser l'atlas

- **Lire** : faire défiler. Chaque texte joue son étape sur la tablette (Avant · Le geste · Après).
- **Présenter** : `Suivant ▸` ou la flèche → pour avancer, `←` pour revenir, `⛶` pour le plein écran.
- **En savoir plus** : le bouton près des flèches déplie, pour chaque étape, les explications *Conception · Garde-fou · Cadre*.
- **Sur tablette** : « Ajouter à l'écran d'accueil » installe l'atlas comme une application, en plein écran.
- Dans chaque maquette, les aides **Écouter**, **Plus simple** et **Langue** (arabe) sont actives.

Les personnages et le CHRS Les Lilas sont imaginaires.

## Modifier l'atlas

La page `index.html` est générée : ne la modifiez pas directement. Les sources sont dans `src/` :

| Fichier | Contenu |
|---|---|
| `src/body.html` | Le contenu : couverture, écrans, maquettes |
| `src/style.css` | Les styles (couleurs dieidos, cartes, chemins) |
| `src/app.js` | Le moteur : défilement guidé, étapes, textes (`NOTES`), explications (`WHY`), portraits, pictos |
| `src/logo.svg`, `src/aqua.ttf` | Le symbole dieidos et la police des titres |

Après une modification, régénérez la page :

```bash
python src/build.py
```

## By dieidos
