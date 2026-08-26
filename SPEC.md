# SPEC — Herramienta de diagnóstico STRATTONWORLD
### Documento de construcción para Claude Code · v1.1

---

## CÓMO USAR ESTE DOCUMENTO

1. Crea la carpeta del proyecto y guarda este archivo dentro como `SPEC.md`.
2. Abre Claude Code en esa carpeta.
3. Primer mensaje: **«Lee `SPEC.md` completo. No escribas código todavía. Devuélveme el plan de la Fase 0 y espera mi confirmación.»**
4. A partir de ahí, avanzas fase por fase. El documento manda: si algo de lo que Claude Code propone contradice esta spec, gana la spec.

Este archivo es la fuente de verdad del producto. Si cambia una decisión, se cambia aquí primero y se le dice a Claude Code que vuelva a leerlo.

---

## 0. CONTEXTO Y MISIÓN

Estás construyendo el activo de captación principal de **STRATTONWORLD**, una consultoría española de tecnología y automatización para pymes. El producto es una herramienta web de diagnóstico: 8 preguntas, dos minutos, y el dueño de una pyme descubre cuántas horas al mes se le van en trabajo que no debería necesitarle y en qué tres zonas conviene empezar.

**Idea madre de la marca:** *Haz que tu empresa necesite menos de tu tiempo.*

**Quién lo va a usar:** autónomo o gerente de una empresa de 1 a 15 empleados, 42-55 años, conocimiento tecnológico bajo-medio. Llega desde un anuncio de LinkedIn, casi siempre desde el móvil, con poca paciencia y bastante escepticismo hacia todo lo que suene a promesa fácil.

**El criterio que decide cualquier duda de diseño o de copy:** entre lo que más llama la atención y lo que más credibilidad transmite, siempre lo segundo. La marca vende criterio, no entusiasmo. Si una decisión te obliga a elegir entre impactar y parecer fiable, elige parecer fiable.

---

## 1. REGLAS DE TRABAJO

Aplican a toda la sesión de construcción.

- **No inventes contenido.** Todo el copy visible está en esta spec. Si falta un texto, párate y pregunta. No rellenes huecos con redacción propia ni con placeholders tipo *lorem ipsum* en pantallas reales.
- **No inventes datos.** Ninguna cifra, porcentaje, testimonio o benchmark puede aparecer en la interfaz si no sale de la base de datos o del propio cálculo del usuario.
- **Una fase, un commit.** Mensajes de commit descriptivos en español. No mezcles fases.
- **Verifica antes de dar algo por terminado.** Cada pantalla se comprueba a 375px de ancho antes de pasar a la siguiente. Si tienes acceso a navegador, haz captura y míralas; si no, revisa el markup buscando desbordamientos, textos truncados y áreas táctiles menores de 44px.
- **Tests donde importan.** El motor de cálculo (§6) lleva tests unitarios obligatorios. El resto no necesita cobertura.
- **Nada de secretos en el repo.** `.env` en `.gitignore` desde el primer commit. La clave `service_role` de Supabase vive solo en las variables de entorno de la Edge Function, jamás en el frontend.
- **Dependencias mínimas.** Antes de instalar cualquier librería que no esté en §2, pregunta y justifica.
- **Si algo de esta spec no es viable o es mala idea, dilo.** No lo fuerces en silencio ni lo resuelvas por tu cuenta con una alternativa peor.

---

## 2. STACK — DECISIONES CERRADAS

| Pieza | Decisión |
|---|---|
| Build | Vite + React 18 + TypeScript |
| Estilos | Tailwind CSS |
| Componentes | shadcn/ui, solo los que se usen (`button`, `input`, `select`, `checkbox`, `label`, `progress`) |
| Estado | `useReducer` local + Context. Sin Redux, sin Zustand |
| Routing | Ninguno. Es una sola página con máquina de estados por pantalla |
| Backend | Supabase (Postgres + Edge Functions) |
| Email | Resend, disparado desde Edge Function |
| Animación | CSS y transiciones nativas. Sin Framer Motion salvo que la cascada de §8.9 lo justifique — si lo pides, justifícalo |
| Iconos | `lucide-react` |

