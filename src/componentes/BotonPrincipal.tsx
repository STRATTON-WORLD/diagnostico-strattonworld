import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

/**
 * §4.3 — CTA principal: rounded-full, fondo blanco sólido, texto negro bold,
 * padding vertical mínimo de 16px, sombra sutil y scale(1.02) al hover.
 * Sin azul: el azul es funcional, no decorativo (§4.1).
 */
export default function BotonPrincipal({ children, className, ...props }: Props) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        'w-full rounded-full bg-white px-6 py-4 text-[17px] font-bold text-black',
        'shadow-[0_2px_16px_rgba(0,0,0,0.4)] transition-transform duration-200 ease-out',
        'hover:scale-[1.02] active:scale-100',
        'disabled:cursor-not-allowed disabled:bg-white/40 disabled:hover:scale-100',
        className
      )}
    >
      {children}
    </button>
  );
}
