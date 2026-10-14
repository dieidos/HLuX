// Le journal du profil ouvert, côté interface, et la séance qui l'ouvre (`profiles.ts`, `projectStore.ts`).
// ⛳ Lot 2 : remplacé par le moteur Rust via UniFFI (SQLite chiffré, une base par profil).

import { makeProjectStore } from './projectStore';
import { pending, standing, type ProjectState } from './project';
import { localStorageAdapter } from './storage';

export { TEAM } from './projectStore';

export const useProject = makeProjectStore(localStorageAdapter);

export const useProjectState = (): ProjectState => standing(useProject((s) => s.entries));
export const usePending = () => pending(useProject((s) => s.entries));

/** Le profil ouvert : son identifiant (auteur des gestes) et son prénom (ce qu'on lit à l'écran). */
export function useMe(): { id: string; name: string } {
  const person = useProject((s) => s.person);
  const profiles = useProject((s) => s.profiles);
  const p = profiles.find((x) => x.id === person);
  return { id: p?.id ?? '', name: p?.firstName ?? '' };
}