**Por qué sin router:** el usuario nunca debe poder llegar a la pantalla 7 con un enlace ni perder el progreso al pulsar atrás. El estado vive en memoria y se persiste en `sessionStorage` (§8.13).

---

## 3. ESTRUCTURA DE ARCHIVOS

```
src/
  main.tsx
  App.tsx                    # máquina de estados + orquestación de pantallas
  index.css                  # tokens, textura de fondo, base
  data/
    zonas.ts                 # las 8 zonas: pregunta, esfuerzo, contenido de resultado
    rangos.ts                # rangos de horas y sus valores medios
  lib/
    calculo.ts               # motor: horas, priorización, desempate
    calculo.test.ts          # tests obligatorios
    scoring.ts               # score_interno comercial
    supabase.ts              # cliente
    tipos.ts                 # tipos compartidos
  componentes/
    Fondo.tsx                # textura de ruido
    Badge.tsx
    BotonPrincipal.tsx
    TarjetaOpcion.tsx
    BarraProgreso.tsx
    Cascada.tsx              # componente de conteo mes → año → jornadas
  pantallas/
    Hero.tsx                 # 0
    Pregunta.tsx             # 1-8 (una sola, parametrizada)
    ResultadoParcial.tsx     # 9
    Captura.tsx              # 10
    ResultadoCompleto.tsx    # 11
supabase/
  migrations/001_leads.sql
  functions/enviar-informe/index.ts
```

---

## 4. SISTEMA VISUAL

Esta sección es literal. No la interpretes ni la mejores.

### 4.1 Color

```
--fondo:         #0A0A0A
--fondo-elevado: #141416   /* tarjetas */
--borde:         rgba(255,255,255,0.08)
--texto:         #FFFFFF
--texto-suave:   #A1A1AA
--acento:        #2563EB   /* blue-600 */
--acento-tenue:  rgba(37,99,235,0.12)
```

**El azul es funcional, nunca decorativo.** Solo aparece en: la palabra destacada de un titular, el punto del badge, el borde y fondo tenue de una respuesta seleccionada, la barra de progreso, los iconos de check y el punto que marca una zona prioritaria. En ningún otro sitio.

**Prohibido cualquier violeta, morado o magenta**, en cualquier elemento, incluidos estados hover, sombras y gradientes. Prohibidos los gradientes de acento en general.

### 4.2 Tipografía

- **Familia:** Google Sans italic para todo el texto. Si no está disponible, Inter.
- **Cifras del diagnóstico:** Geist Mono (fallback IBM Plex Mono), con `font-variant-numeric: tabular-nums`. Todo número que sea un dato del usuario —horas, jornadas, contador del hero, «Pregunta 3 de 8»— va en la mono. Esto no es decoración: separa visualmente *lo que afirmamos* de *lo que hemos medido*, y es lo que hace que el resultado se lea como un dato y no como una promesa.
- **Titulares:** 700-800, `line-height` 1.05-1.15, `letter-spacing` -0.02em. 36-56px en desktop, 28-36px en móvil.
- **Cuerpo:** 400, 16-18px, `line-height` 1.6, color `--texto-suave`.
- **Badges y etiquetas:** 12-13px, mayúsculas, `letter-spacing` 0.08em.

Carga las fuentes por `@fontsource` o self-hosted con `font-display: swap`. No uses el `<link>` de Google Fonts: añade una petición bloqueante a un tercero y aquí la velocidad en móvil es parte del producto.

### 4.3 Formas y espacio

- Tarjetas: `rounded-xl`, fondo `--fondo-elevado`, borde 1px `--borde`.
- Badges: `rounded-full`, fondo oscuro, borde 1px `--borde`, punto azul de 6px a la izquierda.
- CTA principal: `rounded-full`, fondo blanco sólido, texto negro bold, padding vertical mínimo 16px, sombra sutil, `scale(1.02)` al hover.
- Separación vertical entre bloques: 64px en desktop, 40px en móvil. El aire forma parte del posicionamiento.
- Ancho máximo de contenido: 640px. Es un cuestionario, no una web corporativa.

### 4.4 Textura de fondo

Ruido fino generado por CSS (`feTurbulence` en SVG inline como `background-image`, o un `data:` URI de 128×128 repetido) al **3-5% de opacidad**, fijo, sin animar. Debe notarse solo si lo buscas.

