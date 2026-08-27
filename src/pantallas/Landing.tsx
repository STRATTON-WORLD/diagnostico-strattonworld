import { Check, Minus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BadgeContador from '@/componentes/BadgeContador';
import BarraSticky from '@/componentes/BarraSticky';
import BotonPrincipal from '@/componentes/BotonPrincipal';
import { ZONAS } from '@/data/zonas';

/**
 * Landing de contenido en la raíz. Aporta valor por sí sola — las 8 zonas
 * y dónde no aplicar nada todavía — antes de pedir ningún clic hacia
 * /diagnostico.
 *
 * Los tres CTA de esta página llevan a /diagnostico con `state: { empezar:
 * true }`: saltan el hero interno y entran directas en la pregunta 1,
 * porque el visitante ya ha visto aquí la presentación del producto.
 */

const CASOS_DONDE_NO_APLICAR = [
  'Si en esa zona pierdes menos de 2 horas al mes, probablemente no compensa tocarla aún — el esfuerzo de montarlo supera lo que recuperas.',
  'Si ni siquiera tú tienes claro hoy cómo se hace ese proceso paso a paso, no hay nada que sistematizar todavía — primero se ordena, luego se automatiza.',
  'Si esa decisión concreta necesita tu criterio o el de una persona de confianza, delegarla en un sistema resta valor en vez de sumarlo.',
  'Si el volumen de casos a la semana es muy bajo, hacerlo a mano sigue siendo más barato que montar cualquier sistema.',
];

export default function Landing() {
  const navigate = useNavigate();
  const irADiagnostico = () => navigate('/diagnostico', { state: { empezar: true } });

  const [mostrarSticky, setMostrarSticky] = useState(false);
  const centinela = useRef<HTMLDivElement>(null);

  // La barra sticky aparece en cuanto el CTA del hero deja de estar a la
  // vista, no desde el primer píxel de scroll: así no compite con él.
  useEffect(() => {
    const nodo = centinela.current;
    if (!nodo) return;
    const observador = new IntersectionObserver(([entrada]) =>
      setMostrarSticky(!entrada.isIntersecting)
    );
    observador.observe(nodo);
    return () => observador.disconnect();
  }, []);

  return (
    <>
      <BarraSticky visible={mostrarSticky} onEmpezar={irADiagnostico} />

      <div className="contenedor">
        {/* Hero */}
        <section className="aparece flex min-h-dvh flex-col justify-center py-10">
          <div className="mb-8">
            <BadgeContador />
          </div>

          <h1 className="mb-6 text-[32px] sm:text-[46px]">
            Dónde aplicar la IA en una empresa de menos de 10 personas
          </h1>

          <p className="mb-10 text-texto-suave">
            Las 8 zonas donde se te va el tiempo cada semana. Y cuánto podrías recuperar.
          </p>

          <BotonPrincipal onClick={irADiagnostico}>Ver mis 3 zonas prioritarias</BotonPrincipal>

          <div ref={centinela} aria-hidden="true" />
        </section>

        {/* Las 8 zonas — contenido importado de @/data/zonas, no duplicado */}
        <section className="py-16">
          <div className="grid gap-4 sm:grid-cols-2">
            {ZONAS.map((zona) => {
              // queCuesta de dos zonas lleva un {h} que solo tiene sentido
              // con las horas reales de un diagnóstico ya hecho. Sin datos
              // del usuario no hay número que poner ahí (§1: no inventar
              // cifras), así que esas dos tarjetas se muestran sin esa
              // frase en vez de con un hueco o un número inventado.
              const tieneMarcadorDeHoras = zona.queCuesta.includes('{h}');
              return (
                <article
                  key={zona.id}
                  className="rounded-xl border border-borde bg-fondo-elevado p-6"
                >
                  <h2 className="mb-3 text-[17px] leading-snug">{zona.nombre}</h2>
                  {!tieneMarcadorDeHoras && (
                    <p className="mb-4 text-[14px] leading-relaxed text-texto-suave">
                      {zona.queCuesta}
                    </p>
                  )}
                  <ul className="space-y-2.5">
                    {zona.acciones.map((accion) => (
                      <li key={accion} className="flex gap-2.5 text-[14px] leading-relaxed">
                        <Check
                          aria-hidden="true"
                          className="mt-0.5 size-3.5 shrink-0 text-acento"
                          strokeWidth={2.5}
                        />
                        <span>{accion}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </section>

        {/* Dónde no aplicar esto todavía */}
        <section className="py-8">
          <h2 className="mb-6 text-[22px] sm:text-[26px]">Dónde no compensa aplicar esto todavía</h2>
          <div className="rounded-xl border border-borde bg-fondo-elevado p-6">
            <ul className="space-y-4">
              {CASOS_DONDE_NO_APLICAR.map((caso) => (
                <li key={caso} className="flex gap-3 text-[15px] leading-relaxed text-texto-suave">
                  <Minus aria-hidden="true" className="mt-1 size-3.5 shrink-0" strokeWidth={2.5} />
                  <span>{caso}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* CTA final */}
        <section className="py-16">
          <h2 className="mb-4 text-[26px] sm:text-[32px]">
            Esto es el mapa. El diagnóstico te dice dónde estás tú.
          </h2>
          <p className="mb-8 text-texto-suave">
            8 preguntas, 2 minutos. Sales sabiendo tus 3 zonas prioritarias y cuántas horas al mes
            podrías recuperar.
          </p>
          <BotonPrincipal onClick={irADiagnostico}>Empezar mi diagnóstico</BotonPrincipal>
        </section>
      </div>
    </>
  );
}
