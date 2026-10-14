import { describe, expect, it } from 'vitest';

import type { Entry } from './acts';
import { chosenCards } from './thread';

const e = (rank: number, act: Entry['act']): Entry => ({ rank, author: 'amina', provenance: 'by_hand', act });

describe('Le fil de la séance', () => {
  it('rassemble toutes les Cartes choisies d’une étape à l’autre, sans celles d’avant la séance', () => {
    const known = { papiers: 1, logement: 1, sante: 1 };
    const entries: Entry[] = [
      e(0, { act: 'card_felt', card: 'sante', feeling: 'fine', when: 'hier' }),
      e(1, { act: 'card_felt', card: 'logement', feeling: 'hard', when: "aujourd'hui" }),
      e(2, { act: 'idea_created', idea: 'i', title: 'Lire', from_card: 'papiers', in_session: false }),
    ];
    expect(chosenCards(['papiers'], entries, 1, known)).toEqual(['papiers', 'logement']);
    expect(chosenCards([], entries, 1, known)).toEqual(['logement', 'papiers']);
  });
});
