require('dotenv').config();
const app = require('./src/app');
const inicializarEsquema = require('./src/db/init');

const PORT = process.env.PORT || 3001;

async function iniciar() {
  await inicializarEsquema();
  app.listen(PORT, () => {
    console.log(`Backend escuchando en el puerto ${PORT}`);
  });
}

iniciar().catch((err) => {
  console.error('No se pudo iniciar el backend:', err.message);
  process.exit(1);
});
