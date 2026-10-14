// Le Projet d'Établissement, côté interface — miroir de `FacilityAct` (core/hlux-core/src/act.rs).
// ⛳ Copie locale du collectif ; au lot 5, les gestes partent vers le tableau dieidos (trinity-mcp).

import type { Feeling, Id, Lean, LinkKind, NodeKind, Rank, Spot } from './acts';

/** Seul le nom d'une image générique (« papiers »…) passe au collectif : jamais un texte libre (comme le cœur Rust). */
const genericPicto = (p: string | null | undefined): string | null => (p && /^[a-z_]{1,32}$/.test(p) ? p : null);

export type Source = 'consented_word' | 'team' | 'cvs';
export type Qualification = 'individual' | 'signal' | 'repeated' | 'confirmed';
export type Criterion = 'effect' | 'rights' | 'feasibility' | 'urgency' | 'cooperation' | 'resources';

export type FacilityAct =
  | { act: 'agenda_item'; item: Id; title: string; source: Source; session: string; /** l'image de la Carte d'où vient le sujet */ picto?: string | null }
  | { act: 'attendance'; session: string; present: string[]; absent: string[]; facilitator: string }
  | { act: 'floor_given'; session: string; to: string }
  | { act: 'finding_placed'; finding: Id; title: string; zone: Feeling; source: Source; author: string; picto?: string | null }
  | { act: 'finding_qualified'; finding: Id; level: Qualification }
  | { act: 'mandate_set'; to: string }
  | { act: 'cap_placed'; cap: Id; title: string; by: string; spot: Spot }
  | { act: 'expected_change'; cap: Id; text: string; validated: boolean }
  | { act: 'criterion_ranked'; criterion: Criterion; rank: Rank }
  | { act: 'orientation'; orientation: Id; title: string }
  | { act: 'private_placement'; orientation: Id; criterion: Criterion; by: string; lean: Lean }
  | { act: 'revealed'; orientation: Id }
  | { act: 'reading'; orientation: Id; converge: boolean; people: string[]; criterion: Criterion; phrase: string }
  | { act: 'decision'; orientation: Id; dictated: string; words: string }
  | { act: 'solution'; solution: Id; title: string; modality: string; rhythm: string }
  | { act: 'solution_lean'; solution: Id; effect: boolean; by: string; lean: Lean }
  | { act: 'commitment'; commitment: Id; text: string; solution: Id; thread: string[]; review: string; carriers?: string[] }
  | { act: 'node_set'; node: Id; lane: string; kind: NodeKind; label: string; when: string }
  | { act: 'link_set'; from: Id; to: Id; link: LinkKind }
  | { act: 'load'; load: Id; name: string; carriers: string[]; rhythm: string }
  | { act: 'result'; text: string; back_to_finding: boolean; when?: string }
  | { act: 'proposal'; proposal: Id; text: string };

export interface FEntry { rank: number; author: string; provenance: 'by_hand' | 'dictated' | 'hypothesis' | 'generated'; confirmedBy?: string; undone?: number; act?: FacilityAct }

export interface FacilityState {
  agenda: { item: Id; title: string; source: Source; session: string; picto: string | null }[];
  attendance: { session: string; present: string[]; absent: string[]; facilitator: string } | null;
  floor: string | null;
  mandate: string | null;
  findings: Record<Id, { title: string; zone: Feeling; source: Source; author: string; level: Qualification; picto: string | null }>;
  caps: Record<Id, { title: string; placements: { by: string; spot: Spot }[] }>;
  expectedChange: { cap: Id; text: string; validated: boolean } | null;
  criteria: Partial<Record<Criterion, Rank>>;
  orientations: Record<Id, { title: string; placedBy: string[]; placements: { criterion: Criterion; by: string; lean: Lean }[]; revealed: boolean; readings: { converge: boolean; people: string[]; criterion: Criterion; phrase: string }[]; decision: { dictated: string; words: string } | null; sealed: { criterion: Criterion; by: string; lean: Lean }[] }>;
  solutions: Record<Id, { title: string; modality: string; rhythm: string; leans: { effect: boolean; by: string; lean: Lean }[] }>;
  commitments: Record<Id, { text: string; solution: Id; thread: string[]; review: string; carriers: string[] }>;
  nodes: Record<Id, { lane: string; kind: NodeKind; label: string; when: string }>;
  links: { from: Id; to: Id; link: LinkKind }[];
  loads: Record<Id, { name: string; carriers: string[]; rhythm: string }>;
  results: { text: string; backToFinding: boolean; when: string }[];
  proposals: Record<Id, string>;
}

export const emptyFacility = (): FacilityState => ({
  agenda: [], attendance: null, floor: null, mandate: null, findings: {}, caps: {}, expectedChange: null, criteria: {},
  orientations: {}, solutions: {}, commitments: {}, nodes: {}, links: [], loads: {}, results: [], proposals: {},
});

const orientation = (s: FacilityState, id: Id) =>
  (s.orientations[id] ??= { title: '', placedBy: [], placements: [], revealed: false, readings: [], decision: null, sealed: [] });

