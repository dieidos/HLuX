// La séance (07) : « Pas maintenant » reste dans le parcours de la Carte ; les personnes présentes, par leur
// prénom du jour, deviennent participantes (08-12) ; le départ se confirme et se dit définitif.
import { expect, test, type Page } from '@playwright/test';

async function demo(page: Page, pro = 'Sarah', person: string | null = 'Amina') {
  await page.goto('/');
  await page.getByLabel('HLuX', { exact: true }).first().click({ delay: 1200 });
  await page.getByRole('button', { name: 'Ouvrir', exact: true }).click();
  await page.getByRole('button', { name: pro, exact: true }).click();
  if (person) await page.getByRole('button', { name: person, exact: true }).click();
}
const vis = (page: Page, name: string | RegExp) => page.getByRole('button', { name, exact: typeof name === 'string' }).filter({ visible: true }).first();

test('« Pas maintenant » : rien ne passe, et la Carte le garde', async ({ page }) => {
  await demo(page);
  await page.getByRole('link', { name: /Notre projet/ }).filter({ visible: true }).click();
  await vis(page, 'Pas maintenant').click();
  await expect(page.getByText('Rien ne passe. Tu pourras le proposer plus tard, si tu veux.')).toBeVisible();
  await page.getByRole('link', { name: /Mon projet/ }).filter({ visible: true }).click();
  await vis(page, 'Papiers').click();
  await expect(page.getByLabel('Le fil de la Carte')).toContainText('pas maintenant');
});

test('une nouvelle séance : les personnes présentes, par leur prénom, participent', async ({ page }) => {
  await demo(page);
  await page.getByRole('link', { name: /Notre projet/ }).filter({ visible: true }).click();
  await vis(page, '＋ Nouvelle séance').click();
  await page.getByLabel('Date de la séance').fill('jeudi 15 octobre');
  await page.getByLabel('Personnes accompagnées présentes').fill('Nour, Malik');
  await page.getByRole('checkbox', { name: 'CVS' }).click();
  await vis(page, 'Ouvrir l’ordre du jour').click();
  await expect(page.getByText('Ordre du jour · jeudi 15 octobre')).toBeVisible();
  await page.getByRole('link', { name: /Constat/ }).filter({ visible: true }).click();
  await expect(vis(page, '→ Nour')).toBeVisible();
  await expect(vis(page, '→ Malik')).toBeVisible();
});

test('le départ : effacer demande une confirmation qui dit « définitif »', async ({ page }) => {
  await demo(page);
  await vis(page, /Amina 👋/).click();
  await vis(page, /Je quitte/).click();
  await page.getByLabel('Ma phrase', { exact: true }).filter({ visible: true }).first().fill('un deux trois quatre cinq six');
  await vis(page, 'Emporter').click();
  await expect(page.getByText('Ton dossier chiffré est prêt.').first()).toBeVisible();
  await vis(page, 'Effacer mon dossier de cette tablette').click();
  await expect(page.getByText(/C’est définitif/)).toBeVisible();
  await vis(page, 'Oui, effacer définitivement').click();
  await expect(page.getByText('Qui est là ?')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Amina', exact: true })).toHaveCount(0);
});
