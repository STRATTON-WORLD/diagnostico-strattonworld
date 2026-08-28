import Badge from '@/componentes/Badge';
import { useContadorDiagnosticos } from '@/lib/useContadorDiagnosticos';

/**
 * §8.0 — Badge del contador real, con su copy exacto.
 * No se renderiza nada si la llamada falla o si aún no hay 25 diagnósticos.
 */
export default function BadgeContador() {
  const resultado = useContadorDiagnosticos();

  if (!resultado.mostrarBadge) return null;
  const { diagnosticos } = resultado;

  return (
    <Badge mayusculas={false} className="mb-8">
      <span>
        <span className="dato">{diagnosticos.toLocaleString('es-ES')}</span> dueños de pyme ya han
        hecho su diagnóstico
      </span>
    </Badge>
  );
}
