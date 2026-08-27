import BotonPrincipal from '@/componentes/BotonPrincipal';
import { useDiagnostico } from '@/lib/estado';

/**
 * §8.0 — Hero de /diagnostico.
 *
 * El badge del contador ya no vive aquí: vive en el hero de la landing de
 * la raíz, que es lo primero que ve el visitante. Mostrarlo también aquí
 * repetiría la misma señal de confianza dos veces en el mismo recorrido.
 */
export default function Hero() {
  const { navegar } = useDiagnostico();

  return (
    <section className="aparece flex min-h-dvh flex-col justify-center py-10">
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
