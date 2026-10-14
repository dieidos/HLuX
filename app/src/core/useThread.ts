// Le fil de la séance : **toutes les Cartes choisies, d'une étape à l'autre** (décision du 2026-10-14).
// Une Carte rejoint le fil quand la personne la prend : ouverte en 01, posée en 02, d'où naît une envie,
// apportée en 07, reliée à une étape… Un état d'écran, pas un geste : rien n'est écrit au journal.
import { useMemo } from 'react';
import { create } from 'zustand';

import { useFacilityState } from './useFacility';
import { useProject, useProjectState } from './useProject';
import { chosenCards, threadPassed } from './thread';

export const useThread = create<{ taken: string[]; since: number; take: (card: string) => void }>((set, get) => ({
  taken: [],
  since: 0,
  take: (card) => { if (!get().taken.includes(card)) set({ taken: [...get().taken, card] }); },
}));
// Une autre personne, un autre fil : il commence à l'ouverture de son profil.
useProject.subscribe((s, before) => {
  if (s.person !== before.person) useThread.setState({ taken: [], since: s.entries.length });
});

export interface ThreadCard { id: string; title: string; picto: string | null; passed: string[] }

/** Le fil : les Cartes choisies, et pour chacune les écrans qu'elle a traversés. */
export function useThreadCards(): ThreadCard[] {
  const { taken, since } = useThread();
  const p = useProjectState();
  const entries = useProject((s) => s.entries);
  const f = useFacilityState();
  return useMemo(
    () => chosenCards(taken, entries, since, p.cards).map((id) => ({ id, title: p.cards[id].title, picto: p.cards[id].picto, passed: threadPassed(id, p, f) })),
    [taken, since, entries, p, f],
  );
}
