import { useId, useState, type FormEvent, type ReactNode } from 'react';
import BotonPrincipal from '@/componentes/BotonPrincipal';
import { Checkbox } from '@/componentes/ui/checkbox';
import { Input } from '@/componentes/ui/input';
import { Label } from '@/componentes/ui/label';
import { calcularDiagnostico, horasParaGuardar } from '@/lib/calculo';
import { limpiarEstado, useDiagnostico } from '@/lib/estado';
import { calcularScore } from '@/lib/scoring';
import { enviarInforme, insertarLead, nuevoId } from '@/lib/supabase';
import type { Lead, NumEmpleados } from '@/lib/tipos';
import { cn } from '@/lib/utils';

const URL_PRIVACIDAD = import.meta.env.VITE_URL_PRIVACIDAD;

const EMPLEADOS: NumEmpleados[] = ['1 (autónomo)', '2-5', '6-10'];

const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

interface Errores {
  nombre?: string;
  email?: string;
  numEmpleados?: string;
}

/** §8.10 — Captura. Ni un campo más que los cuatro de la spec (§13). */
export default function Captura() {
  const { estado, navegar } = useDiagnostico();

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [numEmpleados, setNumEmpleados] = useState<NumEmpleados | ''>('');
  const [telefono, setTelefono] = useState('');
  const [consentimiento, setConsentimiento] = useState(false);
  const [trampa, setTrampa] = useState('');
  const [errores, setErrores] = useState<Errores>({});
  const [enviando, setEnviando] = useState(false);

  const idNombre = useId();
  const idEmail = useId();
  const idEmpleados = useId();
  const idTelefono = useId();
  const idConsentimiento = useId();

  const completo =
    nombre.trim() !== '' && email.trim() !== '' && numEmpleados !== '' && consentimiento;

  function validar(): Errores {
    const nuevos: Errores = {};
    if (nombre.trim() === '') nuevos.nombre = 'Falta tu nombre.';
    if (email.trim() === '') nuevos.email = 'Falta tu email.';
    else if (!FORMATO_EMAIL.test(email.trim())) nuevos.email = 'Ese email no parece válido.';
    if (numEmpleados === '') nuevos.numEmpleados = 'Elige cuántas personas sois.';
    return nuevos;
  }

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (enviando) return;

    const nuevos = validar();
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) return;

    setEnviando(true);

    // §8.10 — Honeypot relleno: se simula el éxito y no se inserta nada.
    if (trampa.trim() !== '') {
      limpiarEstado();
      navegar({ tipo: 'ir', pantalla: 'completo' });
      return;
    }

    const diagnostico = calcularDiagnostico(estado.respuestas);
    const telefonoLimpio = telefono.trim() === '' ? null : telefono.trim();

    const lead: Lead & { id: string } = {
      id: nuevoId(),
      nombre: nombre.trim(),
      email: email.trim(),
      telefono: telefonoLimpio,
      num_empleados: numEmpleados as NumEmpleados,
      respuestas: estado.respuestas.map((r) => ({
        zona_id: r.zonaId,
        si: r.si === true,
        rango: r.rango,
      })),
      zonas_prioritarias: diagnostico.prioritarias.map((p) => ({
        zona_id: p.zona.id,
        nombre: p.zona.nombre,
        horas_mes: horasParaGuardar(p.horasMes),
        posicion: p.posicion,
      })),
      horas_mes_calculadas: horasParaGuardar(diagnostico.horasMes),
      score_interno: calcularScore({
        respuestas: estado.respuestas,
        numEmpleados: numEmpleados as NumEmpleados,
        telefono: telefonoLimpio,
        horasMes: diagnostico.horasMes,
      }),
      consentimiento_rgpd: consentimiento,
    };

    try {
      await insertarLead(lead);
      void enviarInforme(lead.id);
    } catch (error) {
      // §8.10 — El usuario ha hecho su parte: que falle nuestra base de datos
      // no es motivo para dejarle sin lo que ha venido a buscar.
      console.error('No se pudo guardar el lead', error);
    }

    limpiarEstado();
    navegar({ tipo: 'ir', pantalla: 'completo' });
  }

  return (
    <section className="aparece flex min-h-dvh flex-col justify-center py-12">
      <h1 className="mb-3 text-[28px] sm:text-[36px]">Ya sabemos tus 3 zonas prioritarias</h1>
      <p className="mb-10 text-texto-suave">
        Dinos dónde enviamos el desglose completo — qué hacer primero, y qué no tocar todavía.
      </p>

      <form onSubmit={enviar} noValidate className="space-y-6">
        <Campo
          id={idNombre}
          etiqueta="Nombre"
          error={errores.nombre}
          control={
            <Input
              id={idNombre}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              autoComplete="name"
              aria-invalid={Boolean(errores.nombre)}
              aria-describedby={errores.nombre ? `${idNombre}-error` : undefined}
              className={claseCampo(Boolean(errores.nombre))}
            />
          }
        />

        <Campo
          id={idEmail}
          etiqueta="Email profesional"
          error={errores.email}
          control={
            <Input
              id={idEmail}
              type="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              aria-invalid={Boolean(errores.email)}
              aria-describedby={errores.email ? `${idEmail}-error` : undefined}
              className={claseCampo(Boolean(errores.email))}
            />
          }
        />

        <Campo
          id={idEmpleados}
          etiqueta="Número de empleados"
          error={errores.numEmpleados}
          control={
            <select
              id={idEmpleados}
              value={numEmpleados}
              onChange={(e) => setNumEmpleados(e.target.value as NumEmpleados)}
              aria-invalid={Boolean(errores.numEmpleados)}
              aria-describedby={errores.numEmpleados ? `${idEmpleados}-error` : undefined}
              className={cn(
                claseCampo(Boolean(errores.numEmpleados)),
                'appearance-none bg-fondo-elevado bg-[length:12px] bg-[position:right_16px_center] bg-no-repeat pr-10',
                numEmpleados === '' && 'text-texto-suave'
              )}
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8' fill='none'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23A1A1AA' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
              }}
            >
              <option value="" disabled>
                Elige una opción
              </option>
              {EMPLEADOS.map((opcion) => (
                <option key={opcion} value={opcion} className="bg-fondo-elevado text-texto">
                  {opcion}
                </option>
              ))}
            </select>
          }
        />

        <Campo
          id={idTelefono}
          etiqueta="Teléfono"
          ayuda="Solo si quieres que te llamemos para hablar de tu caso"
          control={
            <Input
              id={idTelefono}
              type="tel"
              inputMode="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              autoComplete="tel"
              className={claseCampo(false)}
            />
          }
        />

        {/* §8.10 — Honeypot: fuera del viewport, no display:none. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-[9999px] top-0 h-0 w-0 overflow-hidden"
        >
          <label htmlFor="empresa-web">No rellenar</label>
          <input
            id="empresa-web"
            name="empresa-web"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={trampa}
            onChange={(e) => setTrampa(e.target.value)}
          />
        </div>

        <div className="flex items-start gap-3 pt-2">
          <Checkbox
            id={idConsentimiento}
            checked={consentimiento}
            onCheckedChange={(valor) => setConsentimiento(valor === true)}
            className="mt-1 size-5 shrink-0 border-borde data-[state=checked]:border-acento data-[state=checked]:bg-acento"
          />
          <Label
            htmlFor={idConsentimiento}
            className="block text-[14px] leading-relaxed font-normal text-texto-suave"
          >
            Acepto recibir mi diagnóstico y comunicaciones de STRATTONWORLD por email. Puedes darte
            de baja cuando quieras.{' '}
            {URL_PRIVACIDAD ? (
              <a
                href={URL_PRIVACIDAD}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-4 hover:text-texto"
              >
                Política de privacidad
              </a>
            ) : (
              'Política de privacidad'
            )}
          </Label>
        </div>

        <BotonPrincipal type="submit" disabled={!completo || enviando}>
          {enviando ? 'Enviando…' : 'Ver mi resultado completo'}
        </BotonPrincipal>
      </form>
    </section>
  );
}

function claseCampo(hayError: boolean): string {
  return cn(
    'h-12 rounded-xl border bg-fondo-elevado px-4 text-[16px] text-texto shadow-none',
    'focus-visible:ring-0 focus-visible:border-acento',
    hayError ? 'border-error' : 'border-borde'
  );
}

interface CampoProps {
  id: string;
  etiqueta: string;
  ayuda?: string;
  error?: string;
  control: ReactNode;
}

function Campo({ id, etiqueta, ayuda, error, control }: CampoProps) {
  return (
    <div>
      <Label htmlFor={id} className="mb-2 block text-[14px] font-normal text-texto-suave">
        {etiqueta}
      </Label>
      {control}
      {ayuda && <p className="mt-2 text-[13px] text-texto-suave">{ayuda}</p>}
      {/* §12 — Los errores van con aria-live polite. */}
      <p id={`${id}-error`} aria-live="polite" className="mt-2 text-[13px] text-error empty:mt-0">
        {error ?? ''}
      </p>
    </div>
  );
}
