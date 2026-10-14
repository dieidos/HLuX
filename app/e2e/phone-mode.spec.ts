// Le téléphone de la personne (CDC, « Données locales ») : elle entre directement, sans équipe ni séance ;
// seulement « Mon projet » ; « Notre projet » n'existe pas sur son téléphone.
import { expect, test } from '@playwright/test';

test('sur son téléphone, la personne entre directement dans son projet', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('radio', { name: /Mon téléphone/ }).click();
  await page.getByLabel('Mon prénom').fill('Nour');
  await page.getByLabel('Une phrase, pour commencer').fill('Je voudrais un logement à moi.');
  await page.getByRole('button', { name: 'Entrer' }).click();
  await expect(page.getByText('Bonjour Nour 👋').filter({ visible: true })).toBeVisible();
  await expect(page.getByRole('link', { name: /Notre projet/ })).toHaveCount(0);
  await page.getByRole('button', { name: /Nour 👋/ }).filter({ visible: true }).first().click();
  await expect(page.getByRole('button', { name: /Fermer la séance/ })).toHaveCount(0);
  await expect(page.getByText(/Je voudrais un/).filter({ visible: true }).first()).toBeVisible();
  // Relancée, l'application la remet dans son projet, sans rien demander.
  await page.reload();
  await expect(page.getByText('Bonjour Nour 👋').filter({ visible: true })).toBeVisible();
});

test('sans phrase, elle entre quand même ; et son téléphone reçoit une copie à tout moment', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('radio', { name: /Mon téléphone/ }).click();
  await page.getByLabel('Mon prénom').fill('Nour');
  await page.getByRole('button', { name: 'Entrer' }).click();
  await expect(page.getByText('Bonjour Nour 👋').filter({ visible: true })).toBeVisible();
  await page.getByRole('button', { name: /Nour 👋/ }).filter({ visible: true }).first().click();
  await expect(page.getByRole('button', { name: /Recevoir/ })).toBeVisible();
});
