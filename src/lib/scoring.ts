import type { NumEmpleados, Respuesta, ScoreInterno } from '@/lib/tipos';

/**
 * §7 — Scoring comercial interno.
 * NUNCA visible para el usuario, ni en la interfaz ni en el email (§13).
 */

interface EntradaScoring {
  respuestas: Respuesta[];
  numEmpleados: NumEmpleados;
  telefono: string | null;
  horasMes: number;
}

export function calcularScore({
  respuestas,
  numEmpleados,
  telefono,
  horasMes,
}: EntradaScoring): ScoreInterno {
  const zonasSi = respuestas.filter((r) => r.si);
  const tieneRangoAlto = zonasSi.some((r) => r.rango === '5a10' || r.rango === 'mas10');
  const telefonoInformado = telefono !== null && telefono.trim() !== '';
  const empresaConEquipo = numEmpleados === '2-5' || numEmpleados === '6-10';

  // Se evalúa en este orden: si cumple «caliente», es caliente aunque
  // también encaje en «frío».
  if (zonasSi.length >= 4 && tieneRangoAlto && empresaConEquipo && telefonoInformado) {
    return 'caliente';
  }

  if ((numEmpleados === '1 (autónomo)' && zonasSi.length <= 2) || horasMes < 8) {
    return 'frio';
  }

  return 'tibio';
}
