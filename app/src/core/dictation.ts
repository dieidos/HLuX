// La dictée : la voix devient du texte **sur l'appareil**, jamais par un serveur, et n'est pas gardée.
// Garde-fou de l'écran 02 : « Parler au micro reste un choix. Ce qu'elle dit n'est jamais enregistré. »

export type Platform = 'ios' | 'android' | 'web' | string;

/**
 * Peut-on dicter sans que la voix quitte l'appareil ?
 * - web : jamais (la reconnaissance du navigateur envoie l'audio à un serveur) ;
 * - iOS : seulement si la reconnaissance sur l'appareil est disponible ;
 * - Android : en plus, la langue doit être installée pour l'usage hors ligne.
 * `requiresOnDeviceRecognition` seul ne suffit pas : la bibliothèque l'ignore si l'appareil ne le permet pas.
 */
export function canDictateOnDevice(p: { platform: Platform; supportsOnDevice: boolean; installedLocales: string[]; lang: 'fr' | 'ar' }): { ok: boolean; reason: string } {
  if (p.platform === 'web') return { ok: false, reason: 'La dictée se fait sur la tablette ou le téléphone, pas dans le navigateur.' };
  if (!p.supportsOnDevice) return { ok: false, reason: "Cet appareil ne sait pas reconnaître la voix sans Internet : écris, ou choisis une image." };
  if (p.platform === 'android' && !p.installedLocales.some((l) => l.toLowerCase().startsWith(p.lang))) {
    return { ok: false, reason: `La langue ${p.lang === 'ar' ? 'arabe' : 'française'} n'est pas installée pour la dictée hors ligne sur cet appareil.` };
  }
  return { ok: true, reason: '' };
}

export const LOCALE = { fr: 'fr-FR', ar: 'ar-SA' } as const;