function fold(s: FacilityState, a: FacilityAct): void {
  switch (a.act) {
    case 'agenda_item': s.agenda.push({ item: a.item, title: a.title, source: a.source, session: a.session, picto: genericPicto(a.picto) }); break;
    case 'attendance': s.attendance = { session: a.session, present: a.present, absent: a.absent, facilitator: a.facilitator }; break;
    case 'floor_given': s.floor = a.to; break;
    // Déplacer une carte garde sa qualification : seul le groupe la change (finding_qualified).
    case 'finding_placed': s.findings[a.finding] = { title: a.title, zone: a.zone, source: a.source, author: a.author, level: s.findings[a.finding]?.level ?? 'individual', picto: genericPicto(a.picto) ?? s.findings[a.finding]?.picto ?? null }; break;
    case 'finding_qualified': if (s.findings[a.finding]) s.findings[a.finding].level = a.level; break;
    case 'mandate_set': s.mandate = a.to; break;
    case 'cap_placed': {
      const c = (s.caps[a.cap] ??= { title: a.title, placements: [] });
      c.placements = [...c.placements.filter((p) => p.by !== a.by), { by: a.by, spot: a.spot }];
      break;
    }
    case 'expected_change': s.expectedChange = { cap: a.cap, text: a.text, validated: a.validated }; break;
    case 'criterion_ranked': s.criteria[a.criterion] = a.rank; break;
    case 'orientation': orientation(s, a.orientation).title = a.title; break;
    case 'private_placement': {
      const o = orientation(s, a.orientation);
      if (!o.placedBy.includes(a.by)) o.placedBy.push(a.by);
      o.sealed = [...o.sealed.filter((p) => !(p.criterion === a.criterion && p.by === a.by)), { criterion: a.criterion, by: a.by, lean: a.lean }];
      if (o.revealed) o.placements = o.sealed;
      break;
    }
    case 'revealed': { const o = orientation(s, a.orientation); o.revealed = true; o.placements = o.sealed; break; }
    case 'reading': orientation(s, a.orientation).readings.push({ converge: a.converge, people: a.people, criterion: a.criterion, phrase: a.phrase }); break;
    case 'decision': orientation(s, a.orientation).decision = { dictated: a.dictated, words: a.words }; break;
    case 'solution': s.solutions[a.solution] = { title: a.title, modality: a.modality, rhythm: a.rhythm, leans: [] }; break;
    case 'solution_lean': {
      const x = s.solutions[a.solution];
      if (x) x.leans = [...x.leans.filter((l) => !(l.effect === a.effect && l.by === a.by)), { effect: a.effect, by: a.by, lean: a.lean }];
      break;
    }
    case 'commitment': s.commitments[a.commitment] = { text: a.text, solution: a.solution, thread: a.thread, review: a.review, carriers: a.carriers ?? [] }; break;
    case 'node_set': s.nodes[a.node] = { lane: a.lane, kind: a.kind, label: a.label, when: a.when }; break;
    case 'link_set': s.links = [...s.links.filter((l) => !(l.from === a.from && l.to === a.to)), { from: a.from, to: a.to, link: a.link }]; break;
    case 'load': s.loads[a.load] = { name: a.name, carriers: a.carriers, rhythm: a.rhythm }; break;
    case 'result': s.results.push({ text: a.text, backToFinding: a.back_to_finding, when: a.when ?? '' }); break;
    case 'proposal': s.proposals[a.proposal] = a.text; break;
  }
}

/** L'état du collectif, rejoué. Les placements privés restent scellés jusqu'à la révélation. */
export function facilityStanding(entries: FEntry[]): FacilityState {
  const undone = new Set(entries.filter((e) => e.undone !== undefined).map((e) => e.undone!));
  const s = emptyFacility();
  // Une proposition de la machine (« hypothesis ») ne compte pas : elle attend la validation du groupe.
  for (const e of entries) if (e.act && !undone.has(e.rank) && e.provenance !== 'hypothesis') fold(s, e.act);
  return s;
}

/** Les propositions de la machine qui attendent que l'animatrice les valide pour le groupe. */
export function facilityPending(entries: FEntry[]): FEntry[] {
  const undone = new Set(entries.filter((e) => e.undone !== undefined).map((e) => e.undone!));
  return entries.filter((e) => e.provenance === 'hypothesis' && !undone.has(e.rank));
}

export const SOURCE_WORDS: Record<Source, string> = { consented_word: '🗣️ parole consentie', team: '👥 équipe', cvs: '🏛️ CVS' };
export const QUALIF_WORDS: Record<Qualification, string> = {
  individual: 'situation individuelle', signal: 'signal à vérifier', repeated: 'difficulté répétée', confirmed: 'enjeu collectif confirmé',
};

/** Qui a écrit le texte validé : l'IA (validée par le groupe) quand l'aide a servi, sinon le groupe à la main. */
export function provenanceOf(aided: boolean, _validated: boolean, by: string): [string, FEntry['provenance'], string | undefined] {
  // Écrit à la main : le geste du groupe. Proposé par l'IA : « à valider » — l'animatrice le validera
  // pour le groupe, une fois que tout le monde a dit oui (décision du 2026-10-14).
  if (!aided) return [by, 'by_hand', undefined];
  return ['hlux-ia', 'hypothesis', undefined];
}
