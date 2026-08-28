/**
 * Fuente de verdad del contenido de las 8 zonas (§5).
 *
 * Vive aqui, y no en src/, porque la Edge Function del envio del informe
 * (§10) necesita el mismo copy que la interfaz y corre en Deno: un modulo
 * sin imports ni alias es lo unico que ambos runtimes leen igual.
 * src/data/zonas.ts y src/lib/tipos.ts reexportan desde aqui.
 */

export type Esfuerzo = 'bajo' | 'medio' | 'alto';

/**
 * Tipo de zona (v2).
 *
 * 'horas': el usuario declara cuántas horas semanales le lleva; esa cifra
 * entra en horasMes y en el nivel de impacto.
 * 'riesgo': no se le pregunta por horas — «cuántas horas» no tiene una
 * respuesta honesta para un riesgo de continuidad o un punto ciego. Si
 * contesta «Sí», el nivel de impacto es alto, fijo, decidido por
 * STRATTONWORLD y no por el usuario (ver PESO_IMPACTO_RIESGO en calculo.ts).
 */
export type TipoZona = 'horas' | 'riesgo';

/** Un dato externo citable: nunca se muestra sin fuente comprobable. */
export interface DatoCitado {
  texto: string;
  fuente: string;
  url: string;
}

export interface Zona {
  id: number; // 1-8, define tambien el orden y el desempate final
  nombre: string;
  afirmacion: string;
  esfuerzo: Esfuerzo;
  tipo: TipoZona;
  /**
   * Solo para tipo 'horas'. Texto de la pregunta de horas semanales que se
   * muestra tras «Sí»; si no se especifica, se usa el genérico. Zona 2 la
   * personaliza porque «cuántas horas te lleva» no encajaba con su
   * afirmación nueva (es sobre seguimiento, no sobre una tarea puntual).
   */
  preguntaHoras?: string;
  /**
   * Pregunta 1-8: se muestra al responder «Sí», antes de pedir las horas
   * semanales (o antes de avanzar, en zonas tipo riesgo). Opcional a
   * propósito — no se inventa para las zonas que todavía no lo tienen; en
   * esas, la pregunta se comporta como antes.
   */
  solucion?: string;
  /** Acompaña a `solucion`. Solo con fuente verificada, nunca de relleno. */
  dato?: DatoCitado;
  queCuesta: string; // pantalla 11: consecuencia
  acciones: string[]; // pantalla 11: 2-3 acciones realistas
}

/**
 * §5 (v2) — La frase que explica por qué una zona sale priorizada se
 * compone según su POSICIÓN en el ranking (1ª, 2ª o 3ª) Y según su TIPO
 * (horas/riesgo) — no según su esfuerzo.
 *
 * Componerla desde el esfuerzo era un fallo de lógica: una zona de esfuerzo
 * bajo puede quedar tercera, y decirle al usuario que «sale primero» algo
 * que es su tercera prioridad rompe la confianza justo en la pantalla que
 * más la necesita. El tipo se suma en v2 porque una zona de riesgo nunca
 * tuvo horas que declarar, así que la frase no puede hablar de «el tiempo
 * que pierdes» como si las hubiera. Por eso no vive en Zona: es una función
 * de la posición y el tipo, y la usan tanto la pantalla 11 como el email
 * (§10) — este último a partir de lo guardado en Supabase, de ahí que
 * `tipo` viaje también en `zonas_prioritarias` (ver tipos.ts).
 */
const POR_QUE_POSICION: Record<TipoZona, Record<1 | 2 | 3, string>> = {
  horas: {
    1: 'Sale primero porque es donde más tiempo pierdes y donde antes se nota la mejora.',
    2: 'Sale arriba porque el tiempo que pierdes compensa el trabajo de ordenar antes el proceso.',
    3: 'Es la más laboriosa de las tres, pero las horas que declaras la colocan aquí de todas formas.',
  },
  riesgo: {
    1: 'Sale entre tus prioridades porque es fácil de resolver y el riesgo que evita compensa de sobra el esfuerzo.',
    2: 'Sale arriba porque, aunque aquí no se cuenta en horas, es un riesgo que puede parar el negocio en cualquier momento.',
    3: 'Es la más laboriosa de las tres, pero el riesgo que representa la coloca aquí de todas formas.',
  },
};

export function porQuePosicion(posicion: 1 | 2 | 3, tipo: TipoZona): string {
  return POR_QUE_POSICION[tipo][posicion];
}

/**
 * Pantalla 11 y email (§10) — titular según cuántas zonas prioritarias hay
 * de verdad. Máximo 3 por diseño (§6.3), pero puede haber 1 o 2 si el
 * usuario marcó menos preguntas con «Sí». En singular no lleva número:
 * «Tus 1 zonas» no concuerda.
 */
export function tituloPrioritarias(cantidad: number): string {
  if (cantidad === 1) return 'Tu zona prioritaria';
  return `Tus ${cantidad} zonas prioritarias`;
}

const DEFINICIONES: Zona[] = [
  {
    id: 1,
    nombre: 'Entrada de clientes y primera respuesta',
    afirmacion:
      'Si un cliente nos escribe un sábado por la tarde, no recibe respuesta hasta el lunes.',
    esfuerzo: 'bajo',
    tipo: 'riesgo',
    solucion:
      'La solución es implantar un sistema personalizado para la gestión de la primera respuesta.',
    dato: {
      texto:
        'Los leads contactados en menos de 5 minutos tienen 100 veces más probabilidades de convertirse en clientes que los contactados después de 30, y casi 8 de cada 10 compran con la primera empresa que les responde.',
      fuente: 'HubSpot y Vendasta',
      url: 'https://www.patagon.ai/es/blog-posts/el-verdadero-costo-de-responder-lento-como-cada-minuto-impacta-tus-ventas',
    },
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
    afirmacion: 'La mayoría de presupuestos no tienen seguimiento tras mandarlos.',
    esfuerzo: 'medio',
    tipo: 'horas',
    preguntaHoras: '¿Cuánto tiempo dedicáis a la semana a intentar hacer ese seguimiento?',
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
    tipo: 'horas',
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
    tipo: 'horas',
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
    tipo: 'horas',
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
    tipo: 'riesgo',
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
    tipo: 'horas',
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
    tipo: 'riesgo',
    queCuesta:
      'Sin saber cuántas oportunidades entran y cuántas se caen, cualquier decisión sobre precios, personal o publicidad se toma a ciegas.',
    acciones: [
      'Registrar toda oportunidad entrante en un único sitio, con su estado',
      'Una cifra semanal: cuántas entraron, cuántas se ganaron, cuántas se perdieron y por qué',
      'Quince minutos de revisión al cerrar la semana',
    ],
  },
];

export const ZONAS: Zona[] = DEFINICIONES;

export function zonaPorId(id: number): Zona {
  const zona = ZONAS.find((z) => z.id === id);
  if (!zona) throw new Error(`Zona inexistente: ${id}`);
  return zona;
}
