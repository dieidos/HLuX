import { Platform } from 'react-native';

import { tokens } from './tokens';

export const C = {
  bg: tokens.color.bg,
  surface: tokens.color.surface,
  surface2: tokens.color.surface2,
  ink: tokens.color.ink,
  text: tokens.color.text,
  slate: tokens.color.slate,
  muted: tokens.color.muted,
  line: tokens.color.line,
  violet: tokens.color.violet.value,
  violetInk: tokens.color.violet.ink,
  night: tokens.color.night,
  lavender: tokens.color.lavender,
  pp: tokens.color.pp,
  pe: tokens.color.pe,
  logo: tokens.color.logo,
  feeling: tokens.color.feeling,
  yellow: tokens.color.yellow,
  blue: tokens.color.blue,
  green: tokens.color.green,
  coral: tokens.color.coral,
  onAccent: tokens.color.onAccent,
  violetSoft: tokens.color.violet.soft,
  violetHover: tokens.color.violet.hover,
  warn: tokens.color.warn,
  amber: tokens.color.amber,
  discard: tokens.color.discard,
  shadow: tokens.color.shadow,
  band: tokens.color.band,
  scrim: tokens.color.scrim,
  veil: tokens.color.veil,
  picto: tokens.color.picto,
};

// Sur le web, chaque police se replie sur Noto Naskh pour les lettres arabes : tout texte arabe, même
// écrit avec la police du titre ou du corps, s'affiche en Noto Naskh. Sur l'appareil (iPad, Android), une
// famille ne prend pas de liste : la police arabe du système prend le relais (écart consigné au CDC).
const withArabic = (f: string) => (Platform.OS === 'web' ? `${f}, ${tokens.font.arabic}` : f);

export const F = {
  display: withArabic(tokens.font.display),
  wordmark: tokens.font.wordmark,
  body: withArabic(tokens.font.body),
  bold: withArabic(`${tokens.font.body}Bold`),
  arabic: tokens.font.arabic,
};

export const S = tokens.size;
