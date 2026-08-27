import { asunto, html, textoPlano, type ZonaDelInforme } from './plantilla.ts';

/**
 * §10 — Envio del informe.
 *
 * Se invoca desde el frontend justo despues de insertar el lead, pasando su
 * id. Lee la fila con service_role, compone el email, lo envia por Resend y
 * marca informe_enviado. Si Resend falla devuelve error, pero el frontend no
 * lo propaga: el usuario ya esta viendo su resultado en pantalla.
 */

const REMITENTE = 'STRATTONWORLD <diagnostico@strattonworld.ai>';

const HORAS_POR_JORNADA = 8;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface Lead {
  id: string;
  nombre: string;
  email: string;
  horas_mes_calculadas: number;
  zonas_prioritarias: ZonaDelInforme[];
  informe_enviado: boolean;
}

function respuesta(cuerpo: unknown, estado: number): Response {
  return new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (peticion: Request) => {
  if (peticion.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  const urlSupabase = Deno.env.get('SUPABASE_URL');
  const servicio = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const claveResend = Deno.env.get('RESEND_API_KEY');
  const urlContacto = Deno.env.get('URL_CONTACTO') ?? '';

  if (!urlSupabase || !servicio || !claveResend) {
    console.error('Faltan variables de entorno en la funcion');
    return respuesta({ error: 'configuracion incompleta' }, 500);
  }

  let id: string;
  try {
    const cuerpo = (await peticion.json()) as { id?: string };
    if (!cuerpo.id) return respuesta({ error: 'falta el id' }, 400);
    id = cuerpo.id;
  } catch {
    return respuesta({ error: 'cuerpo invalido' }, 400);
  }

  const cabecerasSupabase = {
    apikey: servicio,
    Authorization: `Bearer ${servicio}`,
    'Content-Type': 'application/json',
  };

  // Lectura con service_role: anon no puede leer esta tabla (§9.2).
  const lectura = await fetch(
    `${urlSupabase}/rest/v1/leads?id=eq.${encodeURIComponent(id)}&select=id,nombre,email,horas_mes_calculadas,zonas_prioritarias,informe_enviado`,
    { headers: cabecerasSupabase }
  );

  if (!lectura.ok) {
    console.error('No se pudo leer el lead', await lectura.text());
    return respuesta({ error: 'lead no accesible' }, 500);
  }

  const filas = (await lectura.json()) as Lead[];
  const lead = filas[0];
  if (!lead) return respuesta({ error: 'lead no encontrado' }, 404);

  // Idempotencia: si el frontend reintenta, no se manda dos veces.
  if (lead.informe_enviado) return respuesta({ ok: true, yaEnviado: true }, 200);

  const horasMes = Number(lead.horas_mes_calculadas);
  const datos = {
    nombre: lead.nombre,
    horasMes,
    horasAño: horasMes * 12,
    jornadas: (horasMes * 12) / HORAS_POR_JORNADA,
    prioritarias: lead.zonas_prioritarias,
    urlContacto,
  };

  const envio = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${claveResend}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: REMITENTE,
      to: [lead.email],
      subject: asunto(horasMes),
      html: html(datos),
      text: textoPlano(datos),
    }),
  });

  if (!envio.ok) {
    console.error('Resend rechazo el envio', await envio.text());
    return respuesta({ error: 'envio fallido' }, 502);
  }

  const marcado = await fetch(`${urlSupabase}/rest/v1/leads?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { ...cabecerasSupabase, Prefer: 'return=minimal' },
    body: JSON.stringify({ informe_enviado: true }),
  });

  if (!marcado.ok) {
    console.error('Email enviado pero no se pudo marcar informe_enviado', await marcado.text());
  }

  return respuesta({ ok: true }, 200);
});
