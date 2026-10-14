// Stockage local : jamais en ligne.
//
// Sur l'appareil : MMKV **chiffré** (AES-256), une instance par profil, chacune avec sa propre clé tirée
// au hasard et gardée dans le Keychain (iOS) ou le Keystore (Android) via expo-secure-store.
// Lot 2 : le SQLite chiffré du cœur Rust (SQLCipher) prendra la suite, avec la même règle « une clé par profil ».
// Purger un profil efface son instance **et** sa clé : sans clé, rien ne se relit.
// Sur le web (aperçu local seulement, décision du 2026-10-14) : localStorage.

import { Platform } from 'react-native';

import type { KV } from './profiles';

const PROFILE_KEY = /^hlux\.project\.(.+)$/;

function webAdapter(): KV & { purge: (id: string) => void } {
  const ls = typeof globalThis.localStorage !== 'undefined' ? globalThis.localStorage : undefined;
  const mem = new Map<string, string>();
  const kv: KV = {
    getItem: (k) => (ls ? ls.getItem(k) : mem.get(k) ?? null),
    setItem: (k, v) => (ls ? ls.setItem(k, v) : void mem.set(k, v)),
    removeItem: (k) => (ls ? ls.removeItem(k) : void mem.delete(k)),
  };
  return { ...kv, purge: (id) => kv.removeItem(`hlux.project.${id}`) };
}

function nativeAdapter(): KV & { purge: (id: string) => void } {
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
  const instances = new Map<string, { getString: (k: string) => string | undefined; set: (k: string, v: string) => void; remove: (k: string) => void }>();
  const open = (scope: string) => {
    let i = instances.get(scope);
    if (!i) {
      i = createMMKV({ id: `hlux.${scope}`, encryptionKey: keyOf(scope), encryptionType: 'AES-256' });
      instances.set(scope, i!);
    }
    return i!;
  };
  // Le journal d'un profil vit dans l'instance de ce profil ; le reste (liste des profils, collectif) dans « common ».
  const scopeOf = (k: string) => PROFILE_KEY.exec(k)?.[1] ?? 'common';
  return {
    getItem: (k) => open(scopeOf(k)).getString(k) ?? null,
    setItem: (k, v) => open(scopeOf(k)).set(k, v),
    removeItem: (k) => open(scopeOf(k)).remove(k),
    purge: (id) => {
      instances.delete(id);
      deleteMMKV(`hlux.${id}`);
      SecureStore.deleteItemAsync(`hlux.key.${id}`);
    },
  };
}

export const localStorageAdapter = Platform.OS === 'web' ? webAdapter() : nativeAdapter();
