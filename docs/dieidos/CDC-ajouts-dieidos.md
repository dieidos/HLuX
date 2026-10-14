# Cahier des charges — ajouts côté dieidos-technology pour une application tablette cliente

> **À transmettre à la session dieidos.** Rattachement : déc. 811 (`gouvernance/DECISIONS.md`, commit
> `0f4ffe6`). Contrat d'interface détaillé : [`contrat-api.md`](contrat-api.md), qui fait foi pour les
> formats. **Vocabulaire neutre** : aucun mot propre au produit client n'entre dans dieidos-technology
> (déc. 711 ; garde `verify:atlas-lexicon` et relectures).

## 0. Contexte en cinq lignes

- Une application tablette et mobile (React Native) accompagne des personnes dans un établissement
  social : le projet d'une personne, puis le projet collectif de l'établissement.
- **Tout le projet d'une personne reste sur l'appareil.** L'application n'a aucun serveur propre.
- dieidos-technology est son **seul serveur**, pour quatre besoins : identifier les professionnels,
  aider à reformuler, relayer des invitations courtes, partager le projet collectif.
- Le protocole ad-hoc-ab-ante régit tout passage : rien ne sort sans consentement `Publish` ; seuls
  4 champs traversent (`session_id`, `author`, `content`, `space`) ; espace `hlux.facility:<établissement>` (A190).
- Le client existe déjà et fonctionne hors ligne ; chaque lot ci-dessous le rend « en ligne » sans
  rien changer à ses écrans.

## 1. Ce qui existe déjà et sert tel quel (aucun travail)

| Besoin | Brique existante |
|---|---|
| Connexion des professionnels | `features/auth_oauth`, `POST /api/auth/native/exchange` (PKCE, appareil appairé) |
| Un tenant par client | `dieidos-api/config/tenants/*.manifest.json`, `features/tenant` |
| Purge d'un tenant | `services/langgraph/data/purge_orchestrator.py::purge_tenant_all_stores` |
| Détection de données personnelles | `repositories/incoming_sanitize.py` (`pii_detect`) |
| Suivi de consommation | `llm_usage_events` (via `rig`) |
| Tableau partagé, scellés, audit | trinity-mcp (`blackboard.*`), `features/board`, `audit_log` chaîné |
| Validation humaine | `pending_actions` → `approve` |
| Signature de jetons | `security/jwt_utils.py`, `security/jwks.py` |

## 2. Lots à réaliser

Chaque lot suit les gabarits `.agentic/templates/feature_*.tpl` (deps, models, routes, service, tests),
passe les hooks de `pre-commit` et ajoute ses tests au bras témoin habituel.

### Lot A — Gabarit de tenant « établissement, application tablette » (petit)

- Nouveau type de manifest : `config/tenants/<établissement>.manifest.json`, avec
  `retention.collective = "project_duration_plus_1y"` (5 ans au plus) et aucun secret propre.
- Un tenant de démonstration (`etablissement-demo`), pour le pilote et la CI.
- **Acceptation** : `verify:tenant-*` vert ; la purge à échéance est testée (export remis, puis
  `purge_tenant_all_stores`, puis compte nul).

### Lot B — Module `features/assist` : aides de reformulation (moyen, prioritaire)

- Six routes `POST /api/assist/{simplify|translate|generalize|narrate|phrase|sort}`, format exact dans le
  contrat §2. Routeur fin, `response_model`, `require_auth_payload`, E/S via `rig`.
- **Gardes obligatoires, testées une à une** :
  1. `pii_detect` en entrée **et** en sortie ; une sortie qui ramène un nom est refusée ;
  2. refus de toute donnée de santé (liste fermée côté serveur, en plus de celle du client) ;
  3. **aucune rétention** du texte : ni log, ni trace, ni cache ; seul `llm_usage_events` (tenant,
     route, tokens) est écrit ;
  4. prompt système : reformuler, traduire, simplifier, décrire — **jamais** proposer une idée, une
     solution, un chemin, une note, un classement ou une prédiction ;
  5. une seule proposition par appel, jamais de liste à choisir.
