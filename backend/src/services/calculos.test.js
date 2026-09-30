const { calcularPorcentaje, calcularRacha, calcularPromedioSemanal } = require('./calculos');

describe('calcularPorcentaje', () => {
  // Test parametrizado: la MISMA regla de negocio (calcularPorcentaje para un
  // hábito CONTADOR) probada con varias entradas distintas, incluyendo un
  // caso borde (justo en la meta) y un caso que se pasa de la meta.
  test.each([
    [1000, 50],  // Arrange: mitad de la meta -> Assert: 50%
    [2000, 100], // caso borde: justo en la meta -> 100%
    [3000, 100], // se pasa de la meta -> se capa en 100, no da 150%
    [0, 0],      // caso borde: nada registrado -> 0%
  ])('con meta 2000, registrar %i ml da %i%%', (valor, esperado) => {
    // Arrange
    const habitoAgua = { tipo: 'CONTADOR', meta: 2000 };

    // Act
    const resultado = calcularPorcentaje(habitoAgua, valor);

    // Assert
    expect(resultado).toBe(esperado);
  });

  test('para un hábito BOOLEANO, valor 1 da 100%', () => {
    // Arrange
    const habitoEjercicio = { tipo: 'BOOLEANO' };

    // Act
    const resultado = calcularPorcentaje(habitoEjercicio, 1);

    // Assert
    expect(resultado).toBe(100);
  });

  test('para un hábito BOOLEANO, valor 0 da 0%', () => {
    // Arrange
    const habitoEjercicio = { tipo: 'BOOLEANO' };

    // Act
    const resultado = calcularPorcentaje(habitoEjercicio, 0);

    // Assert
    expect(resultado).toBe(0);
  });
});

describe('calcularRacha', () => {
  test('cuenta días consecutivos cumpliendo la meta hacia atrás desde hoy', () => {
    // Arrange
    const habito = { tipo: 'CONTADOR', meta: 2000 };
    const registros = [
      { fecha: '2026-08-20', valor: 2000 },
      { fecha: '2026-08-19', valor: 2500 },
      { fecha: '2026-08-18', valor: 2000 },
    ];

    // Act
    const racha = calcularRacha(habito, registros, '2026-08-20');

    // Assert
    expect(racha).toBe(3);
  });

  test('la racha se corta en el primer día que no cumple la meta', () => {
    // Arrange
    const habito = { tipo: 'CONTADOR', meta: 2000 };
    const registros = [
      { fecha: '2026-08-20', valor: 2000 },
      { fecha: '2026-08-19', valor: 500 }, // no cumple -> corta acá
      { fecha: '2026-08-18', valor: 2000 },
    ];

    // Act
    const racha = calcularRacha(habito, registros, '2026-08-20');

    // Assert
    expect(racha).toBe(1);
  });

  test('si hoy no tiene registro, la racha es 0 aunque haya días anteriores cumplidos', () => {
    // Arrange
    const habito = { tipo: 'CONTADOR', meta: 2000 };
    const registros = [{ fecha: '2026-08-19', valor: 2000 }];

    // Act
    const racha = calcularRacha(habito, registros, '2026-08-20');

    // Assert
    expect(racha).toBe(0);
  });
});

describe('calcularPromedioSemanal', () => {
  test('promedia los últimos 7 días, contando los días sin registro como 0%', () => {
    // Arrange
    const habito = { tipo: 'CONTADOR', meta: 2000 };
    const registros = [{ fecha: '2026-08-20', valor: 1500 }]; // 75%, el resto de la semana sin registro

    // Act
    const promedio = calcularPromedioSemanal(habito, registros, '2026-08-20');

    // Assert: 75 / 7 = 10.71 -> redondeado a 11
    expect(promedio).toBe(11);
  });
});