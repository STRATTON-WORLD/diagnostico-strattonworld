import BotonPrincipal from '@/componentes/BotonPrincipal';
import Cascada from '@/componentes/Cascada';
import { ZONAS } from '@/data/zonas';
import { calcularDiagnostico } from '@/lib/calculo';
import { useDiagnostico } from '@/lib/estado';
import { cn } from '@/lib/utils';

const URL_WEB = import.meta.env.VITE_URL_WEB;

/** §8.9 — Resultado parcial. */
export default function ResultadoParcial() {
  const { estado, navegar } = useDiagnostico();
  const diagnostico = calcularDiagnostico(estado.respuestas);
  const prioritarias = new Set(diagnostico.prioritarias.map((p) => p.zona.id));

  // §8.9 — Caso de cero zonas: no hay cascada y no se pide el email.
  if (diagnostico.zonasSi.length === 0) {
    return (
      <section className="aparece flex min-h-dvh flex-col justify-center py-12">
        <h1 className="mb-6 text-[28px] sm:text-[36px]">
          Por lo que cuentas, tu empresa tiene los procesos bastante ordenados. No tenemos un
          diagnóstico que ofrecerte aquí.
        </h1>
        {URL_WEB && (
          <a
            href={URL_WEB}
            className="-mx-2 inline-flex min-h-11 w-fit items-center rounded-sm px-2 text-[15px] text-texto-suave underline underline-offset-4 transition-colors duration-200 hover:text-texto"
          >
            strattonworld.ai
          </a>
        )}
      </section>
    );
  }

  return (
    <section className="aparece flex min-h-dvh flex-col justify-center py-12">
      <Cascada
        horasMes={diagnostico.horasMes}
        horasAño={diagnostico.horasAño}
        jornadas={diagnostico.jornadas}
      />

      <p className="mt-8 text-texto-suave">
        Es el tiempo que hoy dedicas a trabajo que, en su mayor parte, no debería necesitarte.
      </p>

      {/* Teaser: solo los nombres. Lo que hay detrás del punto azul es lo
          que justifica pedir el email. */}
      <ul className="mt-10 space-y-3 border-t border-borde pt-8">
        {ZONAS.map((zona) => {
          const esPrioritaria = prioritarias.has(zona.id);
          return (
            <li key={zona.id} className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className={cn(
                  'size-1.5 shrink-0 rounded-full',
                  esPrioritaria ? 'bg-acento' : 'bg-white/15'
                )}
              />
              <span className={cn('text-[15px]', esPrioritaria ? 'text-texto' : 'text-texto-suave')}>
                {zona.nombre}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="mt-10">
        <BotonPrincipal onClick={() => navegar({ tipo: 'ir', pantalla: 'captura' })}>
          Ver mis 3 zonas prioritarias y qué hacer primero
        </BotonPrincipal>
        <p className="mt-4 text-center text-[14px] text-texto-suave">
          Te lo enviamos también por email, con el desglose completo.
        </p>
      </div>
    </section>
  );
}
