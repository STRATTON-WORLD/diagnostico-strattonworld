import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface Props {
  children: ReactNode;
  seleccionada: boolean;
  onSeleccionar: () => void;
  /** «tarjeta» para Sí/No (§8.1-8.8), «pildora» para los rangos de horas. */
  forma?: 'tarjeta' | 'pildora';
  className?: string;
}

/**
 * Opción de un radiogroup (§12). Al estar seleccionada toma borde y fondo
 * azul tenue, que es uno de los usos funcionales permitidos del acento (§4.1).
 * Altura mínima de 64px en tarjeta y 48px en píldora: por encima de los 44px
 * de área táctil que exige §12.
 */
export default function TarjetaOpcion({
  children,
  seleccionada,
  onSeleccionar,
  forma = 'tarjeta',
  className,
}: Props) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={seleccionada}
      onClick={onSeleccionar}
      className={cn(
        'flex w-full items-center justify-center border text-center transition-colors duration-200 ease-out',
        forma === 'tarjeta'
          ? 'min-h-16 rounded-xl px-5 py-4 text-[17px] font-bold'
          : 'min-h-12 rounded-full px-5 py-3 text-[15px] font-bold',
        seleccionada
          ? 'border-acento bg-acento-tenue text-texto'
          : 'border-borde bg-fondo-elevado text-texto hover:border-white/20',
        className
      )}
    >
      {children}
    </button>
  );
}
