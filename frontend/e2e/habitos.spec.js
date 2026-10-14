import { test, expect } from '@playwright/test';

// E2E: un navegador real usa la app desplegada en QA. Sin mocks ni
// intercepciones: el navegador le pega a la API de verdad y los datos viven
// en la base de QA. Cada test crea un hábito con nombre único y lo borra
// comprobando que ya no está.

const nombreUnico = (prefijo) => `${prefijo}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

// Espera a que la pantalla "Mis hábitos" termine de cargar la lista. Sin esto,
// una afirmación de "ya no está" podría pasar antes de que la lista llegue.
async function esperarLista(page) {
  await expect(page.getByRole('heading', { name: 'Nuevo hábito' })).toBeVisible();
  await expect(page.getByText('Cargando…')).toHaveCount(0);
}

async function abrir(page) {
  await page.goto('/');
  await esperarLista(page);
}

const tituloDe = (page, nombre) => page.getByRole('heading', { name: nombre, exact: true });
const tarjetaDe = (page, nombre) => page.locator('.card', { has: tituloDe(page, nombre) });

async function crearBooleano(page, nombre) {
  await page.getByLabel('Nombre', { exact: true }).fill(nombre);
  await page.getByLabel('Tipo', { exact: true }).selectOption('BOOLEANO');
  await page.getByRole('button', { name: 'Agregar hábito' }).click();
}

async function eliminarYComprobar(page, nombre) {
  await tarjetaDe(page, nombre).getByRole('button', { name: 'Eliminar' }).click();
  await expect(tituloDe(page, nombre)).toHaveCount(0);
}

// Red de seguridad: si el test falla a mitad de camino, igual borra lo que creó.
async function limpiar(request, nombre) {
  const res = await request.get('/api/habitos');
  for (const h of (await res.json()).filter((x) => x.nombre === nombre)) {
    await request.delete(`/api/habitos/${h.id}`);
  }
}

test('crear un hábito contador: se ve con su meta y se puede eliminar', async ({ page, request }) => {
  const nombre = nombreUnico('e2e-crear');
  try {
    await abrir(page);

    await page.getByLabel('Nombre', { exact: true }).fill(nombre);
    await page.getByLabel('Meta diaria').fill('2000');
    await page.getByLabel('Unidad', { exact: true }).fill('ml');
    await page.getByRole('button', { name: 'Agregar hábito' }).click();

    await expect(tituloDe(page, nombre)).toBeVisible();
    await expect(tarjetaDe(page, nombre)).toContainText('Meta: 2000 ml');

    await eliminarYComprobar(page, nombre);
    await page.reload();
    await esperarLista(page);
    await expect(tituloDe(page, nombre)).toHaveCount(0);
  } finally {
    await limpiar(request, nombre);
  }
});

test('error de validación: un nombre repetido muestra el error y no crea otro', async ({ page, request }) => {
  const nombre = nombreUnico('e2e-dup');
  try {
    await abrir(page);

    await crearBooleano(page, nombre);
    await expect(tituloDe(page, nombre)).toBeVisible();

    // Se vuelve a intentar con el mismo nombre: la base lo rechaza.
    await crearBooleano(page, nombre);
    await expect(page.locator('.error-msg')).toHaveText('Ya existe un hábito con ese nombre');
    await expect(tituloDe(page, nombre)).toHaveCount(1);

    await eliminarYComprobar(page, nombre);
  } finally {
    await limpiar(request, nombre);
  }
});

// El flujo de todos los días: el dato principal tiene que seguir ahí al
// recargar la página, o sea, que de verdad quedó guardado en la base.
test('un hábito creado sigue ahí al recargar la página', async ({ page, request }) => {
  const nombre = nombreUnico('e2e-persiste');
  try {
    await abrir(page);

    await crearBooleano(page, nombre);
    await expect(tituloDe(page, nombre)).toBeVisible();

    await page.reload();
    await esperarLista(page);
    await expect(tituloDe(page, nombre)).toBeVisible();

    await eliminarYComprobar(page, nombre);
    await page.reload();
    await esperarLista(page);
    await expect(tituloDe(page, nombre)).toHaveCount(0);
  } finally {
    await limpiar(request, nombre);
  }
});