### 4.5 Movimiento

Transiciones de 200-300ms, `ease-out`. Fade + desplazamiento vertical de 8px entre pantallas. Nada de rebotes, parpadeos ni entradas escalonadas de elementos. Respeta `prefers-reduced-motion`: con esa preferencia activa, todo aparece sin transición y la cascada de §8.9 muestra las cifras finales directamente.

### 4.6 Señales de confianza

- Cero signos de exclamación en toda la interfaz.
- Cero superlativos: nada de «el mejor», «único», «definitivo», «revolucionario».
- Cero emojis en la interfaz.
- Las palabras «gratis» y «gratuito» no aparecen en ningún sitio.
- No se nombra tecnología en el copy visible: ni IA, ni agentes, ni automatización, ni CRM. Se habla de tiempo, zonas, procesos y resultados.

---

## 5. DATOS — LAS 8 ZONAS

`src/data/zonas.ts`. Copia literal, incluida la puntuación.

```ts
export type Esfuerzo = 'bajo' | 'medio' | 'alto';

export interface Zona {
  id: number;                    // 1-8, define también el orden y el desempate final
  nombre: string;
  afirmacion: string;
  esfuerzo: Esfuerzo;
  porQue: string;                // pantalla 11: por qué sale priorizada
  queCuesta: string;             // pantalla 11: consecuencia
  acciones: string[];            // pantalla 11: 2-3 acciones realistas
}
```

| id | nombre | esfuerzo |
|---|---|---|
| 1 | Entrada de clientes y primera respuesta | bajo |
| 2 | Seguimiento comercial y presupuestos | medio |
| 3 | Citas, agenda y ausencias | bajo |
| 4 | Atención al cliente y preguntas repetitivas | bajo |
| 5 | Administración y documentos | medio |
| 6 | Conocimiento interno y dependencia de personas | alto |
| 7 | Marketing y contenido | medio |
| 8 | Datos, informes y control | alto |

**Afirmaciones (texto exacto de las pantallas 1-8):**

1. «Si un cliente nos escribe un sábado por la tarde, no recibe respuesta hasta el lunes.»
2. «Se nos han quedado presupuestos sin seguimiento más de una vez.»
3. «Gestionar citas y avisar de cambios nos quita tiempo cada semana.»
4. «Respondemos las mismas preguntas una y otra vez a distintos clientes.»
5. «Preparamos documentos, facturas o informes a mano de forma repetitiva.»
6. «Si una persona concreta falta un día, hay cosas que nadie más sabe hacer.»
7. «Nos cuesta mantener publicaciones o comunicación constante con clientes.»
8. «No sabría decir con seguridad cuántas oportunidades hemos perdido este mes.»

**Contenido de resultado, zona por zona.** `{h}` se sustituye por las horas mensuales calculadas de esa zona, redondeadas a entero.

**Zona 1 — Entrada de clientes y primera respuesta**
- *queCuesta:* «Un cliente que escribe fuera de horario y no recibe señal en 48 horas rara vez espera: escribe al siguiente. No aparece como una pérdida en ningún sitio, y por eso cuesta verlo.»
- *acciones:* Confirmar cada mensaje entrante al momento, con el plazo real de respuesta · Recoger en ese primer contacto lo mínimo para retomar la conversación: qué necesita y cómo localizarle · Reunir todos los canales en una sola bandeja, para que nada dependa de quién mire el móvil

**Zona 2 — Seguimiento comercial y presupuestos**
- *queCuesta:* «Un presupuesto sin seguimiento no se pierde por precio, se pierde por silencio. Son {h} horas al mes gestionándolo a mano y, aun así, alguno se cae.»
- *acciones:* Una única lista de presupuestos abiertos, con fecha de envío y fecha del próximo contacto · Aviso automático al responsable cuando uno lleva demasiados días parado · Dos o tres mensajes de seguimiento ya redactados, para no escribirlos de cero cada vez

**Zona 3 — Citas, agenda y ausencias**
- *queCuesta:* «El tiempo de coordinar, confirmar y recolocar huecos no factura. Y una ausencia sin avisar deja un hueco que casi nunca se rellena.»
- *acciones:* Reserva online contra la disponibilidad real, sin llamada de por medio · Recordatorio automático el día antes, con opción de cambiar la cita · Aviso inmediato al equipo cuando se libera un hueco

