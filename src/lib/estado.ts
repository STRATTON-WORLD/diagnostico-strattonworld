import { createContext, useContext } from 'react';
import { ZONAS } from '@/data/zonas';
import type { RangoId, Respuesta } from '@/lib/tipos';

/**
 * Máquina de estados del cuestionario (§2, §8.12).
 * Sin router: el usuario no puede llegar a la pregunta 7 con un enlace.
 */

export const TOTAL_PREGUNTAS = 8;

export type Pantalla = 'hero' | 'pregunta' | 'parcial' | 'captura' | 'completo';

export interface EstadoDiagnostico {
  pantalla: Pantalla;
  /** 1 a 8. */
  pregunta: number;
  respuestas: Respuesta[];
}

export const ESTADO_INICIAL: EstadoDiagnostico = {
  pantalla: 'hero',
  pregunta: 1,
  respuestas: ZONAS.map((z) => ({ zonaId: z.id, si: null, rango: null })),
};

export type Accion =
  | { tipo: 'restaurar'; estado: EstadoDiagnostico }
  | { tipo: 'empezar' }
  | { tipo: 'responder'; zonaId: number; si: boolean }
  | { tipo: 'elegirRango'; zonaId: number; rango: RangoId }
  | { tipo: 'avanzar' }
  | { tipo: 'volver' }
  | { tipo: 'ir'; pantalla: Pantalla };

export function reductor(estado: EstadoDiagnostico, accion: Accion): EstadoDiagnostico {
  switch (accion.tipo) {
    case 'restaurar':
      return accion.estado;

    case 'empezar':
      return { ...estado, pantalla: 'pregunta', pregunta: 1 };

    case 'responder':
      return {
        ...estado,
        respuestas: estado.respuestas.map((r) =>
          r.zonaId === accion.zonaId
            ? { ...r, si: accion.si, rango: accion.si ? r.rango : null }
            : r
        ),
      };

    case 'elegirRango':
      return {
        ...estado,
        respuestas: estado.respuestas.map((r) =>
          r.zonaId === accion.zonaId ? { ...r, si: true, rango: accion.rango } : r
        ),
      };

    case 'avanzar':
      return estado.pregunta < TOTAL_PREGUNTAS
        ? { ...estado, pregunta: estado.pregunta + 1 }
        : { ...estado, pantalla: 'parcial' };

    case 'volver':
      return estado.pregunta > 1
        ? { ...estado, pregunta: estado.pregunta - 1 }
        : { ...estado, pantalla: 'hero' };

    case 'ir':
      return { ...estado, pantalla: accion.pantalla };
  }
}

/* ------------------------------------------------------------------
   Persistencia en sessionStorage (§8.12)
   ------------------------------------------------------------------ */

const CLAVE = 'strattonworld:diagnostico:v1';

const PANTALLAS: Pantalla[] = ['hero', 'pregunta', 'parcial', 'captura', 'completo'];

function esEstadoValido(valor: unknown): valor is EstadoDiagnostico {
  if (typeof valor !== 'object' || valor === null) return false;
  const e = valor as Partial<EstadoDiagnostico>;
  if (!PANTALLAS.includes(e.pantalla as Pantalla)) return false;
  if (typeof e.pregunta !== 'number' || e.pregunta < 1 || e.pregunta > TOTAL_PREGUNTAS) return false;
  if (!Array.isArray(e.respuestas) || e.respuestas.length !== ZONAS.length) return false;
  return e.respuestas.every(
    (r) => typeof r === 'object' && r !== null && ZONAS.some((z) => z.id === r.zonaId)
  );
}

export function guardarEstado(estado: EstadoDiagnostico): void {
  try {
    sessionStorage.setItem(CLAVE, JSON.stringify(estado));
  } catch {
    // Navegación privada o almacenamiento lleno: seguimos sin persistir.
  }
}

export function leerEstado(): EstadoDiagnostico | null {
  try {
    const bruto = sessionStorage.getItem(CLAVE);
    if (!bruto) return null;
    const valor: unknown = JSON.parse(bruto);
    return esEstadoValido(valor) ? valor : null;
  } catch {
    return null;
  }
}

export function limpiarEstado(): void {
  try {
    sessionStorage.removeItem(CLAVE);
  } catch {
    // Sin nada que hacer.
  }
}

/* ------------------------------------------------------------------
   Contexto (§2: useReducer + Context, sin Redux ni Zustand)
   ------------------------------------------------------------------ */

interface Contexto {
  estado: EstadoDiagnostico;
  /** Cambia de pantalla o de pregunta y deja rastro en el historial. */
  navegar: (accion: Accion) => void;
  /** Cambia el estado sin tocar el historial (responder una pregunta). */
  actualizar: (accion: Accion) => void;
}

export const ContextoDiagnostico = createContext<Contexto | null>(null);

export function useDiagnostico(): Contexto {
  const ctx = useContext(ContextoDiagnostico);
  if (!ctx) throw new Error('useDiagnostico fuera de ContextoDiagnostico');
  return ctx;
}
