// Le fil d'une Carte : ce qu'elle est devenue, de la parole d'Amina jusqu'à l'engagement du collectif.
// « Ta Carte garde tout son parcours » — rien n'est calculé : chaque étape est un geste du journal.

import type { Id } from './acts';
import type { FacilityState } from './facility';
import type { ProjectState } from './project';

export interface ThreadStep { step: string; detail: string }

/** Le nom d'une étape, d'après le moment écrit au journal. */
function stepOf(moment: string): string {
  if (moment.includes(' · reposée dans la réserve')) return 'Reposée dans la réserve';
  if (moment.includes(' · pas maintenant')) return 'Pas maintenant';
  return 'Ressentie';
}

export function cardThread(card: Id, p: ProjectState, f: FacilityState | null): ThreadStep[] {
  const c = p.cards[card];
  if (!c) return [];
  // La naissance de la Carte : dite, écrite, ou choisie en image.
  const born = c.origin === 'written' ? 'Écrite' : c.origin === 'picture' ? 'Choisie en image' : 'Dite';
  const out: ThreadStep[] = [{ step: born, detail: c.moments[0] }];
  for (const m of c.moments.slice(1)) out.push({ step: stepOf(m), detail: m });
  for (const i of Object.values(p.ideas)) if (i.fromCard === card) out.push({ step: 'Une envie en est née', detail: i.title });
  for (const n of Object.values(p.nodes)) if (n.card === card) out.push({ step: 'Une étape de mon chemin', detail: `${n.label} (${n.when})` });
  const subjects = Object.values(p.subjects).filter((x) => x.card === card);
  for (const x of subjects) out.push({ step: 'Apportée au collectif', detail: x.forCollective });
  // L'engagement rejoint la Carte par SA parole consentie (la phrase « pour le collectif » de son sujet),
  // jamais par son seul titre : deux Cartes au même titre ne se mêlent pas.
  const said = new Set(subjects.map((x) => x.forCollective));
  const joined = f ? Object.entries(f.commitments).filter(([, e]) => e.thread.some((t) => said.has(t))) : [];
  for (const [, e] of joined) out.push({ step: 'Un engagement du collectif', detail: e.text });
  // Seule la proposition née de CET engagement, reliée par la personne à son chemin, referme le fil.
  const fromHere = new Set(joined.map(([id]) => `p-${id}`));
  for (const l of p.linkedProposals) if (fromHere.has(l.proposal) && f) out.push({ step: 'Reliée à mon chemin', detail: f.proposals[l.proposal] ?? l.proposal });
  return out;
}

/**
 * Les écrans où la Carte est passée (le fil de l'Atlas : chaque étape traversée s'allume dans le bandeau).
 * Rien n'est deviné : chaque passage est un geste du journal qui porte la Carte, ou ce qui en est né.
 */
export function threadPassed(card: Id, p: ProjectState, f: FacilityState | null): string[] {
  const c = p.cards[card];
  if (!c) return [];
  const out = ['/mon-projet/cartes'];
  if (c.feeling || c.moments.length > 1) out.push('/mon-projet/ressenti');
  const ideas = Object.entries(p.ideas).filter(([, i]) => i.fromCard === card).map(([id]) => id);
  if (ideas.length) out.push('/mon-projet/envies');
  if (Object.values(p.lines).some((l) => l.some((x) => ideas.includes(x)))) out.push('/mon-projet/priorites');
  if (Object.values(p.invitations).some((i) => ideas.includes(i.idea))) out.push('/mon-projet/regards');
  if (Object.values(p.nodes).some((n) => n.card === card)) out.push('/mon-projet/chemin');
  const said = new Set(Object.values(p.subjects).filter((x) => x.card === card).map((x) => x.forCollective));
  if (said.size) out.push('/notre-projet/sujets');
  if (f) {
    if (Object.values(f.findings).some((x) => said.has(x.title)) || f.agenda.some((a) => said.has(a.title))) out.push('/notre-projet/constat');
    if (Object.values(f.commitments).some((e) => e.thread.some((t) => said.has(t)))) out.push('/notre-projet/actions', '/notre-projet/suivi');
  }
  return out;
}

/** La Carte qui fait le fil : celle que la personne a reprise, sinon la dernière qu'elle a touchée. */
export function currentThread(chosen: Id | null, p: ProjectState, entries: { act?: { act: string; card?: Id | null; from_card?: Id | null } }[]): Id | null {
  if (chosen && p.cards[chosen]) return chosen;
  for (const e of [...entries].reverse()) {
    const id = e.act?.card ?? e.act?.from_card;
    if (id && p.cards[id]) return id;
  }
  return Object.keys(p.cards)[0] ?? null;
}
