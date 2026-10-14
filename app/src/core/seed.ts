// Le départ du fil de l'Atlas : la Carte « Papiers », dite mardi avec Sarah.
// Données fictives de démonstration (Amina, CHRS Les Lilas — personnages imaginaires).

import type { Entry } from './acts';

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
  ];
}
