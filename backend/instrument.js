const Sentry = require('@sentry/node');

// Si SENTRY_DSN no está definida (local, tests, QA), Sentry queda apagado
// y la app funciona igual. Solo se enciende donde la variable existe.
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT || 'production',
  tracesSampleRate: 1.0,
});