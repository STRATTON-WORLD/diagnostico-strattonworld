import { Navigate, Route, Routes } from 'react-router-dom';
import Fondo from '@/componentes/Fondo';
import Diagnostico from '@/pantallas/Diagnostico';
import Landing from '@/pantallas/Landing';

/**
 * Routing de nivel superior. Dos rutas:
 * '/' — landing de contenido. '/diagnostico' — el flujo de las 12
 * pantallas, intacto. Cualquier otra ruta vuelve a la landing.
 *
 * El fondo y su textura (§4.4) se renderizan una sola vez aquí, no por
 * pantalla: es el mismo sistema visual en toda la web, no algo que cada
 * ruta deba repetir.
 */
export default function App() {
  return (
    <>
      <Fondo />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/diagnostico" element={<Diagnostico />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
