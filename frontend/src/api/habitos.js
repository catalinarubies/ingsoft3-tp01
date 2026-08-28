// Igual que el backend con DB_HOST, acá la URL del backend no está fija en
// el código: viene de una variable de entorno que Vite expone al build
// (tiene que empezar con VITE_ para que Vite la incluya).
// En local apunta a localhost:3001; en Docker va a apuntar al nombre del
// servicio backend dentro de la red de compose.
const API_URL = '/api';

async function manejarRespuesta(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Error ${res.status}`);
  }
  return data;
}

export async function listarHabitos() {
  const res = await fetch(`${API_URL}/habitos`);
  return manejarRespuesta(res);
}

export async function crearHabito(habito) {
  const res = await fetch(`${API_URL}/habitos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(habito),
  });
  return manejarRespuesta(res);
}

export async function eliminarHabito(id) {
  const res = await fetch(`${API_URL}/habitos/${id}`, { method: 'DELETE' });
  if (!res.ok && res.status !== 204) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Error ${res.status}`);
  }
}

export async function archivarHabito(id) {
  const res = await fetch(`${API_URL}/habitos/${id}/archivar`, { method: 'PATCH' });
  return manejarRespuesta(res);
}

export async function obtenerResumen(id) {
  const res = await fetch(`${API_URL}/habitos/${id}/resumen`);
  return manejarRespuesta(res);
}

export async function registrarValor(registro) {
  const res = await fetch(`${API_URL}/registros`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(registro),
  });
  return manejarRespuesta(res);
}
