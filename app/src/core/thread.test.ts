import { describe, expect, it } from 'vitest';

import type { Entry } from './acts';
import { emptyFacility } from './facility';
import { standing } from './project';
import { seedAmina } from './seed';
import { cardThread } from './thread';

const N = seedAmina().length;

describe('Le fil de la Carte', () => {
  it('commence par la parole, puis suit chaque geste', () => {
    const e: Entry[] = [
      ...seedAmina(),
      { rank: N, author: 'amina', provenance: 'by_hand', act: { act: 'card_felt', card: 'papiers', feeling: 'hard', when: "aujourd'hui" } },
    ];
    const t = cardThread('papiers', standing(e), null);
    expect(t[0]).toEqual({ step: 'Dite', detail: 'mardi · dite avec Sarah' });
    expect(t[1]).toEqual({ step: 'Ressentie', detail: "aujourd'hui · dans « c'est difficile »" });
  });

  it("rejoint l'engagement du collectif quand son fil part de cette Carte", () => {
    const f = emptyFacility();
    f.commitments['e-1'] = { text: 'Atelier courriers, le jeudi', solution: 's', thread: ['Papiers', '…', 'engagement'], review: 'en mars', carriers: [] };
    const t = cardThread('papiers', standing(seedAmina()), f);
    expect(t.map((s) => s.step)).toContain('Un engagement du collectif');
    expect(cardThread('inconnue', standing(seedAmina()), f)).toEqual([]);
  });
});
