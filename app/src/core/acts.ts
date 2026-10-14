// Miroir TypeScript des gestes de `core/hlux-core/src/act.rs`.
// ⛔ Le cœur Rust fait foi : ce fichier suit sa forme JSON (`tag = "act"`, snake_case).

export type Id = string;
export type Feeling = 'fine' | 'unsure' | 'hard';
export type Origin = 'spoken' | 'written' | 'picture';
export type Lang = 'fr' | 'ar';
export type Circle = 'love' | 'able' | 'useful' | 'living';
export type Crossing = 'passion' | 'mission' | 'profession' | 'vocation';
export type Spot =
  | { at: 'tray' }
  | { at: 'circle'; which: Circle }
  | { at: 'crossing'; which: Crossing }
  | { at: 'discarded' };
export type Rank = 'first' | 'then' | 'also' | 'less' | 'not_yet';
export type Lean = 'little' | 'middle' | 'much';
/** Écran 05 — par où part l'invitation. */
export type Channel = 'sms' | 'mail' | 'in_session';
export type NodeKind = 'decision' | 'event';
export type LinkKind =
  | { kind: 'chosen' }
  | { kind: 'open' }
  | { kind: 'condition'; words: string }
  | { kind: 'dependency'; words: string };

export interface Plan {
  first: string[];
  waiting: [string, string][];
  with_whom: string[];
  open: string[];
}

export type ProjectAct =
  | { act: 'card_created'; card: Id; title: string; picto: string | null; verbatim: string; lang: Lang; origin: Origin; said_with: string | null; when: string }
  | { act: 'card_simpler'; card: Id; text: string }
  | { act: 'card_translated'; card: Id; lang: Lang; text: string }
  | { act: 'card_felt'; card: Id; feeling: Feeling; when: string }
  | { act: 'idea_created'; idea: Id; title: string; from_card: Id | null; in_session: boolean }
  | { act: 'idea_placed'; idea: Id; spot: Spot }
  | { act: 'axis_ranked'; axis: Circle; rank: Rank }
  | { act: 'line_ordered'; axis: Circle; author: string; order: Id[] }
  | { act: 'companion_order'; by: string; ranks: [Circle, Rank][] }
  | { act: 'invitation_sent'; invitation: Id; guest: string; relation: string; idea: Id; axes: Circle[]; lang: Lang; expires: string; channel?: Channel | null; idea_text?: string | null }
  | { act: 'invitation_answered'; invitation: Id; leans: [Circle, Lean][]; word: string | null }
  | { act: 'views_revealed' }
  | { act: 'node_set'; node: Id; lane: string; kind: NodeKind; label: string; when: string; thread: boolean }
  | { act: 'link_set'; from: Id; to: Id; link: LinkKind }
  | { act: 'what_if'; sim: Id; question: string; moves: [Id, string][]; story: string | null }
  | { act: 'what_if_closed'; sim: Id; kept: boolean }
  | { act: 'plan_set'; plan: Plan }
  | { act: 'subject_prepared'; subject: Id; card: Id; mine: string; for_collective: string }
  | { act: 'proposal_linked'; proposal: string; node: Id };

/** Où vient un geste : à la main, dicté, ou proposé par la machine (en attente d'un humain). */
export type Provenance = 'by_hand' | 'dictated' | 'hypothesis' | 'generated';

export interface Entry {
  rank: number;
  author: string;
  provenance: Provenance;
  confirmedBy?: string;
  /** Une compensation : le geste au rang `undone` est annulé, rien n'est effacé. */
  undone?: number;
  act?: ProjectAct;
}
