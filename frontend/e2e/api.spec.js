import { test, expect } from '@playwright/test';

// Integración: estas pruebas le hablan a la API desplegada en QA (sin
// navegador) y pasan por el driver de MySQL contra la base de verdad. Un
// unitario con mock no puede ver lo que la base rechaza (restricciones
// UNIQUE, ENUM, claves foráneas).

// Nombre que no se repite: lleva la hora adentro, así ninguna otra corrida
// usa el mismo.
const nombreUnico = (prefijo) => `${prefijo}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

const habitoBooleano = (nombre) => ({ nombre, tipo: 'BOOLEANO', meta: null, unidad: null });

async function listar(request) {
  const res = await request.get('/api/habitos');
  expect(res.status()).toBe(200);
  return res.json();
}

// Red de seguridad: si un test falla a mitad de camino, igual borra lo que creó.
async function borrarPorNombre(request, nombre) {
  for (const h of (await listar(request)).filter((x) => x.nombre === nombre)) {
    await request.delete(`/api/habitos/${h.id}`);
  }
}

test('alta, verificación y borrado de un hábito', async ({ request }) => {
  const nombre = nombreUnico('integ-alta');
  try {
    const alta = await request.post('/api/habitos', { data: habitoBooleano(nombre) });
    expect(alta.status()).toBe(201);
    const creado = await alta.json();
    expect(creado.nombre).toBe(nombre);

    const tras = (await listar(request)).find((h) => h.id === creado.id);
    expect(tras?.nombre).toBe(nombre);
    expect(tras?.tipo).toBe('BOOLEANO');

    const baja = await request.delete(`/api/habitos/${creado.id}`);
    expect(baja.status()).toBe(204);

    expect((await listar(request)).some((h) => h.id === creado.id)).toBe(false);
  } finally {
    await borrarPorNombre(request, nombre);
  }
});

test('alta inválida: nombre vacío devuelve 400 y no se crea nada', async ({ request }) => {
  const antes = await listar(request);

  const res = await request.post('/api/habitos', { data: habitoBooleano('') });
  expect(res.status()).toBe(400);
  expect((await res.json()).error).toBe('El nombre es obligatorio');

  const despues = await listar(request);
  expect(despues.length).toBe(antes.length);
  expect(despues.some((h) => h.nombre.trim() === '')).toBe(false);
});

// La tercera: la base rechaza un nombre repetido (UNIQUE) y la API traduce el
// error de MySQL a un mensaje claro. Un test con mock de pool.query no puede
// ver esto: el mock no tiene ninguna restricción UNIQUE.
test('nombre repetido: la base lo rechaza y la API contesta 400', async ({ request }) => {
  const nombre = nombreUnico('integ-dup');
  try {
    const primero = await request.post('/api/habitos', { data: habitoBooleano(nombre) });
    expect(primero.status()).toBe(201);

    const repetido = await request.post('/api/habitos', { data: habitoBooleano(nombre) });
    expect(repetido.status()).toBe(400);
    expect((await repetido.json()).error).toBe('Ya existe un hábito con ese nombre');

    const iguales = (await listar(request)).filter((h) => h.nombre === nombre);
    expect(iguales).toHaveLength(1);
  } finally {
    await borrarPorNombre(request, nombre);
  }
});