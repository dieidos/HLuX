// Deux versions d'un même dossier (copie QR divergente) : côte à côte, et la personne choisit, point par point,
// ce qu'elle garde de l'autre version (décision du 2026-10-14). Rien n'est effacé ni fusionné d'office.
//
// Le piège : les deux appareils ont pu créer chacun une « carte-3 » différente. Garder un élément de l'autre
// version lui donne donc un identifiant neuf s'il en croise un d'ici, et ses gestes suivants suivent ce renommage.

import type { Entry, ProjectAct } from './acts';
import { freshId } from './ids';

/** Les gestes propres à chaque version, après leur tronc commun. */
export function differences(here: Entry[], there: Entry[]): { mine: Entry[]; theirs: Entry[] } {
  let n = 0;
  while (n < here.length && n < there.length && JSON.stringify(here[n]) === JSON.stringify(there[n])) n++;
  const live = (es: Entry[]) => {
    const undone = new Set(es.filter((e) => e.undone !== undefined).map((e) => e.undone!));
    return es.slice(n).filter((e) => e.act && !undone.has(e.rank));
  };
  return { mine: live(here), theirs: live(there) };
}

/** Un geste, dit en mots, pour la comparaison. */
export function describe(a: ProjectAct): string {
  switch (a.act) {
    case 'card_created': return `Carte « ${a.title} »${a.verbatim ? ` : « ${a.verbatim} »` : ''}`;
    case 'card_felt': return `Carte posée : ${a.feeling === 'fine' ? 'ça va' : a.feeling === 'unsure' ? 'je ne sais pas' : "c'est difficile"} (${a.when})`;
    case 'card_back': return `Carte reposée dans la réserve (${a.when})`;
    case 'idea_created': return `Envie « ${a.title} »`;
    case 'idea_placed': return 'Envie déplacée';
    case 'axis_ranked': return 'Un rang de priorité';
    case 'axis_unranked': return 'Un axe remis à ranger';
    case 'line_ordered': return 'Ses idées situées sur une ligne';
    case 'invitation_sent': return `Invitation à ${a.guest}`;
    case 'invitation_answered': return 'Une réponse d’invité';
    case 'node_set': return `Étape « ${a.label} » (${a.when})`;
    case 'link_set': return 'Un lien entre deux étapes';
    case 'what_if': return `Et si… ? « ${a.question} »`;
    case 'plan_set': return 'Son plan';
    case 'subject_prepared': return `Sujet apporté : « ${a.for_collective} »`;
    case 'subject_declined': return `Pas maintenant (${a.when})`;
    default: return 'Un geste';
  }
}

type Ids = { cards: string[]; ideas: string[]; nodes: string[]; invitations: string[]; sims: string[]; subjects: string[] };

/**
 * Le geste de l'autre version, prêt à entrer ici : un identifiant neuf s'il croise un identifiant d'ici,
 * et les références (carte, idée, étape…) suivent les renommages déjà faits.
 */
export function adopt(a: ProjectAct, here: Ids, remap: Map<string, string>): ProjectAct {
  const r = (id: string) => remap.get(id) ?? id;
  const fresh = (id: string, taken: string[], prefix: string) => {
    if (remap.has(id)) return remap.get(id)!;
    if (!taken.includes(id)) return id;
    const n = freshId(prefix, [...taken, ...remap.values()]);
    remap.set(id, n);
    return n;
  };
  switch (a.act) {
    case 'card_created': return { ...a, card: fresh(a.card, here.cards, 'carte') };
    case 'idea_created': return { ...a, idea: fresh(a.idea, here.ideas, 'idee'), from_card: a.from_card ? r(a.from_card) : null };
    case 'node_set': return { ...a, node: fresh(a.node, here.nodes, 'etape'), card: a.card ? r(a.card) : a.card };
    case 'invitation_sent': return { ...a, invitation: fresh(a.invitation, here.invitations, 'inv'), idea: r(a.idea) };
    case 'what_if': return { ...a, sim: fresh(a.sim, here.sims, 'sim'), moves: a.moves.map(([n, w]) => [r(n), w]) };
    case 'subject_prepared': return { ...a, subject: fresh(a.subject, here.subjects, 'sujet'), card: r(a.card) };
    case 'card_felt': case 'card_back': case 'card_simpler': case 'card_translated': case 'subject_declined': return { ...a, card: r(a.card) };
    case 'idea_placed': return { ...a, idea: r(a.idea) };
    case 'invitation_answered': return { ...a, invitation: r(a.invitation) };
    case 'link_set': return { ...a, from: r(a.from), to: r(a.to) };
    case 'line_ordered': return { ...a, order: a.order.map(r) };
    case 'what_if_closed': return { ...a, sim: r(a.sim) };
    case 'proposal_linked': return { ...a, node: r(a.node) };
    default: return a;
  }
}
