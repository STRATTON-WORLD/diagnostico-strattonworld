import BotonPrincipal from '@/componentes/BotonPrincipal';
import { cn } from '@/lib/utils';

interface Props {
  visible: boolean;
  onEmpezar: () => void;
}

/**
 * CTA fijo en la cabecera de la landing mientras se hace scroll.
 *
 * Discreto: no aparece nada más cargar la página — compitiría con el CTA
 * del propio hero, justo debajo. Aparece solo cuando el hero ya ha
 * quedado atrás (ver el IntersectionObserver en Landing.tsx).
 */
export default function BarraSticky({ visible, onEmpezar }: Props) {
  return (
    <div
      aria-hidden={!visible}
      className={cn(
        'fixed inset-x-0 top-0 z-20 border-b border-borde bg-fondo',
        'transition-transform duration-300 ease-out',
        visible ? 'translate-y-0' : 'pointer-events-none -translate-y-full'
      )}
    >
      <div className="contenedor flex items-center justify-between gap-4 py-3">
        <span className="etiqueta text-texto-suave">STRATTONWORLD</span>
        <BotonPrincipal
          onClick={onEmpezar}
          tabIndex={visible ? 0 : -1}
          className="w-auto shrink-0 px-5 py-2.5 text-[14px] shadow-none"
        >
          Empezar mi diagnóstico
        </BotonPrincipal>
      </div>
    </div>
  );
}
