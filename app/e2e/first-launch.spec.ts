// La vraie vie : une tablette neuve est vide ; on nomme l'établissement et l'équipe, puis une personne entre.
// La démonstration se tient à part et s'efface en partant.
import { expect, test } from '@playwright/test';

test('une tablette neuve est vide : on la met en place, puis une personne entre avec un prénom et une phrase', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Mettre en place la tablette')).toBeVisible();
  await expect(page.getByText('Amina')).toHaveCount(0);
  await page.getByLabel("Le nom de l'établissement").fill('CHRS du Port');
  await page.getByLabel("Les prénoms de l'équipe, séparés par des virgules").fill('Inès, Marc');
  await page.getByRole('button', { name: 'Commencer' }).click();
  await page.getByRole('button', { name: 'Inès', exact: true }).click();
  await expect(page.getByText('Qui est là ?')).toBeVisible();
  await page.getByLabel('Son prénom').fill('Nour');
  await page.getByLabel('Une phrase, pour commencer').fill('Je cherche un logement pour mes enfants.');
  await page.getByRole('button', { name: 'Entrer' }).click();
  await expect(page.getByText('Bonjour Nour 👋')).toBeVisible();
  await page.getByRole('link', { name: /Mon projet/ }).click();
  await expect(page.getByText("aujourd'hui · dite avec Inès")).toBeVisible();
  await expect(page.getByText('Nour · avec Inès')).toBeVisible();
});

test('la démonstration se tient à part, et la vraie vie reprend telle quelle en la quittant', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel("Le nom de l'établissement").fill('CHRS du Port');
  await page.getByLabel("Les prénoms de l'équipe, séparés par des virgules").fill('Inès');
  await page.getByRole('button', { name: 'Commencer' }).click();
  await page.getByLabel('HLuX', { exact: true }).first().click({ delay: 1200 });
  await page.getByRole('button', { name: 'Ouvrir', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Sarah', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Inès', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Quitter la démonstration' }).click();
  await expect(page.getByRole('button', { name: 'Inès', exact: true })).toBeVisible();
  await expect(page.getByText('DÉMONSTRATION · personnages imaginaires')).toHaveCount(0);
  const keys = await page.evaluate(() => Object.keys(localStorage));
  expect(keys.some((k) => k.startsWith('demo:'))).toBe(false);
});
