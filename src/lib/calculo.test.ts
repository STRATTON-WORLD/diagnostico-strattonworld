import { describe, expect, it } from 'vitest';
import { ZONAS } from '@/data/zonas';
import { porQuePosicion } from '@/data/zonas';
import { calcularDiagnostico, horasParaGuardar, sustituirHoras } from '@/lib/calculo';
import { calcularScore } from '@/lib/scoring';
import type { RangoId, Respuesta } from '@/lib/tipos';

/** Construye el juego de 8 respuestas a partir de las zonas marcadas «Sí». */
function respuestas(marcadas: Record<number, RangoId>): Respuesta[] {
  return ZONAS.map((z) => ({
    zonaId: z.id,
    si: z.id in marcadas,
    rango: marcadas[z.id] ?? null,
  }));
}

const ids = (d: ReturnType<typeof calcularDiagnostico>) => d.prioritarias.map((p) => p.zona.id);

describe('§6.4 — casos obligatorios del motor de cálculo', () => {
  it('ninguna zona marcada: horasMes 0 y sin prioritarias', () => {
    const d = calcularDiagnostico(respuestas({}));

    expect(d.horasMes).toBe(0);
    expect(d.horasAño).toBe(0);
    expect(d.jornadas).toBe(0);
    expect(d.prioritarias).toEqual([]);
    expect(d.zonasSi).toEqual([]);
  });

  it('una sola zona «Sí»: devuelve una prioritaria, no tres', () => {
    const d = calcularDiagnostico(respuestas({ 3: '5a10' }));

    expect(d.prioritarias).toHaveLength(1);
    expect(ids(d)).toEqual([3]);
    expect(d.horasMes).toBeCloseTo(7.5 * 4.33, 10);
  });

  it('ocho zonas «Sí» con mas10: 415,68 horas al mes, se muestran 416, prioritarias 1-3-4', () => {
    const todas = Object.fromEntries(ZONAS.map((z) => [z.id, 'mas10'])) as Record<number, RangoId>;
    const d = calcularDiagnostico(respuestas(todas));

    expect(d.horasMes).toBeCloseTo(415.68, 10);
    expect(Math.round(d.horasMes)).toBe(416);
    expect(ids(d)).toEqual([1, 3, 4]);
  });

  it('empate real entre zonas 1, 3 y 5: el orden esperado es 5, 1, 3', () => {
    // zona 5 (medio, mas10) ratio 6 · zona 1 (bajo, 2a5) ratio 3,5 · zona 3 (bajo, 2a5) ratio 3,5
    const d = calcularDiagnostico(respuestas({ 1: '2a5', 3: '2a5', 5: 'mas10' }));

    expect(ids(d)).toEqual([5, 1, 3]);
  });

  it('esfuerzo alto con mas10 (ratio 4) por delante de esfuerzo bajo con 2a5 (ratio 3,5)', () => {
    // zona 6 es de esfuerzo alto; zona 1 es de esfuerzo bajo.
    const d = calcularDiagnostico(respuestas({ 1: '2a5', 6: 'mas10' }));

    expect(ids(d)).toEqual([6, 1]);
  });

  it('determinismo: veinte ejecuciones del mismo input devuelven el mismo orden', () => {
    const entrada = respuestas({ 1: '2a5', 2: '5a10', 3: '2a5', 5: 'mas10', 7: '5a10', 8: 'mas10' });
    const esperado = ids(calcularDiagnostico(entrada));

    for (let i = 0; i < 20; i++) {
      expect(ids(calcularDiagnostico(entrada))).toEqual(esperado);
    }
  });
});

