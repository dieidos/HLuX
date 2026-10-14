// Le fil d'une Carte : ce qu'elle est devenue, de la parole d'Amina jusqu'à l'engagement du collectif.
// « Ta Carte garde tout son parcours » — rien n'est calculé : chaque étape est un geste du journal.

import type { Id } from './acts';
import type { FacilityState } from './facility';
import type { ProjectState } from './project';

export interface ThreadStep { step: string; detail: string }

export function cardThread(card: Id, p: ProjectState, f: FacilityState | null): ThreadStep[] {
  const c = p.cards[card];
  if (!c) return [];
  const out: ThreadStep[] = [{ step: 'Dite', detail: c.moments[0] }];
  for (const m of c.moments.slice(1)) out.push({ step: 'Ressentie', detail: m });
  for (const i of Object.values(p.ideas)) if (i.fromCard === card) out.push({ step: 'Une envie en est née', detail: i.title });
  for (const s of Object.values(p.subjects)) if (s.card === card) out.push({ step: 'Apportée au collectif', detail: s.forCollective });
  const joined = f ? Object.values(f.commitments).filter((e) => e.thread[0] === c.title) : [];
  for (const e of joined) out.push({ step: 'Un engagement du collectif', detail: e.text });
  // La proposition du collectif, reliée par Amina à son chemin, referme le fil.
  if (joined.length) for (const l of p.linkedProposals) out.push({ step: 'Reliée à mon chemin', detail: l.proposal });
  return out;
}
