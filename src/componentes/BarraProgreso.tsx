interface Props {
  /** Pregunta actual, de 1 a 8. */
  actual: number;
  total: number;
}

/**
 * §8.1-8.8 — Barra de progreso azul.
 * §12 — Lleva aria-valuenow para lectores de pantalla.
 */
export default function BarraProgreso({ actual, total }: Props) {
  const porcentaje = Math.min(100, Math.max(0, (actual / total) * 100));

  return (
    <div
      role="progressbar"
      aria-valuenow={actual}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-label={`Pregunta ${actual} de ${total}`}
      className="h-1 w-full overflow-hidden rounded-full bg-white/10"
    >
      <div
        className="h-full rounded-full bg-acento transition-[width] duration-300 ease-out"
        style={{ width: `${porcentaje}%` }}
      />
    </div>
  );
}
