import { valorDeRango } from '@/data/rangos';
import { zonaPorId } from '@/data/zonas';
import type { Diagnostico, Esfuerzo, RangoId, Respuesta, Zona, ZonaPrioritaria } from '@/lib/tipos';

/** §6.2 — Semanas por mes. */
export const SEMANAS_POR_MES = 4.33;

/** §6.2 — Horas de una jornada de trabajo. */
export const HORAS_POR_JORNADA = 8;

/** §6.3 — Peso del esfuerzo de implantación. */
export const PESO_ESFUERZO: Record<Esfuerzo, number> = {
  bajo: 1,
  medio: 2,
  alto: 3,
};

/**
 * v2 — Nivel de impacto (1 bajo, 2 medio, 3 alto), unificado para poder
 * comparar zonas tipo horas y zonas tipo riesgo en el mismo ranking.
 *
 * En zonas tipo horas sale del rango declarado. En zonas tipo riesgo es
 * siempre 3 (alto): un riesgo de continuidad o un punto ciego del negocio
 * no es nunca «impacto bajo» por definición — lo decide STRATTONWORLD, no
 * lo declara el usuario, porque no hay una cifra que el usuario pueda dar
 * para algo que no se mide en horas.
 */
const NIVEL_IMPACTO_POR_RANGO: Record<RangoId, number> = {
  menos2: 1,
  '2a5': 2,
  '5a10': 3,
  mas10: 3,
};

export const NIVEL_IMPACTO_RIESGO = 3;

/**
 * Horas mensuales de una zona a partir de sus horas semanales declaradas.
 * Solo tiene sentido en zonas tipo horas: una zona tipo riesgo nunca
 * contribuye a horasMes, aunque venga con un rango en la Respuesta (no
 * debería, pero si lo trae, se ignora — horasMes debe seguir siendo una
 * cifra 100% real).
 */
export function horasMesDeZona(zona: Zona, respuesta: Respuesta): number {
  if (zona.tipo !== 'horas') return 0;
  if (!respuesta.si || respuesta.rango === null) return 0;
  return valorDeRango(respuesta.rango) * SEMANAS_POR_MES;
}

interface Candidata {
  zona: Zona;
  nivelImpacto: number;
  peso: number;
  ratio: number;
  horasMes: number;
}

/**
 * §6.3 (v2) — Orden de prioridad.
 * ratio = nivelImpacto ÷ pesoEsfuerzo, de mayor a menor.
 * Desempate: menor id de zona. Es el único criterio de desempate porque el
 * esfuerzo ya está dentro del ratio (como denominador) y el nivel de
 * impacto ya no es un valor continuo comparable entre tipos de zona — no
 * tendría sentido desempatar por «quién declaró más horas» cuando una de
 * las dos zonas empatadas puede no haber declarado horas en absoluto.
 * La cadena sigue terminando en el id, que es único: el orden es total y
 * el mismo input devuelve siempre exactamente el mismo resultado.
 */
function compararPrioridad(a: Candidata, b: Candidata): number {
  if (a.ratio !== b.ratio) return b.ratio - a.ratio;
  return a.zona.id - b.zona.id;
}

/**
 * §6.2 y §6.3 — Motor completo (v2).
 * No redondea nada: el redondeo es responsabilidad de quien presenta.
 */
export function calcularDiagnostico(respuestas: Respuesta[]): Diagnostico {
  const contestadas = respuestas
    .filter((r) => r.si === true)
    .sort((a, b) => a.zonaId - b.zonaId)
    .map((r) => ({ respuesta: r, zona: zonaPorId(r.zonaId) }));

  // horasMes solo suma zonas tipo horas con rango elegido. Una zona tipo
  // horas marcada «Sí» pero todavía sin rango (a medio responder) no cuenta
  // — igual que antes. Una zona tipo riesgo nunca cuenta, tenga o no rango.
  const horasMes = contestadas.reduce(
    (suma, { zona, respuesta }) => suma + horasMesDeZona(zona, respuesta),
    0
  );

  // Candidatas a prioridad: zonas horas con rango elegido, o zonas riesgo
  // con «Sí» (sin necesitar rango — no se les pregunta por horas).
  const candidatas: Candidata[] = contestadas
    .filter(
      ({ zona, respuesta }) => (zona.tipo === 'horas' && respuesta.rango !== null) || zona.tipo === 'riesgo'
    )
    .map(({ zona, respuesta }) => {
      const nivelImpacto =
        zona.tipo === 'riesgo' ? NIVEL_IMPACTO_RIESGO : NIVEL_IMPACTO_POR_RANGO[respuesta.rango!];
      const peso = PESO_ESFUERZO[zona.esfuerzo];
      return {
        zona,
        nivelImpacto,
        peso,
        ratio: nivelImpacto / peso,
        horasMes: horasMesDeZona(zona, respuesta),
      };
    });

  const prioritarias: ZonaPrioritaria[] = candidatas
    .slice()
    .sort(compararPrioridad)
    .slice(0, 3)
    .map(({ zona, horasMes: horas }, indice) => ({
      zona,
      // La posición en el ranking (1ª, 2ª, 3ª) determina la frase `porQue`
      // de §5: no puede depender del esfuerzo, porque una zona de esfuerzo
      // bajo puede quedar tercera.
      posicion: (indice + 1) as ZonaPrioritaria['posicion'],
      horasMes: horas,
    }));

  return {
    horasMes,
    horasAño: horasMes * 12,
    jornadas: (horasMes * 12) / HORAS_POR_JORNADA,
    prioritarias,
    zonasSi: contestadas.map(({ respuesta }) => respuesta.zonaId),
  };
}

/**
 * §5 — `{h}` se sustituye por las horas mensuales de esa zona,
 * redondeadas a entero.
 */
export function sustituirHoras(texto: string, horasMes: number): string {
  return texto.replaceAll('{h}', String(Math.round(horasMes)));
}

/** §9.1 — `horas_mes_calculadas` se guarda con un decimal. */
export function horasParaGuardar(horasMes: number): number {
  return Math.round(horasMes * 10) / 10;
}
