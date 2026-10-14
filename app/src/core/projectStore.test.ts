import { describe, expect, it } from 'vitest';

import { DEMO_SETUP } from './demo';
import { journalKey, needsBackup, profileId, readDossier, writeJournal, writeProfiles, type KV } from './profiles';
import { seedAmina } from './seed';
import type { Circle, Lean } from './acts';
import { makeProjectStore, SETUP_KEY } from './projectStore';
import { standing } from './project';

/** Une tablette déjà mise en place (Les Lilas), avec le profil d'Amina : les données de la démonstration, en vraie vie. */
const memory = (): KV & { m: Map<string, string> } => {
  const m = new Map<string, string>();
  const kv = { m, getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) };
  kv.setItem(SETUP_KEY, JSON.stringify(DEMO_SETUP));
  writeProfiles(kv, [{ id: 'amina', firstName: 'Amina' }]);
  writeJournal(kv, 'amina', seedAmina());
  return kv;
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

  it('départ : pas d’effacement sans copie emportée dans la séance ; puis tout part, clé comprise', () => {
    const kv = memory();
    const purged: string[] = [];
    const s = makeProjectStore({ ...kv, purge: (id) => void purged.push(id) });
    s.getState().openSession('Sarah');
    s.getState().open('amina');
    expect(s.getState().purge()).toBe(false);
    const d = s.getState().dossier()!;
    expect(d.firstName).toBe('Amina');
    s.getState().markBackedUp(new Date('2026-10-14T10:00:00Z'));
    expect(s.getState().purge()).toBe(true);
    expect(purged).toEqual(['amina']);
    expect(kv.m.get(journalKey('amina'))).toBeUndefined();
    expect(s.getState().profiles).toEqual([]);
    // relancée, la tablette ne fait pas revenir la démonstration
    expect(makeProjectStore(kv).getState().profiles).toEqual([]);
  });

  it('restaurer : un nouveau profil, jamais par-dessus un autre', () => {
    const kv = memory();
    const s = makeProjectStore(kv);
    s.getState().openSession('Sarah');
    s.getState().open('amina');
    const d = s.getState().dossier()!;
    s.getState().close();
    const id = s.getState().restoreProfile(d);
    expect(id).toBe('amina-2');
    expect(s.getState().entries).toEqual(d.entries);
  });

  it('le rappel doux : jamais de copie, ou plus de 7 jours', () => {
    const now = new Date('2026-10-14T10:00:00Z');
    expect(needsBackup({ id: 'a', firstName: 'A' }, now)).toBe(true);
    expect(needsBackup({ id: 'a', firstName: 'A', lastBackup: '2026-10-10T10:00:00Z' }, now)).toBe(false);
    expect(needsBackup({ id: 'a', firstName: 'A', lastBackup: '2026-10-01T10:00:00Z' }, now)).toBe(true);
  });

  it('un dossier ancien, sans prénom, se relit', () => {
    expect(readDossier(JSON.stringify({ person: 'amina', entries: [] })).firstName).toBe('Amina');
    expect(() => readDossier('{"x":1}')).toThrow();
  });

  it("l'invité, sans séance : il ne lit que son invitation, et ne répond qu'une fois", () => {
    const kv = memory();
    const s = makeProjectStore(kv);
    s.getState().openSession('Sarah');
    s.getState().open('amina');
    s.getState().act('amina', { act: 'invitation_sent', invitation: 'inv-1', guest: 'Salma', relation: 'sœur', idea: 'formation', axes: ['love'], lang: 'ar', expires: 'dans 3 jours' });
    s.getState().closeSession();
    const g = makeProjectStore(kv);
    expect(g.getState().guestRead('inconnue')).toBeNull();
    expect(g.getState().guestRead('inv-1')!.firstName).toBe('Amina');
    const answer = { act: 'invitation_answered' as const, invitation: 'inv-1', leans: [['love', 'much']] as [Circle, Lean][], word: null };
    g.getState().guestAnswer('inv-1', answer, 'Salma');
    g.getState().guestAnswer('inv-1', answer, 'Salma');
    const st = standing(g.getState().guestRead('inv-1')!.entries);
    expect(st.invitations['inv-1'].answered).toBe(true);
    expect(g.getState().guestRead('inv-1')!.entries.filter((e) => e.act?.act === 'invitation_answered')).toHaveLength(1);
  });

  it('copie par QR : la suite du même journal se fusionne ; une divergence arrive à côté', () => {
    const tablet = makeProjectStore(memory());
    tablet.getState().openSession('Sarah');
    tablet.getState().open('amina');
    tablet.getState().act('amina', { act: 'views_revealed' });
    const copy = tablet.getState().dossier()!;

    const phone = makeProjectStore(memory());
    phone.getState().openSession('Sarah');
    expect(phone.getState().receiveCopy(copy)).toEqual({ id: 'amina', diverged: false });
    expect(phone.getState().entries).toEqual(copy.entries);

    phone.getState().act('amina', { act: 'card_felt', card: 'papiers', feeling: 'fine', when: 'hier' });
    tablet.getState().act('amina', { act: 'card_felt', card: 'papiers', feeling: 'hard', when: 'hier' });
    expect(phone.getState().receiveCopy(tablet.getState().dossier()!)).toEqual({ id: 'amina-2', diverged: true });
  });
});

