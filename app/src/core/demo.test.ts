import { describe, expect, it } from 'vitest';

import { clearDemo, writeDemo } from './demo';
import { currentMode, MODE_KEY, withMode, type RawKV } from './mode';
import { makeProjectStore } from './projectStore';

const raw = (): RawKV & { m: Map<string, string> } => {
  const m = new Map<string, string>();
  return { m, getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k), keys: () => [...m.keys()] };
};

describe('Vraie vie et démonstration', () => {
  it('une tablette neuve est vide : il faut nommer l’établissement et l’équipe', () => {
    const s = makeProjectStore(withMode(raw()));
    expect(s.getState().setup).toBeNull();
    expect(s.getState().profiles).toEqual([]);
    s.getState().openSession('Sarah');
    expect(s.getState().pro).toBeNull(); // personne n'est de l'équipe tant qu'il n'y a pas d'équipe
    expect(s.getState().configure('CHRS du Port', ['Inès', ' Marc ', ''])).toBe(true);
    expect(s.getState().setup).toEqual({ name: 'CHRS du Port', team: ['Inès', 'Marc'] });
    s.getState().openSession('Inès');
    expect(s.getState().pro).toBe('Inès');
  });

  it('la démonstration entre ses données à part, et les efface en partant', () => {
    const r = raw();
    const kv = withMode(r);
    const real = makeProjectStore(kv);
    real.getState().configure('CHRS du Port', ['Inès']);
    real.getState().openSession('Inès');
    real.getState().createProfile('Nour', 'Je cherche un logement.');

    writeDemo(r);
    expect(currentMode(r)).toBe('demo');
    real.getState().reload();
    expect(real.getState().setup?.name).toBe('CHRS Les Lilas');
    expect(real.getState().profiles.map((p) => p.firstName)).toEqual(['Amina']);

    clearDemo(r);
    real.getState().reload();
    expect(r.getItem(MODE_KEY)).toBe('real');
    expect(real.getState().setup?.name).toBe('CHRS du Port');
    expect(real.getState().profiles.map((p) => p.firstName)).toEqual(['Nour']);
    expect([...r.m.keys()].some((k) => k.startsWith('demo:'))).toBe(false);
  });
});