**Zona 4 — Atención al cliente y preguntas repetitivas**
- *queCuesta:* «{h} horas al mes contestando lo mismo. El coste no es solo ese tiempo: es la atención que se resta a los clientes que sí necesitan a una persona.»
- *acciones:* Identificar las diez preguntas que más se repiten y dejarlas resueltas antes de que se hagan · Respuestas preparadas para enviar en un toque, con el nombre y el dato que cambian · Que lo repetitivo se conteste solo y pase a una persona en cuanto la consulta se sale del guion

**Zona 5 — Administración y documentos**
- *queCuesta:* «Rehacer a mano un documento que ya existe es trabajo que no añade nada. También es donde aparecen los errores que luego hay que corregir.»
- *acciones:* Plantillas que se completan con los datos ya registrados del cliente · Generar presupuesto, albarán o factura desde el mismo sitio donde vive la ficha del cliente · Envío y archivado sin pasos manuales por medio

**Zona 6 — Conocimiento interno y dependencia de personas**
- *queCuesta:* «Cuando el proceso vive en la cabeza de alguien, la empresa se para cada vez que esa persona no está. Es la zona que más limita crecer y también la que más ata al dueño.»
- *acciones:* Escribir los cinco procesos críticos donde cualquiera pueda consultarlos · Que la información del cliente esté en el sistema, no en el móvil de una persona · Una persona de respaldo asignada por proceso

**Zona 7 — Marketing y contenido**
- *queCuesta:* «La comunicación irregular no se nota de golpe: se nota en que cada mes entran menos consultas de gente que ya te conocía.»
- *acciones:* Un ritmo mínimo sostenible: una pieza a la semana, siempre la misma · Un banco de contenido reutilizable, en vez de empezar en blanco cada vez · Preparar y programar el mes entero en una sola sesión

**Zona 8 — Datos, informes y control**
- *queCuesta:* «Sin saber cuántas oportunidades entran y cuántas se caen, cualquier decisión sobre precios, personal o publicidad se toma a ciegas.»
- *acciones:* Registrar toda oportunidad entrante en un único sitio, con su estado · Una cifra semanal: cuántas entraron, cuántas se ganaron, cuántas se perdieron y por qué · Quince minutos de revisión al cerrar la semana

**Frase `porQue`** — se compone según el esfuerzo de la zona:

- bajo → «Sale primero porque es donde más tiempo pierdes y donde antes se nota la mejora.»
- medio → «Sale arriba porque el tiempo que pierdes compensa el trabajo de ordenar antes el proceso.»
- alto → «Es la más laboriosa de las tres, pero las horas que declaras la colocan aquí de todas formas.»

---

## 6. MOTOR DE CÁLCULO

`src/lib/calculo.ts`. Es la pieza que si falla invalida todo lo demás. Se construye y se testea antes de escribir una línea de interfaz.

### 6.1 Rangos de horas

```ts
export const RANGOS = [
  { id: 'menos2',  etiqueta: 'Menos de 2h', valor: 1   },
  { id: '2a5',     etiqueta: '2-5h',        valor: 3.5 },
  { id: '5a10',    etiqueta: '5-10h',       valor: 7.5 },
  { id: 'mas10',   etiqueta: 'Más de 10h',  valor: 12  },
] as const;
```

Son horas **semanales**. El valor es el punto medio del rango; en el abierto superior se toma 12, deliberadamente conservador. Nunca infles un rango hacia arriba: la credibilidad del número es el producto.

### 6.2 Horas mensuales

```
horasZona   = valorRango × 4,33
horasMes    = Σ horasZona de las zonas marcadas «Sí»
horasAño    = horasMes × 12
jornadas    = horasAño ÷ 8
```

Redondeo: **solo al presentar**, nunca en el cálculo intermedio. `horasMes` y `jornadas` se muestran como entero (`Math.round`). `horasMes` se guarda en Supabase con un decimal.

### 6.3 Priorización

```
ratio = valorRango ÷ pesoEsfuerzo      // bajo=1, medio=2, alto=3
```

Se ordenan de mayor a menor ratio las zonas marcadas «Sí» y se toman las tres primeras. Si hay menos de tres, se muestran las que haya.

