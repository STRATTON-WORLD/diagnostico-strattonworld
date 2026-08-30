import {
  BrainCircuit,
  CalendarClock,
  Check,
  Clock,
  FileText,
  HelpCircle,
  LineChart,
  Megaphone,
  MessageCircle,
  Receipt,
  type LucideIcon,
} from 'lucide-react';
import { porQuePosicion, tituloPrioritarias } from '@/data/zonas';
import { calcularDiagnostico, sustituirHoras } from '@/lib/calculo';
import { useDiagnostico } from '@/lib/estado';

const URL_CONTACTO = import.meta.env.VITE_URL_CONTACTO;

/**
 * Un icono por zona, puramente visual — no vive en zonas.ts porque esa
 * fuente de verdad ya está en producción con leads reales, cálculo de horas,
 * scoring y emails, y esta tarea no la toca. Mismos iconos que la landing
 * (strattonworld.es) para las mismas 8 zonas: es el elemento que hace que
 * el resultado se lea como parte del mismo sitio, no de dos sistemas
 * distintos.
 */
const ICONO_POR_ZONA: Record<number, LucideIcon> = {
  1: MessageCircle,
  2: FileText,
  3: CalendarClock,
  4: HelpCircle,
  5: Receipt,
  6: BrainCircuit,
  7: Megaphone,
  8: LineChart,
};

/** §8.11 — Resultado completo. Sin descargas, sin compartir, sin ofertas. */
export default function ResultadoCompleto() {
  const { estado } = useDiagnostico();
  const { prioritarias } = calcularDiagnostico(estado.respuestas);

  return (
    <section className="aparece py-16">
      <h1 className="mb-3 text-[28px] sm:text-[36px]">{tituloPrioritarias(prioritarias.length)}</h1>
      <p className="mb-10 text-[15px] text-texto-suave">
        Esto es lo que hemos visto en tus respuestas — no el mapa general, el tuyo.
      </p>

      <ol className="space-y-4">
        {prioritarias.map((prioritaria) => {
          const { zona, posicion, horasMes } = prioritaria;
          const Icono = ICONO_POR_ZONA[zona.id];
          return (
            <li
              key={zona.id}
              className="rounded-xl border border-borde bg-fondo-elevado p-6"
            >
              <div className="mb-4 flex items-start gap-4">
                {/* Caja redondeada con acento azul — tomado de la landing,
                    mismo icono que representa allí a esta misma zona. */}
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-acento/30 bg-acento-tenue">
                  <Icono className="size-6 text-acento" aria-hidden="true" strokeWidth={2} />
                </span>
                <div>
                  {/* La numeración aquí sí informa: es un orden de actuación. */}
                  <span className="dato text-[13px] text-texto-suave">{posicion}</span>
                  <h2 className="text-[19px] leading-snug sm:text-[22px]">{zona.nombre}</h2>
                </div>
              </div>

              {/* Una zona tipo riesgo nunca tuvo horas que declarar — no hay
                  cifra honesta que mostrar aquí, así que el badge se omite
                  en vez de enseñar «0 horas al mes». */}
              {zona.tipo === 'horas' && (
                <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-acento/40 bg-acento-tenue px-3 py-1.5 text-texto-suave">
                  <Clock className="size-3.5 text-acento" aria-hidden="true" strokeWidth={2.5} />
                  <span className="dato text-[13px] font-semibold text-texto">
                    {Math.round(horasMes)} horas al mes
                  </span>
                </span>
              )}

              {/* La frase depende de la posición real en el ranking y del
                  tipo de zona (§5), no del esfuerzo: si dependiera del
                  esfuerzo, una zona de esfuerzo bajo en tercer lugar diría
                  «sale primero» sobre algo que es su tercera prioridad; y
                  una zona de riesgo no puede hablar de «el tiempo que
                  pierdes» porque nunca declaró horas. */}
              <p className="mb-4 text-[15px] text-texto-suave">
                {porQuePosicion(posicion, zona.tipo)}
              </p>

              <p className="mb-5 text-[15px] text-texto-suave">
                {sustituirHoras(zona.queCuesta, horasMes)}
              </p>

              <ul className="space-y-3">
                {zona.acciones.map((accion) => (
                  <li key={accion} className="flex gap-3 text-[15px]">
                    <Check
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0 text-acento"
                      strokeWidth={2.5}
                    />
                    <span>{accion}</span>
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ol>

      <p className="mt-10 text-texto-suave">
        El informe completo, con las ocho zonas y el detalle ampliado, ya va camino de tu email.
      </p>

      {URL_CONTACTO && (
        <a
          href={URL_CONTACTO}
          target="_blank"
          rel="noreferrer"
          className="-mx-2 mt-8 inline-flex min-h-11 w-fit items-center rounded-sm px-2 text-[15px] text-texto-suave underline underline-offset-4 transition-colors duration-200 hover:text-texto"
        >
          Hablar sobre mi caso con STRATTONWORLD
        </a>
      )}
    </section>
  );
}
