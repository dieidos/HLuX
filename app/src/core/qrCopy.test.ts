import { describe, expect, it } from 'vitest';

import type { Entry } from './acts';
import { Collector, CopyRefusal, makeFrames, merge } from './qrCopy';
import { seedAmina } from './seed';

const dossier = { person: 'amina', firstName: 'Amina', entries: seedAmina() };

describe('Copie par QR', () => {
  it('le premier code porte la clé ; les autres, le dossier chiffré, en morceaux lisibles', () => {
    const frames = makeFrames(dossier);
    expect(frames.length).toBeGreaterThan(2);
    expect(frames[0]).toMatch(/^HLUX1\|0\|\d+\|[0-9a-f]{64}\|[0-9a-f]{48}$/);
    expect(frames.slice(1).every((f) => f.length < 640)).toBe(true);
    expect(frames.join('')).not.toContain('Papiers'); // rien en clair
  });

  it('lus dans le désordre, avec des doublons, les codes redonnent le dossier', () => {
    const frames = makeFrames(dossier);
    const c = new Collector();
    for (const f of [...frames].reverse()) c.add(f);
    c.add(frames[1]);
    expect(c.add('https://exemple.test')).toBe(false); // un QR étranger est ignoré
    expect(c.done()).toBe(true);
    expect(c.progress()).toEqual({ read: frames.length, total: frames.length });
    expect(c.open()).toEqual(dossier);
  });

  it('un code manquant, altéré, ou venu d’une autre copie : refus en mots', () => {
    const frames = makeFrames(dossier);
    const missing = new Collector();
    frames.slice(0, -1).forEach((f) => missing.add(f));
    expect(() => missing.open()).toThrow(CopyRefusal);

    const altered = new Collector();
    frames.forEach((f, i) => altered.add(i === 1 ? f.replace(/.$/, (ch) => (ch === '0' ? '1' : '0')) : f));
    expect(() => altered.open()).toThrow(/mal lu/);

    const other = makeFrames({ ...dossier, entries: [...seedAmina(), ...seedAmina()] });
    expect(other.length).not.toBe(frames.length);
    const mixed = new Collector();
    mixed.add(frames[0]);
    expect(() => mixed.add(other[1])).toThrow(/se mélangent/);
  });

  it('fusion en ajout seul : le plus long gagne ; une divergence arrive à côté', () => {
    const base = seedAmina();
    const more: Entry[] = [...base, { rank: base.length, author: 'amina', provenance: 'by_hand', act: { act: 'views_revealed' } }];
    expect(merge(base, more)).toEqual({ entries: more, diverged: false });
    expect(merge(more, base)).toEqual({ entries: more, diverged: false });
    const other: Entry[] = [...base, { rank: base.length, author: 'amina', provenance: 'by_hand', act: { act: 'card_felt', card: 'papiers', feeling: 'fine', when: 'hier' } }];
    expect(merge(more, other).diverged).toBe(true);
  });
});
