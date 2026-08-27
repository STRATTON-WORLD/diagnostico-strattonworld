import { Check } from 'lucide-react';
import { calcularDiagnostico, sustituirHoras } from '@/lib/calculo';
import { useDiagnostico } from '@/lib/estado';

const URL_CONTACTO = import.meta.env.VITE_URL_CONTACTO;

/** §8.11 — Resultado completo. Sin descargas, sin compartir, sin ofertas. */
export default function ResultadoCompleto() {
  const { estado } = useDiagnostico();
  const { prioritarias } = calcularDiagnostico(estado.respuestas);

  return (
    <section className="aparece py-16">
      <h1 className="mb-10 text-[28px] sm:text-[36px]">Tus 3 zonas prioritarias</h1>

      <ol className="space-y-4">
        {prioritarias.map((prioritaria, indice) => {
          const { zona, horasMes } = prioritaria;
          return (
            <li
              key={zona.id}
              className="rounded-xl border border-borde bg-fondo-elevado p-6"
            >
              <div className="mb-4 flex items-baseline gap-3">
                {/* La numeración aquí sí informa: es un orden de actuación. */}
                <span className="dato text-[15px] text-texto-suave">{indice + 1}</span>
                <h2 className="text-[19px] leading-snug sm:text-[22px]">{zona.nombre}</h2>
              </div>

              <p className="dato mb-5 text-[15px] text-texto-suave">
                {Math.round(horasMes)} horas al mes
              </p>

              <p className="mb-4 text-[15px] text-texto-suave">{zona.porQue}</p>

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
