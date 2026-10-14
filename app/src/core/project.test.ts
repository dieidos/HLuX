// Parité avec le cœur Rust (`core/hlux-core/tests/atlas.rs`) sur le fil d'Amina.
import { describe, expect, it } from 'vitest';

import type { Entry } from './acts';
import { pending, standing } from './project';
import { seedAmina } from './seed';

const felt = (rank: number): Entry => ({ rank, author: 'amina', provenance: 'by_hand', act: { act: 'card_felt', card: 'papiers', feeling: 'hard', when: "aujourd'hui" } });

describe('Projet Personnalisé', () => {
  it('la Carte garde tout son parcours', () => {
    const s = standing([...seedAmina(), felt(2)]);
    expect(s.cards.papiers.feeling).toBe('hard');
    expect(s.cards.papiers.moments).toEqual(['mardi · dite avec Sarah', "aujourd'hui · dans « c'est difficile »"]);
    expect(s.cards.papiers.verbatim).toBe('Les lettres de la CAF, je les laisse fermées.');
  });

  it("annuler est le même geste à l'envers", () => {
    const s = standing([...seedAmina(), felt(2), { rank: 3, author: 'amina', provenance: 'by_hand', undone: 2 }]);
    expect(s.cards.papiers.feeling).toBeNull();
  });

  it('écarter par le bord est irréversible', () => {
    const e: Entry[] = [
      ...seedAmina(),
      { rank: 2, author: 'amina', provenance: 'by_hand', act: { act: 'idea_placed', idea: 'formation', spot: { at: 'discarded' } } },
      { rank: 3, author: 'amina', provenance: 'by_hand', act: { act: 'idea_placed', idea: 'formation', spot: { at: 'circle', which: 'love' } } },
    ];
    expect(standing(e).ideas.formation.spot).toEqual({ at: 'discarded' });
  });

  it('la machine propose, un humain valide', () => {
    const e: Entry[] = [...seedAmina(), { rank: 2, author: 'hlux-ia', provenance: 'hypothesis', act: { act: 'card_simpler', card: 'papiers', text: 'Les lettres me font peur.' } }];
    expect(pending(e)).toHaveLength(1);
    expect(standing(e).cards.papiers.awaitingValidation).toBe(true);
    const confirmed: Entry[] = [
      ...e,
      { rank: 3, author: 'hlux-ia', provenance: 'generated', confirmedBy: 'amina', act: e[2].act },
      { rank: 4, author: 'amina', provenance: 'by_hand', undone: 2 },
    ];
    expect(pending(confirmed)).toHaveLength(0);
    expect(standing(confirmed).cards.papiers.simpler).toBe('Les lettres me font peur.');
    expect(standing(confirmed).cards.papiers.awaitingValidation).toBe(false);
  });
});
