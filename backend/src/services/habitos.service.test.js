// Reemplazamos el módulo real de conexión a MySQL por un doble (mock).
// Así probamos la LÓGICA de habitos.service.js (qué hace con la respuesta
// de la base) sin necesitar una base de datos de verdad corriendo.
jest.mock('../db/pool', () => ({
  query: jest.fn(),
}));

const pool = require('../db/pool');
const { crearHabito, eliminarHabito } = require('./habitos.service');

describe('crearHabito (con mock de la base de datos)', () => {
  beforeEach(() => {
    pool.query.mockReset();
  });

  test('rechaza un nombre vacío antes de tocar la base (caso de error)', async () => {
    // Arrange / Act
    const intento = crearHabito({ nombre: '  ', tipo: 'CONTADOR', meta: 100 });

    // Assert
    await expect(intento).rejects.toThrow('El nombre es obligatorio');
    expect(pool.query).not.toHaveBeenCalled();
  });

  test('rechaza un tipo que no sea CONTADOR ni BOOLEANO (caso de error)', async () => {
    const intento = crearHabito({ nombre: 'Meditar', tipo: 'OTRO', meta: null });
    await expect(intento).rejects.toThrow('El tipo debe ser CONTADOR o BOOLEANO');
  });

  test('re-lanza un error de la base que no sea de nombre duplicado', async () => {
    // Arrange: un error de MySQL distinto a ER_DUP_ENTRY no debe ser "traducido"
    const errorInesperado = new Error('Connection lost');
    errorInesperado.code = 'PROTOCOL_CONNECTION_LOST';
    pool.query.mockRejectedValueOnce(errorInesperado);

    // Act / Assert: se propaga tal cual, sin el mensaje de "nombre duplicado"
    await expect(crearHabito({ nombre: 'Leer', tipo: 'BOOLEANO' })).rejects.toThrow('Connection lost');
  });

  test('traduce el error de MySQL por nombre duplicado a un mensaje entendible', async () => {
    // Arrange: el mock simula que MySQL rechaza el INSERT por la UNIQUE KEY
    const errorDuplicado = new Error('Duplicate entry');
    errorDuplicado.code = 'ER_DUP_ENTRY';
    pool.query.mockRejectedValueOnce(errorDuplicado);

    // Act
    const intento = crearHabito({ nombre: 'Tomar agua', tipo: 'CONTADOR', meta: 2000, unidad: 'ml' });

    // Assert: verificamos que el service NO deja pasar el error crudo de
    // MySQL, sino que lo traduce a un mensaje de negocio entendible.
    await expect(intento).rejects.toThrow('Ya existe un hábito con ese nombre');
    expect(pool.query).toHaveBeenCalledTimes(1);
  });

  test('inserta correctamente cuando el nombre no está duplicado', async () => {
    // Arrange: el mock simula un INSERT exitoso y el SELECT posterior
    pool.query
      .mockResolvedValueOnce([{ insertId: 42 }]) // el INSERT
      .mockResolvedValueOnce([[{ id: 42, nombre: 'Caminar', tipo: 'CONTADOR', meta: 10000 }]]); // el SELECT de obtenerHabito

    // Act
    const habito = await crearHabito({ nombre: 'Caminar', tipo: 'CONTADOR', meta: 10000, unidad: 'pasos' });

    // Assert
    expect(habito.id).toBe(42);
    expect(pool.query).toHaveBeenCalledTimes(2);
  });
});

describe('eliminarHabito (con mock de la base de datos)', () => {
  beforeEach(() => {
    pool.query.mockReset();
  });

  test('traduce el error de FOREIGN KEY a un mensaje sobre la restricción de negocio', async () => {
    // Arrange: MySQL rechaza el DELETE porque hay registros que referencian este hábito
    const errorFK = new Error('Cannot delete or update a parent row');
    errorFK.code = 'ER_ROW_IS_REFERENCED_2';
    pool.query.mockRejectedValueOnce(errorFK);

    // Act
    const intento = eliminarHabito(1);

    // Assert
    await expect(intento).rejects.toThrow('ya tiene registros cargados');
  });

  test('elimina correctamente un hábito sin registros asociados', async () => {
    // Arrange
    pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

    // Act
    const resultado = await eliminarHabito(5);

    // Assert
    expect(resultado).toBe(true);
  });

  test('rechaza eliminar un hábito que no existe (caso de error)', async () => {
    // Arrange: DELETE que no afectó ninguna fila
    pool.query.mockResolvedValueOnce([{ affectedRows: 0 }]);

    // Act / Assert
    await expect(eliminarHabito(999)).rejects.toThrow('Hábito no encontrado');
  });

  test('re-lanza un error de la base que no sea de restricción de FK', async () => {
    const errorInesperado = new Error('Connection lost');
    errorInesperado.code = 'PROTOCOL_CONNECTION_LOST';
    pool.query.mockRejectedValueOnce(errorInesperado);

    await expect(eliminarHabito(1)).rejects.toThrow('Connection lost');
  });
});