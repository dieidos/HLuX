// Les aides IA — le maximum, mais seulement derrière des fonctions de l'Atlas, et jamais sans un humain.
//
// Règles (CDC, « Montage IA ») :
// - l'IA ne propose JAMAIS d'idée, de chemin ni de solution : elle reformule, traduit, simplifie, décrit ;
// - un appel ne part que sur un geste explicite (le bouton d'aide fait office de consentement) ;
// - le texte est pseudonymisé et passe la garde « données de santé » AVANT de partir ; rien n'est conservé ;
// - la réponse entre au journal en `hypothesis` : elle attend qu'un humain la valide ;
// - le seul serveur est dieidos (`EXPO_PUBLIC_DIEIDOS_URL`) ; sans lui, un exemple hors ligne, annoncé comme tel.

export type AideKind =
  | 'simplify' // 💬 Plus simple (FALC)
  | 'translate' // 🌐 Langue
  | 'generalize' // 07 « Pour le collectif »
  | 'narrate' // 06 récit « Et si… ? », 06 plan, 08 relecture du constat
  | 'phrase'; // 09 changement attendu, 10 décision, 11 engagement, 12 résultat

export interface AideRequest { kind: AideKind; text: string; lang?: 'fr' | 'ar'; register?: 'falc' | 'plain' }
export interface AideResult { proposal: string; offline: boolean }

export class AideRefusal extends Error {
  constructor(readonly reason: string) {
    super(reason);
    this.name = 'AideRefusal';
  }
}

// Garde « données de santé » : rien de cela ne part vers dieidos, qui n'est pas hébergeur HDS.
// ⚠️ Pas de `\b` : en JavaScript, il ne voit pas les lettres accentuées ni l'arabe (« santé » passait).
// Les bords de mot sont des lettres Unicode (`\p{L}`), et l'arabe a sa propre liste (racines courantes).
const WORD = (w: string) => `(?<!\\p{L})(?:${w})(?!\\p{L})`;
const HEALTH_FR = [
  'sant[ée]', 'malad\\p{L}*', 'm[ée]dic\\p{L}*', 'm[ée]decins?', 'docteur\\p{L}*', 'infirmi\\p{L}*', 'soins?', 'traitements?',
  'h[ôo]pita\\p{L}*', 'urgences', 'diagnostic\\p{L}*', 'handicap\\p{L}*', 'enceinte', 'grossesse', 'psy\\p{L}*', 'd[ée]press\\p{L}*',
  'addiction\\p{L}*', 'alcool\\p{L}*', 'drogues?', 'th[ée]rapie\\p{L}*', 'ordonnances?', 'vih', 'sida', 'cancer\\p{L}*',
  'diab[èe]t\\p{L}*', 'pharmacie\\p{L}*', 'opération', 'chirurg\\p{L}*', 'mutuelle', 'cmu', 'css',
];
const HEALTH_AR = ['صح[ةت]', 'مرض', 'مريض', 'دواء', 'أدوية', 'طبيب', 'مستشفى', 'علاج', 'حامل', 'حمل', 'نفسي', 'اكتئاب', 'إدمان', 'سرطان', 'سكري'];
const HEALTH = new RegExp(`${HEALTH_FR.map(WORD).join('|')}|${HEALTH_AR.join('|')}`, 'iu');
// Coordonnées : un numéro de téléphone ou une adresse électronique ne partent pas non plus.
const CONTACT = /(?:\+?\d[\d .-]{7,}\d)|(?:[\p{L}\d._%+-]+@[\p{L}\d.-]+\.\p{L}{2,})/u;

/** Les prénoms connus sont remplacés avant l'envoi, et rétablis au retour. */
export function pseudonymize(text: string, names: string[]): { text: string; restore: (s: string) => string } {
  const map = new Map<string, string>();
  let out = text;
  names.forEach((n, i) => {
    const tag = `[P${i + 1}]`;
    if (out.includes(n)) {
      map.set(tag, n);
      out = out.split(n).join(tag);
    }
  });
  return { text: out, restore: (s) => [...map].reduce((acc, [tag, n]) => acc.split(tag).join(n), s) };
}

