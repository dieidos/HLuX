import { describe, expect, it } from 'vitest';

import { momentAr } from './moments';

describe('Les moments, lus en arabe', () => {
  it('le jour, le mois, la façon dont la Carte est née, le lieu où elle a été posée', () => {
    expect(momentAr('mardi · dite avec Sarah')).toBe('الثلاثاء · قيلت مع Sarah');
    expect(momentAr('mercredi 14 octobre · écrite avec Inès')).toBe('الأربعاء 14 أكتوبر · كُتبت مع Inès');
    expect(momentAr("jeudi 15 octobre · dans « c'est difficile »")).toBe('الخميس 15 أكتوبر · في « صعب »');
    expect(momentAr('vendredi 16 octobre · reposée dans la réserve')).toBe('الجمعة 16 أكتوبر · أُعيدت إلى علبة البطاقات');
  });
});
