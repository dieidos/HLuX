// La Carte reprise dans la séance : elle fait le fil d'un écran à l'autre (Atlas : « 📄 Papiers » traverse
// les douze écrans). Un état d'écran, pas un geste : rien n'est écrit au journal.
import { create } from 'zustand';

import { useFacilityState } from './useFacility';
import { useProject, useProjectState } from './useProject';
import { currentThread, threadPassed } from './thread';

export const useThread = create<{ card: string | null; take: (card: string) => void }>((set) => ({
  card: null,
  take: (card) => set({ card }),
}));
// Une autre personne, un autre fil.
useProject.subscribe((s, before) => {
  if (s.person !== before.person) useThread.setState({ card: null });
});

/** La Carte du fil et les écrans qu'elle a traversés. */
export function useThreadCard(): { id: string | null; title: string; picto: string | null; passed: string[] } {
  const chosen = useThread((t) => t.card);
  const p = useProjectState();
  const entries = useProject((s) => s.entries);
  const f = useFacilityState();
  const id = currentThread(chosen, p, entries as never);
  const c = id ? p.cards[id] : null;
  return { id, title: c?.title ?? '', picto: c?.picto ?? null, passed: id ? threadPassed(id, p, f) : [] };
}
