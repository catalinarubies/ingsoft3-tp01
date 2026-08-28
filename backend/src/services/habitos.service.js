const pool = require('../db/pool');
const { validarMeta } = require('./validaciones');

async function listarHabitos({ soloActivos = true } = {}) {
  const sql = soloActivos
    ? 'SELECT * FROM habitos WHERE activo = TRUE ORDER BY id'
    : 'SELECT * FROM habitos ORDER BY id';
  const [rows] = await pool.query(sql);
  return rows;
}

async function obtenerHabito(id) {
  const [rows] = await pool.query('SELECT * FROM habitos WHERE id = ?', [id]);
  return rows[0] || null;
}

async function crearHabito({ nombre, tipo, meta, unidad }) {
  if (!nombre || nombre.trim() === '') {
    throw new Error('El nombre es obligatorio');
  }
  if (tipo !== 'CONTADOR' && tipo !== 'BOOLEANO') {
    throw new Error('El tipo debe ser CONTADOR o BOOLEANO');
  }
  validarMeta(tipo, meta ?? null);

  try {
    const [result] = await pool.query(
      'INSERT INTO habitos (nombre, tipo, meta, unidad) VALUES (?, ?, ?, ?)',
      [nombre.trim(), tipo, tipo === 'CONTADOR' ? meta : null, tipo === 'CONTADOR' ? unidad : null]
    );
    return obtenerHabito(result.insertId);
  } catch (err) {
    // ER_DUP_ENTRY: el UNIQUE de la columna `nombre` saltó.
    // Regla de negocio: "el nombre del hábito debe ser único".
    if (err.code === 'ER_DUP_ENTRY') {
      throw new Error('Ya existe un hábito con ese nombre');
    }
    throw err;
  }
}

async function eliminarHabito(id) {
  try {
    const [result] = await pool.query('DELETE FROM habitos WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      throw new Error('Hábito no encontrado');
    }
    return true;
  } catch (err) {
    // ER_ROW_IS_REFERENCED*: hay registros que apuntan a este hábito (FK).
    // Regla de negocio: "no se puede eliminar un hábito con registros cargados".
    // La restricción está garantizada por la base (FOREIGN KEY sin CASCADE),
    // y acá la traducimos a un mensaje entendible.
    if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
      throw new Error('No se puede eliminar un hábito que ya tiene registros cargados. Archivalo en su lugar.');
    }
    throw err;
  }
}

async function archivarHabito(id) {
  const [result] = await pool.query('UPDATE habitos SET activo = FALSE WHERE id = ?', [id]);
  if (result.affectedRows === 0) {
    throw new Error('Hábito no encontrado');
  }
  return obtenerHabito(id);
}

module.exports = { listarHabitos, obtenerHabito, crearHabito, eliminarHabito, archivarHabito };
