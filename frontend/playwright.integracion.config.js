import { defineConfig } from '@playwright/test';

// Suite de INTEGRACIÓN: le habla directo a la API ya desplegada en QA, sin
// navegador (solo el fixture `request`) y con la base de datos de verdad.
// La dirección sale de API_BASE_URL. Si no está definida, falla: no hay
// ningún valor por defecto a localhost que haga pasar la prueba "sola".
const baseURL = process.env.API_BASE_URL;
if (!baseURL) {
  throw new Error('Falta API_BASE_URL (la URL pública de la API de QA)');
}

export default defineConfig({
  testDir: './e2e',
  testMatch: 'api.spec.js',
  // QA es uno solo y lo comparten todas las corridas: un test a la vez.
  workers: 1,
  fullyParallel: false,
  // Margen para el arranque en frío del plan gratuito (el servicio puede
  // estar dormido). Se resuelve con timeouts, no salteando ni durmiendo.
  timeout: 90_000,
  expect: { timeout: 30_000 },
  retries: 0,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report-integracion', open: 'never' }],
    ['json', { outputFile: 'resultados-integracion.json' }],
  ],
  use: { baseURL },
});