import { useState } from 'react';
import MisHabitos from './pages/MisHabitos';
import RegistrarHoy from './pages/RegistrarHoy';
import Historial from './pages/Historial';

const TABS = [
  { id: 'habitos', label: 'Mis hábitos', Componente: MisHabitos },
  { id: 'registrar', label: 'Registrar hoy', Componente: RegistrarHoy },
  { id: 'historial', label: 'Historial', Componente: Historial },
];

export default function App() {
  const [tabActiva, setTabActiva] = useState('habitos');
  const Activa = TABS.find((t) => t.id === tabActiva).Componente;

  return (
    <>
      <header className="app-header">
        <div className="eyebrow">Bitácora personal</div>
        <h1>Hábitos</h1>
      </header>

      <nav className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={tabActiva === t.id ? 'activo' : ''}
            onClick={() => setTabActiva(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main>
        <Activa />
      </main>
    </>
  );
}
