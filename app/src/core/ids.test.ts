import { describe, expect, it } from 'vitest';

import { freshId } from './ids';

describe('Identifiants', () => {
  it('ne reprend jamais un identifiant existant, même après un retrait', () => {
    expect(freshId('etape', ['etape-1', 'etape-3'])).toBe('etape-4');
    expect(freshId('etape', ['etape-2'])).toBe('etape-3');
    expect(freshId('etape', [])).toBe('etape-1');
  });
});