export function guard(text: string): void {
  if (!text.trim()) throw new AideRefusal('Rien à reformuler.');
  if (HEALTH.test(text)) throw new AideRefusal("Ce texte parle de santé : il reste sur l'appareil, l'aide IA ne l'envoie pas.");
  if (CONTACT.test(text)) throw new AideRefusal("Ce texte contient un numéro ou une adresse : il reste sur l'appareil.");
}

/** L'exemple hors ligne : sans IA, déterministe, et dit comme tel. */
export function offlineExample(req: AideRequest): string {
  const t = req.text.trim().replace(/^«\s*|\s*»$/g, '');
  switch (req.kind) {
    case 'simplify':
      return t.split(/[.;:]/)[0].split(' ').slice(0, 8).join(' ') + '.';
    case 'translate':
      return req.lang === 'ar' ? '(traduction en arabe : disponible avec dieidos)' : '(traduction en français : disponible avec dieidos)';
    case 'generalize':
      return `${t.split(/[.,]/)[0]} est difficile pour plusieurs personnes.`;
    case 'phrase': {
      const u = t.charAt(0).toUpperCase() + t.slice(1);
      return /[.!?]$/.test(u) ? u : `${u}.`;
    }
    default:
      return t;
  }
}

/** Les prénoms à masquer avant tout envoi : tenus à jour par l'application (`setKnownNames`). */
let NAMES: string[] = [];
export function setKnownNames(names: string[]) {
  // Les plus longs d'abord : « Marie-Anne » avant « Marie ».
  NAMES = [...new Set(names.map((n) => n.trim()).filter((n) => n.length > 1))].sort((a, b) => b.length - a.length);
}

export async function askAide(req: AideRequest, fetcher: typeof fetch = fetch): Promise<AideResult> {
  guard(req.text);
  const base = process.env.EXPO_PUBLIC_DIEIDOS_URL;
  if (!base) return { proposal: offlineExample(req), offline: true };
  const p = pseudonymize(req.text, NAMES);
  // Contrat : docs/dieidos/contrat-api.md — POST /api/assist/{kind}, jeton du tenant, sans rétention.
  const r = await fetcher(`${base}/api/assist/${req.kind}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text: p.text, lang: req.lang ?? 'fr', register: req.register ?? 'plain' }),
  });
  if (!r.ok) throw new AideRefusal("L'aide n'a pas répondu. Rien n'a changé.");
  const { proposal } = (await r.json()) as { proposal: string };
  guard(proposal);
  return { proposal: p.restore(proposal), offline: false };
}

/**
 * « …ou je choisis une image » (01) : l'IA **ordonne** les pictos d'après la phrase dite ; c'est la
 * personne qui choisit. Route dieidos `POST /api/assist/sort` (décision du 2026-10-14). La réponse doit
 * être une permutation exacte des clés envoyées, sinon on garde l'ordre habituel. Sans dieidos : l'ordre habituel.
 */
export async function sortPictos(text: string, keys: string[], lang: 'fr' | 'ar' = 'fr', fetcher: typeof fetch = fetch): Promise<string[]> {
  const base = process.env.EXPO_PUBLIC_DIEIDOS_URL;
  if (!base || !text.trim()) return keys;
  guard(text);
  const p = pseudonymize(text, NAMES);
  try {
    const r = await fetcher(`${base}/api/assist/sort`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: p.text, lang, keys }),
    });
    if (!r.ok) return keys;
    const { order } = (await r.json()) as { order: string[] };
    const same = Array.isArray(order) && order.length === keys.length && [...order].sort().join() === [...keys].sort().join();
    return same ? order : keys;
  } catch {
    return keys;
  }
}
