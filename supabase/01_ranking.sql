-- =====================================================================
-- THE MAN OF THE BAG · Suite de juegos
-- Script 01: apodos y ranking mundial
-- Ejecutar completo en Supabase → SQL Editor → New query → Run
-- Se puede volver a ejecutar sin romper nada.
-- =====================================================================
-- Privacidad (público de 8 a 12 años):
--   * Solo se guarda un APODO. Sin nombre, correo, edad ni ubicación.
--   * "device_id" es un código al azar que crea el juego en el navegador.
--     No identifica a la persona; solo sirve para saber qué récord es de quién.
--   * Las tablas están cerradas: el juego solo puede usar las funciones de abajo.
-- =====================================================================


-- ---------- 1. TABLAS ----------

create table if not exists public.jugadores (
  device_id   uuid primary key,
  apodo       text not null,
  creado      timestamptz not null default now(),
  actualizado timestamptz not null default now()
);

-- Un apodo solo puede tenerlo un jugador (sin importar mayúsculas)
create unique index if not exists jugadores_apodo_unico
  on public.jugadores (lower(apodo));

create table if not exists public.puntajes (
  device_id   uuid not null references public.jugadores(device_id) on delete cascade,
  juego       text not null check (juego in ('escape_cabras', 'carrera_toxica')),
  mejor       integer not null default 0 check (mejor >= 0),
  partidas    integer not null default 0,
  actualizado timestamptz not null default now(),
  primary key (device_id, juego)
);

create index if not exists puntajes_ranking
  on public.puntajes (juego, mejor desc);

-- Palabras que no se permiten dentro de un apodo (se pueden agregar más)
create table if not exists public.palabras_prohibidas (
  palabra text primary key
);

insert into public.palabras_prohibidas (palabra) values
  ('idiota'), ('estupido'), ('estúpido'), ('tonto'), ('mierda'), ('puta'), ('puto'),
  ('pene'), ('culo'), ('sexo'), ('nazi'), ('hitler'), ('matar'), ('muerte'),
  ('admin'), ('moderador'), ('themanofthebag'), ('tmboficial')
on conflict do nothing;


-- ---------- 2. SEGURIDAD: nadie toca las tablas directamente ----------

alter table public.jugadores           enable row level security;
alter table public.puntajes            enable row level security;
alter table public.palabras_prohibidas enable row level security;

revoke all on public.jugadores, public.puntajes, public.palabras_prohibidas
  from anon, authenticated;


-- ---------- 3. FUNCIONES QUE USA EL JUEGO ----------

