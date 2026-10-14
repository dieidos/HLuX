// Parité des catalogues : chaque mot existe en français, en arabe et en « Plus simple » (FALC).
import { describe, expect, it } from 'vitest';

import { WORDS } from './words';

describe('Catalogue des mots', () => {
  it('chaque mot a ses trois registres, non vides', () => {
    const missing = Object.entries(WORDS).flatMap(([k, v]) =>
      (['fr', 'ar', 'falc'] as const).filter((r) => !(v as Record<string, string>)[r]?.trim()).map((r) => `${k}.${r}`),
    );
    expect(missing).toEqual([]);
  });

  it('aucun mot de score, de moyenne ou de vote', () => {
    const all = JSON.stringify(WORDS).toLowerCase();
    for (const w of ['score', 'moyenne', 'vote', 'note sur', '%']) expect(all).not.toContain(w);
  });
});
