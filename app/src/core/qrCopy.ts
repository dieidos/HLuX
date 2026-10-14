// Copier un dossier d'un appareil à l'autre par QR, sans Internet (CDC, « Données locales »).
//
// - Le dossier est chiffré (XChaCha20-Poly1305) avec une clé de séance tirée au hasard.
// - Le premier QR porte la clé de séance et le nombre de QR ; les suivants, le texte chiffré, en morceaux.
// - L'écran qui envoie fait défiler les QR en boucle ; l'appareil qui reçoit les lit dans n'importe quel
//   ordre, garde ce qu'il a déjà, et ouvre le dossier quand tout est là. L'étiquette AEAD refuse un
//   morceau altéré ou un mélange de deux envois.
// - Rien ne passe par le réseau ; une copie ne dure que le temps de la lecture.

import { xchacha20poly1305 } from '@noble/ciphers/chacha.js';
import { bytesToHex, hexToBytes, randomBytes } from '@noble/hashes/utils.js';

import type { Entry } from './acts';
import { readDossier, type Dossier } from './profiles';

const MAGIC = 'HLUX1';
/** Assez petit pour qu'un QR reste lisible par la caméra d'une tablette posée à côté. */
export const CHUNK = 600;

const enc = new TextEncoder();
const dec = new TextDecoder();

/** Les QR à faire défiler : `HLUX1|0|n|clé|nonce` puis `HLUX1|i|n|morceau`. */
export function makeFrames(d: Dossier, key = randomBytes(32), nonce = randomBytes(24)): string[] {
  const cipher = bytesToHex(xchacha20poly1305(key, nonce).encrypt(enc.encode(JSON.stringify(d))));
  const chunks: string[] = [];
  for (let i = 0; i < cipher.length; i += CHUNK) chunks.push(cipher.slice(i, i + CHUNK));
  const n = chunks.length;
  return [`${MAGIC}|0|${n}|${bytesToHex(key)}|${bytesToHex(nonce)}`, ...chunks.map((c, i) => `${MAGIC}|${i + 1}|${n}|${c}`)];
}

export class CopyRefusal extends Error {
  constructor(reason: string) {
    super(reason);
    this.name = 'CopyRefusal';
  }
}

/** La réception : chaque QR lu s'ajoute ; on sait toujours combien il en manque. */
export class Collector {
  private head: { n: number; key: string; nonce: string } | null = null;
  private parts = new Map<number, string>();

  /** Ajoute un QR lu ; rend vrai s'il était nouveau. Un QR qui n'est pas d'HLuX est ignoré. */
  add(frame: string): boolean {
    const f = frame.split('|');
    if (f[0] !== MAGIC) return false;
    const i = Number(f[1]);
    const n = Number(f[2]);
    if (!Number.isInteger(i) || !Number.isInteger(n) || n < 1 || n > 500 || i < 0 || i > n) return false;
    if (this.head && this.head.n !== n) throw new CopyRefusal('Deux copies différentes se mélangent. Recommence la lecture.');
    if (i === 0) {
      if (!/^[0-9a-f]{64}$/.test(f[3] ?? '') || !/^[0-9a-f]{48}$/.test(f[4] ?? '')) return false;
      if (this.head) return false;
      this.head = { n, key: f[3], nonce: f[4] };
      return true;
    }
    if (this.parts.has(i) || !/^[0-9a-f]+$/.test(f[3] ?? '')) return false;
    this.parts.set(i, f[3]);
    return true;
  }

  /** Combien de QR ont été lus, sur combien (le total n'est connu qu'une fois le premier lu). */
  progress(): { read: number; total: number | null } {
    return { read: this.parts.size + (this.head ? 1 : 0), total: this.head ? this.head.n + 1 : null };
  }

  done(): boolean {
    return !!this.head && this.parts.size === this.head.n;
  }

  /** Ouvre le dossier ; refuse s'il manque un morceau ou si un morceau a été altéré. */
  open(): Dossier {
    if (!this.head || !this.done()) throw new CopyRefusal('Il manque encore des codes.');
    const cipher = Array.from({ length: this.head.n }, (_, k) => this.parts.get(k + 1)).join('');
    try {
      const plain = xchacha20poly1305(hexToBytes(this.head.key), hexToBytes(this.head.nonce)).decrypt(hexToBytes(cipher));
      return readDossier(dec.decode(plain));
    } catch {
      throw new CopyRefusal("Cette copie ne s'ouvre pas : un code a été mal lu. Recommence la lecture.");
    }
  }
}

/**
 * Fusion en ajout seul : un journal ne perd jamais un geste.
 * - l'un prolonge l'autre → on garde le plus long ;
 * - ils ont divergé → on ne choisit pas à la place de la personne : la copie arrive à côté
 *   (un second profil), et c'est elle qui compare (« côte à côte »).
 */
export function merge(local: Entry[], incoming: Entry[]): { entries: Entry[]; diverged: boolean } {
  const same = (a: Entry, b: Entry) => JSON.stringify(a) === JSON.stringify(b);
  const n = Math.min(local.length, incoming.length);
  for (let i = 0; i < n; i++) if (!same(local[i], incoming[i])) return { entries: local, diverged: true };
  return { entries: incoming.length > local.length ? incoming : local, diverged: false };
}
