import { describe as group, expect, it } from 'vitest';

import type { Entry } from './acts';
import { adopt, describe, differences } from './compare';
import { seedAmina } from './seed';

const N = seedAmina().length;
const card = (rank: number, id: string, title: string): Entry => ({ rank, author: 'amina', provenance: 'by_hand', act: { act: 'card_created', card: id, title, picto: null, verbatim: title, lang: 'fr', origin: 'written', said_with: null, when: 'jeudi' } });

group('Deux versions côte à côte', () => {
  it('seuls les gestes propres à chaque version sont montrés', () => {
    const here = [...seedAmina(), card(N, 'carte-2', 'Logement')];
    const there = [...seedAmina(), card(N, 'carte-2', 'Travail')];
    const d = differences(here, there);
    expect(d.mine.map((e) => describe(e.act!))).toEqual(['Carte « Logement » : « Logement »']);
    expect(d.theirs.map((e) => describe(e.act!))).toEqual(['Carte « Travail » : « Travail »']);
  });

  it('garder une Carte de l’autre version ne recouvre jamais une Carte d’ici, et ses gestes suivent', () => {
    const remap = new Map<string, string>();
    const ids = { cards: ['papiers', 'carte-2'], ideas: [], nodes: [], invitations: [], sims: [], subjects: [] };
    const kept = adopt({ act: 'card_created', card: 'carte-2', title: 'Travail', picto: null, verbatim: '', lang: 'fr', origin: 'written', said_with: null, when: 'jeudi' }, ids, remap);
    expect(kept.act === 'card_created' && kept.card).toBe('carte-3');
    const felt = adopt({ act: 'card_felt', card: 'carte-2', feeling: 'hard', when: 'jeudi' }, ids, remap);
    expect(felt.act === 'card_felt' && felt.card).toBe('carte-3');
  });
});
