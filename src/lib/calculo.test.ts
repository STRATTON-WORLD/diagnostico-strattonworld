import { describe, expect, it } from 'vitest';
import { porQuePosicion, ZONAS } from '@/data/zonas';
import { calcularDiagnostico, horasParaGuardar, sustituirHoras } from '@/lib/calculo';
import { calcularScore } from '@/lib/scoring';
import type { RangoId, Respuesta } from '@/lib/tipos';

/**
 * Construye el juego de 8 respuestas a partir de las zonas marcadas «Sí».
 * `true` marca «Sí» sin rango — el caso normal en una zona tipo riesgo, que
 * nunca pregunta por horas. Un `RangoId` marca «Sí» con ese rango elegido.
 */
function respuestas(marcadas: Record<number, RangoId | true>): Respuesta[] {
  return ZONAS.map((z) => {
    const valor = marcadas[z.id];
    return {
      zonaId: z.id,
      si: valor !== undefined,
      rango: typeof valor === 'string' ? valor : null,
    };
  });
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

  it('una sola zona «Sí» tipo horas: devuelve una prioritaria, no tres', () => {
    const d = calcularDiagnostico(respuestas({ 3: '5a10' }));

    expect(d.prioritarias).toHaveLength(1);
    expect(ids(d)).toEqual([3]);
    expect(d.horasMes).toBeCloseTo(7.5 * 4.33, 10);
  });

  it('ocho zonas «Sí» con mas10: horasMes solo suma las 5 zonas tipo horas (2,3,4,5,7)', () => {
    // Las tres zonas tipo riesgo (1, 6, 8) marcadas «Sí» nunca contribuyen a
    // horasMes, aunque este helper les pase un rango — se ignora.
    const todas = Object.fromEntries(ZONAS.map((z) => [z.id, 'mas10'])) as Record<number, RangoId>;
    const d = calcularDiagnostico(respuestas(todas));

    expect(d.horasMes).toBeCloseTo(5 * 12 * 4.33, 10); // 259,8
    expect(Math.round(d.horasMes)).toBe(260);
    // Prioritarias: zonas 1, 3, 4 empatan a ratio 3 (impacto alto ÷ esfuerzo
    // bajo) y ganan a las demás por id.
    expect(ids(d)).toEqual([1, 3, 4]);
  });

  it('empate real a ratio 1 entre una zona horas y dos zonas riesgo: gana el id', () => {
    // zona 3 (horas, bajo, 'menos2') → impacto 1 ÷ esfuerzo 1 = ratio 1
    // zona 6 (riesgo, alto) → impacto 3 ÷ esfuerzo 3 = ratio 1
    // zona 8 (riesgo, alto) → impacto 3 ÷ esfuerzo 3 = ratio 1
    // zona 2 (horas, medio, 'menos2') → impacto 1 ÷ esfuerzo 2 = ratio 0,5,
    // no entra: queda para comprobar que el empate no se cuela con ella.
    const d = calcularDiagnostico(
      respuestas({ 3: 'menos2', 6: true, 8: true, 2: 'menos2' })
    );

    expect(ids(d)).toEqual([3, 6, 8]);
  });

  it('una zona de riesgo puede superar a una zona de horas de ratio menor, y entra en el top 3', () => {
    // zona 1 (riesgo, bajo) → ratio 3, fijo con «Sí».
    // zona 2 (horas, medio, '2a5') → impacto 2 ÷ esfuerzo 2 = ratio 1.
    const d = calcularDiagnostico(respuestas({ 1: true, 2: '2a5' }));

    expect(ids(d)).toEqual([1, 2]);
    expect(d.prioritarias[0].zona.tipo).toBe('riesgo');
    // La zona de riesgo nunca declaró horas: su horasMes de zona es 0.
    expect(d.prioritarias[0].horasMes).toBe(0);
  });

  it('determinismo: veinte ejecuciones del mismo input devuelven el mismo orden', () => {
    const entrada = respuestas({ 1: '2a5', 2: '5a10', 3: '2a5', 5: 'mas10', 7: '5a10', 8: 'mas10' });
    const esperado = ids(calcularDiagnostico(entrada));

    for (let i = 0; i < 20; i++) {
      expect(ids(calcularDiagnostico(entrada))).toEqual(esperado);
    }
  });
});

