// Le jour, en mots, pour les moments d'une Carte : « mardi 14 octobre ». Une date, jamais une heure.
const DAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

export const dayInWords = (d = new Date()) => `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;

/** Les saisons, en commençant par celle d'aujourd'hui (écran 06). */
const SEASONS = ['hiver', 'printemps', 'été', 'automne'];
export function seasonsFrom(d = new Date()) {
  const m = d.getMonth();
  const now = m === 11 || m <= 1 ? 0 : m <= 4 ? 1 : m <= 7 ? 2 : 3;
  return [0, 1, 2, 3].map((k) => SEASONS[(now + k) % 4]);
}
