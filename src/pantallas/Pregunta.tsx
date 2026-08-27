import { useEffect, useRef } from 'react';
import BarraProgreso from '@/componentes/BarraProgreso';
import TarjetaOpcion from '@/componentes/TarjetaOpcion';
import { RANGOS } from '@/data/rangos';
import { ZONAS } from '@/data/zonas';
import { TOTAL_PREGUNTAS, useDiagnostico } from '@/lib/estado';
import type { RangoId } from '@/lib/tipos';

/** §8.1-8.8 — «No» y la elección de rango avanzan solas tras 250ms. */
const ESPERA_ANTES_DE_AVANZAR = 250;

export default function Pregunta() {
  const { estado, navegar, actualizar } = useDiagnostico();
  const numero = estado.pregunta;
  const zona = ZONAS[numero - 1];
  const respuesta = estado.respuestas.find((r) => r.zonaId === zona.id)!;

  const temporizador = useRef<number | null>(null);
  const titular = useRef<HTMLHeadingElement>(null);

  const cancelarAvance = () => {
    if (temporizador.current !== null) {
      window.clearTimeout(temporizador.current);
      temporizador.current = null;
    }
  };

  const programarAvance = () => {
    cancelarAvance();
    temporizador.current = window.setTimeout(() => {
      temporizador.current = null;
      navegar({ tipo: 'avanzar' });
    }, ESPERA_ANTES_DE_AVANZAR);
  };

  const responder = (si: boolean) => {
    cancelarAvance();
    actualizar({ tipo: 'responder', zonaId: zona.id, si });
    if (!si) programarAvance();
  };

  const elegirRango = (rango: RangoId) => {
    cancelarAvance();
    actualizar({ tipo: 'elegirRango', zonaId: zona.id, rango });
    programarAvance();
  };

  // Al cambiar de pregunta: limpiar cualquier avance pendiente y llevar el
  // foco al enunciado, para que un lector de pantalla lo anuncie.
  useEffect(() => {
    titular.current?.focus({ preventScroll: true });
    return cancelarAvance;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numero]);

  // §8.1-8.8 — Teclas S / N.
  useEffect(() => {
    const alPulsar = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const tecla = e.key.toLowerCase();
      if (tecla === 's') {
        e.preventDefault();
        responder(true);
      } else if (tecla === 'n') {
        e.preventDefault();
        responder(false);
      }
    };
    window.addEventListener('keydown', alPulsar);
    return () => window.removeEventListener('keydown', alPulsar);
  });

  const idAfirmacion = `afirmacion-${zona.id}`;
  const idPreguntaHoras = `horas-${zona.id}`;

  return (
    <section key={numero} className="aparece flex min-h-dvh flex-col justify-center py-12">
      <div className="mb-10">
        <p className="dato mb-3 text-[13px] text-texto-suave">
          Pregunta {numero} de {TOTAL_PREGUNTAS}
        </p>
        <BarraProgreso actual={numero} total={TOTAL_PREGUNTAS} />
      </div>

      <p className="etiqueta mb-3 text-texto-suave">{zona.nombre}</p>

      <h1
        id={idAfirmacion}
        ref={titular}
        tabIndex={-1}
        className="mb-8 text-[28px] outline-none sm:text-[36px]"
      >
        {zona.afirmacion}
      </h1>

      <div role="radiogroup" aria-labelledby={idAfirmacion} className="grid gap-3 sm:grid-cols-2">
        <TarjetaOpcion seleccionada={respuesta.si === true} onSeleccionar={() => responder(true)}>
          Sí
        </TarjetaOpcion>
        <TarjetaOpcion seleccionada={respuesta.si === false} onSeleccionar={() => responder(false)}>
          No
        </TarjetaOpcion>
      </div>

      {/* Se muestra al responder «Sí», antes de pedir las horas: primero la
          solución, luego un dato externo solo si tiene fuente verificada.
          `solucion` es opcional en los datos — las zonas que aún no lo
          tienen simplemente no muestran este bloque. */}
      {respuesta.si === true && zona.solucion && (
        <div className="aparece mt-8 rounded-xl border border-borde bg-fondo-elevado p-5">
          <p className="etiqueta mb-2 text-texto-suave">La solución</p>
          <p className="text-[15px] leading-relaxed text-texto">{zona.solucion}</p>

          {zona.dato && (
            <div className="mt-4 border-t border-borde pt-4">
              <p className="text-[14px] leading-relaxed text-texto-suave">{zona.dato.texto}</p>
              <a
                href={zona.dato.url}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-[13px] text-texto-suave underline underline-offset-4 hover:text-texto"
              >
                Fuente: {zona.dato.fuente}
              </a>
            </div>
          )}
        </div>
      )}

      {respuesta.si === true && (
        <div className="aparece mt-8">
          <p id={idPreguntaHoras} className="mb-4 text-[17px] text-texto-suave">
            ¿Cuántas horas a la semana te lleva?
          </p>
          <div
            role="radiogroup"
            aria-labelledby={idPreguntaHoras}
            className="grid grid-cols-2 gap-3"
          >
            {RANGOS.map((rango) => (
              <TarjetaOpcion
                key={rango.id}
                forma="pildora"
                seleccionada={respuesta.rango === rango.id}
                onSeleccionar={() => elegirRango(rango.id)}
              >
                {rango.etiqueta}
              </TarjetaOpcion>
            ))}
          </div>
        </div>
      )}

      <div className="mt-10">
        <button
          type="button"
          onClick={() => {
            cancelarAvance();
            navegar({ tipo: 'volver' });
          }}
          className="-mx-2 inline-flex min-h-11 items-center rounded-sm px-2 text-[15px] text-texto-suave transition-colors duration-200 hover:text-texto"
        >
          Volver
        </button>
      </div>
    </section>
  );
}
