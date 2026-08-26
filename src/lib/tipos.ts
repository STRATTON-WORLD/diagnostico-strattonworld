/**
 * Tipos compartidos. §5, §6, §7.
 */

export type Esfuerzo = 'bajo' | 'medio' | 'alto';

export type RangoId = 'menos2' | '2a5' | '5a10' | 'mas10';

export interface Zona {
  id: number; // 1-8, define también el orden y el desempate final
  nombre: string;
  afirmacion: string;
  esfuerzo: Esfuerzo;
  porQue: string; // pantalla 11: por qué sale priorizada
  queCuesta: string; // pantalla 11: consecuencia
  acciones: string[]; // pantalla 11: 2-3 acciones realistas
}

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

export interface ZonaPrioritaria {
  zona: Zona;
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
  zonas_prioritarias: Array<{ zona_id: number; nombre: string; horas_mes: number }>;
  horas_mes_calculadas: number;
  score_interno: ScoreInterno;
  consentimiento_rgpd: boolean;
}
