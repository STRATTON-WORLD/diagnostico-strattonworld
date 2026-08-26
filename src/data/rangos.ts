import type { Rango, RangoId } from '@/lib/tipos';

/**
 * §6.1 — Rangos de horas SEMANALES.
 * El valor es el punto medio del rango; en el abierto superior se toma 12,
 * deliberadamente conservador. No inflar nunca un rango hacia arriba: la
 * credibilidad del número es el producto.
 */
export const RANGOS = [
  { id: 'menos2', etiqueta: 'Menos de 2h', valor: 1 },
  { id: '2a5', etiqueta: '2-5h', valor: 3.5 },
  { id: '5a10', etiqueta: '5-10h', valor: 7.5 },
  { id: 'mas10', etiqueta: 'Más de 10h', valor: 12 },
] as const satisfies readonly Rango[];

const PORVALOR = Object.fromEntries(RANGOS.map((r) => [r.id, r.valor])) as Record<
  RangoId,
  number
>;

export function valorDeRango(rango: RangoId): number {
  return PORVALOR[rango];
}
