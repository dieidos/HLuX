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
const HEALTH = /\b(sant[ée]|malad\w*|m[ée]dic\w*|traitement|h[ôo]pital|diagnostic\w*|handicap\w*|enceinte|grossesse|psychiatr\w*|d[ée]pression|addiction|alcool|drogue|th[ée]rapie|ordonnance|vih|cancer|diab[èe]te)\b/i;

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
    default:
      return t;
  }
}

const NAMES = ['Amina', 'Sarah', 'Salma', 'Robert', 'Aïcha', 'Bruno', 'Karim', 'Léa'];

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
