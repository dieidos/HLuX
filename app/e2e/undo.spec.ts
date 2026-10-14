// Annuler, c'est le même geste à l'envers (Atlas, écran 02) — et rien ne s'efface : le parcours le garde.
import { expect, test, type Page } from '@playwright/test';

async function demo(page: Page, pro = 'Sarah', person: string | null = 'Amina') {
  await page.goto('/');
  await page.getByLabel('HLuX', { exact: true }).first().click({ delay: 1200 });
  await page.getByRole('button', { name: 'Ouvrir', exact: true }).click();
  await page.getByRole('button', { name: pro, exact: true }).click();
  if (person) await page.getByRole('button', { name: person, exact: true }).click();
}
const vis = (page: Page, name: string) => page.getByRole('button', { name, exact: true }).filter({ visible: true }).first();

test('02 : posée deux fois, la Carte revient dans la réserve en un geste, et son parcours le garde', async ({ page }) => {
  await demo(page);
  await page.getByRole('link', { name: /Ressenti/ }).filter({ visible: true }).click();
  await vis(page, 'Papiers').click();
  await vis(page, "Poser ici : 😟 C'est difficile").click();
  await vis(page, 'Papiers').click();
  await vis(page, 'Poser ici : 😊 Ça va').click();
  await vis(page, 'Papiers').click();
  await vis(page, 'Poser ici : La réserve').click();
  await expect(page.getByText('Papiers revient dans la réserve.').filter({ visible: true }).first()).toBeVisible();
  await page.getByRole('link', { name: /Cartes/ }).filter({ visible: true }).click();
  await vis(page, 'Papiers').click();
  await expect(page.getByLabel('Le fil de la Carte')).toContainText('reposée dans la réserve');
});

test('04 : un axe rangé revient parmi ceux à ranger', async ({ page }) => {
  await demo(page);
  await page.getByRole('link', { name: /Priorités/ }).filter({ visible: true }).click();
  await vis(page, "❤️ J'aime").click();
  await vis(page, "Poser ici : D'ABORD").click();
  await vis(page, "❤️ J'aime").click();
  await vis(page, 'Poser ici : À ranger').click();
  await expect(page.getByText("❤️ J'aime : à ranger.").filter({ visible: true }).first()).toBeVisible();
});

test('08 : une carte posée sur la table se reprend', async ({ page }) => {
  await demo(page, 'Aïcha', null);
  await page.getByRole('link', { name: /Notre projet/ }).filter({ visible: true }).click();
  await vis(page, 'Horaires de la laverie').click();
  await vis(page, 'Poser ici : Reprendre la carte').click();
  await expect(page.getByText('Horaires de la laverie : reprise.').filter({ visible: true }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Horaires de la laverie', exact: true })).toHaveCount(0);
});

test('le fil : la Carte reprise en 01 suit la personne, et une envie naît d’elle', async ({ page }) => {
  await demo(page);
  await vis(page, 'Papiers').click();
  await vis(page, 'Fermer').click();
  await expect(page.getByLabel('Le fil : Papiers')).toBeVisible();
  await page.getByRole('link', { name: /Envies/ }).filter({ visible: true }).click();
  await expect(page.getByLabel('Le fil : Papiers').filter({ visible: true })).toBeVisible();
  await vis(page, '＋ Une idée').click();
  await page.getByLabel('Mon idée', { exact: true }).filter({ visible: true }).fill('Comprendre mes courriers seule');
  await vis(page, 'Créer').click();
  await expect(page.getByText('née de Papiers').filter({ visible: true }).first()).toBeVisible();
});
