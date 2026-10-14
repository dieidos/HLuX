import { describe, expect, it } from 'vitest';

import { canDictateOnDevice } from './dictation';

describe('La dictée reste sur l’appareil', () => {
  it('jamais dans le navigateur', () => {
    expect(canDictateOnDevice({ platform: 'web', supportsOnDevice: true, installedLocales: ['fr-FR'], lang: 'fr' }).ok).toBe(false);
  });
  it('jamais sans reconnaissance hors ligne', () => {
    expect(canDictateOnDevice({ platform: 'ios', supportsOnDevice: false, installedLocales: [], lang: 'fr' }).ok).toBe(false);
  });
  it('sur Android, la langue doit être installée', () => {
    expect(canDictateOnDevice({ platform: 'android', supportsOnDevice: true, installedLocales: ['en-US'], lang: 'ar' }).reason).toContain('arabe');
    expect(canDictateOnDevice({ platform: 'android', supportsOnDevice: true, installedLocales: ['fr-FR'], lang: 'fr' }).ok).toBe(true);
  });
  it('sur iPad, la reconnaissance hors ligne suffit', () => {
    expect(canDictateOnDevice({ platform: 'ios', supportsOnDevice: true, installedLocales: [], lang: 'fr' }).ok).toBe(true);
  });
});
