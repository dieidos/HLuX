// La langue de la personne : en arabe, tout l'écran de la personne passe en arabe, de droite à gauche,
// avec la police arabe ; son choix est gardé dans son profil et retrouvé à la prochaine ouverture.
import { expect, test } from '@playwright/test';

test("en arabe, l'écran de la personne change de langue et le profil s'en souvient", async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('HLuX', { exact: true }).first().click({ delay: 1200 });
  await page.getByRole('button', { name: 'Ouvrir', exact: true }).click();
  await page.getByRole('button', { name: 'Sarah', exact: true }).click();
  await page.getByRole('button', { name: 'Amina', exact: true }).click();
  await page.getByText('🌐 Langue').filter({ visible: true }).first().click();
  await expect(page.getByText('إنشاء بطاقتي').or(page.getByText('بطاقة جديدة')).first()).toBeVisible();
  await expect(page.locator('[lang="ar"]').filter({ visible: true }).first()).toBeVisible();
  const font = await page.getByText('بطاقة جديدة').first().evaluate((e) => getComputedStyle(e).fontFamily);
  expect(font).toContain('NotoNaskhArabic');
  // Elle change de personne puis revient : l'arabe l'attend.
  // Le menu de la personne (son prénom, dans le bandeau) : changer de personne ; la professionnelle reste retenue.
  await page.getByRole('button', { name: /Amina 👋/ }).filter({ visible: true }).first().click();
  await page.getByRole('button', { name: /Changer de personne|تغيير الشخص/ }).click();
  await page.getByRole('button', { name: 'Amina', exact: true }).click();
  await expect(page.getByText('بطاقة جديدة').filter({ visible: true }).first()).toBeVisible();
});
