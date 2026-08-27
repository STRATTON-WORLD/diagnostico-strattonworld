import { useEffect, useState } from 'react';
import { contarDiagnosticos } from '@/lib/supabase';

/**
 * Contador real de diagnósticos hechos, con su umbral de aparición.
 *
 * El badge solo aparece con un número real y a partir de 25: un contador que
 * dice «3» resta credibilidad, y ninguno no resta nada.
 *
 * Vive aquí, y no dentro de un componente de pantalla, porque el badge
 * aparece en dos sitios — el hero de la landing (raíz) y, antes de esta
 * fase, el hero interno de /diagnostico — y no puede haber dos peticiones
 * ni dos umbrales que puedan divergir.
 */
const MINIMO_PARA_MOSTRAR = 25;

// Discriminada a propósito: cuando mostrarBadge es true, TypeScript sabe que
// diagnosticos ya no puede ser null, sin necesidad de una comprobación extra
// en cada sitio que consume el hook.
type ResultadoContador =
  | { mostrarBadge: false }
  | { mostrarBadge: true; diagnosticos: number };

export function useContadorDiagnosticos(): ResultadoContador {
  const [diagnosticos, setDiagnosticos] = useState<number | null>(null);

  useEffect(() => {
    let vigente = true;
    void contarDiagnosticos().then((n) => {
      if (vigente) setDiagnosticos(n);
    });
    return () => {
      vigente = false;
    };
  }, []);

  if (diagnosticos === null || diagnosticos < MINIMO_PARA_MOSTRAR) {
    return { mostrarBadge: false };
  }
  return { mostrarBadge: true, diagnosticos };
}
