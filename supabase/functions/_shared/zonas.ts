/**
 * Fuente de verdad del contenido de las 8 zonas (§5).
 *
 * Vive aqui, y no en src/, porque la Edge Function del envio del informe
 * (§10) necesita el mismo copy que la interfaz y corre en Deno: un modulo
 * sin imports ni alias es lo unico que ambos runtimes leen igual.
 * src/data/zonas.ts y src/lib/tipos.ts reexportan desde aqui.
 */

export type Esfuerzo = 'bajo' | 'medio' | 'alto';

export interface Zona {
  id: number; // 1-8, define tambien el orden y el desempate final
  nombre: string;
  afirmacion: string;
  esfuerzo: Esfuerzo;
  porQue: string; // pantalla 11: por que sale priorizada
  queCuesta: string; // pantalla 11: consecuencia
  acciones: string[]; // pantalla 11: 2-3 acciones realistas
}

/**
 * §5 — La frase `porQue` se compone según el esfuerzo de la zona.
 * No se escribe zona por zona: se deriva, para que no puedan divergir.
 */
const POR_QUE: Record<Esfuerzo, string> = {
  bajo: 'Sale primero porque es donde más tiempo pierdes y donde antes se nota la mejora.',
  medio:
    'Sale arriba porque el tiempo que pierdes compensa el trabajo de ordenar antes el proceso.',
  alto: 'Es la más laboriosa de las tres, pero las horas que declaras la colocan aquí de todas formas.',
};

type ZonaSinPorQue = Omit<Zona, 'porQue'>;

const DEFINICIONES: ZonaSinPorQue[] = [
  {
    id: 1,
    nombre: 'Entrada de clientes y primera respuesta',
    afirmacion:
      'Si un cliente nos escribe un sábado por la tarde, no recibe respuesta hasta el lunes.',
    esfuerzo: 'bajo',
    queCuesta:
      'Un cliente que escribe fuera de horario y no recibe señal en 48 horas rara vez espera: escribe al siguiente. No aparece como una pérdida en ningún sitio, y por eso cuesta verlo.',
    acciones: [
      'Confirmar cada mensaje entrante al momento, con el plazo real de respuesta',
      'Recoger en ese primer contacto lo mínimo para retomar la conversación: qué necesita y cómo localizarle',
      'Reunir todos los canales en una sola bandeja, para que nada dependa de quién mire el móvil',
    ],
  },
  {
    id: 2,
    nombre: 'Seguimiento comercial y presupuestos',
    afirmacion: 'Se nos han quedado presupuestos sin seguimiento más de una vez.',
    esfuerzo: 'medio',
    queCuesta:
      'Un presupuesto sin seguimiento no se pierde por precio, se pierde por silencio. Son {h} horas al mes gestionándolo a mano y, aun así, alguno se cae.',
    acciones: [
      'Una única lista de presupuestos abiertos, con fecha de envío y fecha del próximo contacto',
      'Aviso automático al responsable cuando uno lleva demasiados días parado',
      'Dos o tres mensajes de seguimiento ya redactados, para no escribirlos de cero cada vez',
    ],
  },
  {
    id: 3,
    nombre: 'Citas, agenda y ausencias',
    afirmacion: 'Gestionar citas y avisar de cambios nos quita tiempo cada semana.',
    esfuerzo: 'bajo',
    queCuesta:
      'El tiempo de coordinar, confirmar y recolocar huecos no factura. Y una ausencia sin avisar deja un hueco que casi nunca se rellena.',
    acciones: [
      'Reserva online contra la disponibilidad real, sin llamada de por medio',
      'Recordatorio automático el día antes, con opción de cambiar la cita',
      'Aviso inmediato al equipo cuando se libera un hueco',
    ],
  },
  {
    id: 4,
    nombre: 'Atención al cliente y preguntas repetitivas',
    afirmacion: 'Respondemos las mismas preguntas una y otra vez a distintos clientes.',
    esfuerzo: 'bajo',
    queCuesta:
      '{h} horas al mes contestando lo mismo. El coste no es solo ese tiempo: es la atención que se resta a los clientes que sí necesitan a una persona.',
    acciones: [
      'Identificar las diez preguntas que más se repiten y dejarlas resueltas antes de que se hagan',
      'Respuestas preparadas para enviar en un toque, con el nombre y el dato que cambian',
      'Que lo repetitivo se conteste solo y pase a una persona en cuanto la consulta se sale del guion',
    ],
  },
  {
    id: 5,
    nombre: 'Administración y documentos',
    afirmacion: 'Preparamos documentos, facturas o informes a mano de forma repetitiva.',
    esfuerzo: 'medio',
    queCuesta:
      'Rehacer a mano un documento que ya existe es trabajo que no añade nada. También es donde aparecen los errores que luego hay que corregir.',
    acciones: [
      'Plantillas que se completan con los datos ya registrados del cliente',
      'Generar presupuesto, albarán o factura desde el mismo sitio donde vive la ficha del cliente',
      'Envío y archivado sin pasos manuales por medio',
    ],
  },
  {
    id: 6,
    nombre: 'Conocimiento interno y dependencia de personas',
    afirmacion: 'Si una persona concreta falta un día, hay cosas que nadie más sabe hacer.',
    esfuerzo: 'alto',
    queCuesta:
      'Cuando el proceso vive en la cabeza de alguien, la empresa se para cada vez que esa persona no está. Es la zona que más limita crecer y también la que más ata al dueño.',
    acciones: [
      'Escribir los cinco procesos críticos donde cualquiera pueda consultarlos',
      'Que la información del cliente esté en el sistema, no en el móvil de una persona',
      'Una persona de respaldo asignada por proceso',
    ],
  },
  {
    id: 7,
    nombre: 'Marketing y contenido',
    afirmacion: 'Nos cuesta mantener publicaciones o comunicación constante con clientes.',
    esfuerzo: 'medio',
    queCuesta:
      'La comunicación irregular no se nota de golpe: se nota en que cada mes entran menos consultas de gente que ya te conocía.',
    acciones: [
      'Un ritmo mínimo sostenible: una pieza a la semana, siempre la misma',
      'Un banco de contenido reutilizable, en vez de empezar en blanco cada vez',
      'Preparar y programar el mes entero en una sola sesión',
    ],
  },
  {
    id: 8,
    nombre: 'Datos, informes y control',
    afirmacion: 'No sabría decir con seguridad cuántas oportunidades hemos perdido este mes.',
    esfuerzo: 'alto',
    queCuesta:
      'Sin saber cuántas oportunidades entran y cuántas se caen, cualquier decisión sobre precios, personal o publicidad se toma a ciegas.',
    acciones: [
      'Registrar toda oportunidad entrante en un único sitio, con su estado',
      'Una cifra semanal: cuántas entraron, cuántas se ganaron, cuántas se perdieron y por qué',
      'Quince minutos de revisión al cerrar la semana',
    ],
  },
];

export const ZONAS: Zona[] = DEFINICIONES.map((z) => ({ ...z, porQue: POR_QUE[z.esfuerzo] }));

export function zonaPorId(id: number): Zona {
  const zona = ZONAS.find((z) => z.id === id);
  if (!zona) throw new Error(`Zona inexistente: ${id}`);
  return zona;
}
