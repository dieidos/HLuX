// Le rejeu du Projet Personnalisé, côté interface.
// ⛳ Jusqu'au pont UniFFI (lot 2), l'app rejoue elle-même le journal ; la logique suit
//    `core/hlux-core/src/state.rs`. Les tests (`project.test.ts`) tiennent la parité sur le fil d'Amina.

import type { Circle, Entry, Feeling, Id, Lang, Lean, NodeKind, LinkKind, Origin, Plan, ProjectAct, Rank, Spot } from './acts';

export interface Card {
  title: string;
  picto: string | null;
  verbatim: string;
  lang: Lang;
  origin: Origin;
  saidWith: string | null;
  simpler: string | null;
  translations: Partial<Record<Lang, string>>;
  feeling: Feeling | null;
  moments: string[];
  awaitingValidation: boolean;
}

export interface Idea { title: string; fromCard: Id | null; inSession: boolean; spot: Spot }
export interface Invitation {
  guest: string; relation: string; idea: Id; axes: Circle[]; lang: Lang; expires: string;
  answered: boolean; leans: [Circle, Lean][]; word: string | null;
}
export interface PathNode { lane: string; kind: NodeKind; label: string; when: string; thread: boolean }

export interface ProjectState {
  cards: Record<Id, Card>;
  ideas: Record<Id, Idea>;
  axisRanks: Partial<Record<Circle, Rank>>;
  lines: Record<string, Id[]>;
  companionOrder: { by: string; ranks: [Circle, Rank][] } | null;
  invitations: Record<Id, Invitation>;
  viewsRevealed: boolean;
  nodes: Record<Id, PathNode>;
  links: { from: Id; to: Id; link: LinkKind }[];
  whatIfs: Record<Id, { question: string; moves: [Id, string][]; story: string | null; kept: boolean | null }>;
  plan: Plan;
  subjects: Record<Id, { card: Id; mine: string; forCollective: string }>;
  linkedProposals: { proposal: string; node: Id }[];
}

export const FEELING_WORDS: Record<Feeling, string> = {
  fine: 'ça va',
  unsure: 'je ne sais pas',
  hard: "c'est difficile",
};

export const emptyProject = (): ProjectState => ({
  cards: {}, ideas: {}, axisRanks: {}, lines: {}, companionOrder: null, invitations: {}, viewsRevealed: false,
  nodes: {}, links: [], whatIfs: {}, plan: { first: [], waiting: [], with_whom: [], open: [] }, subjects: {}, linkedProposals: [],
});

export const lineKey = (axis: Circle, author: string) => `${axis}/${author}`;

function fold(s: ProjectState, e: Entry, a: ProjectAct): void {
  const pending = e.provenance === 'hypothesis';
  switch (a.act) {
    case 'card_created':
      s.cards[a.card] = {
        title: a.title, picto: a.picto, verbatim: a.verbatim, lang: a.lang, origin: a.origin, saidWith: a.said_with,
        simpler: null, translations: {}, feeling: null, awaitingValidation: false,
        moments: [a.said_with ? `${a.when} · dite avec ${a.said_with}` : a.when],
      };
      break;
    case 'card_simpler':
      if (s.cards[a.card]) Object.assign(s.cards[a.card], { simpler: a.text, awaitingValidation: pending });
      break;
    case 'card_translated':
      if (s.cards[a.card]) {
        s.cards[a.card].translations[a.lang] = a.text;
        s.cards[a.card].awaitingValidation = pending;
      }
      break;
    case 'card_felt':
      if (s.cards[a.card]) {
        s.cards[a.card].feeling = a.feeling;
        s.cards[a.card].moments.push(`${a.when} · dans « ${FEELING_WORDS[a.feeling]} »`);
      }
      break;
    case 'idea_created':
      s.ideas[a.idea] = { title: a.title, fromCard: a.from_card, inSession: a.in_session, spot: { at: 'tray' } };
      break;
    case 'idea_placed': {
      const i = s.ideas[a.idea];
      if (i && i.spot.at !== 'discarded') i.spot = a.spot; // écarter par le bord : irréversible
      break;
    }
    case 'axis_ranked': s.axisRanks[a.axis] = a.rank; break;
    case 'line_ordered': s.lines[lineKey(a.axis, a.author)] = a.order; break;
    case 'companion_order': s.companionOrder = { by: a.by, ranks: a.ranks }; break;
    case 'invitation_sent':
      s.invitations[a.invitation] = { guest: a.guest, relation: a.relation, idea: a.idea, axes: a.axes, lang: a.lang, expires: a.expires, answered: false, leans: [], word: null };
      break;
    case 'invitation_answered':
      if (s.invitations[a.invitation]) Object.assign(s.invitations[a.invitation], { answered: true, leans: a.leans, word: a.word });
      break;
    case 'views_revealed': s.viewsRevealed = true; break;
    case 'node_set': s.nodes[a.node] = { lane: a.lane, kind: a.kind, label: a.label, when: a.when, thread: a.thread }; break;
    case 'link_set':
      s.links = s.links.filter((l) => !(l.from === a.from && l.to === a.to));
      s.links.push({ from: a.from, to: a.to, link: a.link });
      break;
    case 'what_if': s.whatIfs[a.sim] = { question: a.question, moves: a.moves, story: a.story, kept: null }; break;
    case 'what_if_closed': if (s.whatIfs[a.sim]) s.whatIfs[a.sim].kept = a.kept; break;
    case 'plan_set': s.plan = a.plan; break;
    case 'subject_prepared': s.subjects[a.subject] = { card: a.card, mine: a.mine, forCollective: a.for_collective }; break;
    case 'proposal_linked': s.linkedProposals.push({ proposal: a.proposal, node: a.node }); break;
  }
}

/** L'état courant : on rejoue, en sautant ce qui a été compensé (annulé). */
export function standing(entries: Entry[]): ProjectState {
  const undone = new Set(entries.filter((e) => e.undone !== undefined).map((e) => e.undone!));
  const s = emptyProject();
  for (const e of entries) if (e.act && !undone.has(e.rank)) fold(s, e, e.act);
  return s;
}

/** Les propositions de la machine qui attendent un humain. */
export function pending(entries: Entry[]): Entry[] {
  const undone = new Set(entries.filter((e) => e.undone !== undefined).map((e) => e.undone!));
  return entries.filter((e) => e.provenance === 'hypothesis' && !undone.has(e.rank));
}
