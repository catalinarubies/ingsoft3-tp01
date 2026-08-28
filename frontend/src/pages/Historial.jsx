import { useEffect, useState } from 'react';
import { listarHabitos, obtenerResumen } from '../api/habitos';

export default function Historial() {
  const [resumenes, setResumenes] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    setCargando(true);
    const habitos = await listarHabitos();
    const datos = await Promise.all(habitos.map((h) => obtenerResumen(h.id)));
    setResumenes(datos);
    setCargando(false);
  }

  if (cargando) return <p className="empty-state">Cargando…</p>;

  if (resumenes.length === 0) {
    return <p className="empty-state">Todavía no hay hábitos para mostrar.</p>;
  }

  return (
    <div>
      {resumenes.map(({ habito, racha, promedioSemanal, registros }) => (
        <div className="card" key={habito.id}>
          <div className="card-header">
            <div>
              <h3>{habito.nombre}</h3>
              <span className="racha-badge">
                {racha > 0 ? `🔥 Racha de ${racha} día${racha === 1 ? '' : 's'}` : 'Sin racha activa'}
              </span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className="meta-label">Promedio semanal</span>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22 }}>{promedioSemanal}%</div>
            </div>
          </div>

          {registros.length > 0 && (
            <table style={{ width: '100%', marginTop: 14, borderCollapse: 'collapse', fontSize: 13 }}>
              <tbody>
                {registros.slice(0, 7).map((r) => (
                  <tr key={r.fecha} style={{ borderTop: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '6px 0', color: 'var(--color-ink-soft)' }}>{r.fecha}</td>
                    <td style={{ padding: '6px 0', textAlign: 'right' }}>
                      {habito.tipo === 'BOOLEANO' ? (r.valor === 1 ? 'Cumplido' : 'No cumplido') : `${r.valor} ${habito.unidad || ''}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ))}
    </div>
  );
}
