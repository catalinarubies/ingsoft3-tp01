import { useEffect, useState } from 'react';
import { listarHabitos, crearHabito, eliminarHabito } from '../api/habitos';

const HABITO_INICIAL = { nombre: '', tipo: 'CONTADOR', meta: '', unidad: '' };

export default function MisHabitos() {
  const [habitos, setHabitos] = useState([]);
  const [form, setForm] = useState(HABITO_INICIAL);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    setCargando(true);
    try {
      setHabitos(await listarHabitos());
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  // El formulario no deja enviar si falta el nombre, o si es CONTADOR y la
  // meta no es un número positivo. Es la validación "en vivo" del lado del
  // frontend — el backend igual la vuelve a chequear.
  const formInvalido =
    form.nombre.trim() === '' ||
    (form.tipo === 'CONTADOR' && (!form.meta || Number(form.meta) <= 0));

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await crearHabito({
        nombre: form.nombre.trim(),
        tipo: form.tipo,
        meta: form.tipo === 'CONTADOR' ? Number(form.meta) : null,
        unidad: form.tipo === 'CONTADOR' ? form.unidad : null,
      });
      setForm(HABITO_INICIAL);
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleEliminar(id) {
    setError('');
    try {
      await eliminarHabito(id);
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div className="card">
        <h3>Nuevo hábito</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label htmlFor="nombre">Nombre</label>
            <input
              id="nombre"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Tomar agua"
            />
          </div>

          <div className="form-inline">
            <div className="form-row" style={{ flex: 1 }}>
              <label htmlFor="tipo">Tipo</label>
              <select
                id="tipo"
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value })}
              >
                <option value="CONTADOR">Contador (número)</option>
                <option value="BOOLEANO">Sí / No</option>
              </select>
            </div>

            {form.tipo === 'CONTADOR' && (
              <>
                <div className="form-row" style={{ flex: 1 }}>
                  <label htmlFor="meta">Meta diaria</label>
                  <input
                    id="meta"
                    type="number"
                    min="1"
                    value={form.meta}
                    onChange={(e) => setForm({ ...form, meta: e.target.value })}
                    placeholder="2000"
                  />
                </div>
                <div className="form-row" style={{ flex: 1 }}>
                  <label htmlFor="unidad">Unidad</label>
                  <input
                    id="unidad"
                    value={form.unidad}
                    onChange={(e) => setForm({ ...form, unidad: e.target.value })}
                    placeholder="ml"
                  />
                </div>
              </>
            )}
          </div>

          {error && <div className="error-msg">{error}</div>}

          <button type="submit" className="btn-primary" disabled={formInvalido}>
            Agregar hábito
          </button>
        </form>
      </div>

      {cargando && <p className="empty-state">Cargando…</p>}

      {!cargando && habitos.length === 0 && (
        <p className="empty-state">Todavía no creaste ningún hábito. Empezá con uno arriba.</p>
      )}

      {habitos.map((h) => (
        <div className="card" key={h.id}>
          <div className="card-header">
            <div>
              <h3>{h.nombre}</h3>
              <span className="meta-label">
                {h.tipo === 'CONTADOR' ? `Meta: ${Number(h.meta)} ${h.unidad || ''}` : 'Sí / No'}
              </span>
            </div>
            <button className="btn-danger-text" onClick={() => handleEliminar(h.id)}>
              Eliminar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
