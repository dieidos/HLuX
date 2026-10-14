// Recette : les 36 notes de l'Atlas, une par test, sur l'aperçu web de l'application (décision du 2026-10-14).
// L'application est exportée en statique puis servie localement ; rien ne part sur le réseau.
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:8097',
    // Une tablette en paysage : la cible première du CDC.
    viewport: { width: 1180, height: 820 },
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'tablette', use: { ...devices['Desktop Chrome'], viewport: { width: 1180, height: 820 } } }],
  webServer: {
    command: 'npx expo export --platform web --output-dir dist-e2e && npx serve -s dist-e2e -l 8097 --no-clipboard',
    url: 'http://localhost:8097',
    timeout: 240_000,
    // Jamais réutiliser : un autre service local pourrait tenir le port (8090 l'était, par dieidos).
    reuseExistingServer: false,
  },
});
