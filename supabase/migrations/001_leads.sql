-- §9.1 — Tabla de leads.

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

-- §9.2 — RLS.
-- Solo insert para anon, y solo con consentimiento. No hay policy de select:
-- nadie puede leer la tabla desde el frontend.
-- Como consecuencia, el insert del frontend no puede devolver la fila creada;
-- por eso el cliente genera el uuid y lo manda (ver src/lib/supabase.ts), que
-- es la unica forma de conocer el id para invocar despues la Edge Function
-- sin abrir un permiso de lectura.

alter table public.leads enable row level security;

create policy "insert publico" on public.leads
  for insert to anon with check (consentimiento_rgpd = true);

-- §9.3 — Contador del hero. Devuelve un entero y nada mas.
-- Es la unica via por la que el frontend toca esta tabla en lectura.
--
-- Nota: el linter de Supabase avisa de las funciones security definer sin
-- search_path fijo. Anadir "set search_path = public" a la definicion cierra
-- ese aviso. La spec da el SQL literal, asi que se deja como esta y se decide
-- fuera de aqui.

create or replace function public.contar_diagnosticos()
returns integer language sql security definer stable as $$
  select count(*)::integer from public.leads;
$$;

grant execute on function public.contar_diagnosticos() to anon;
