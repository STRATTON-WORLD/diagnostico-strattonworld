import type { Lead } from '@/lib/tipos';

/**
 * Cliente de Supabase.
 *
 * Son tres llamadas HTTP contra la API REST: contar, insertar e invocar la
 * Edge Function. Ninguna necesita sesión, refresco de token ni realtime, que
 * es lo que justifica @supabase/supabase-js. Con fetch nos ahorramos unos
 * 35 KB comprimidos de bundle, y §12 pone el presupuesto en 150 KB.
 */

const URL_BASE = import.meta.env.VITE_SUPABASE_URL;
const CLAVE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigurado = Boolean(URL_BASE && CLAVE_ANON);

function cabeceras(): HeadersInit {
  return {
    apikey: CLAVE_ANON,
    Authorization: `Bearer ${CLAVE_ANON}`,
    'Content-Type': 'application/json',
  };
}

/**
 * §9.2 — No hay policy de select para anon, así que el insert no puede
 * devolver la fila creada. El id lo genera el cliente para poder invocar
 * después la Edge Function sin abrir un permiso de lectura.
 */
export function nuevoId(): string {
  const c: Crypto = globalThis.crypto;
  if (typeof c.randomUUID === 'function') return c.randomUUID();

  // Navegadores antiguos, o contexto no seguro.
  const bytes = new Uint8Array(16);
  c.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * §8.0 y §9.3 — Contador del hero.
 * Devuelve null si falla: el badge no se renderiza y no pasa nada.
 */
export async function contarDiagnosticos(): Promise<number | null> {
  if (!supabaseConfigurado) return null;
  try {
    const respuesta = await fetch(`${URL_BASE}/rest/v1/rpc/contar_diagnosticos`, {
      method: 'POST',
      headers: cabeceras(),
      body: '{}',
    });
    if (!respuesta.ok) return null;
    const valor: unknown = await respuesta.json();
    return typeof valor === 'number' ? valor : null;
  } catch {
    return null;
  }
}

/** §8.10 — Inserta el lead. Devuelve el id, o null si la inserción falla. */
export async function insertarLead(lead: Lead & { id: string }): Promise<string | null> {
  if (!supabaseConfigurado) return null;
  const respuesta = await fetch(`${URL_BASE}/rest/v1/leads`, {
    method: 'POST',
    headers: { ...cabeceras(), Prefer: 'return=minimal' },
    body: JSON.stringify(lead),
  });
  if (!respuesta.ok) {
    throw new Error(`Insert fallido (${respuesta.status}): ${await respuesta.text()}`);
  }
  return lead.id;
}

/**
 * §10 — Dispara el envío del informe.
 * No propaga el error: el usuario ya está viendo su resultado en pantalla.
 */
export async function enviarInforme(id: string): Promise<void> {
  if (!supabaseConfigurado) return;
  try {
    await fetch(`${URL_BASE}/functions/v1/enviar-informe`, {
      method: 'POST',
      headers: cabeceras(),
      body: JSON.stringify({ id }),
    });
  } catch (error) {
    console.error('No se pudo invocar el envío del informe', error);
  }
}
