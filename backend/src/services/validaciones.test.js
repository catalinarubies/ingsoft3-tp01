const { validarValor, validarFechaNoFutura, validarMeta } = require('./validaciones');

describe('validarValor', () => {
  test('rechaza un valor negativo para un hábito CONTADOR (caso de error)', () => {
    // Arrange / Act / Assert
    expect(() => validarValor('CONTADOR', -5)).toThrow('El valor no puede ser negativo');
  });

  test('acepta un valor positivo para un hábito CONTADOR', () => {
    expect(validarValor('CONTADOR', 1500)).toBe(true);
  });

  test('rechaza un valor booleano que no sea 0 ni 1 (caso de error)', () => {
    expect(() => validarValor('BOOLEANO', 2)).toThrow('debe ser 0 o 1');
  });
});

describe('validarFechaNoFutura', () => {
  test('rechaza una fecha futura (caso de error)', () => {
    expect(() => validarFechaNoFutura('2099-01-01', '2026-08-20')).toThrow('fecha futura');
  });

  test('acepta la fecha de hoy', () => {
    expect(validarFechaNoFutura('2026-08-20', '2026-08-20')).toBe(true);
  });
});

describe('validarMeta', () => {
  test('rechaza una meta menor o igual a cero para CONTADOR (caso de error)', () => {
    expect(() => validarMeta('CONTADOR', 0)).toThrow('mayor a cero');
  });

  test('no exige meta para un hábito BOOLEANO', () => {
    expect(validarMeta('BOOLEANO', null)).toBe(true);
  });
});