**Desempate, en este orden estricto:**

1. Mayor `valorRango` declarado.
2. Menor peso de esfuerzo (antes lo que se resuelve antes).
3. Menor `id` de zona.

El desempate no es opcional: con cuatro rangos y tres niveles de esfuerzo los empates son frecuentes, y sin regla fija el mismo usuario podría obtener resultados distintos en dos intentos. Eso destruye la confianza en la herramienta más rápido que cualquier fallo visual.

### 6.4 Tests obligatorios

`src/lib/calculo.test.ts`, con Vitest. Casos mínimos:

- Ninguna zona marcada → `horasMes = 0`, lista de prioritarias vacía. La interfaz no debe poder llegar aquí (§8.9), pero la función no puede romperse.
- Una sola zona «Sí» → devuelve una prioritaria, no tres.
- Ocho zonas «Sí» con `mas10` → `horasMes = 415,68`, se muestran 416; las tres prioritarias son las de esfuerzo bajo por orden de id: 1, 3, 4.
- Empate real: zona 1 (bajo, `2a5`, ratio 3,5) contra zona 5 (medio, `mas10`, ratio 6) contra zona 3 (bajo, `2a5`, ratio 3,5) → orden esperado: 5, 1, 3.
- Zona de esfuerzo alto con `mas10` (ratio 4) por delante de zona de esfuerzo bajo con `2a5` (ratio 3,5) → el alto esfuerzo puede y debe entrar en el top 3 si el impacto lo justifica.
- Determinismo: el mismo input, ejecutado veinte veces, devuelve exactamente el mismo orden.

---

## 7. SCORING COMERCIAL INTERNO

`src/lib/scoring.ts`. Nunca visible para el usuario, ni en la interfaz ni en el email. Se calcula antes de insertar en Supabase.

```
caliente: 4 o más zonas «Sí»
          Y al menos una zona con rango '5a10' o 'mas10'
          Y num_empleados en ('2-5', '6-10')
          Y teléfono informado

frio:     (num_empleados === '1 (autónomo)' Y 2 o menos zonas «Sí»)
          O horasMes < 8

tibio:    el resto
```

Se evalúa en ese orden: si cumple «caliente», es caliente aunque también encaje en «frío».

---

## 8. PANTALLAS

Doce pantallas, de la 0 a la 11. Copy literal.

### 8.0 — Hero

- **Badge:** punto azul + `[N] dueños de pyme ya han hecho su diagnóstico`. `N` viene del `count` real de la tabla `leads` vía RPC (§9.3). Tipografía discreta, cifra en mono. **Si la llamada falla o `N < 25`, el badge no se renderiza.** Un contador que dice «3» resta credibilidad; ninguno no resta nada.
- **Titular:** «Averigua en 2 minutos dónde le está robando tiempo tu empresa cada semana», con **«2 minutos»** en azul.
- **Subtitular:** «8 preguntas rápidas. Al final sabrás tus 3 zonas prioritarias y cuántas horas al mes podrías recuperar.»
- **CTA:** «Empezar mi diagnóstico»
- **Microcopy bajo el CTA:** «Sin registro para empezar. Ves tu resultado nada más terminar.»
- Sin vídeo, sin scroll adicional, sin secciones de «cómo funciona». Todo cabe en una pantalla de móvil.

### 8.1-8.8 — Preguntas

- Arriba: `Pregunta {n} de 8` (mono) y barra de progreso azul.
- La afirmación en grande, con el nombre de la zona encima en formato etiqueta pequeña.
- Dos tarjetas grandes, **Sí** y **No**, apiladas en móvil y lado a lado en desktop. Altura mínima 64px. Se seleccionan con toque, teclado (Tab + Enter) y también con las teclas `S` / `N`.
- **«No»** → avanza solo a la siguiente pregunta tras 250ms.
- **«Sí»** → sin cambiar de pantalla, aparece debajo «¿Cuántas horas a la semana te lleva?» y los cuatro rangos como píldoras seleccionables. Al elegir uno, avanza tras 250ms.
- Enlace de texto discreto «Volver» que retrocede una pregunta conservando la respuesta.
- La pregunta 8, al responderse, lleva a la pantalla 9.

### 8.9 — Resultado parcial

