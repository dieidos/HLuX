// Parité avec le cœur Rust (`core/hlux-core/tests/atlas.rs`) sur le fil d'Amina.
import { describe, expect, it } from 'vitest';

import type { Entry } from './acts';
import { expired, pending, standing } from './project';
import { seedAmina } from './seed';

const N = seedAmina().length;
const felt = (rank: number): Entry => ({ rank, author: 'amina', provenance: 'by_hand', act: { act: 'card_felt', card: 'papiers', feeling: 'hard', when: "aujourd'hui" } });

describe('Projet Personnalisé', () => {
  it('la Carte garde tout son parcours', () => {
    const s = standing([...seedAmina(), felt(N)]);
    expect(s.cards.papiers.feeling).toBe('hard');
    expect(s.cards.papiers.moments).toEqual(['mardi · dite avec Sarah', "aujourd'hui · dans « c'est difficile »"]);
    expect(s.cards.papiers.verbatim).toBe('Les lettres de la CAF, je les laisse fermées.');
  });

  it("annuler est le même geste à l'envers", () => {
    const s = standing([...seedAmina(), felt(N), { rank: N + 1, author: 'amina', provenance: 'by_hand', undone: N }]);
    expect(s.cards.papiers.feeling).toBeNull();
  });

  it('écarter par le bord est irréversible', () => {
    const e: Entry[] = [
      ...seedAmina(),
      { rank: N, author: 'amina', provenance: 'by_hand', act: { act: 'idea_placed', idea: 'formation', spot: { at: 'discarded' } } },
      { rank: N + 1, author: 'amina', provenance: 'by_hand', act: { act: 'idea_placed', idea: 'formation', spot: { at: 'circle', which: 'love' } } },
    ];
    expect(standing(e).ideas.formation.spot).toEqual({ at: 'discarded' });
  });

  it('la machine propose, un humain valide', () => {
    const e: Entry[] = [...seedAmina(), { rank: N, author: 'hlux-ia', provenance: 'hypothesis', act: { act: 'card_simpler', card: 'papiers', text: 'Les lettres me font peur.' } }];
    expect(pending(e)).toHaveLength(1);
    expect(standing(e).cards.papiers.awaitingValidation).toBe(true);
    const confirmed: Entry[] = [
      ...e,
      { rank: N + 1, author: 'hlux-ia', provenance: 'generated', confirmedBy: 'amina', act: e[N].act },
      { rank: N + 2, author: 'amina', provenance: 'by_hand', undone: N },
    ];
    expect(pending(confirmed)).toHaveLength(0);
    expect(standing(confirmed).cards.papiers.simpler).toBe('Les lettres me font peur.');
    expect(standing(confirmed).cards.papiers.awaitingValidation).toBe(false);
  });
});

describe('Invitations', () => {
  it("passé l'échéance, l'invitation est expirée ; les anciennes, en mots, n'expirent pas", () => {
    const base = { guest: 'Salma', relation: '', idea: 'x', axes: [], lang: 'ar' as const, channel: null, ideaText: null, answered: false, leans: [], word: null };
    const now = new Date('2026-10-14T12:00:00Z');
    expect(expired({ ...base, expires: '2026-10-10' }, now)).toBe(true);
    expect(expired({ ...base, expires: '2026-10-20' }, now)).toBe(false);
    expect(expired({ ...base, expires: 'dans 7 jours' }, now)).toBe(false);
  });
});

describe('Annuler par le geste, sans rien effacer', () => {
  it('reposée dans la réserve, la Carte n’est plus posée, et son parcours le dit', () => {
    const e: Entry[] = [...seedAmina(), felt(N), { rank: N + 1, author: 'amina', provenance: 'by_hand', act: { act: 'card_felt', card: 'papiers', feeling: 'fine', when: 'jeudi' } }, { rank: N + 2, author: 'amina', provenance: 'by_hand', act: { act: 'card_back', card: 'papiers', when: 'vendredi' } }];
    const s = standing(e);
    expect(s.cards.papiers.feeling).toBeNull();
    expect(s.cards.papiers.moments.at(-1)).toBe('vendredi · reposée dans la réserve');
    expect(s.cards.papiers.moments).toHaveLength(4);
  });
  it('un axe rangé deux fois revient hors rang en un geste', () => {
    const e: Entry[] = [
      { rank: 0, author: 'amina', provenance: 'by_hand', act: { act: 'axis_ranked', axis: 'love', rank: 'first' } },
      { rank: 1, author: 'amina', provenance: 'by_hand', act: { act: 'axis_ranked', axis: 'love', rank: 'then' } },
      { rank: 2, author: 'amina', provenance: 'by_hand', act: { act: 'axis_unranked', axis: 'love' } },
    ];
    expect(standing(e).axisRanks.love).toBeUndefined();
  });
});

