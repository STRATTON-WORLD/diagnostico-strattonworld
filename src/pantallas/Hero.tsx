import BotonPrincipal from '@/componentes/BotonPrincipal';
import { useDiagnostico } from '@/lib/estado';

/**
 * §8.0 — Hero de /diagnostico (v2, storytelling corto).
 *
 * El badge del contador ya no vive aquí: vive en el hero de la landing de
 * la raíz, que es lo primero que ve el visitante. Mostrarlo también aquí
 * repetiría la misma señal de confianza dos veces en el mismo recorrido.
 *
 * El copy también se acorta aquí: la landing (ahora en Lovable, fuera de
 * este proyecto) ya presenta STRATTONWORLD y las 8 zonas antes de que el
 * visitante llegue a esta pantalla — este hero deja de tener que venderlo.
 */
export default function Hero() {
  const { navegar } = useDiagnostico();

  return (
    <section className="aparece flex min-h-dvh flex-col justify-center py-10">
      <h1 className="mb-6 text-[32px] sm:text-[46px]">Vamos a verlo.</h1>

      <p className="mb-10 text-texto-suave">
        8 preguntas, 2 minutos. Al final sabrás tus 3 zonas prioritarias y cuántas horas al mes
        podrías recuperar.
      </p>

      <BotonPrincipal onClick={() => navegar({ tipo: 'empezar' })}>Empezar</BotonPrincipal>

      <p className="mt-4 text-center text-[14px] text-texto-suave">
        Sin registro para empezar. Ves tu resultado nada más terminar.
      </p>
    </section>
  );
}
