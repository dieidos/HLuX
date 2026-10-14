// Le téléphone (CDC, « Front React Native ») : une seule colonne, rien ne déborde sur le côté.
// On ouvre la démonstration sur un écran de 375 px, puis chaque écran : aucun élément ne dépasse la
// largeur, sauf à l'intérieur d'une zone faite pour défiler à l'horizontale (le fil des étapes).
import { expect, test, type Page } from '@playwright/test';

test.use({ viewport: { width: 375, height: 812 } });

const overflowing = (page: Page) =>
  page.evaluate(() => {
    const W = window.innerWidth;
    const scrolls = (el: Element | null): boolean => {
      for (let e = el?.parentElement; e; e = e.parentElement) {
        const o = getComputedStyle(e).overflowX;
        if ((o === 'auto' || o === 'scroll') && e.scrollWidth > e.clientWidth) return true;
      }
      return false;
    };
    return [...document.querySelectorAll('body *')]
      .filter((e) => {
        const r = e.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && r.right > W + 2 && getComputedStyle(e).visibility !== 'hidden' && (e as HTMLElement).offsetParent !== null && !scrolls(e);
      })
      .map((e) => `${e.tagName}:${(e.textContent ?? '').trim().slice(0, 30)}`)
      .slice(0, 5);
  });

test('sur un téléphone, aucun écran ne déborde sur le côté', async ({ page }) => {
  await page.goto('/');
  expect(await overflowing(page)).toEqual([]);
  await page.getByLabel('HLuX', { exact: true }).first().click({ delay: 1200 });
  await page.getByRole('button', { name: 'Ouvrir', exact: true }).click();
  await page.getByRole('button', { name: 'Sarah', exact: true }).click();
  await page.getByRole('button', { name: 'Amina', exact: true }).click();
  const faults: Record<string, string[]> = {};
  for (const screen of [/Cartes/, /Ressenti/, /Envies/, /Priorités/, /Regards/, /Chemin/, /Sujets/, /Constat/, /Cap/, /Choix/, /Actions/, /Suivi/]) {
    if (/Sujets/.test(screen.source)) {
        await page.getByRole('link', { name: /Notre projet/ }).filter({ visible: true }).click();
    } else {
      await page.getByRole('link', { name: screen }).filter({ visible: true }).first().click();
    }
    await page.waitForTimeout(400);
    const f = await overflowing(page);
    if (f.length) faults[screen.source] = f;
  }
  expect(faults).toEqual({});
});