La pantalla que decide la conversión. **Este es el momento característico de la herramienta y el único sitio donde se gasta algo de espectáculo** — y aun así, contenido.

- **La cascada:** tres cifras que aparecen en secuencia, una por línea, con 400ms entre ellas, cada una contando desde cero en 600ms. En mono, tamaño decreciente:
  - `{horasMes} horas al mes`
  - `son {horasAño} horas al año`
  - `son {jornadas} jornadas de trabajo`
- Debajo, una línea sobria: «Es el tiempo que hoy dedicas a trabajo que, en su mayor parte, no debería necesitarte.»
- **Teaser de zonas:** las 8 en lista compacta, solo el nombre, con punto azul en las 3 prioritarias. Sin ningún texto de detalle. La curiosidad de qué hay detrás del punto es lo que justifica pedir el email.
- **CTA:** «Ver mis 3 zonas prioritarias y qué hacer primero»
- **Microcopy:** «Te lo enviamos también por email, con el desglose completo.»
- **Caso de cero zonas:** si el usuario responde «No» a las ocho, no hay cascada. Se muestra: «Por lo que cuentas, tu empresa tiene los procesos bastante ordenados. No tenemos un diagnóstico que ofrecerte aquí.» y un enlace secundario a la web. **No se le pide el email.** Pedirlo sin nada que entregar a cambio es exactamente lo que esta marca no hace.

### 8.10 — Captura

- Campos, en este orden: Nombre (obligatorio) · Email profesional (obligatorio, validación de formato) · Número de empleados (obligatorio, desplegable: `1 (autónomo)` / `2-5` / `6-10`) · Teléfono (opcional, con microcopy «Solo si quieres que te llamemos para hablar de tu caso»).
- **No se añade ningún campo más.** Ni sector, ni web, ni cargo.
- **Checkbox RGPD**, desmarcado por defecto, después de los campos y justo antes del botón: «Acepto recibir mi diagnóstico y comunicaciones de STRATTONWORLD por email. Puedes darte de baja cuando quieras. [Política de privacidad]».
- **Botón:** «Ver mi resultado completo». Deshabilitado hasta que los obligatorios y el consentimiento estén.
- **Honeypot:** campo oculto a usuarios (no `display:none`, sino fuera de viewport con `aria-hidden` y `tabindex="-1"`). Si viene relleno, se simula el éxito y no se inserta nada.
- **Errores:** debajo del campo, en rojo sobrio, diciendo qué corregir. Nunca un error genérico de formulario entero.
- **Estado de envío:** el botón pasa a «Enviando…» y se bloquea. Si la inserción falla, **se muestra igualmente el resultado completo** y se registra el error en consola. El usuario ha hecho su parte; que falle nuestra base de datos no es motivo para dejarle sin lo que ha venido a buscar.

### 8.11 — Resultado completo

- Titular: «Tus 3 zonas prioritarias»
- Una tarjeta por zona, numeradas 1-2-3 (aquí la numeración sí informa: es un orden de actuación). Cada tarjeta lleva: nombre de la zona · horas mensuales de esa zona en mono · la frase `porQue` · el bloque `queCuesta` · las acciones como lista con check azul.
- Cierre: «El informe completo, con las ocho zonas y el detalle ampliado, ya va camino de tu email.»
- CTA secundario, tono bajo, sin caja destacada: «Hablar sobre mi caso con STRATTONWORLD» → enlace a calendario o WhatsApp (URL como variable de entorno).
- Sin botones de descarga, sin compartir en redes, sin ofertas.

### 8.12 — Persistencia y comportamiento global

- El estado se guarda en `sessionStorage` en cada respuesta. Si el usuario recarga a mitad, vuelve donde estaba. Al completar la pantalla 10, se limpia.
- El botón «atrás» del navegador no debe sacar al usuario del cuestionario: intercepta con `history.pushState` por pantalla.
- Nada de scroll horizontal a 375px, en ninguna pantalla, en ningún estado.

---

## 9. SUPABASE

### 9.1 Tabla