- Degré `llm-config` : 1 pour `sort` ; 2 pour `simplify`, `translate`, `narrate` ; 3 pour `generalize`, `phrase`.
- `sort` (ajout du 2026-10-14) : la réponse est **une permutation des clés reçues**, rien d'autre ; le serveur refuse toute clé inventée. Le client garde l'ordre habituel tant que la route n'existe pas.
- **Acceptation** : un test par garde (le texte piégé est refusé, son jumeau propre passe) ; un test
  qui vérifie qu'après un appel, aucune table ni aucun log ne contient le texte envoyé.
- Le client appelle déjà ces routes (`app/src/core/aides.ts`) et bascule sur un exemple hors ligne
  quand `EXPO_PUBLIC_DIEIDOS_URL` est absent : brancher ce lot suffit à l'activer.

### Lot C — Jetons éphémères et relais (moyen)

- Routes `/api/ephemeral/invitations` (créer, lire, répondre, rapatrier) et
  `/api/ephemeral/sessions` (QR de séance), format exact dans le contrat §3.
- Jeton signé Ed25519, portée limitée à **un** objet, échéance courte (72 h par défaut pour une
  invitation, durée de la séance pour un QR), révocable.
- Une invitation porte une seule phrase et ses axes ; une seule réponse ; aucun nom de famille.
- Purge à l'échéance **et** au rapatriement.
- Page invité statique servie **sur le même domaine** (profil `INFRA_PROFILE=sovereign`, pas de CORS
  externe). Elle lit une phrase, propose trois positions (peu, moyen, beaucoup) et un mot libre.
- **Acceptation** : un jeton expiré, réutilisé ou hors portée est refusé ; après rapatriement, la
  réponse n'existe plus côté serveur.

### Lot D — Révélation collective sur le tableau (moyen)

- Espace `hlux.facility:<établissement>` sur trinity-mcp ; n'y arrive que ce qui a été consenti
  (4 champs).
- **Placements privés** déposés scellés (mécanisme des créations scellées existant) ; on voit qui a
  placé, pas où.
- **Révélation** : un geste collectif `blackboard.decide` avec élicitation, qui descelle d'un coup
  tous les placements d'une orientation. **Aucun calcul** côté serveur : ni moyenne, ni vote, ni
  majorité, ni tri.
- Chaque écriture et chaque révélation entre à l'`audit_log` chaîné.
- **Acceptation** : avant révélation, aucune route ne rend la position d'un placement ; après, toutes
  d'un coup ; un test vérifie qu'aucune réponse ne contient d'agrégat.

## 3. Ordre conseillé

B (débloque toutes les aides du client) → A (pilote) → C (invitations et QR) → D (collectif en réseau).

## 4. Ce que dieidos ne reçoit jamais

- Le projet personnel d'une personne : cartes, ressenti, envies, priorités, chemin, plan.
- Une donnée de santé.
- Le texte des aides au-delà du temps de l'appel.

## 5. Points tranchés par le propriétaire (2026-10-14)

1. `features/assist` fait un **appel direct via `rig`, sans état** (aucun graphe `langgraph`).
2. La page invité statique est servie par **Caddy (`dieidos-apps/`), sur le même domaine**.
3. **La déc. 811 suffit** ; une ligne de suivi par lot livré, pas de nouvelle décision.

## 6. Côté client, déjà prêt

- `app/src/core/aides.ts` : appel `POST /api/assist/{kind}`, pseudonymisation `[P1]…`, garde santé,
  repli hors ligne annoncé ; testé (`aides.test.ts`).
- `core/hlux-core` : `Engine::bring_subject` produit l'`Outgoing` à 4 champs sous consentement
  `Publish` ; testé contre les vecteurs de conformité d'ab-ante.
- Reste côté client, une fois les lots livrés : l'appairage OAuth, le relais des invitations, la
  page de séance, l'envoi au tableau.
