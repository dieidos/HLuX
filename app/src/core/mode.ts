// Vraie vie ou démonstration (décision du 2026-10-14) : la même application, deux espaces étanches.
//
// - En vraie vie, la tablette démarre vide : on nomme l'établissement et l'équipe, puis les personnes.
// - Le mode démonstration, caché, **entre lui-même les données** (Amina, CHRS Les Lilas) : toutes ses clés
//   sont préfixées `demo:`, si bien qu'elles ne se mêlent jamais aux vrais profils, et le quitter les efface.
// - La seule clé commune aux deux espaces est celle qui dit dans quel espace on est.

export type Mode = 'real' | 'demo';
export const MODE_KEY = 'hlux.mode';
export const DEMO_PREFIX = 'demo:';

/** Un stockage clé-valeur, avec la liste de ses clés (pour effacer un espace entier). */
export interface RawKV {
  getItem: (k: string) => string | null;
  setItem: (k: string, v: string) => void;
  removeItem: (k: string) => void;
  keys: () => string[];
  purge?: (id: string) => void;
}

export function currentMode(raw: RawKV): Mode {
  return raw.getItem(MODE_KEY) === 'demo' ? 'demo' : 'real';
}

/** Le stockage vu depuis l'espace courant : en démonstration, chaque clé est préfixée. */
export function withMode(raw: RawKV) {
  const k = (key: string) => (currentMode(raw) === 'demo' ? DEMO_PREFIX + key : key);
  return {
    getItem: (key: string) => raw.getItem(k(key)),
    setItem: (key: string, v: string) => raw.setItem(k(key), v),
    removeItem: (key: string) => raw.removeItem(k(key)),
    purge: (id: string) => raw.purge?.(currentMode(raw) === 'demo' ? `${DEMO_PREFIX}${id}` : id),
  };
}

/** Quitter la démonstration : toutes ses clés disparaissent, puis on revient à la vraie vie. */
export function wipeDemo(raw: RawKV): void {
  for (const key of raw.keys()) if (key.startsWith(DEMO_PREFIX)) raw.removeItem(key);
  raw.setItem(MODE_KEY, 'real');
}
