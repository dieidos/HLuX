// Le mode démonstration **entre lui-même les données** (décision du 2026-10-14) : l'établissement
// « CHRS Les Lilas », son équipe et le fil d'Amina, tels que l'Atlas les montre (personnages imaginaires).
// Tout s'écrit dans l'espace `demo:` (`mode.ts`) : rien ne se mêle aux vrais profils, et quitter efface tout.

import { MODE_KEY, withMode, wipeDemo, type RawKV } from './mode';
import { writeJournal, writeProfiles } from './profiles';
import { SETUP_KEY } from './projectStore';
import { seedAmina, seedLilas } from './seed';

export const DEMO_SETUP = { name: 'CHRS Les Lilas', team: ['Sarah', 'Aïcha', 'Bruno', 'Karim', 'Léa'] };
const FACILITY_KEY = 'hlux.facility';

/** Passe en démonstration et y entre les données (une démonstration déjà ouverte repart de zéro). */
export function writeDemo(raw: RawKV): void {
  wipeDemo(raw);
  raw.setItem(MODE_KEY, 'demo');
  const kv = withMode(raw);
  kv.setItem(SETUP_KEY, JSON.stringify(DEMO_SETUP));
  writeProfiles(kv, [{ id: 'amina', firstName: 'Amina' }]);
  writeJournal(kv, 'amina', seedAmina());
  // Le format de persistance de zustand : { state, version }.
  kv.setItem(FACILITY_KEY, JSON.stringify({ state: { entries: seedLilas() }, version: 0 }));
}

/** Quitte la démonstration : ses données disparaissent, la vraie vie reprend telle qu'elle était. */
export function clearDemo(raw: RawKV): void {
  wipeDemo(raw);
}
