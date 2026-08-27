# Diagnóstico STRATTONWORLD

Herramienta de captación: 8 preguntas, dos minutos, y el dueño de una pyme obtiene sus horas
al mes en trabajo que no debería necesitarle y sus 3 zonas prioritarias.

La fuente de verdad del producto es [`SPEC.md`](SPEC.md). Si una decisión cambia, se cambia
ahí primero.

## Puesta en marcha

```bash
npm install
cp .env.example .env
npm run dev
```

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo en `localhost:5173` |
| `npm run test` | Tests del motor de cálculo (§6.4) |
| `npm run build` | Comprobación de tipos y build de producción en `dist/` |
| `npm run preview` | Sirve el build de producción |

## Variables de entorno

El frontend usa las cuatro `VITE_` de `.env.example`. `VITE_URL_WEB` no está en §11: la pide
el enlace secundario del caso de cero zonas (§8.9), y si se deja vacía ese enlace no aparece.

La `service_role` y la clave de Resend **no van en `.env`**. Se configuran solo como secretos
de la Edge Function:

```bash
supabase secrets set RESEND_API_KEY=...
supabase secrets set URL_CONTACTO=...
```

`SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` las inyecta Supabase en tiempo de ejecución.

## Base de datos

```bash
supabase db push          # aplica supabase/migrations/001_leads.sql
supabase functions deploy enviar-informe
```

La tabla `leads` tiene RLS con una única policy de insert para `anon`, condicionada al
consentimiento. **No hay policy de select**: nadie lee la tabla desde el frontend. El contador
del hero pasa por la función `contar_diagnosticos()`, que devuelve un entero y nada más.

Como consecuencia de no poder leer, el frontend genera el `uuid` del lead y lo envía en el
insert: es la única forma de conocer el id para invocar después la Edge Function sin abrir un
permiso de lectura.

## Contenido de las zonas

El copy de las 8 zonas vive en [`supabase/functions/_shared/zonas.ts`](supabase/functions/_shared/zonas.ts),
no en `src/data/`. La interfaz y el email tienen que decir exactamente lo mismo, y la Edge
Function corre en Deno: un módulo sin imports ni alias es lo único que ambos runtimes leen
igual. `src/data/zonas.ts` reexporta desde ahí.

## Antes de publicar el anuncio

Lista completa en el Anexo B de `SPEC.md`. Lo que no se resuelve en el mismo día:

- Verificación del dominio en Resend, con SPF y DKIM publicados en el DNS.
- Política de privacidad publicada y enlazada desde `VITE_URL_PRIVACIDAD`.
- Prueba end to end con un lead real.
