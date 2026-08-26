import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface Props {
  children: ReactNode;
  /** §4.2: badges y etiquetas van en mayúsculas. */
  mayusculas?: boolean;
  className?: string;
}

/**
 * §4.3 — Píldora: fondo oscuro, borde de 1px y punto azul de 6px a la izquierda.
 * El punto es uno de los pocos sitios donde el azul aparece (§4.1).
 */
export default function Badge({ children, mayusculas = true, className }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-borde bg-fondo-elevado px-3.5 py-2 text-texto-suave',
        mayusculas ? 'etiqueta' : 'text-[13px] leading-snug',
        className
      )}
    >
      <span
        aria-hidden="true"
        className="size-1.5 shrink-0 rounded-full bg-acento"
      />
      {children}
    </span>
  );
}
