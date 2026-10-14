// La barre d'aides : 🔊 Écouter · 💬 Plus simple · 🌐 Langue.
// Lecture à voix haute sur l'appareil (aucun envoi) ; textes fixes FALC et arabe tirés de l'Atlas.

import * as Speech from 'expo-speech';
import { create } from 'zustand';

import { WORDS, type Register, type WordKey } from '../i18n/words';

interface Aids {
  listen: boolean;
  simple: boolean;
  lang: 'fr' | 'ar';
  toggle: (k: 'listen' | 'simple') => void;
  switchLang: () => void;
}

export const useAids = create<Aids>()((set, get) => ({
  listen: false,
  simple: false,
  lang: 'fr',
  toggle: (k) => set({ [k]: !get()[k] } as Pick<Aids, typeof k>),
  switchLang: () => set({ lang: get().lang === 'fr' ? 'ar' : 'fr' }),
}));

/** Le registre en vigueur : arabe d'abord, puis FALC, puis français. */
export function useRegister(): Register {
  const { lang, simple } = useAids();
  if (lang === 'ar') return 'ar';
  return simple ? 'falc' : 'fr';
}

export function useWords() {
  const r = useRegister();
  return (k: WordKey) => WORDS[k][r];
}

/** Dit une phrase si « Écouter » est actif — sur l'appareil, rien n'est envoyé ni enregistré. */
export function say(text: string) {
  const { listen, lang } = useAids.getState();
  if (!listen || !text) return;
  Speech.stop();
  Speech.speak(text, { language: lang === 'ar' ? 'ar' : 'fr-FR', rate: 0.95 });
}

/** La famille de police selon le registre : Noto Naskh pour l'arabe. */
export function useFamily(bold = false): string {
  const r = useRegister();
  if (r === 'ar') return 'NotoNaskhArabic';
  return bold ? 'SourceSans3Bold' : 'SourceSans3';
}
