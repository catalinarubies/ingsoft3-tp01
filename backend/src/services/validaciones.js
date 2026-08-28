// Todas las funciones de este archivo son "puras": reciben datos simples,
// devuelven un resultado (o lanzan un error), y no dependen de la base de
// datos ni de Express. Eso las hace fáciles de testear: no hace falta
// levantar un servidor ni una conexión a MySQL para probarlas.

/**
 * Valida el valor de un registro según el tipo de hábito.
 * - CONTADOR: no puede ser negativo.
 * - BOOLEANO: solo puede ser 0 o 1.
 */
function validarValor(tipoHabito, valor) {
  if (typeof valor !== 'number' || Number.isNaN(valor)) {
    throw new Error('El valor debe ser un número');
  }
  if (tipoHabito === 'CONTADOR' && valor < 0) {
    throw new Error('El valor no puede ser negativo');
  }
  if (tipoHabito === 'BOOLEANO' && valor !== 0 && valor !== 1) {
    throw new Error('Para un hábito booleano, el valor debe ser 0 o 1');
  }
  return true;
}

/**
 * Valida que la fecha de un registro no sea futura.
 * Recibe strings en formato 'YYYY-MM-DD' para comparar sin problemas de huso horario.
 */
function validarFechaNoFutura(fechaStr, hoyStr = new Date().toISOString().slice(0, 10)) {
  if (fechaStr > hoyStr) {
    throw new Error('No se puede registrar una fecha futura');
  }
  return true;
}

/**
 * Valida la meta de un hábito de tipo CONTADOR: tiene que ser un número positivo.
 */
function validarMeta(tipoHabito, meta) {
  if (tipoHabito === 'CONTADOR') {
    if (typeof meta !== 'number' || Number.isNaN(meta) || meta <= 0) {
      throw new Error('La meta debe ser un número mayor a cero');
    }
  }
  return true;
}

module.exports = { validarValor, validarFechaNoFutura, validarMeta };
