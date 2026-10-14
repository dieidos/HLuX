// Parité avec `core/hlux-core/tests/atlas.rs` (écrans 09 et 10).
import { describe, expect, it } from 'vitest';

import { facilityPending, facilityStanding, provenanceOf, type FacilityAct, type FEntry } from './facility';

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
  it("proposé par l'IA : à valider, même si le bouton dit « validé » — c'est l'animatrice qui valide", () => {
    expect(provenanceOf(true, true, 'groupe')).toEqual(['hlux-ia', 'hypothesis', undefined]);
  });
  it('une proposition à valider ne compte pas ; validée par l’animatrice, elle compte', () => {
    const e: FEntry[] = [{ rank: 0, author: 'hlux-ia', provenance: 'hypothesis', act: { act: 'result', text: 'Trois personnes lisent seules.', back_to_finding: false } }];
    expect(facilityStanding(e).results).toEqual([]);
    expect(facilityPending(e)).toHaveLength(1);
    const ok: FEntry[] = [...e, { rank: 1, author: 'hlux-ia', provenance: 'generated', confirmedBy: 'Aïcha', act: e[0].act }, { rank: 2, author: 'Aïcha', provenance: 'by_hand', undone: 0 }];
    expect(facilityStanding(ok).results).toHaveLength(1);
    expect(facilityPending(ok)).toHaveLength(0);
  });
  it("proposé par l'IA, pas encore validé : en attente", () => {
    expect(provenanceOf(true, false, 'Aïcha')).toEqual(['hlux-ia', 'hypothesis', undefined]);
  });
});