-- 3.1 Registrar o cambiar el apodo
-- Respuestas: 'ok' | 'apodo_invalido' | 'apodo_no_permitido' | 'apodo_ocupado' | 'error'
create or replace function public.registrar_apodo(p_device uuid, p_apodo text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_apodo text := btrim(regexp_replace(coalesce(p_apodo, ''), '\s+', ' ', 'g'));
  v_norm  text;
begin
  if p_device is null then
    return 'error';
  end if;

  -- De 3 a 14 caracteres: letras, números, espacio, guion y guion bajo
  if v_apodo !~ '^[A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ _-]{3,14}$' then
    return 'apodo_invalido';
  end if;

  -- Revisa palabras prohibidas aunque estén mezcladas con números o espacios
  -- (convierte trucos como "1d10ta" → "idiota" antes de revisar)
  v_norm := translate(lower(v_apodo), '103457@', 'ioeasta');
  v_norm := regexp_replace(v_norm, '[^a-záéíóúüñ]', '', 'g');
  if exists (select 1 from palabras_prohibidas
             where v_norm like '%' || lower(palabra) || '%') then
    return 'apodo_no_permitido';
  end if;

  if exists (select 1 from jugadores
             where lower(apodo) = lower(v_apodo) and device_id <> p_device) then
    return 'apodo_ocupado';
  end if;

  insert into jugadores (device_id, apodo)
  values (p_device, v_apodo)
  on conflict (device_id) do update
    set apodo = excluded.apodo, actualizado = now();

  return 'ok';
exception
  when unique_violation then
    return 'apodo_ocupado';
end;
$$;


-- 3.2 Enviar el puntaje de una partida (solo se guarda si es el mejor)
-- Devuelve: { ok, mejor, record, posicion }  o  { ok:false, error }
create or replace function public.enviar_puntaje(p_device uuid, p_juego text, p_puntaje integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prev     integer;
  v_ultimo   timestamptz;
  v_mejor    integer;
  v_posicion bigint;
begin
  if not exists (select 1 from jugadores where device_id = p_device) then
    return jsonb_build_object('ok', false, 'error', 'sin_apodo');
  end if;

  if p_juego not in ('escape_cabras', 'carrera_toxica') then
    return jsonb_build_object('ok', false, 'error', 'juego_invalido');
  end if;

  -- Tope anti-trampa básico: ninguna partida real llega a 200 000
  if p_puntaje is null or p_puntaje < 0 or p_puntaje > 200000 then
    return jsonb_build_object('ok', false, 'error', 'puntaje_invalido');
  end if;

  select mejor, actualizado into v_prev, v_ultimo
  from puntajes where device_id = p_device and juego = p_juego;

  -- Evita que se envíen puntajes en ráfaga (máximo uno cada 3 segundos)
  if v_ultimo is not null and v_ultimo > now() - interval '3 seconds' then
    return jsonb_build_object('ok', false, 'error', 'muy_rapido');
  end if;

  insert into puntajes (device_id, juego, mejor, partidas)
  values (p_device, p_juego, p_puntaje, 1)
  on conflict (device_id, juego) do update
    set mejor       = greatest(puntajes.mejor, excluded.mejor),
        partidas    = puntajes.partidas + 1,
        actualizado = now()
  returning mejor into v_mejor;

  select count(*) + 1 into v_posicion
  from puntajes where juego = p_juego and mejor > v_mejor;

  return jsonb_build_object(
    'ok', true,
    'mejor', v_mejor,
    'record', p_puntaje > coalesce(v_prev, 0) and p_puntaje > 0,
    'posicion', v_posicion
  );
end;
$$;


-- 3.3 Ranking mundial (top 50 por defecto, máximo 100)
create or replace function public.ver_ranking(p_juego text, p_limite integer default 50)
returns table (posicion bigint, apodo text, mejor integer)
language sql
stable
security definer
set search_path = public
as $$
  select rank() over (order by p.mejor desc) as posicion, j.apodo, p.mejor
  from puntajes p
  join jugadores j on j.device_id = p.device_id
  where p.juego = p_juego and p.mejor > 0
  order by p.mejor desc, p.actualizado asc
  limit least(greatest(coalesce(p_limite, 50), 1), 100);
$$;


-- 3.4 Mi posición en el ranking (aunque no esté en el top 50)
create or replace function public.mi_ranking(p_device uuid, p_juego text)
returns table (posicion bigint, apodo text, mejor integer)
language sql
stable
security definer
set search_path = public
as $$
  select (select count(*) + 1 from puntajes o
          where o.juego = p_juego and o.mejor > p.mejor) as posicion,
         j.apodo, p.mejor
  from puntajes p
  join jugadores j on j.device_id = p.device_id
  where p.device_id = p_device and p.juego = p_juego;
$$;


-- ---------- 4. PERMISOS: el juego (clave pública) solo usa estas 4 funciones ----------

revoke all on function public.registrar_apodo(uuid, text)               from public;
revoke all on function public.enviar_puntaje(uuid, text, integer)       from public;
revoke all on function public.ver_ranking(text, integer)                from public;
revoke all on function public.mi_ranking(uuid, text)                    from public;

grant execute on function public.registrar_apodo(uuid, text)            to anon, authenticated;
grant execute on function public.enviar_puntaje(uuid, text, integer)    to anon, authenticated;
grant execute on function public.ver_ranking(text, integer)             to anon, authenticated;
grant execute on function public.mi_ranking(uuid, text)                 to anon, authenticated;


-- =====================================================================
-- PRUEBA (opcional): quita los "--" de estas líneas y ejecútalas aparte.
-- Al terminar, borra los datos de prueba con la última línea.
-- =====================================================================
-- select public.registrar_apodo('11111111-1111-1111-1111-111111111111', 'Bolsín');
-- select public.registrar_apodo('22222222-2222-2222-2222-222222222222', 'ToxiKid');
-- select public.enviar_puntaje('11111111-1111-1111-1111-111111111111', 'escape_cabras', 850);
-- select public.enviar_puntaje('22222222-2222-2222-2222-222222222222', 'escape_cabras', 1200);
-- select * from public.ver_ranking('escape_cabras');
-- select * from public.mi_ranking('11111111-1111-1111-1111-111111111111', 'escape_cabras');
-- delete from public.jugadores where device_id in ('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222');
