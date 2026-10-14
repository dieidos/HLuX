// Parité avec `core/hlux-core/tests/atlas.rs` (écrans 09 et 10).
import { describe, expect, it } from 'vitest';

import { facilityStanding, provenanceOf, type FacilityAct, type FEntry } from './facility';

const run = (acts: FacilityAct[]): FEntry[] => acts.map((act, rank) => ({ rank, author: 'x', provenance: 'by_hand', act }));

describe("Projet d'Établissement", () => {
  it('on voit qui a placé, jamais où, avant la révélation', () => {
    const base: FacilityAct[] = [
      { act: 'orientation', orientation: 'o', title: 'Accompagner la lecture des courriers' },
      { act: 'private_placement', orientation: 'o', criterion: 'effect', by: 'Aïcha', lean: 'much' },
      { act: 'private_placement', orientation: 'o', criterion: 'effect', by: 'Bruno', lean: 'much' },
    ];
    const before = facilityStanding(run(base)).orientations.o;
    expect(before.placedBy).toEqual(['Aïcha', 'Bruno']);
    expect(before.placements).toEqual([]);
    const after = facilityStanding(run([...base, { act: 'revealed', orientation: 'o' }])).orientations.o;
    expect(after.placements).toHaveLength(2);
  });

  it('plusieurs placements restent côte à côte', () => {
    const s = facilityStanding(run([
      { act: 'cap_placed', cap: 'c', title: 'Lecture', by: 'Aïcha', spot: { at: 'crossing', which: 'mission' } },
      { act: 'cap_placed', cap: 'c', title: 'Lecture', by: 'Bruno', spot: { at: 'crossing', which: 'vocation' } },
    ]));
    expect(s.caps.c.placements).toHaveLength(2);
  });

  it('la qualification est décidée par le groupe, en mots', () => {
    const s = facilityStanding(run([
      { act: 'finding_placed', finding: 'f', title: 'Comprendre les courriers', zone: 'unsure', source: 'consented_word', author: 'Amina' },
      { act: 'finding_qualified', finding: 'f', level: 'repeated' },
    ]));
    expect(s.findings.f.level).toBe('repeated');
  });
});

describe("Provenance d'un texte de groupe", () => {
  it("écrit à la main : le groupe en est l'auteur", () => {
    expect(provenanceOf(false, true, 'groupe')).toEqual(['groupe', 'by_hand', undefined]);
  });
  it("proposé par l'IA puis validé : généré, confirmé par le groupe", () => {
    expect(provenanceOf(true, true, 'groupe')).toEqual(['hlux-ia', 'generated', 'groupe']);
  });
  it("proposé par l'IA, pas encore validé : en attente", () => {
    expect(provenanceOf(true, false, 'Aïcha')).toEqual(['hlux-ia', 'hypothesis', undefined]);
  });
});