```sql
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  nombre text not null,
  email text not null,
  telefono text,
  num_empleados text not null,
  respuestas jsonb not null,          -- [{zona_id, si, rango}]
  zonas_prioritarias jsonb not null,  -- [{zona_id, nombre, horas_mes}]
  horas_mes_calculadas numeric(6,1) not null,
  score_interno text not null check (score_interno in ('caliente','tibio','frio')),
  consentimiento_rgpd boolean not null,
  informe_enviado boolean not null default false
);

create index leads_created_at_idx on public.leads (created_at desc);
create index leads_score_idx on public.leads (score_interno);
```

### 9.2 RLS

```sql
alter table public.leads enable row level security;

create policy "insert publico" on public.leads
  for insert to anon with check (consentimiento_rgpd = true);
```

**No se crea ninguna policy de SELECT para `anon`.** Nadie puede leer la tabla desde el frontend. El consentimiento se valida también en base de datos, no solo en el formulario: si algún día el frontend falla, la base de datos sigue siendo defendible ante una reclamación.

### 9.3 Contador del hero

```sql
create or replace function public.contar_diagnosticos()
returns integer language sql security definer stable as $$
  select count(*)::integer from public.leads;
$$;

grant execute on function public.contar_diagnosticos() to anon;
```

Devuelve un entero y nada más. Es la única vía por la que el frontend toca esa tabla en lectura.

---

## 10. EDGE FUNCTION — ENVÍO DEL INFORME

`supabase/functions/enviar-informe/index.ts`. Se invoca desde el frontend justo después de la inserción, pasando el `id` del lead.

- Lee el lead con `service_role`, compone el email y lo envía por Resend.
- Al terminar, marca `informe_enviado = true`.
- Si Resend falla, devuelve error pero **no lo propaga a la interfaz**: el usuario ya está viendo su resultado en pantalla.
- Remitente: `diagnostico@strattonworld.ai`. Asunto: `Tu diagnóstico: {horasMes} horas al mes`.

**Contenido mínimo del email en esta fase** (el informe extenso es un trabajo aparte): saludo con el nombre · la cascada de tres cifras en texto · las tres zonas con nombre, `porQue` y sus acciones · una línea de cierre y el enlace de contacto. HTML sobrio, una sola columna, 600px, sin imágenes salvo el logo, texto plano alternativo obligatorio.

Deja la plantilla en un archivo aparte y bien separada de la lógica: se va a reescribir entera.

---

## 11. VARIABLES DE ENTORNO

