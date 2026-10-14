import { describe, expect, it } from 'vitest';

import { dayInWords, seasonsFrom } from './dates';

describe('Le temps, en mots', () => {
  it('un jour se dit en mots', () => {
    expect(dayInWords(new Date(2026, 9, 14))).toBe('mercredi 14 octobre');
  });
  it('les saisons commencent par celle du moment', () => {
    expect(seasonsFrom(new Date(2026, 9, 14))).toEqual(['automne', 'hiver', 'printemps', 'été']);
    expect(seasonsFrom(new Date(2027, 0, 5))).toEqual(['hiver', 'printemps', 'été', 'automne']);
  });
});
