import { useEffect, useState } from 'react';
import { listarHabitos, registrarValor } from '../api/habitos';

const hoyStr = () => new Date().toISOString().slice(0, 10);

export default function RegistrarHoy() {
  const [habitos, setHabitos] = useState([]);
  const [valores, setValores] = useState({}); // { [habitoId]: valor ingresado }
  const [resultados, setResultados] = useState({}); // { [habitoId]: { porcentaje } }
  const [errores, setErrores] = useState({}); // { [habitoId]: mensaje }
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    listarHabitos()
      .then(setHabitos)
      .finally(() => setCargando(false));
  }, []);

  async function handleGuardar(habito) {
    setErrores((e) => ({ ...e, [habito.id]: '' }));

    const crudo = valores[habito.id];
    const valor = habito.tipo === 'BOOLEANO' ? (crudo ? 1 : 0) : Number(crudo);

    if (habito.tipo === 'CONTADOR' && (crudo === undefined || crudo === '' || valor < 0)) {
      setErrores((e) => ({ ...e, [habito.id]: 'Ingresá un valor válido (no negativo)' }));
      return;
    }

    try {
      const res = await registrarValor({ habitoId: habito.id, fecha: hoyStr(), valor });
      setResultados((r) => ({ ...r, [habito.id]: res }));
    } catch (err) {
      setErrores((e) => ({ ...e, [habito.id]: err.message }));
    }
  }

  if (cargando) return <p className="empty-state">Cargando…</p>;

  if (habitos.length === 0) {
    return <p className="empty-state">Creá un hábito primero en la pestaña "Mis hábitos".</p>;
  }

  return (
    <div>
      {habitos.map((h) => {
        const pct = resultados[h.id]?.porcentaje ?? 0;
        const yaGuardado = resultados[h.id] !== undefined;

        return (
          <div className="card" key={h.id}>
            <div className="registro-row">
              <div className="ring" style={{ '--pct': pct }}>
                <div className="ring-inner">{pct}%</div>
              </div>

              <div className="info">
                <h3>{h.nombre}</h3>

                {h.tipo === 'CONTADOR' ? (
                  <div className="form-inline" style={{ marginTop: 8 }}>
                    <input
                      type="number"
                      min="0"
                      placeholder={`Cantidad (${h.unidad || ''})`}
                      value={valores[h.id] ?? ''}
                      onChange={(e) => setValores({ ...valores, [h.id]: e.target.value })}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 8,
                        border: '1px solid var(--color-border)',
                        width: 140,
                      }}
                    />
                    <button
                      className="btn-primary"
                      disabled={!valores[h.id]}
                      onClick={() => handleGuardar(h)}
                    >
                      Guardar
                    </button>
                  </div>
                ) : (
                  <div style={{ marginTop: 8 }}>
                    <button className="btn-primary" onClick={() => setValores({ ...valores, [h.id]: true })}>
                      {yaGuardado && pct === 100 ? 'Cumplido ✓' : 'Marcar como cumplido'}
                    </button>{' '}
                    {valores[h.id] && !yaGuardado && (
                      <button className="btn-secondary" onClick={() => handleGuardar(h)}>
                        Confirmar
                      </button>
                    )}
                  </div>
                )}

                {errores[h.id] && <div className="error-msg" style={{ marginTop: 8 }}>{errores[h.id]}</div>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
