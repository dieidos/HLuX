// La sauvegarde chiffrée du dossier — repris de dieidos « Poche » (`dieidos-apps/mobile/src/lib/backup.ts`).
//
// Le fichier porte sel, nonce et texte chiffré : jamais la phrase, jamais une clé. Une mauvaise phrase
// ne donne pas un dossier vide : l'étiquette AEAD la refuse, et le refus est la réponse.
// « Une phrase perdue, c'est un dossier perdu » : la clé est dérivée de la phrase, rien d'autre n'est gardé.
// L'export reste possible même si le compte de l'établissement est désactivé (garde-fou de l'écran 06).

import { xchacha20poly1305 } from '@noble/ciphers/chacha.js';
import { scrypt } from '@noble/hashes/scrypt.js';
import { bytesToHex, hexToBytes, randomBytes } from '@noble/hashes/utils.js';

const enc = new TextEncoder();
const dec = new TextDecoder();

/** « six mots ou plus » : une borne, pas un conseil. */
export const MIN_WORDS = 6;
const SCRYPT = { N: 2 ** 15, r: 8, p: 1, dkLen: 32 };

export interface BackupFile {
  v: 1;
  product: 'hlux';
  kdf: 'scrypt';
  n: number;
  r: number;
  p: number;
  salt: string;
  nonce: string;
  ciphertext: string;
}

export class BackupRefusal extends Error {
  constructor(readonly gesture: 'export' | 'import', readonly reason: string) {
    super(reason);
    this.name = 'BackupRefusal';
  }
}

export const phraseQualifies = (phrase: string) => phrase.trim().split(/\s+/).filter(Boolean).length >= MIN_WORDS;

export function exportDossier(payload: string, phrase: string, cost = SCRYPT.N): BackupFile {
  if (!phraseQualifies(phrase)) throw new BackupRefusal('export', `La phrase doit avoir au moins ${MIN_WORDS} mots.`);
  const salt = randomBytes(16);
  const nonce = randomBytes(24);
  const key = scrypt(phrase.normalize('NFKC'), salt, { ...SCRYPT, N: cost });
  const ciphertext = xchacha20poly1305(key, nonce).encrypt(enc.encode(payload));
  return { v: 1, product: 'hlux', kdf: 'scrypt', n: cost, r: SCRYPT.r, p: SCRYPT.p, salt: bytesToHex(salt), nonce: bytesToHex(nonce), ciphertext: bytesToHex(ciphertext) };
}

export function importDossier(file: BackupFile, phrase: string): string {
  if (file?.v !== 1 || file.product !== 'hlux' || file.kdf !== 'scrypt') throw new BackupRefusal('import', "Ce fichier n'est pas un dossier HLuX.");
  // Le coût est lu dans le fichier : on le borne AVANT scrypt (un `n` forgé allouerait des gigaoctets).
  const n = file.n;
  const ok = Number.isInteger(n) && n >= 2 ** 10 && n <= 2 ** 17 && (n & (n - 1)) === 0;
  if (!ok || file.r !== 8 || file.p !== 1) throw new BackupRefusal('import', 'Ce fichier demande un coût anormal.');
  if (!/^[0-9a-f]{32}$/i.test(file.salt) || !/^[0-9a-f]{48}$/i.test(file.nonce)) throw new BackupRefusal('import', "Ce fichier n'a pas la forme d'un dossier.");
  try {
    const key = scrypt(phrase.normalize('NFKC'), hexToBytes(file.salt), { N: n, r: 8, p: 1, dkLen: 32 });
    return dec.decode(xchacha20poly1305(key, hexToBytes(file.nonce)).decrypt(hexToBytes(file.ciphertext)));
  } catch {
    throw new BackupRefusal('import', "Cette phrase n'ouvre pas ce dossier.");
  }
}
