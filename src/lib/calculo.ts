import { valorDeRango } from '@/data/rangos';
import { zonaPorId } from '@/data/zonas';
import type { Diagnostico, Esfuerzo, Respuesta, Zona, ZonaPrioritaria } from '@/lib/tipos';

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

/** Horas mensuales de una zona a partir de sus horas semanales declaradas. */
export function horasMesDeZona(respuesta: Respuesta): number {
  if (!respuesta.si || respuesta.rango === null) return 0;
  return valorDeRango(respuesta.rango) * SEMANAS_POR_MES;
}

/**
 * §6.3 — Orden de prioridad.
 * ratio = valorRango ÷ pesoEsfuerzo, de mayor a menor.
 * Desempate estricto: mayor valorRango, menor peso de esfuerzo, menor id.
 * La cadena termina en el id, que es único: el orden es total y por tanto
 * el mismo input devuelve siempre exactamente el mismo resultado.
 */
function compararPrioridad(
  a: { zona: Zona; valor: number; peso: number; ratio: number },
  b: { zona: Zona; valor: number; peso: number; ratio: number }
): number {
  if (a.ratio !== b.ratio) return b.ratio - a.ratio;
  if (a.valor !== b.valor) return b.valor - a.valor;
  if (a.peso !== b.peso) return a.peso - b.peso;
  return a.zona.id - b.zona.id;
}

/**
 * §6.2 y §6.3 — Motor completo.
 * No redondea nada: el redondeo es responsabilidad de quien presenta.
 */
export function calcularDiagnostico(respuestas: Respuesta[]): Diagnostico {
  const marcadas = respuestas
    .filter((r) => r.si && r.rango !== null)
    .sort((a, b) => a.zonaId - b.zonaId);

  const horasMes = marcadas.reduce((suma, r) => suma + horasMesDeZona(r), 0);

  const candidatas = marcadas.map((r) => {
    const zona = zonaPorId(r.zonaId);
    const valor = valorDeRango(r.rango!);
    const peso = PESO_ESFUERZO[zona.esfuerzo];
    return { zona, valor, peso, ratio: valor / peso, horasMes: horasMesDeZona(r) };
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
    zonasSi: marcadas.map((r) => r.zonaId),
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
