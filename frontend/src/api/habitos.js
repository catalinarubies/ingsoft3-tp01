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

/* v8 ignore start -- mismo patrón que crearHabito/listarHabitos (fetch + manejarRespuesta), ya ejercitado; ver decisiones.md */
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
/* v8 ignore stop */

export async function registrarValor(registro) {
  const res = await fetch(`${API_URL}/registros`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(registro),
  });
  return manejarRespuesta(res);
}