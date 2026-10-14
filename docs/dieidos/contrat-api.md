# Contrat des ajouts côté dieidos-technology

> À transmettre à la session dieidos. **Vocabulaire neutre** : les gardes `verify:atlas-lexicon` de
> dieidos-technology refusent les mots propres au produit. Ce document n'en contient aucun.
> Décision de rattachement : `docs/gouvernance/decision-hlux-autonome.md` (déc. 811, versée le 2026-10-14).

L'application cliente n'a **aucun serveur propre**. dieidos-technology est son seul serveur. Les données
personnelles des personnes accompagnées n'y sont **jamais stockées**.

## 0. Authentification (existant, aucun ajout)

- Professionnels : `POST /api/auth/native/exchange` (OAuth Google/Microsoft + PKCE, appareil appairé).
  Le JWT porte `client_id` = l'établissement.
- Personnes accompagnées : pas de compte. Elles agissent dans une séance ouverte par un professionnel.

## 1. Un tenant par établissement

- Gabarit `config/tenants/<établissement>.manifest.json` (type « établissement, application tablette »).
- Secrets : aucun propre au client (la clé de modèle est celle de dieidos, voir §5).
- Conservation des données collectives : **durée du projet de l'établissement + 1 an** (5 ans au plus).
  Ensuite, export remis à l'établissement, puis `purge_tenant_all_stores`.

## 2. Module d'aides de reformulation — `features/assist`

Gabarits : `.agentic/templates/feature_*.tpl`. Un routeur fin `APIRouter(prefix="/api/assist")`,
`response_model` partout, accès par `require_auth_payload` (tenant), E/S via `rig`.

| Route | Rôle | Degré `llm-config` |
|---|---|---|
| `POST /api/assist/simplify` | version simple d'une phrase (FALC) | 2 |
| `POST /api/assist/translate` | traduction fr ↔ ar, l'original reste côté client | 2 |
| `POST /api/assist/generalize` | phrase générale à partir d'une situation individuelle | 3 |
| `POST /api/assist/narrate` | récit court (simulation, plan, relecture d'un constat) | 2–3 |
| `POST /api/assist/phrase` | mise en mots d'une phrase dictée par un groupe | 3 |

- **Requête** : `{ "text": string, "lang": "fr" | "ar", "register": "falc" | "plain" }`. Le client a déjà
  pseudonymisé les prénoms (`[P1]`, `[P2]`…).
- **Réponse** : `{ "proposal": string }`. Une seule proposition, jamais une liste de choix ni un score.
- **Gardes** :
  - `pii_detect` en entrée **et** en sortie ; refus de toute donnée de santé (dieidos n'est pas HDS) ;
  - posture ZDR : **aucune rétention** du texte ; seul `llm_usage_events` (tenant, route, tokens) est gardé ;
  - le prompt système interdit de proposer des idées, des solutions ou des chemins, de noter, de classer ou de prédire. La sortie reformule, traduit ou décrit seulement.
- **Verrou humain** : côté client, la réponse entre en attente de validation (entrée de la machine, en attente).
  Pour une phrase de groupe (`phrase`), la validation passe par `pending_actions` → `approve`.

## 3. Jetons éphémères et relais

Deux usages, un mécanisme :

| Route | Rôle |
|---|---|
| `POST /api/ephemeral/invitations` | (pro authentifié) crée une invitation : `{ idea_text, axes[], lang, expires_at }` → `{ token, url }` |
| `GET /api/ephemeral/invitations/{token}` | (sans compte) lit **une seule** idée à commenter |
| `POST /api/ephemeral/invitations/{token}/answer` | (sans compte) dépose `{ leans[], word? }` ; une seule réponse |
| `GET /api/ephemeral/invitations?mine` | (pro) rapatrie les réponses, puis purge |
| `POST /api/ephemeral/sessions` | (pro) ouvre un QR de séance → `{ token, url, expires_at }` |

- Jeton signé (Ed25519, `services/security`), portée limitée à **un** objet, échéance courte, révocable.
- Purge automatique à l'échéance. Aucun nom de famille, aucun dossier.
- Page invité statique servie **sur le même domaine** (le profil `INFRA_PROFILE=sovereign` refuse le CORS externe).

## 4. Tableau partagé et révélation

- Espaces réservés au produit sur le tableau trinity-mcp : `hlux.facility:<établissement>`. Seul ce
  qu'une personne a consenti à publier y arrive (4 champs : `session_id`, `author`, `content`, `space`).
- **Placements privés** : déposés scellés (créations scellées du board risen) ; on voit qui a placé.
- **Révélation** : un geste collectif `blackboard.decide` avec élicitation, qui descelle d'un coup
  les placements d'une orientation. Aucun calcul de moyenne, de vote ni de majorité côté serveur.
- Audit : `audit_log` chaîné pour chaque écriture et chaque révélation.

## 5. Coût des modèles

- Clé OpenRouter de dieidos (Vault, repli d'environnement).
- Consommation suivie par établissement (`llm_usage_events`), incluse dans l'abonnement.

## 6. Ce que dieidos ne reçoit jamais

- Le projet personnel d'une personne (cartes, ressenti, envies, priorités, chemin, plan).
- Une donnée de santé.
- Le texte des aides, au-delà du temps de l'appel.
