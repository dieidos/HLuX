# Build natif (EAS) — ce qui est prêt, ce qui attend

## Prêt (vérifié en local)

- `app/eas.json` : profils `development` (dev client, distribution interne), `preview` (APK interne)
  et `production` (incrément automatique). `npx expo-doctor` : 21/21.
- `app/scripts/eas-rust.sh`, appelé par le hook `eas-build-pre-install` :
  - installe Rust et les cibles de la plateforme (`EAS_BUILD_PLATFORM`) ;
  - lit ab-ante (dépôt privé) avec `AB_ANTE_READ_TOKEN` ;
  - compile `hlux-ffi` (iOS : `aarch64-apple-ios` et `-sim` ; Android : `cargo ndk`, `arm64-v8a` et `x86_64`).
- `core/hlux-ffi` : le **pont UniFFI 0.28** (proc-macros) — objet `HluxEngine` :
  - `open(path, key, person, facility)` ;
  - `act` / `act_facility` (gestes en JSON, mêmes étiquettes que `app/src/core/acts.ts`) ;
  - `undo`, `confirm`, `project_state`, `facility_state`, `pending`, `project_head`.

  Testé :
  - aller-retour JSON, réouverture de la base et chaîne identique, refus en mots ;
  - clippy sans avertissement ;
  - liaisons Kotlin générées avec le générateur embarqué (`cargo run -p hlux-ffi --features tool --bin uniffi-bindgen`).

## Ce qui attend le propriétaire

1. **Compte Expo**, puis `npx eas-cli@latest init` dans `app/` (crée l'`projectId`).
2. **Variable secrète EAS** `AB_ANTE_READ_TOKEN`. C'est le même jeton en lecture seule que celui de la CI ; il se pose avec `eas env:create`, en visibilité « secret ».
3. Comptes **Apple Developer** (iPad) et **Google Play Console** (Android), pour la distribution privée.

## Ce que Claude fera au premier build (il ne peut pas se vérifier avant)

1. Lancer `npx eas-cli@latest build --profile development --platform android` et lire le journal de `eas-rust.sh`.
2. Générer le TurboModule avec **uniffi-bindgen-react-native** à partir de `hlux-ffi` (module local `app/modules/hlux-native`).
3. Remplacer, derrière la même interface (`projectStore.ts`), le rejeu TypeScript par `HluxEngine`.
   - Les tests de parité restent : même journal, même état.
4. Passer `rusqlite` en `bundled-sqlcipher`, avec la clé du profil tirée du Keychain / Keystore, puis retirer le chiffrement MMKV provisoire.
5. Parcours Maestro sur tablette réelle (les 36 notes, déjà en Playwright sur l'aperçu web).
6. **Vérifier sur appareil** : la copie par QR entre deux appareils (`expo-camera`, `react-native-qrcode-svg`) et la dictée hors ligne en français et en arabe (`expo-speech-recognition`, iPad et Android 13+). Vérifier aussi que, sans reconnaissance hors ligne, le bouton refuse au lieu de passer par le réseau.
