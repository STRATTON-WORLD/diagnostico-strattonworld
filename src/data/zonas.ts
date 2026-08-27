/**
 * §5 — Las 8 zonas.
 *
 * El contenido vive en supabase/functions/_shared/zonas.ts porque la Edge
 * Function del informe (§10) tiene que componer el email con exactamente el
 * mismo copy. Aquí solo se reexporta, para que el resto de la interfaz siga
 * importando de '@/data/zonas' como dice §3.
 */
export {
  ZONAS,
  zonaPorId,
  porQuePosicion,
  type Esfuerzo,
  type Zona,
  type DatoCitado,
} from '../../supabase/functions/_shared/zonas.ts';
