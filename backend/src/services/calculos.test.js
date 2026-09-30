const { calcularPorcentaje, calcularRacha, calcularPromedioSemanal, validarUnidad, calcularMejorRacha } = require('./calculos');

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

describe('calcularMejorRacha', () => {
  test('sin registros, la mejor racha es 0', () => {
    const habito = { tipo: 'CONTADOR', meta: 2000 };
    expect(calcularMejorRacha(habito, [])).toBe(0);
  });

  test('encuentra la racha más larga aunque no sea la actual', () => {
    // Arrange: cumplió 3 días seguidos (18-20/8), después se cortó,
    // y cumplió solo 1 día más reciente (25/8) — la MEJOR es la de 3, no la actual (1)
    const habito = { tipo: 'CONTADOR', meta: 2000 };
    const registros = [
      { fecha: '2026-08-18', valor: 2000 },
      { fecha: '2026-08-19', valor: 2000 },
      { fecha: '2026-08-20', valor: 2000 },
      { fecha: '2026-08-22', valor: 500 }, // no cumple, corta
      { fecha: '2026-08-25', valor: 2000 },
    ];

    expect(calcularMejorRacha(habito, registros)).toBe(3);
  });

  test('funciona sin importar el orden en que vengan los registros', () => {
    const habito = { tipo: 'CONTADOR', meta: 2000 };
    const registros = [
      { fecha: '2026-08-20', valor: 2000 },
      { fecha: '2026-08-18', valor: 2000 },
      { fecha: '2026-08-19', valor: 2000 },
    ];

    expect(calcularMejorRacha(habito, registros)).toBe(3);
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