import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App.jsx';
import './index.css';

// El DSN del front va escrito en el código a propósito: solo permite ENVIAR
// datos a Sentry, no leerlos, y de todos modos queda expuesto en el
// JavaScript que baja el navegador.
Sentry.init({
  dsn: 'https://8aef850646a221f6468e63da5e23ff24@o4512404056113152.ingest.de.sentry.io/4512404100612176' ,
  environment: window.location.hostname,
  integrations: [Sentry.browserTracingIntegration()],
  tracesSampleRate: 1.0,
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);