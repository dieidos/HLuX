// Les regards réunis (écran 05) : chaque marque garde son nom ; la bande va de la marque la plus
// à gauche à la plus à droite. Bande étroite : on se rejoint ; bande large : à en parler.
// ⛔ Aucune moyenne, aucun point de synthèse : la bande dit l'écart, rien d'autre.

import type { Lean } from './acts';

export const LEANS: Lean[] = ['little', 'middle', 'much'];

/** Où se tient une idée sur la ligne d'Amina, en mots : peu, entre les deux, beaucoup. */
export function leanOf(order: string[], idea: string): Lean | null {
  const i = order.indexOf(idea);
  if (i < 0) return null;
  if (order.length === 1) return 'middle';
  const third = i / (order.length - 1);
  return third < 1 / 3 ? 'little' : third > 2 / 3 ? 'much' : 'middle';
}

/** La bande couvre les marques ; elle est étroite quand toutes tiennent dans un même tiers ou deux voisins. */
export function band(marks: Lean[]): { from: Lean; to: Lean; narrow: boolean } | null {
  if (marks.length === 0) return null;
  const idx = marks.map((m) => LEANS.indexOf(m));
  const lo = Math.min(...idx);
  const hi = Math.max(...idx);
  return { from: LEANS[lo], to: LEANS[hi], narrow: hi - lo <= 1 };
}
