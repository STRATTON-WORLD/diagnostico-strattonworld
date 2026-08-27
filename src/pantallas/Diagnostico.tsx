import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Captura from '@/pantallas/Captura';
import Hero from '@/pantallas/Hero';
import Pregunta from '@/pantallas/Pregunta';
import ResultadoCompleto from '@/pantallas/ResultadoCompleto';
import ResultadoParcial from '@/pantallas/ResultadoParcial';
import {
  ContextoDiagnostico,
  ESTADO_INICIAL,
  guardarEstado,
  limpiarEstado,
  leerEstado,
  reductor,
  type Accion,
  type EstadoDiagnostico,
} from '@/lib/estado';

/**
 * §2 y §8.12 — Orquestación de /diagnostico.
 *
 * El flujo interno (pantallas 0-11) sigue sin router propio: es una máquina
 * de estados sobre una única ruta. El progreso vive en memoria, se persiste
 * en sessionStorage y cada cambio de pantalla deja una entrada en el
 * historial, para que el botón «atrás» del navegador retroceda dentro del
 * cuestionario en vez de sacar al usuario de él. Nada de esto cambia por
 * vivir ahora bajo react-router: los pushState/replaceState internos nunca
 * tocan el pathname, así que el router no los ve como una navegación.
 */

/** Lo que puede llevar la navegación desde la landing (ver Landing.tsx). */
interface EstadoNavegacion {
  /** Si viene en true, se salta el hero interno y se entra directo en la 1. */
  empezar?: boolean;
}

function empiezaDirecto(estadoNav: unknown): boolean {
  return (
    typeof estadoNav === 'object' &&
    estadoNav !== null &&
    (estadoNav as EstadoNavegacion).empezar === true
  );
}

function estadoInicial(estadoNav: unknown): EstadoDiagnostico {
  const guardado = leerEstado();
  if (guardado) return guardado;
  return empiezaDirecto(estadoNav)
    ? { ...ESTADO_INICIAL, pantalla: 'pregunta', pregunta: 1 }
    : ESTADO_INICIAL;
}

export default function Diagnostico() {
  const location = useLocation();
  const [estado, dispatch] = useReducer(reductor, null, () => estadoInicial(location.state));

  const estadoRef = useRef(estado);
  useEffect(() => {
    estadoRef.current = estado;
  }, [estado]);

  // Cambia de pantalla dejando rastro en el historial.
  const navegar = useCallback((accion: Accion) => {
    const siguiente = reductor(estadoRef.current, accion);
    dispatch(accion);
    window.history.pushState({ diagnostico: siguiente }, '');
  }, []);

  // Cambia el estado sin tocar el historial: responder no es navegar.
  const actualizar = useCallback((accion: Accion) => {
    dispatch(accion);
  }, []);

  // La entrada actual del historial guarda siempre el estado vivo. Si solo se
  // guardase al entrar, al retroceder se perdería lo respondido después,
  // y §8.1-8.8 pide que «Volver» conserve la respuesta.
  useEffect(() => {
    window.history.replaceState({ diagnostico: estado }, '');
  }, [estado]);

  useEffect(() => {
    const alRetroceder = (e: PopStateEvent) => {
      const guardado = (e.state as { diagnostico?: EstadoDiagnostico } | null)?.diagnostico;
      if (guardado) dispatch({ tipo: 'restaurar', estado: guardado });
    };
    window.addEventListener('popstate', alRetroceder);
    return () => window.removeEventListener('popstate', alRetroceder);
  }, []);

  // §8.12 — El progreso se guarda en cada respuesta y se limpia al completar
  // la pantalla 10.
  useEffect(() => {
    if (estado.pantalla === 'completo') limpiarEstado();
    else guardarEstado(estado);
  }, [estado]);

  const contexto = useMemo(() => ({ estado, navegar, actualizar }), [estado, navegar, actualizar]);

  return (
    <ContextoDiagnostico.Provider value={contexto}>
      <div className="contenedor">
        {estado.pantalla === 'hero' && <Hero />}
        {estado.pantalla === 'pregunta' && <Pregunta />}
        {estado.pantalla === 'parcial' && <ResultadoParcial />}
        {estado.pantalla === 'captura' && <Captura />}
        {estado.pantalla === 'completo' && <ResultadoCompleto />}
      </div>
    </ContextoDiagnostico.Provider>
  );
}
