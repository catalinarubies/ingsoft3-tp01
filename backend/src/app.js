const express = require('express');
const cors = require('cors');
const Sentry = require('@sentry/node');
const habitosRoutes = require('./routes/habitos.routes');
const registrosRoutes = require('./routes/registros.routes');

const app = express();
app.use(cors());
app.use(express.json());

// Endpoint simple para verificar que el backend está vivo (útil para el
// healthcheck de Docker que vamos a agregar en el próximo paso del TP2).
app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/habitos', habitosRoutes);
app.use('/api/registros', registrosRoutes);

// TEMPORAL (TP9): provoca un error a propósito para verlo en Sentry.
// Se saca en un PR aparte cuando ya lo usé.
app.get('/api/falla', () => {
  throw new Error('Falla de prueba del TP9');
});

// Sentry captura los errores no manejados. Va después de las rutas.
Sentry.setupExpressErrorHandler(app);

module.exports = app;