`.env.example` versionado, `.env` ignorado.

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_URL_CONTACTO=          # calendario o WhatsApp del CTA final
VITE_URL_PRIVACIDAD=
```

Solo en las variables de la Edge Function, nunca en el frontend:

```
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
```

---

## 12. CALIDAD — NO NEGOCIABLE

- **Móvil:** las 12 pantallas verificadas a 375px. Áreas táctiles ≥44px. Sin scroll horizontal.
- **Teclado:** todo el cuestionario completable sin ratón, con foco visible (anillo azul de 2px).
- **Lectores de pantalla:** las opciones Sí/No son `role="radiogroup"`. La barra de progreso lleva `aria-valuenow`. Los errores de formulario van con `aria-live="polite"`.
- **Rendimiento:** Lighthouse móvil ≥90 en Performance y Accessibility. Bundle inicial por debajo de 150KB comprimido. Fuentes con `preload` y `swap`.
- **Errores:** ninguno en consola en el recorrido completo.

---

## 13. PROHIBICIONES

- Escasez artificial de cualquier tipo: plazas limitadas, cuentas atrás, «solo hoy».
- Cifras que no salgan de Supabase o del cálculo del propio usuario.
- Vídeo en el hero.
- Nombrar tecnología en el copy visible.
- Violeta o morado en cualquier elemento.
- Campos de formulario adicionales a los de §8.10.
- Las palabras «gratis» o «gratuito».
- Mostrar el `score_interno` al usuario, en la interfaz o en el email.
- Añadir pantallas, secciones o pasos que no estén en esta spec.

---

## 14. DEFINITION OF DONE

Antes de decir que está terminado, comprueba una por una:

- [ ] `npm run test` en verde, con los seis casos de §6.4.
- [ ] Recorrido completo a 375px, respondiendo «Sí» a todo, sin un solo salto visual.
- [ ] Recorrido completo respondiendo «No» a todo → mensaje de §8.9, sin petición de email.
- [ ] Recarga a mitad del cuestionario → el progreso se conserva.
- [ ] Un lead real insertado en Supabase con `respuestas`, `zonas_prioritarias` y `score_interno` correctos.
- [ ] Email recibido en una bandeja real, revisado también en el móvil.
- [ ] Contador del hero mostrando el número real, y desapareciendo limpiamente si la llamada falla.
- [ ] Ninguna aparición de violeta, exclamaciones, emojis, «gratis» o nombres de tecnología en todo el código de interfaz.
- [ ] Lighthouse móvil ≥90 en Performance y Accessibility.
- [ ] `.env` fuera del repositorio y sin claves en el historial de commits.

---

## 15. PLAN DE FASES

Un commit por fase. No empieces una sin cerrar la anterior.

| Fase | Contenido | Commit |
|---|---|---|
| 0 | Andamiaje: Vite, TS, Tailwind con los tokens de §4, shadcn, fuentes, `.gitignore`, `.env.example`. Pantalla en blanco con el fondo y su textura correctos. | `chore: andamiaje y sistema visual base` |
| 1 | `zonas.ts`, `rangos.ts`, `tipos.ts`, `calculo.ts`, `scoring.ts` + tests en verde. **Sin nada de interfaz.** | `feat: motor de cálculo y priorización con tests` |
| 2 | Componentes base: Badge, BotonPrincipal, TarjetaOpcion, BarraProgreso, Fondo. | `feat: componentes base del sistema visual` |
| 3 | Pantallas 1-8, máquina de estados, persistencia en sessionStorage. Verificado a 375px. | `feat: flujo de las 8 preguntas` |
| 4 | Pantalla 9 con la cascada y el teaser de zonas, incluido el caso de cero zonas. | `feat: pantalla de resultado parcial` |
| 5 | Migración SQL, RLS, RPC del contador, cliente de Supabase. | `feat: esquema de datos y politicas de acceso` |
| 6 | Pantalla 10: formulario, validaciones, RGPD, honeypot, inserción. | `feat: captura de lead` |
| 7 | Pantalla 11 con el contenido de las tres zonas. | `feat: resultado completo` |
| 8 | Edge Function y plantilla de email. | `feat: envio del informe por email` |
| 9 | Pantalla 0 con el contador real. Es la última porque necesita datos que hasta ahora no existían. | `feat: hero con contador real` |
| 10 | Repaso completo contra §14, correcciones, Lighthouse. | `chore: QA final y ajustes de rendimiento` |

Al terminar cada fase, dime en dos líneas qué has hecho y qué has decidido que no estaba resuelto en la spec. No pases a la siguiente sin que te lo confirme.

---

## ANEXO A — RELACIÓN CON LOVABLE

Claude Code trabaja sobre un repositorio, no dentro del editor de Lovable. Dos caminos válidos:

**A. Repositorio propio, sin Lovable** *(recomendado)*. Se despliega en Vercel o Netlify conectando el repo de GitHub. Menos piezas, control total del código, y el proyecto sigue siendo tuyo íntegramente. Lovable no aporta nada que aquí se necesite.

**B. Con Lovable como editor visual.** Crea el proyecto en Lovable, activa la sincronización con GitHub, clona el repo y trabaja con Claude Code sobre él: los cambios suben y Lovable los refleja. Útil solo si alguien de tu equipo va a querer tocar la interfaz sin escribir código. A cambio, hay que respetar la estructura de archivos que Lovable impone y se convive con dos fuentes de cambios sobre el mismo repo.

## ANEXO B — PUESTA EN PRODUCCIÓN

1. **Subdominio:** `diagnostico.strattonworld.ai`, por registro CNAME desde el panel de Hostinger apuntando al host de despliegue. Cinco minutos.
2. **Resend:** verificar el dominio y publicar SPF y DKIM en el DNS de Hostinger. **Tramítalo antes de empezar a construir**: la propagación tarda y es lo único de esta lista que no se resuelve en el mismo día.
3. **Política de privacidad** publicada y enlazada desde el checkbox, con responsable del tratamiento, finalidad, base legal y derechos. Sin esto no se puede lanzar.
4. **Registro de actividades de tratamiento** actualizado con esta captación.
5. Prueba end to end con un lead real antes de publicar el anuncio de LinkedIn.
