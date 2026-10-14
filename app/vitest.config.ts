import { defineConfig } from 'vitest/config';

// Les tests unitaires vivent dans src/ ; la recette Playwright (e2e/) a son propre lanceur.
export default defineConfig({ test: { include: ['src/**/*.test.ts'] } });
