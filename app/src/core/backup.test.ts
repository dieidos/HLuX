import { describe, expect, it } from 'vitest';

import { exportDossier, importDossier } from './backup';

const PHRASE = 'les lettres de la caf ouvertes au printemps';
const LOW = 2 ** 10; // coût réduit pour les tests seulement

describe('Sauvegarde chiffrée du dossier', () => {
  it('se rouvre avec la bonne phrase', () => {
    const f = exportDossier('{"entries":[]}', PHRASE, LOW);
    expect(f.ciphertext).not.toContain('entries');
    expect(importDossier(f, PHRASE)).toBe('{"entries":[]}');
  });

  it('refuse une phrase trop courte', () => {
    expect(() => exportDossier('x', 'trop courte', LOW)).toThrow(/6 mots/);
  });

  it('refuse une mauvaise phrase, sans rendre un dossier vide', () => {
    const f = exportDossier('secret', PHRASE, LOW);
    expect(() => importDossier(f, 'une autre phrase de six mots ici')).toThrow(/n'ouvre pas/);
  });

  it('refuse un coût forgé avant de calculer', () => {
    const f = exportDossier('secret', PHRASE, LOW);
    expect(() => importDossier({ ...f, n: 2 ** 30 }, PHRASE)).toThrow(/coût/);
  });
});
