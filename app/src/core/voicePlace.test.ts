import { describe, expect, it } from 'vitest';

import { parsePlacement } from './voicePlace';

const cards = [{ id: 'papiers', title: 'Papiers' }, { id: 'famille', title: 'Famille' }];

describe('Écran 02 : dire où va la Carte', () => {
  it('une Carte et un lieu reconnus', () => {
    expect(parsePlacement("Papiers, c'est difficile", cards)).toEqual({ card: 'papiers', feeling: 'hard' });
    expect(parsePlacement('famille ça va', cards)).toEqual({ card: 'famille', feeling: 'fine' });
    expect(parsePlacement('Papiers je ne sais pas', cards)).toEqual({ card: 'papiers', feeling: 'unsure' });
  });
  it('« pas bien » est difficile, pas « bien »', () => {
    expect(parsePlacement('Famille, pas bien', cards)?.feeling).toBe('hard');
  });
  it('sans Carte ou sans lieu reconnus, rien ne bouge', () => {
    expect(parsePlacement("c'est difficile", cards)).toBeNull();
    expect(parsePlacement('Papiers', cards)).toBeNull();
  });
  it('en arabe aussi', () => {
    const ar = [{ id: 'papiers', title: 'أوراق' }];
    expect(parsePlacement('أوراق، صعب', ar)?.feeling).toBe('hard');
    expect(parsePlacement('أوراق، لا أعرف', ar)?.feeling).toBe('unsure');
  });
});

