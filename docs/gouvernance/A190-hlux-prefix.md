# Projet d'amendement — ad-hoc-ab-ante, A190 (à verser par le propriétaire)

> Brouillon préparé dans le dépôt `hlux`. **Rien n'est écrit dans `ad-hoc-ab-ante`** tant que le
> propriétaire ne l'a pas versé (A189 : l'enregistrement précède la première ligne du consommateur).
> Le code `hlux-core` existe déjà en local, non publié : cet amendement doit être versé **avant** le
> premier push du dépôt `hlux`.

## 1. Ligne à ajouter au tableau « Registered prefixes » de `spec/04-spaces.md`

| Prefix | Declared genres |
|---|---|
| `hlux.` | `project` · `views` · `facility` |

Qualifier levels:
- `project:<person>` — a supported person's own project; **stored on the device only**, never crosses
  except through a `Publish`-consented crystallization;
- `views:<person>` — invitations to relatives on one idea, and their answers; relayed while the
  invitation lives, purged at its expiry;
- `facility:<establishment>` — the establishment's collective project, shared on the board.

## 2. Entrée à ajouter à `spec/01-arbitration-register.md`

### A190 — A fifth consumer registers before its first push: `hlux.`

**Owner's decision, 2026-10-14.** A fifth consumer arrives — a tablet application for supported
persons and their establishment (a person's own project, then the establishment's collective
project). It registers `hlux.` in [`04-spaces.md`](04-spaces.md), with three genres and the meaning of
their qualifier.

⛳ **The person's space never crosses by itself.** `project:<person>` lives on the device; the only
passage towards `facility:<establishment>` is a crystallization under a `Publish` consent granted at
that instant — the protocol already makes anything else inexpressible, and the consumer adds no
route around it.

⚠️ **A gap met on the way, written rather than worked around.** `EntryId` has no public constructor,
so a consumer cannot rebuild an `Entry` from what its store reread. `hlux` therefore persists the
**gestures** (author, provenance, seed, payload or undone rank) and **replays** them through
`Journal::record` / `undo_one` on opening; the derived identifier is stored as a witness and compared
on replay. This is deterministic replay doing its job — but `Store::entries` returning
`Vec<Entry<P>>` stays unimplementable from disk without it. *To be arbitrated: either document replay
as the reread, or give `Entry` a checked constructor.*

📌 The genres are English (rule of 2 September); the words the person reads (*Ressenti*, *Envies*,
*Chemin*…) live in the product's catalogue and never on the wire.
