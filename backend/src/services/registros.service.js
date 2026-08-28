const pool = require('../db/pool');
const { obtenerHabito } = require('./habitos.service');
const { validarValor, validarFechaNoFutura } = require('./validaciones');
const { calcularRacha, calcularPromedioSemanal, calcularPorcentaje } = require('./calculos');

async function listarRegistros(habitoId) {
  const [rows] = await pool.query(
    'SELECT fecha, valor FROM registros WHERE habito_id = ? ORDER BY fecha DESC',
    [habitoId]
  );
  // MySQL devuelve `fecha` como objeto Date; lo normalizamos a 'YYYY-MM-DD'
  // para que las funciones puras de calculos.js (que comparan strings) funcionen bien.
  return rows.map((r) => ({
    fecha: r.fecha.toISOString().slice(0, 10),
    valor: Number(r.valor),
  }));
}

async function registrarValor({ habitoId, fecha, valor }) {
  const habito = await obtenerHabito(habitoId);
  if (!habito) {
    throw new Error('Hábito no encontrado');
  }
  if (!habito.activo) {
    // Regla de negocio: no se puede cargar un registro para un hábito inactivo.
    throw new Error('No se puede registrar un valor para un hábito archivado');
  }

  validarFechaNoFutura(fecha);
  validarValor(habito.tipo, valor);

  // INSERT ... ON DUPLICATE KEY UPDATE usa la UNIQUE KEY (habito_id, fecha):
  // si ya existía un registro ese día, lo actualiza en vez de duplicarlo.
  await pool.query(
    `INSERT INTO registros (habito_id, fecha, valor) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE valor = VALUES(valor)`,
    [habitoId, fecha, valor]
  );

  return { habitoId, fecha, valor, porcentaje: calcularPorcentaje(habito, valor) };
}

async function obtenerResumen(habitoId) {
  const habito = await obtenerHabito(habitoId);
  if (!habito) {
    throw new Error('Hábito no encontrado');
  }
  const registros = await listarRegistros(habitoId);

  return {
    habito,
    racha: calcularRacha(habito, registros),
    promedioSemanal: calcularPromedioSemanal(habito, registros),
    registros,
  };
}

module.exports = { listarRegistros, registrarValor, obtenerResumen };