describe('presentación de las cifras', () => {
  it('las horas de cada zona prioritaria son las de esa zona, no el total', () => {
    const d = calcularDiagnostico(respuestas({ 1: 'menos2', 4: 'mas10' }));

    expect(d.prioritarias[0].zona.id).toBe(4);
    expect(d.prioritarias[0].horasMes).toBeCloseTo(12 * 4.33, 10);
    expect(d.prioritarias[1].horasMes).toBeCloseTo(1 * 4.33, 10);
  });

  it('{h} se sustituye por las horas de la zona redondeadas a entero', () => {
    const zona4 = ZONAS[3];
    expect(zona4.queCuesta).toContain('{h}');
    expect(sustituirHoras(zona4.queCuesta, 51.96)).toContain('52 horas al mes contestando');
    expect(sustituirHoras(zona4.queCuesta, 51.96)).not.toContain('{h}');
  });

  it('horas_mes_calculadas se guarda con un decimal', () => {
    expect(horasParaGuardar(415.68)).toBe(415.7);
    expect(horasParaGuardar(4.33)).toBe(4.3);
  });

  it('un «Sí» sin rango no suma horas ni entra en prioritarias', () => {
    const d = calcularDiagnostico([{ zonaId: 1, si: true, rango: null }]);

    expect(d.horasMes).toBe(0);
    expect(d.prioritarias).toEqual([]);
  });

  it('§5 — la posición depende del puesto en el ranking, no del esfuerzo de la zona', () => {
    // zona 6 es de esfuerzo alto y queda primera (mayor ratio); zona 1 y
    // zona 3, de esfuerzo bajo, quedan segunda y tercera. Componer la frase
    // desde el esfuerzo diría que las dos últimas «salen primero»: el
    // fallo que se corrige aquí.
    const d = calcularDiagnostico(respuestas({ 1: '2a5', 3: '2a5', 6: 'mas10' }));

    expect(ids(d)).toEqual([6, 1, 3]);
    expect(d.prioritarias.map((p) => p.posicion)).toEqual([1, 2, 3]);
    expect(porQuePosicion(d.prioritarias[0].posicion)).toContain('Te sale primero');
    expect(porQuePosicion(d.prioritarias[1].posicion)).toContain('segunda prioridad');
    expect(porQuePosicion(d.prioritarias[2].posicion)).toContain('Completa tus tres');
  });

  it('§5 — con una sola zona, su posición es 1 aunque el esfuerzo sea alto', () => {
    const d = calcularDiagnostico(respuestas({ 6: 'mas10' }));

    expect(d.prioritarias).toHaveLength(1);
    expect(d.prioritarias[0].posicion).toBe(1);
  });
});

describe('§7 — scoring comercial interno', () => {
  const base = respuestas({ 1: '5a10', 2: '5a10', 3: '2a5', 4: '2a5' });

  it('caliente: 4 zonas, un rango alto, empresa con equipo y teléfono', () => {
    expect(
      calcularScore({ respuestas: base, numEmpleados: '2-5', telefono: '600111222', horasMes: 80 })
    ).toBe('caliente');
  });

  it('sin teléfono no es caliente', () => {
    expect(
      calcularScore({ respuestas: base, numEmpleados: '2-5', telefono: null, horasMes: 80 })
    ).toBe('tibio');
  });

  it('frio: autónomo con dos zonas o menos', () => {
    expect(
      calcularScore({
        respuestas: respuestas({ 1: 'mas10', 2: 'mas10' }),
        numEmpleados: '1 (autónomo)',
        telefono: null,
        horasMes: 103.9,
      })
    ).toBe('frio');
  });

  it('frio: menos de 8 horas al mes', () => {
    expect(
      calcularScore({
        respuestas: respuestas({ 1: 'menos2' }),
        numEmpleados: '6-10',
        telefono: '600111222',
        horasMes: 4.33,
      })
    ).toBe('frio');
  });

  it('caliente gana a frío cuando se cumplen los dos', () => {
    // Autónomo con 2 zonas encajaría en «frío», pero no cumple «caliente»
    // por ser autónomo. Este caso comprueba el orden de evaluación con
    // horasMes < 8 y todo lo demás en «caliente».
    const cuatroZonasBajas = respuestas({ 1: '5a10', 2: 'menos2', 3: 'menos2', 4: 'menos2' });
    expect(
      calcularScore({
        respuestas: cuatroZonasBajas,
        numEmpleados: '2-5',
        telefono: '600111222',
        horasMes: 7,
      })
    ).toBe('caliente');
  });
});
