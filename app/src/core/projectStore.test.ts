import { describe, expect, it } from 'vitest';

import { journalKey, profileId, type KV } from './profiles';
import { makeProjectStore } from './projectStore';
import { standing } from './project';

const memory = (): KV & { m: Map<string, string> } => {
  const m = new Map<string, string>();
  return { m, getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) };
};

describe('Profils et séance', () => {
  it('hors séance, aucun profil ne s’ouvre et rien ne s’écrit', () => {
    const kv = memory();
    const s = makeProjectStore(kv);
    s.getState().open('amina');
    expect(s.getState().person).toBeNull();
    s.getState().act('amina', { act: 'views_revealed' });
    expect(s.getState().entries).toEqual([]);
  });

  it('la séance ouvre le profil touché ; la fermer le referme', () => {
    const s = makeProjectStore(memory());
    s.getState().openSession('Sarah');
    s.getState().open('amina');
    expect(standing(s.getState().entries).cards.papiers.title).toBe('Papiers');
    s.getState().closeSession();
    expect(s.getState().entries).toEqual([]);
  });

  it('un prénom et une phrase : un profil étanche, né avec sa première Carte', () => {
    const kv = memory();
    const s = makeProjectStore(kv);
    s.getState().openSession('Sarah');
    s.getState().open('amina');
    const before = kv.m.get(journalKey('amina'));
    const id = s.getState().createProfile('Élodie', 'Je voudrais retrouver un travail.');
    expect(id).toBe('elodie');
    expect(s.getState().person).toBe('elodie');
    const st = standing(s.getState().entries);
    expect(st.cards['carte-1'].verbatim).toBe('Je voudrais retrouver un travail.');
    expect(st.cards['carte-1'].saidWith).toBe('Sarah');
    expect(st.cards.papiers).toBeUndefined();
    s.getState().act('elodie', { act: 'views_revealed' });
    expect(kv.m.get(journalKey('amina'))).toBe(before); // le journal d'Amina n'a pas bougé
  });

  it('deux prénoms identiques restent deux profils', () => {
    expect(profileId('Amina', ['amina'])).toBe('amina-2');
    expect(profileId('Aïcha', [])).toBe('aicha');
  });
});
