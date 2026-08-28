const mysql = require('mysql2/promise');

// Todo lo que necesita esta app para saber a qué base conectarse viene de
// variables de entorno. Nada de esto está "hardcodeado" en el código:
// - En desarrollo local, estos valores vienen de un archivo .env (no commiteado).
// - En Docker, van a venir del docker-compose.yml (TP2).
// - En TP6, el mismo código va a apuntar a QA o a Producción según qué
//   variables le pase el pipeline, SIN tocar ni una línea de este archivo.
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'habitos',
  waitForConnections: true,
  connectionLimit: 10,
  // Necesario para poder correr schema.sql (varias sentencias CREATE TABLE
  // juntas) desde init.js en un solo query.
  multipleStatements: true,
});

module.exports = pool;
