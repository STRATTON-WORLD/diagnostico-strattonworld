import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * §8.9 — Tres cifras en secuencia, 400ms entre ellas, cada una contando
 * desde cero en 600ms. En mono y de tamaño decreciente.
 * §4.5 — Con prefers-reduced-motion se muestran las cifras finales
 * directamente, sin conteo ni secuencia.
 */

const SEPARACION = 400;
const CONTEO = 600;

interface Props {
  horasMes: number;
  horasAño: number;
  jornadas: number;
}

function prefiereMenosMovimiento(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function formatear(valor: number): string {
  return Math.round(valor).toLocaleString('es-ES');
}

interface CifraProps {
  valor: number;
  retardo: number;
  animar: boolean;
  antes: string;
  despues: string;
  className: string;
}

function Cifra({ valor, retardo, animar, antes, despues, className }: CifraProps) {
  const [visible, setVisible] = useState(!animar);
  const [n, setN] = useState(animar ? 0 : valor);

  useEffect(() => {
    if (!animar) return;

    let fotograma = 0;
    let inicio = 0;
    let cierre = 0;

    const espera = window.setTimeout(() => {
      setVisible(true);
      const paso = (ahora: number) => {
        if (!inicio) inicio = ahora;
        const avance = Math.min(1, (ahora - inicio) / CONTEO);
        setN(valor * avance);
        if (avance < 1) fotograma = requestAnimationFrame(paso);
      };
      fotograma = requestAnimationFrame(paso);

      // Red de seguridad: en una pestaña en segundo plano el navegador
      // detiene requestAnimationFrame y el contador se quedaría a medias.
      // La cifra correcta importa más que la animación.
      cierre = window.setTimeout(() => setN(valor), CONTEO);
    }, retardo);

    return () => {
      window.clearTimeout(espera);
      window.clearTimeout(cierre);
      cancelAnimationFrame(fotograma);
    };
  }, [animar, valor, retardo]);

  // Aunque esté oculta ocupa su sitio: así la pantalla no da saltos
  // mientras entran las tres líneas, y un lector de pantalla no lee
  // cifras a medio contar.
  return (
    <p
      className={cn('dato leading-tight', className, visible && 'aparece')}
      style={{ visibility: visible ? 'visible' : 'hidden' }}
    >
      {antes}
      {formatear(visible ? n : valor)}
      {despues}
    </p>
  );
}

export default function Cascada({ horasMes, horasAño, jornadas }: Props) {
  const animar = !prefiereMenosMovimiento();

  return (
    <div className="space-y-2">
      <Cifra
        valor={horasMes}
        retardo={0}
        animar={animar}
        antes=""
        despues=" horas al mes"
        className="text-[40px] font-normal sm:text-[52px]"
      />
      <Cifra
        valor={horasAño}
        retardo={SEPARACION}
        animar={animar}
        antes="son "
        despues=" horas al año"
        className="text-[26px] text-texto-suave sm:text-[34px]"
      />
      <Cifra
        valor={jornadas}
        retardo={SEPARACION * 2}
        animar={animar}
        antes="son "
        despues=" jornadas de trabajo"
        className="text-[20px] text-texto-suave sm:text-[24px]"
      />
    </div>
  );
}
