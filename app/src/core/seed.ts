// Le départ du fil de l'Atlas : la Carte « Papiers », dite mardi avec Sarah.
// Données fictives de démonstration (Amina, CHRS Les Lilas — personnages imaginaires).

import type { Entry, ProjectAct } from './acts';
import type { FacilityAct, FEntry } from './facility';

export function seedAmina(): Entry[] {
  return [
    {
      rank: 0, author: 'amina', provenance: 'dictated',
      act: {
        act: 'card_created', card: 'papiers', title: 'Papiers', picto: 'papiers',
        verbatim: 'Les lettres de la CAF, je les laisse fermées.', lang: 'fr', origin: 'spoken',
        said_with: 'Sarah', when: 'mardi',
      },
    },
    {
      rank: 1, author: 'amina', provenance: 'by_hand',
      act: { act: 'idea_created', idea: 'formation', title: 'Formation', from_card: null, in_session: false },
    },
    ...pathAmina(2),
  ];
}

/** Le chemin d'Amina tel que l'Atlas le montre (écran 06). */
function pathAmina(from: number): Entry[] {
  const acts: ProjectAct[] = [
    { act: 'node_set', node: 'choisis', lane: 'démarches', kind: 'decision', label: 'je choisis', when: 'automne', thread: false },
    { act: 'node_set', node: 'rdv-caf', lane: 'démarches', kind: 'event', label: 'rendez-vous CAF demandé', when: 'automne', thread: false, card: 'papiers' },
    { act: 'node_set', node: 'atelier', lane: 'démarches', kind: 'event', label: 'atelier courriers avec Sarah', when: 'hiver', thread: true, card: 'papiers' },
    { act: 'node_set', node: 'caf-ok', lane: 'démarches', kind: 'event', label: 'dossier CAF à jour', when: 'printemps', thread: false, card: 'papiers' },
    { act: 'node_set', node: 'choix-formation', lane: 'formation', kind: 'decision', label: 'je choisis la formation', when: 'hiver', thread: false },
    { act: 'node_set', node: 'dossier', lane: 'formation', kind: 'event', label: 'dossier déposé', when: 'printemps', thread: false },
    { act: 'node_set', node: 'creer', lane: 'activité', kind: 'event', label: 'créer une activité — ouverte', when: 'printemps', thread: false },
    { act: 'node_set', node: 'permis', lane: 'permis', kind: 'event', label: 'le permis', when: 'été', thread: false },
    { act: 'link_set', from: 'choisis', to: 'rdv-caf', link: { kind: 'chosen' } },
    { act: 'link_set', from: 'rdv-caf', to: 'atelier', link: { kind: 'chosen' } },
    { act: 'link_set', from: 'atelier', to: 'caf-ok', link: { kind: 'chosen' } },
    { act: 'link_set', from: 'atelier', to: 'choix-formation', link: { kind: 'chosen' } },
    { act: 'link_set', from: 'choix-formation', to: 'dossier', link: { kind: 'chosen' } },
    { act: 'link_set', from: 'choix-formation', to: 'creer', link: { kind: 'open' } },
    { act: 'link_set', from: 'creer', to: 'permis', link: { kind: 'condition', words: 'si le rendez-vous a lieu avant mars' } },
    { act: 'link_set', from: 'caf-ok', to: 'dossier', link: { kind: 'dependency', words: 'ceci attend le rendez-vous CAF' } },
    { act: 'plan_set', plan: { first: ['Atelier courriers · jeudi'], waiting: [['Formation', 'après le rendez-vous CAF']], with_whom: ['Sarah', 'Salma'], open: ['Créer', 'Permis'] } },
  ];
  return acts.map((act, i) => ({ rank: from + i, author: 'amina', provenance: 'by_hand', act }));
}

/** Le CHRS Les Lilas tel que l'Atlas le montre au début de l'écran 07 (personnages imaginaires). */
export function seedLilas(): FEntry[] {
  const acts: FacilityAct[] = [
    { act: 'attendance', session: 'mardi 12 janvier', present: ['Aïcha', 'Bruno', 'Karim', 'CVS'], absent: ['Léa'], facilitator: 'Aïcha' },
    { act: 'agenda_item', item: 'local-cvs', title: 'Le local du CVS', source: 'cvs', session: 'mardi 12 janvier' },
    { act: 'agenda_item', item: 'laverie', title: 'Les horaires de la laverie', source: 'consented_word', session: 'mardi 12 janvier' },
    { act: 'mandate_set', to: 'Aïcha' },
    { act: 'finding_placed', finding: 'nuit', title: "L'équipe de nuit prévient", zone: 'fine', source: 'team', author: 'Bruno' },
    { act: 'finding_placed', finding: 'cvs', title: 'Le CVS se réunit', zone: 'fine', source: 'cvs', author: 'Aïcha' },
    { act: 'finding_placed', finding: 'laverie', title: 'Horaires de la laverie', zone: 'unsure', source: 'consented_word', author: 'Karim' },
  ];
  return acts.map((act, i) => ({ rank: i, author: 'aicha', provenance: 'by_hand', act }));
}
