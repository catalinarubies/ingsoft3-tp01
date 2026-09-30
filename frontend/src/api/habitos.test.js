import { describe, test, expect, vi, beforeEach } from 'vitest';
import { crearHabito, listarHabitos, registrarValor } from './habitos';

// Reemplazamos fetch (la dependencia externa: hablar por red con el backend)
// por un doble, para testear la lógica de este módulo sin hacer ningún
// pedido HTTP real.
beforeEach(() => {
  global.fetch = vi.fn();
});

describe('listarHabitos', () => {
  test('pide la ruta correcta y devuelve el JSON tal cual (mock de fetch)', async () => {
    // Arrange
    const habitosFalsos = [{ id: 1, nombre: 'Tomar agua' }];
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(habitosFalsos),
    });

    // Act
    const resultado = await listarHabitos();

    // Assert
    expect(global.fetch).toHaveBeenCalledWith('/api/habitos');
    expect(resultado).toEqual(habitosFalsos);
  });
});

describe('crearHabito', () => {
  test('envía el body correcto por POST', async () => {
    // Arrange
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 1, nombre: 'Caminar' }),
    });

    // Act
    await crearHabito({ nombre: 'Caminar', tipo: 'CONTADOR', meta: 10000 });

    // Assert
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/habitos',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ nombre: 'Caminar', tipo: 'CONTADOR', meta: 10000 }),
      })
    );
  });

  test('propaga el mensaje de error que devuelve el backend (caso de error)', async () => {
    // Arrange: el backend respondió 400 con un mensaje de negocio
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: 'Ya existe un hábito con ese nombre' }),
    });

    // Act / Assert
    await expect(crearHabito({ nombre: 'Tomar agua', tipo: 'CONTADOR', meta: 2000 })).rejects.toThrow(
      'Ya existe un hábito con ese nombre'
    );
  });
});

describe('registrarValor', () => {
  test('envía habitoId, fecha y valor, y devuelve el porcentaje calculado por el backend', async () => {
    // Arrange
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ habitoId: 1, fecha: '2026-08-20', valor: 1500, porcentaje: 75 }),
    });

    // Act
    const resultado = await registrarValor({ habitoId: 1, fecha: '2026-08-20', valor: 1500 });

    // Assert
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/registros',
      expect.objectContaining({ method: 'POST' })
    );
    expect(resultado.porcentaje).toBe(75);
  });
});