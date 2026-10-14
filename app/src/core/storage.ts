// Stockage local du profil : jamais en ligne.
// Sur l'appareil : MMKV (lot 2 : SQLite chiffré du cœur Rust). Sur le web (aperçu) : localStorage.

import { Platform } from 'react-native';

type KV = { getItem: (k: string) => string | null; setItem: (k: string, v: string) => void; removeItem: (k: string) => void };

function makeAdapter(): KV {
  if (Platform.OS === 'web') {
    const ls = typeof globalThis.localStorage !== 'undefined' ? globalThis.localStorage : undefined;
    const mem = new Map<string, string>();
    return {
      getItem: (k) => (ls ? ls.getItem(k) : mem.get(k) ?? null),
      setItem: (k, v) => (ls ? ls.setItem(k, v) : void mem.set(k, v)),
      removeItem: (k) => (ls ? ls.removeItem(k) : void mem.delete(k)),
    };
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createMMKV } = require('react-native-mmkv');
  const mmkv = createMMKV({ id: 'hlux' });
  return {
    getItem: (k) => mmkv.getString(k) ?? null,
    setItem: (k, v) => mmkv.set(k, v),
    removeItem: (k) => mmkv.remove(k),
  };
}

export const localStorageAdapter = makeAdapter();
