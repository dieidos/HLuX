import { describe, expect, it } from 'vitest';

import { band, leanOf } from './views';

describe('Regards réunis', () => {
  it("situe une idée sur la ligne d'Amina, en mots", () => {
    expect(leanOf(['a', 'b', 'c'], 'a')).toBe('little');
    expect(leanOf(['a', 'b', 'c'], 'b')).toBe('middle');
    expect(leanOf(['a', 'b', 'c'], 'c')).toBe('much');
    expect(leanOf(['a'], 'a')).toBe('middle');
    expect(leanOf(['a'], 'z')).toBeNull();
  });

  it("la bande dit l'écart, sans moyenne", () => {
    expect(band(['much', 'much'])).toEqual({ from: 'much', to: 'much', narrow: true });
    expect(band(['little', 'much'])).toEqual({ from: 'little', to: 'much', narrow: false });
    expect(band([])).toBeNull();
  });
});
