/// <reference types="node" />
// Gardes du code (CDC, « Vérification ») : elles lisent les sources, sans rien exécuter.
// - aucune couleur en dur hors des jetons de design ;
// - aucun mot de score, de moyenne, de vote ni de classement à l'écran ;
// - le Projet Personnalisé ne quitte pas l'appareil : un seul fichier parle au réseau (`core/aides.ts`).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';

import { REFUSALS_AR } from './i18n/refusals';

const ROOT = join(__dirname);

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) return files(p);
    return /\.(ts|tsx)$/.test(n) && !/\.test\.tsx?$/.test(n) ? [p] : [];
  });
}

const rel = (p: string) => relative(ROOT, p).split(sep).join('/');
/** Le code sans ses commentaires : une règle écrite en commentaire n'est pas une règle enfreinte. */
const code = (p: string) =>
  readFileSync(p, 'utf-8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .map((l) => l.replace(/(^|[^:'"`])\/\/.*$/, '$1'))
    .join('\n');

const SCREENS = [...files(join(ROOT, 'app')), ...files(join(ROOT, 'components'))];

describe('Gardes du code', () => {
  it('lit assez de fichiers pour que son vert veuille dire quelque chose', () => {
    expect(SCREENS.length).toBeGreaterThan(20);
  });

  it('aucune couleur en dur dans les écrans : tout passe par les jetons', () => {
    const faults = SCREENS.flatMap((p) =>
      code(p)
        .split('\n')
        .map((l, i) => [i + 1, l] as const)
        .filter(([, l]) => /['"`]#[0-9a-f]{3,8}['"`]|(fill|stroke)="#[0-9a-f]|rgba?\(/i.test(l))
        .map(([n]) => `${rel(p)}:${n}`),
    );
    expect(faults).toEqual([]);
  });

  it('aucun mot de score, de moyenne, de vote ni de classement à l’écran', () => {
    const banned = /\b(scores?|moyennes?|votes?|voter|majorité|classement|note sur|pourcentage)\b/i;
    const sources = [...SCREENS, ...files(join(ROOT, 'i18n'))];
    const faults = sources.flatMap((p) =>
      code(p)
        .split('\n')
        .map((l, i) => [i + 1, l] as const)
        .filter(([, l]) => banned.test(l))
        .map(([n, l]) => `${rel(p)}:${n} ${l.trim().slice(0, 60)}`),
    );
    expect(faults).toEqual([]);
  });

  it('un seul fichier parle au réseau : les aides, sur geste, pseudonymisées', () => {
    const network = /\bfetch\b|XMLHttpRequest|WebSocket|EventSource|sendBeacon|\baxios\b/;
    const talkers = files(ROOT)
      .filter((p) => network.test(code(p)))
      .map(rel);
    expect(talkers).toEqual(['core/aides.ts']);
  });

  it('le bras témoin : chaque garde rougit sur son piège', () => {
    expect(/['"`]#[0-9a-f]{3,8}['"`]/i.test("color: '#fff'")).toBe(true);
    expect(/\b(scores?|moyennes?|votes?)\b/i.test('La moyenne du groupe')).toBe(true);
    expect(/\bfetch\s*\(/.test('await fetch(url)')).toBe(true);
    expect(code(join(ROOT, 'app/notre-projet/choix.tsx'))).not.toMatch(/jamais de vote/);
  });

  it('chaque refus du cœur a sa version arabe (aides, sauvegarde, copie, dictée)', () => {
    const msgs = ['core/aides.ts', 'core/backup.ts', 'core/qrCopy.ts', 'core/dictation.ts'].flatMap((f) => {
      const src = readFileSync(join(ROOT, f), 'utf-8');
      return [...src.matchAll(/(?:Refusal\((?:'(?:export|import)', )?|reason: )(['"])((?:(?!\1).)+)\1/g)].map((m) => m[2]);
    });
    expect(msgs.length).toBeGreaterThan(8);
    const missing = msgs.filter((m) => m !== 'export' && m !== 'import' && !(m in REFUSALS_AR));
    expect(missing).toEqual([]);
  });
});

