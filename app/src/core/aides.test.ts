import { afterEach, describe, expect, it, vi } from 'vitest';

import { askAide, AideRefusal, guard, offlineExample, pseudonymize, setKnownNames, sortPictos } from './aides';

afterEach(() => {
  delete process.env.EXPO_PUBLIC_DIEIDOS_URL;
});

describe('Aides IA', () => {
  it('la garde santé bloque avant tout envoi', () => {
    expect(() => guard('Je dois aller à l’hôpital pour mon traitement.')).toThrow(AideRefusal);
    expect(() => guard('Les lettres de la CAF, je les laisse fermées.')).not.toThrow();
  });

  it('pseudonymise les prénoms et les rétablit au retour', () => {
    const p = pseudonymize('Amina en parle avec Sarah.', ['Amina', 'Sarah']);
    expect(p.text).toBe('[P1] en parle avec [P2].');
    expect(p.restore('[P1] parle avec [P2].')).toBe('Amina parle avec Sarah.');
  });

  it('sans dieidos : un exemple hors ligne, annoncé comme tel', async () => {
    const r = await askAide({ kind: 'generalize', text: 'Comprendre les courriers administratifs' });
    expect(r.offline).toBe(true);
    expect(r.proposal).toBe('Comprendre les courriers administratifs est difficile pour plusieurs personnes.');
    expect(offlineExample({ kind: 'simplify', text: 'Les lettres de la CAF, je les laisse fermées.' })).toContain('Les lettres');
    expect(offlineExample({ kind: 'phrase', text: 'au printemps cinq personnes viennent' })).toBe('Au printemps cinq personnes viennent.');
  });

  it('avec dieidos : le texte part pseudonymisé, la réponse revient avec les prénoms', async () => {
    process.env.EXPO_PUBLIC_DIEIDOS_URL = 'https://dieidos.test';
    setKnownNames(['Amina', 'Sarah']); // l'application tient la liste à jour (personnes, équipe, invités)
    const fetcher = vi.fn(async (_u: string, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      expect(body.text).not.toContain('Amina');
      return new Response(JSON.stringify({ proposal: '[P1] a peur des lettres.' }), { status: 200 });
    });
    const r = await askAide({ kind: 'simplify', text: 'Amina laisse les lettres fermées.' }, fetcher as unknown as typeof fetch);
    expect(r).toEqual({ proposal: 'Amina a peur des lettres.', offline: false });
    expect(fetcher.mock.calls[0][0]).toBe('https://dieidos.test/api/assist/simplify');
  });

  it('tri des pictos : une permutation des clés, sinon l’ordre habituel ; sans dieidos, l’ordre habituel', async () => {
    const keys = ['famille', 'papiers', 'logement'];
    expect(await sortPictos('Les lettres de la CAF', keys)).toEqual(keys);
    process.env.EXPO_PUBLIC_DIEIDOS_URL = 'https://dieidos.test';
    const ok = vi.fn(async () => new Response(JSON.stringify({ order: ['papiers', 'logement', 'famille'] }), { status: 200 }));
    expect(await sortPictos('Les lettres de la CAF', keys, ok as unknown as typeof fetch)).toEqual(['papiers', 'logement', 'famille']);
    const forged = vi.fn(async () => new Response(JSON.stringify({ order: ['papiers', 'arme'] }), { status: 200 }));
    expect(await sortPictos('Les lettres de la CAF', keys, forged as unknown as typeof fetch)).toEqual(keys);
  });
});

