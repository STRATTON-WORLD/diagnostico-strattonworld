/**
 * Tipos compartidos. §5, §6, §7.
 */

// Esfuerzo y Zona se definen junto al contenido de las zonas, que es
// compartido con la Edge Function del informe (§10).
import type { Esfuerzo, Zona } from '../../supabase/functions/_shared/zonas.ts';

export type { Esfuerzo, Zona };

export type RangoId = 'menos2' | '2a5' | '5a10' | 'mas10';

export interface Rango {
  id: RangoId;
  etiqueta: string;
  valor: number; // horas semanales, punto medio del rango
}

/**
 * Una respuesta del cuestionario.
 * `si` es null mientras la pregunta está sin responder.
 * `rango` solo existe si `si` es true.
 */
export interface Respuesta {
  zonaId: number;
  si: boolean | null;
  rango: RangoId | null;
}

/** Posición en el ranking de prioridad: 1ª, 2ª o 3ª. Determina la frase `porQue` (§5). */
export type Posicion = 1 | 2 | 3;

export interface ZonaPrioritaria {
  zona: Zona;
  posicion: Posicion;
  /** Horas mensuales que el usuario declara en esta zona concreta. */
  horasMes: number;
}

export interface Diagnostico {
  /** Sin redondear. El redondeo es cosa de la presentación (§6.2). */
  horasMes: number;
  horasAño: number;
  jornadas: number;
  /** Máximo tres, ordenadas por prioridad de actuación (§6.3). */
  prioritarias: ZonaPrioritaria[];
  /** Ids de las zonas marcadas «Sí», en orden de zona. */
  zonasSi: number[];
}

export type NumEmpleados = '1 (autónomo)' | '2-5' | '6-10';

export type ScoreInterno = 'caliente' | 'tibio' | 'frio';

/** Lo que se envía a Supabase. §9.1. */
export interface Lead {
  nombre: string;
  email: string;
  telefono: string | null;
  num_empleados: NumEmpleados;
  respuestas: Array<{ zona_id: number; si: boolean; rango: RangoId | null }>;
  zonas_prioritarias: Array<{
    zona_id: number;
    nombre: string;
    horas_mes: number;
    posicion: Posicion;
  }>;
  horas_mes_calculadas: number;
  score_interno: ScoreInterno;
  consentimiento_rgpd: boolean;
}
