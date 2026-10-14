// Écran 02 : dire où va la Carte au lieu de la glisser — « Papiers, c'est difficile ».
// Même geste qu'au toucher : l'écran redit le résultat, « Annuler » reste là. Rien de plus n'est gardé.
// On ne devine pas : sans une Carte **et** un lieu reconnus, rien ne bouge.

import type { Feeling } from './acts';

// Accents latins retirés, puis recomposition (NFC) : sinon la hamza de « أعرف » resterait séparée.
const plain = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').normalize('NFC').toLowerCase().replace(/[’']/g, "'");

// Le premier qui correspond l'emporte : « je ne sais pas » avant « pas bien », « pas bien » avant « bien ».
const PLACES: [Feeling, RegExp][] = [
  ['unsure', /je ne sais pas|sais pas|j'hesite|hesite|لا أعرف|لست متأكدة/],
  ['hard', /difficile|\bdur\b|pas bien|\bmal\b|صعب/],
  ['fine', /ca va|\bbien\b|بخير|جيد/],
];

export function parsePlacement(said: string, cards: { id: string; title: string }[]): { card: string; feeling: Feeling } | null {
  const t = plain(said);
  const card = cards.find((c) => t.includes(plain(c.title)));
  const place = PLACES.find(([, re]) => re.test(t));
  return card && place ? { card: card.id, feeling: place[0] } : null;
}
