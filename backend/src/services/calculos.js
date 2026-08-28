// Igual que validaciones.js: funciones puras, sin DB. Reciben el hábito y
// una lista de registros ya cargados en memoria, y devuelven un número.

/**
 * Determina si un registro puntual cumple la meta del hábito.
 */
function cumpleMeta(habito, valor) {
  if (habito.tipo === 'CONTADOR') {
    return valor >= habito.meta;
  }
  // BOOLEANO
  return valor === 1;
}

/**
 * Porcentaje de cumplimiento de UN valor puntual (0 a 100).
 * CONTADOR: valor/meta, sin pasarse de 100 aunque te excedas de la meta.
 * BOOLEANO: 100 si es 1, 0 si es 0.
 */
function calcularPorcentaje(habito, valor) {
  if (habito.tipo === 'BOOLEANO') {
    return valor === 1 ? 100 : 0;
  }
  if (habito.meta <= 0) return 0;
  return Math.min(100, Math.round((valor / habito.meta) * 100));
}

/**
 * Racha: cantidad de días consecutivos, contando hacia atrás desde hoy,
 * en los que se cumplió la meta. Se corta en el primer día sin registro
 * o sin cumplimiento (incluyendo "hoy", si todavía no cargaste nada hoy).
 *
 * registros: [{ fecha: 'YYYY-MM-DD', valor: number }, ...]
 */
function calcularRacha(habito, registros, hoyStr = new Date().toISOString().slice(0, 10)) {
  const porFecha = new Map(registros.map((r) => [r.fecha, Number(r.valor)]));

  let racha = 0;
  const cursor = new Date(hoyStr + 'T00:00:00');

  while (true) {
    const fechaStr = cursor.toISOString().slice(0, 10);
    const valor = porFecha.get(fechaStr);
    if (valor === undefined || !cumpleMeta(habito, valor)) break;
    racha++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return racha;
}

/**
 * Promedio de cumplimiento (0 a 100) de los últimos 7 días (hoy incluido).
 * Los días sin registro cuentan como 0% (no se "saltean" del promedio).
 */
function calcularPromedioSemanal(habito, registros, hoyStr = new Date().toISOString().slice(0, 10)) {
  const porFecha = new Map(registros.map((r) => [r.fecha, Number(r.valor)]));
  const cursor = new Date(hoyStr + 'T00:00:00');

  let suma = 0;
  for (let i = 0; i < 7; i++) {
    const fechaStr = cursor.toISOString().slice(0, 10);
    const valor = porFecha.get(fechaStr);
    suma += valor === undefined ? 0 : calcularPorcentaje(habito, valor);
    cursor.setDate(cursor.getDate() - 1);
  }

  return Math.round(suma / 7);
}

module.exports = { cumpleMeta, calcularPorcentaje, calcularRacha, calcularPromedioSemanal };
