# CI en attente

Le fichier `ci.yml` doit aller dans `.github/workflows/ci.yml`. Le compte gh `dieidos` n'a pas la
portée `workflow`, donc GitHub refuse de recevoir ce fichier.

Pour activer la CI :

1. Ajouter la portée, connecté en `dieidos`, dans un navigateur :
   `gh auth refresh -h github.com -s workflow`
2. Poser le secret `AB_ANTE_READ_TOKEN` dans le dépôt (Settings > Secrets and variables > Actions) :
   un jeton à portée fine, en lecture seule sur `Houngan/ad-hoc-ab-ante`.
3. Déplacer `docs/ci/ci.yml` vers `.github/workflows/ci.yml`, puis pousser.

La CI vérifie alors :
- le cœur Rust, avec clippy sans avertissement, les tests et le banc de conformité ab-ante ;
- les jetons de design et les contrastes AA ;
- le typecheck et les tests de l'application.
