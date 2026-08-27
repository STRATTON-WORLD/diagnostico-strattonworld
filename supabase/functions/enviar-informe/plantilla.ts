import { porQuePosicion, ZONAS } from '../_shared/zonas.ts';

/**
 * §10 — Plantilla del email.
 *
 * Este archivo se va a reescribir entero cuando exista el informe extenso.
 * Por eso no contiene nada de logica: recibe datos ya calculados y devuelve
 * las dos versiones del mensaje.
 *
 * HTML sobrio, una sola columna, 600px, sin imagenes, y texto plano
 * alternativo obligatorio.
 */

export interface ZonaDelInforme {
  zona_id: number;
  nombre: string;
  horas_mes: number;
  /** 1ª, 2ª o 3ª. Determina la frase «por qué sale priorizada» (§5). */
  posicion: 1 | 2 | 3;
}

export interface DatosInforme {
  nombre: string;
  horasMes: number;
  horasAño: number;
  jornadas: number;
  prioritarias: ZonaDelInforme[];
  urlContacto: string;
}

const COLOR_FONDO = '#0A0A0A';
const COLOR_ELEVADO = '#141416';
const COLOR_TEXTO = '#FFFFFF';
const COLOR_SUAVE = '#A1A1AA';
const COLOR_ACENTO = '#2563EB';
const COLOR_BORDE = '#26262A';

const MONO = "'Geist Mono','IBM Plex Mono',ui-monospace,SFMono-Regular,monospace";
const SANS = "Inter,-apple-system,'Segoe UI',Helvetica,Arial,sans-serif";

const CIERRE = 'Si quieres, lo vemos con calma sobre tu caso concreto.';

function numero(valor: number): string {
  return Math.round(valor).toLocaleString('es-ES');
}

function escapar(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** El contenido de cada zona sale del mismo modulo que usa la interfaz. */
function contenidoDeZona(zonaId: number) {
  const zona = ZONAS.find((z) => z.id === zonaId);
  if (!zona) throw new Error(`Zona inexistente en el informe: ${zonaId}`);
  return zona;
}

export function asunto(horasMes: number): string {
  return `Tu diagnóstico: ${numero(horasMes)} horas al mes`;
}

export function textoPlano(datos: DatosInforme): string {
  const lineas: string[] = [];

  lineas.push(`Hola ${datos.nombre},`);
  lineas.push('');
  lineas.push(`${numero(datos.horasMes)} horas al mes`);
  lineas.push(`son ${numero(datos.horasAño)} horas al año`);
  lineas.push(`son ${numero(datos.jornadas)} jornadas de trabajo`);
  lineas.push('');
  lineas.push(
    'Es el tiempo que hoy dedicas a trabajo que, en su mayor parte, no debería necesitarte.'
  );
  lineas.push('');
  lineas.push('TUS 3 ZONAS PRIORITARIAS');

  datos.prioritarias.forEach((prioritaria) => {
    const zona = contenidoDeZona(prioritaria.zona_id);
    lineas.push('');
    lineas.push(
      `${prioritaria.posicion}. ${zona.nombre} — ${numero(prioritaria.horas_mes)} horas al mes`
    );
    lineas.push(porQuePosicion(prioritaria.posicion));
    for (const accion of zona.acciones) lineas.push(`- ${accion}`);
  });

  lineas.push('');
  lineas.push(CIERRE);
  lineas.push(`Hablar sobre mi caso con STRATTONWORLD: ${datos.urlContacto}`);
  lineas.push('');
  lineas.push('STRATTONWORLD');

  return lineas.join('\n');
}

export function html(datos: DatosInforme): string {
  const zonas = datos.prioritarias
    .map((prioritaria) => {
      const zona = contenidoDeZona(prioritaria.zona_id);
      const acciones = zona.acciones
        .map(
          (accion) => `
              <tr>
                <td style="padding:0 0 10px 0;vertical-align:top;width:18px;color:${COLOR_ACENTO};font-size:15px;line-height:1.6;">&#10003;</td>
                <td style="padding:0 0 10px 0;color:${COLOR_TEXTO};font-size:15px;line-height:1.6;">${escapar(accion)}</td>
              </tr>`
        )
        .join('');

      return `
        <tr>
          <td style="padding:0 0 16px 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLOR_ELEVADO};border:1px solid ${COLOR_BORDE};border-radius:12px;">
              <tr>
                <td style="padding:24px;">
                  <p style="margin:0 0 6px 0;font-family:${MONO};font-size:14px;color:${COLOR_SUAVE};">${prioritaria.posicion}</p>
                  <h2 style="margin:0 0 12px 0;font-family:${SANS};font-size:19px;font-weight:700;color:${COLOR_TEXTO};">${escapar(zona.nombre)}</h2>
                  <p style="margin:0 0 16px 0;font-family:${MONO};font-size:14px;color:${COLOR_SUAVE};">${numero(prioritaria.horas_mes)} horas al mes</p>
                  <p style="margin:0 0 18px 0;font-family:${SANS};font-size:15px;line-height:1.6;color:${COLOR_SUAVE};">${escapar(porQuePosicion(prioritaria.posicion))}</p>
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-family:${SANS};">${acciones}
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>`;
    })
    .join('');

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="color-scheme" content="dark" />
    <title>${escapar(asunto(datos.horasMes))}</title>
  </head>
  <body style="margin:0;padding:0;background:${COLOR_FONDO};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLOR_FONDO};">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;">
            <tr>
              <td style="padding:0 0 28px 0;font-family:${SANS};font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:${COLOR_SUAVE};">
                STRATTONWORLD
              </td>
            </tr>
            <tr>
              <td style="padding:0 0 24px 0;font-family:${SANS};font-size:17px;line-height:1.6;color:${COLOR_TEXTO};">
                Hola ${escapar(datos.nombre)},
              </td>
            </tr>
            <tr>
              <td style="padding:0 0 8px 0;font-family:${MONO};font-size:34px;line-height:1.2;color:${COLOR_TEXTO};">
                ${numero(datos.horasMes)} horas al mes
              </td>
            </tr>
            <tr>
              <td style="padding:0 0 4px 0;font-family:${MONO};font-size:22px;line-height:1.3;color:${COLOR_SUAVE};">
                son ${numero(datos.horasAño)} horas al año
              </td>
            </tr>
            <tr>
              <td style="padding:0 0 20px 0;font-family:${MONO};font-size:17px;line-height:1.4;color:${COLOR_SUAVE};">
                son ${numero(datos.jornadas)} jornadas de trabajo
              </td>
            </tr>
            <tr>
              <td style="padding:0 0 36px 0;font-family:${SANS};font-size:15px;line-height:1.6;color:${COLOR_SUAVE};">
                Es el tiempo que hoy dedicas a trabajo que, en su mayor parte, no debería necesitarte.
              </td>
            </tr>
            <tr>
              <td style="padding:0 0 16px 0;font-family:${SANS};font-size:22px;font-weight:700;color:${COLOR_TEXTO};">
                Tus 3 zonas prioritarias
              </td>
            </tr>
          </table>
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;">
            ${zonas}
          </table>
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;">
            <tr>
              <td style="padding:20px 0 12px 0;font-family:${SANS};font-size:15px;line-height:1.6;color:${COLOR_SUAVE};">
                ${CIERRE}
              </td>
            </tr>
            <tr>
              <td style="padding:0 0 32px 0;font-family:${SANS};font-size:15px;">
                <a href="${escapar(datos.urlContacto)}" style="color:${COLOR_TEXTO};text-decoration:underline;">Hablar sobre mi caso con STRATTONWORLD</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
