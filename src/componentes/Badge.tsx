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
        // §4.2 admite 12-13px. El badge del hero lleva una frase entera, no
        // una etiqueta: en mayusculas necesita 423px y a 375px solo hay 335,
        // asi que se parte en dos lineas y una pildora rounded-full de dos
        // lineas deja de ser una pildora. En caja baja a 12px entra justa.
        mayusculas ? 'etiqueta' : 'text-[12px] leading-snug',
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
