// Igual que con habitos.service.js: mockeamos la conexión a la base para
// probar la LÓGICA de este archivo (qué decide hacer con lo que la base
// le devuelve) sin necesitar MySQL corriendo de verdad.
jest.mock('../db/pool', () => ({
  query: jest.fn(),
}));

const pool = require('../db/pool');
const { listarRegistros, registrarValor, obtenerResumen } = require('./registros.service');

describe('listarRegistros', () => {
  beforeEach(() => {
    pool.query.mockReset();
  });

  test('normaliza la fecha (objeto Date de MySQL) a texto YYYY-MM-DD', async () => {
    // Arrange: MySQL devuelve `fecha` como objeto Date y `valor` como string
    pool.query.mockResolvedValueOnce([
      [{ fecha: new Date('2026-08-20T00:00:00.000Z'), valor: '1500' }],
    ]);

    // Act
    const registros = await listarRegistros(1);

    // Assert
    expect(registros).toEqual([{ fecha: '2026-08-20', valor: 1500 }]);
  });
});

describe('registrarValor (con mock de la base de datos)', () => {
  beforeEach(() => {
    pool.query.mockReset();
  });

  test('rechaza si el hábito no existe (caso de error)', async () => {
    // Arrange: obtenerHabito -> SELECT que no devuelve filas
    pool.query.mockResolvedValueOnce([[]]);

    // Act / Assert
    await expect(
      registrarValor({ habitoId: 999, fecha: '2026-08-20', valor: 1000 })
    ).rejects.toThrow('Hábito no encontrado');
  });

  // ESTE es el caso que antes de este test NO estaba cubierto por ningún
  // test (la rama "if (!habito.activo)" de registrarValor) — ver decisiones.md.
  test('rechaza registrar un valor para un hábito archivado (caso de error)', async () => {
    // Arrange: el hábito existe pero activo = false
    pool.query.mockResolvedValueOnce([[{ id: 1, tipo: 'CONTADOR', meta: 2000, activo: 0 }]]);

    // Act / Assert
    await expect(
      registrarValor({ habitoId: 1, fecha: '2026-08-20', valor: 1000 })
    ).rejects.toThrow('No se puede registrar un valor para un hábito archivado');
  });

  test('rechaza una fecha futura antes de tocar la base con el INSERT (caso de error)', async () => {
    // Arrange
    pool.query.mockResolvedValueOnce([[{ id: 1, tipo: 'CONTADOR', meta: 2000, activo: 1 }]]);

    // Act / Assert
    await expect(
      registrarValor({ habitoId: 1, fecha: '2099-01-01', valor: 1000 })
    ).rejects.toThrow('fecha futura');
    // Solo se llamó una vez a la base (el SELECT de obtenerHabito), nunca el INSERT
    expect(pool.query).toHaveBeenCalledTimes(1);
  });

  test('registra correctamente un valor válido y devuelve el porcentaje', async () => {
    // Arrange: hábito activo + el INSERT ... ON DUPLICATE KEY UPDATE
    pool.query
      .mockResolvedValueOnce([[{ id: 1, tipo: 'CONTADOR', meta: 2000, activo: 1 }]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    // Act
    const resultado = await registrarValor({ habitoId: 1, fecha: '2026-08-20', valor: 1000 });

    // Assert
    expect(resultado).toEqual({ habitoId: 1, fecha: '2026-08-20', valor: 1000, porcentaje: 50 });
    expect(pool.query).toHaveBeenCalledTimes(2);
  });
});

describe('obtenerResumen (con mock de la base de datos)', () => {
  beforeEach(() => {
    pool.query.mockReset();
  });

  test('rechaza si el hábito no existe (caso de error)', async () => {
    pool.query.mockResolvedValueOnce([[]]);

    await expect(obtenerResumen(999)).rejects.toThrow('Hábito no encontrado');
  });

  test('arma el resumen combinando hábito, racha, promedio y registros', async () => {
    // Arrange: obtenerHabito -> luego listarRegistros, sin registros cargados
    pool.query
      .mockResolvedValueOnce([[{ id: 1, tipo: 'CONTADOR', meta: 2000, activo: 1 }]])
      .mockResolvedValueOnce([[]]);

    // Act
    const resumen = await obtenerResumen(1);

    // Assert: sin registros, racha y promedio dan 0 (ya probado en calculos.test.js)
    expect(resumen.habito.id).toBe(1);
    expect(resumen.racha).toBe(0);
    expect(resumen.promedioSemanal).toBe(0);
    expect(resumen.registros).toEqual([]);
  });
});