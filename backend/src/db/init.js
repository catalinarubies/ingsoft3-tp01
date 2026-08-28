const fs = require('fs');
const path = require('path');
const pool = require('./pool');

// Se corre una vez al arrancar el backend. Como el schema.sql usa
// "CREATE TABLE IF NOT EXISTS", es seguro ejecutarlo en cada arranque:
// si las tablas ya existen, no hace nada.
//
// Por qué esto vive en la app y no en un volumen montado en el contenedor
// de MySQL: docker-compose.registry.yml levanta el sistema solo a partir
// de las imágenes publicadas, sin el código fuente disponible para montar
// un .sql externo. Haciendo que el backend aplique su propio esquema, la
// misma imagen se auto-inicializa en cualquier escenario (local, registry,
// o más adelante QA/Producción en el TP6).
async function inicializarEsquema() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  const conexion = await pool.getConnection();
  try {
    await conexion.query(schema);
    console.log('Esquema de base de datos verificado/creado.');
  } finally {
    conexion.release();
  }
}

module.exports = inicializarEsquema;