describe('v2 — zonas tipo riesgo no contribuyen a horasMes', () => {
  it('tres zonas de riesgo marcadas «Sí»: horasMes sigue siendo 0, y las tres entran en prioritarias', () => {
    const d = calcularDiagnostico(respuestas({ 1: true, 6: true, 8: true }));

    expect(d.horasMes).toBe(0);
    expect(d.prioritarias).toHaveLength(3);
    expect(ids(d)).toEqual([1, 6, 8]);
  });

  it('un «Sí» sin rango en zona tipo horas no suma horas ni entra en prioritarias (respuesta incompleta)', () => {
    const d = calcularDiagnostico([{ zonaId: 3, si: true, rango: null }]);

    expect(d.horasMes).toBe(0);
    expect(d.prioritarias).toEqual([]);
  });

  it('un «Sí» sin rango en zona tipo riesgo es el caso normal: entra en prioritarias con horasMes 0', () => {
    const d = calcularDiagnostico([{ zonaId: 1, si: true, rango: null }]);

    expect(d.horasMes).toBe(0);
    expect(d.prioritarias).toHaveLength(1);
    expect(d.prioritarias[0].zona.id).toBe(1);
    expect(d.prioritarias[0].horasMes).toBe(0);
  });
});

describe('presentación de las cifras', () => {
  it('las horas de cada zona prioritaria tipo horas son las de esa zona, no el total', () => {
    const d = calcularDiagnostico(respuestas({ 3: 'menos2', 4: 'mas10' }));

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

  it('§5 (v2) — la frase porQue depende de la posición Y del tipo de zona, no del esfuerzo', () => {
    // zona 1 (riesgo, bajo) → ratio 3, queda 1ª.
    // zona 3 (horas, bajo, '2a5') → impacto 2 ÷ esfuerzo 1 = ratio 2, queda 2ª.
    // zona 6 (riesgo, alto) → ratio 1, queda 3ª.
    // Componer la frase desde el esfuerzo diría que la zona 6 (esfuerzo
    // alto) es «la más laboriosa» por esfuerzo, y de hecho lo es — pero
    // aquí se comprueba que la frase depende de la POSICIÓN real (3ª),
    // no de que su esfuerzo sea alto por sí solo, y que además elige el
    // set de frases correcto según si la zona es de horas o de riesgo.
    const d = calcularDiagnostico(respuestas({ 1: true, 3: '2a5', 6: true }));

    expect(ids(d)).toEqual([1, 3, 6]);
    expect(d.prioritarias.map((p) => p.posicion)).toEqual([1, 2, 3]);
    expect(d.prioritarias.map((p) => p.zona.tipo)).toEqual(['riesgo', 'horas', 'riesgo']);

    const [p1, p2, p3] = d.prioritarias;
    expect(porQuePosicion(p1.posicion, p1.zona.tipo)).toContain('Sale entre tus prioridades');
    expect(porQuePosicion(p2.posicion, p2.zona.tipo)).toContain('el tiempo que pierdes compensa');
    expect(porQuePosicion(p3.posicion, p3.zona.tipo)).toContain('el riesgo que representa');
  });

  it('§5 (v2) — con una sola zona tipo riesgo, su posición es 1 aunque su esfuerzo sea alto', () => {
    const d = calcularDiagnostico(respuestas({ 6: true }));

    expect(d.prioritarias).toHaveLength(1);
    expect(d.prioritarias[0].posicion).toBe(1);
    expect(porQuePosicion(1, 'riesgo')).toContain('Sale entre tus prioridades');
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
