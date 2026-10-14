import { defineConfig, devices } from '@playwright/test';

// Suite E2E: un navegador real usa la app desplegada en QA (frontend ->
// nginx -> backend -> base). Nada de mocks: si el navegador no le pega a la
// API de verdad, no es end-to-end. La dirección sale de E2E_BASE_URL.
const baseURL = process.env.E2E_BASE_URL;
if (!baseURL) {
  throw new Error('Falta E2E_BASE_URL (la URL pública del frontend de QA)');
}

export default defineConfig({
  testDir: './e2e',
  testMatch: 'habitos.spec.js',
  // QA es uno solo y lo comparten todas las corridas: un test a la vez.
  workers: 1,
  fullyParallel: false,
  // Cold start del plan gratuito: timeouts generosos en vez de sleeps o skips.
  timeout: 120_000,
  expect: { timeout: 45_000 },
  retries: 0,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report-e2e', open: 'never' }],
    ['json', { outputFile: 'resultados-e2e.json' }],
  ],
  outputDir: 'test-results-e2e',
  use: {
    baseURL,
    navigationTimeout: 90_000,
    actionTimeout: 45_000,
    // Si un test falla, el reporte trae captura y traza del momento del fallo.
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    ...devices['Desktop Chrome'],
  },
});