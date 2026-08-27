import { useEffect, useState } from 'react';
import Badge from '@/componentes/Badge';
import BotonPrincipal from '@/componentes/BotonPrincipal';
import { useDiagnostico } from '@/lib/estado';
import { contarDiagnosticos } from '@/lib/supabase';

/**
 * §8.0 — Hero.
 * El badge solo aparece con un numero real y a partir de 25: un contador que
 * dice «3» resta credibilidad, y ninguno no resta nada.
 */
const MINIMO_PARA_MOSTRAR = 25;

export default function Hero() {
  const { navegar } = useDiagnostico();
  const [diagnosticos, setDiagnosticos] = useState<number | null>(null);

  useEffect(() => {
    let vigente = true;
    void contarDiagnosticos().then((n) => {
      if (vigente) setDiagnosticos(n);
    });
    return () => {
      vigente = false;
    };
  }, []);

  const mostrarBadge = diagnosticos !== null && diagnosticos >= MINIMO_PARA_MOSTRAR;

  return (
    <section className="aparece flex min-h-dvh flex-col justify-center py-10">
      {mostrarBadge && (
        <div className="mb-8">
          <Badge mayusculas={false}>
            <span>
              <span className="dato">{diagnosticos.toLocaleString('es-ES')}</span> dueños de pyme ya
              han hecho su diagnóstico
            </span>
          </Badge>
        </div>
      )}

      <h1 className="mb-6 text-[32px] sm:text-[46px]">
        Averigua en <span className="text-acento">2 minutos</span> dónde le está robando tiempo tu
        empresa cada semana
      </h1>

      <p className="mb-10 text-texto-suave">
        8 preguntas rápidas. Al final sabrás tus 3 zonas prioritarias y cuántas horas al mes podrías
        recuperar.
      </p>

      <BotonPrincipal onClick={() => navegar({ tipo: 'empezar' })}>
        Empezar mi diagnóstico
      </BotonPrincipal>

      <p className="mt-4 text-center text-[14px] text-texto-suave">
        Sin registro para empezar. Ves tu resultado nada más terminar.
      </p>
    </section>
  );
}
