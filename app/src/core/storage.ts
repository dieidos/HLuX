// Stockage local : jamais en ligne.
//
// Sur l'appareil : MMKV **chiffré** (AES-256), une instance par profil, chacune avec sa propre clé tirée
// au hasard et gardée dans le Keychain (iOS) ou le Keystore (Android) via expo-secure-store.
// Lot 2 : le SQLite chiffré du cœur Rust (SQLCipher) prendra la suite, avec la même règle « une clé par profil ».
// Purger un profil efface son instance **et** sa clé : sans clé, rien ne se relit.
// Sur le web (aperçu local seulement, décision du 2026-10-14) : localStorage.
// Vraie vie / démonstration : `mode.ts` préfixe les clés de la démonstration (`demo:`).

import { Platform } from 'react-native';

import { DEMO_PREFIX, withMode, type RawKV } from './mode';

/** `hlux.project.<id>` (ou `demo:hlux.project.<id>`) → l'instance du profil ; le reste → « common ». */
const PROFILE_KEY = /^(demo:)?hlux\.project\.(.+)$/;
const scopeOf = (k: string) => {
  const m = PROFILE_KEY.exec(k);
  const demo = k.startsWith(DEMO_PREFIX) ? 'demo.' : '';
  return m ? `${demo}${m[2]}` : `${demo}common`;
};

function webRaw(): RawKV {
  const ls = typeof globalThis.localStorage !== 'undefined' ? globalThis.localStorage : undefined;
  const mem = new Map<string, string>();
  return {
    getItem: (k) => (ls ? ls.getItem(k) : mem.get(k) ?? null),
    setItem: (k, v) => (ls ? ls.setItem(k, v) : void mem.set(k, v)),
    removeItem: (k) => (ls ? ls.removeItem(k) : void mem.delete(k)),
    keys: () => (ls ? Object.keys(ls) : [...mem.keys()]),
    purge: (id) => (ls ? ls.removeItem(id.startsWith(DEMO_PREFIX) ? `${DEMO_PREFIX}hlux.project.${id.slice(DEMO_PREFIX.length)}` : `hlux.project.${id}`) : undefined),
  };
}

function nativeRaw(): RawKV {
  /* eslint-disable @typescript-eslint/no-require-imports */
  const { createMMKV, deleteMMKV } = require('react-native-mmkv');
  const SecureStore = require('expo-secure-store');
  const { getRandomBytes } = require('expo-crypto');
  /* eslint-enable @typescript-eslint/no-require-imports */

  const keyOf = (scope: string): string => {
    const name = `hlux.key.${scope}`;
    let k: string | null = SecureStore.getItem(name);
    if (!k) {
      // 16 octets aléatoires écrits en hexadécimal : 32 caractères, la longueur de clé AES-256 de MMKV.
      k = Array.from(getRandomBytes(16) as Uint8Array, (b) => b.toString(16).padStart(2, '0')).join('');
      SecureStore.setItem(name, k);
    }
    return k;
  };
  type Inst = { getString: (k: string) => string | undefined; set: (k: string, v: string) => void; remove: (k: string) => void; getAllKeys: () => string[] };
  const instances = new Map<string, Inst>();
  const open = (scope: string): Inst => {
    let i = instances.get(scope);
    if (!i) {
      i = createMMKV({ id: `hlux.${scope}`, encryptionKey: keyOf(scope), encryptionType: 'AES-256' }) as Inst;
      instances.set(scope, i);
    }
    return i;
  };
  // Les instances connues sont listées dans « common » pour qu'on puisse toutes les parcourir.
  const remember = (scope: string) => {
    const reg = open('common');
    const known = new Set<string>(JSON.parse(reg.getString('hlux.scopes') ?? '[]'));
    if (!known.has(scope)) {
      known.add(scope);
      reg.set('hlux.scopes', JSON.stringify([...known]));
    }
  };
  const drop = (scope: string) => {
    instances.delete(scope);
    deleteMMKV(`hlux.${scope}`);
    SecureStore.deleteItemAsync(`hlux.key.${scope}`);
  };
  return {
    getItem: (k) => open(scopeOf(k)).getString(k) ?? null,
    setItem: (k, v) => {
      const s = scopeOf(k);
      remember(s);
      open(s).set(k, v);
    },
    removeItem: (k) => open(scopeOf(k)).remove(k),
    keys: () => {
      const known: string[] = JSON.parse(open('common').getString('hlux.scopes') ?? '[]');
      return [...new Set(['common', ...known])].flatMap((s) => open(s).getAllKeys());
    },
    purge: (id) => drop(id.startsWith(DEMO_PREFIX) ? `demo.${id.slice(DEMO_PREFIX.length)}` : id),
  };
}

/** Le stockage brut (les deux espaces) — pour changer d'espace ou effacer la démonstration. */
export const rawStorage: RawKV = Platform.OS === 'web' ? webRaw() : nativeRaw();

/** Le stockage de l'espace courant (vraie vie ou démonstration). */
export const localStorageAdapter = withMode(rawStorage);
