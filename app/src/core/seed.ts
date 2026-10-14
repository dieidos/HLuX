// Le départ du fil de l'Atlas : la Carte « Papiers », dite mardi avec Sarah.
// Données fictives de démonstration (Amina, CHRS Les Lilas — personnages imaginaires).

import type { Entry, ProjectAct } from './acts';

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
    { act: 'node_set', node: 'rdv-caf', lane: 'démarches', kind: 'event', label: 'rendez-vous CAF demandé', when: 'automne', thread: false },
    { act: 'node_set', node: 'atelier', lane: 'démarches', kind: 'event', label: 'atelier courriers avec Sarah', when: 'hiver', thread: true },
    { act: 'node_set', node: 'caf-ok', lane: 'démarches', kind: 'event', label: 'dossier CAF à jour', when: 'printemps', thread: false },
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
