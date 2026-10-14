import { describe, expect, it } from 'vitest';

import { band, leanOf, placesFor, readingOf, shifted } from './views';

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

describe('Le geste sur une ligne', () => {
  it('un petit glissé ne déplace rien ; un grand franchit plusieurs places', () => {
    expect(placesFor(30, 110)).toBe(0);
    expect(placesFor(120, 110)).toBe(1);
    expect(placesFor(-250, 110)).toBe(-2);
  });
  it("l'idée glisse, bornée aux bouts, et l'on sait qui elle a franchi", () => {
    expect(shifted(['a', 'b', 'c'], 'a', 2)).toEqual({ order: ['b', 'c', 'a'], passed: 'c' });
    expect(shifted(['a', 'b', 'c'], 'c', -9)).toEqual({ order: ['c', 'a', 'b'], passed: 'a' });
    expect(shifted(['a', 'b', 'c'], 'a', -1).passed).toBeNull();
  });
});

describe('Convergences et À discuter', () => {
  it('des prénoms et des mots, jamais un chiffre', () => {
    expect(readingOf([{ by: 'Aïcha', lean: 'much' }, { by: 'Bruno', lean: 'much' }], "l'effet")?.phrase).toBe("Aïcha et Bruno se rejoignent sur l'effet.");
    expect(readingOf([{ by: 'Aïcha', lean: 'little' }, { by: 'Karim', lean: 'much' }], 'la faisabilité')?.phrase).toBe('Aïcha et Karim voient la faisabilité très différemment.');
    expect(readingOf([{ by: 'Aïcha', lean: 'much' }], 'x')).toBeNull();
  });
});

