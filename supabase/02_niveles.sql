-- =====================================================================
-- THE MAN OF THE BAG · Script 02: niveles, score total y modos infinitos
-- Ejecutar completo en Supabase → SQL Editor → New query → Run
-- (requiere haber ejecutado antes 01_ranking.sql). Se puede repetir.
-- =====================================================================

-- ---------- 1. Permitir más tablas de ranking (infinito por mundo, etc.) ----------
alter table public.puntajes drop constraint if exists puntajes_juego_check;
alter table public.puntajes add constraint puntajes_juego_check
  check (juego ~ '^[a-z0-9_]{3,40}$');

create or replace function public.enviar_puntaje(p_device uuid, p_juego text, p_puntaje integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prev integer; v_ultimo timestamptz; v_mejor integer; v_posicion bigint;
begin
  if not exists (select 1 from jugadores where device_id = p_device) then
    return jsonb_build_object('ok', false, 'error', 'sin_apodo');
  end if;
  if p_juego !~ '^[a-z0-9_]{3,40}$' then
    return jsonb_build_object('ok', false, 'error', 'juego_invalido');
  end if;
  if p_puntaje is null or p_puntaje < 0 or p_puntaje > 200000 then
    return jsonb_build_object('ok', false, 'error', 'puntaje_invalido');
  end if;
  select mejor, actualizado into v_prev, v_ultimo
  from puntajes where device_id = p_device and juego = p_juego;
  if v_ultimo is not null and v_ultimo > now() - interval '3 seconds' then
    return jsonb_build_object('ok', false, 'error', 'muy_rapido');
  end if;
  insert into puntajes (device_id, juego, mejor, partidas)
  values (p_device, p_juego, p_puntaje, 1)
  on conflict (device_id, juego) do update
    set mejor = greatest(puntajes.mejor, excluded.mejor),
        partidas = puntajes.partidas + 1, actualizado = now()
  returning mejor into v_mejor;
  select count(*) + 1 into v_posicion from puntajes where juego = p_juego and mejor > v_mejor;
  return jsonb_build_object('ok', true, 'mejor', v_mejor,
    'record', p_puntaje > coalesce(v_prev, 0) and p_puntaje > 0, 'posicion', v_posicion);
end;
$$;

-- ---------- 2. Mejor puntaje de cada nivel ----------
-- nivel = 'm{mundo}n{nivel}d{dificultad}', ej: 'm1n03d1' (mundo 1, nivel 3, normal)
create table if not exists public.niveles (
  device_id   uuid not null references public.jugadores(device_id) on delete cascade,
  nivel       text not null check (nivel ~ '^m[1-9][0-9]?n[0-9]{2}d[1-3]$'),
  mejor       integer not null default 0 check (mejor between 0 and 60000),
  estrellas   smallint not null default 0 check (estrellas between 0 and 3),
  actualizado timestamptz not null default now(),
  primary key (device_id, nivel)
);
alter table public.niveles enable row level security;
revoke all on public.niveles from anon, authenticated;

-- Score total = suma de los mejores puntajes de todos los niveles
create or replace function public.enviar_nivel(p_device uuid, p_nivel text, p_puntaje integer, p_estrellas integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_total bigint; v_pos bigint;
begin
  if not exists (select 1 from jugadores where device_id = p_device) then
    return jsonb_build_object('ok', false, 'error', 'sin_apodo');
  end if;
  if p_nivel !~ '^m[1-9][0-9]?n[0-9]{2}d[1-3]$' or p_puntaje is null or p_puntaje < 0 or p_puntaje > 60000
     or p_estrellas is null or p_estrellas < 0 or p_estrellas > 3 then
    return jsonb_build_object('ok', false, 'error', 'puntaje_invalido');
  end if;
  insert into niveles (device_id, nivel, mejor, estrellas)
  values (p_device, p_nivel, p_puntaje, p_estrellas)
  on conflict (device_id, nivel) do update
    set mejor = greatest(niveles.mejor, excluded.mejor),
        estrellas = greatest(niveles.estrellas, excluded.estrellas),
        actualizado = now();
  select coalesce(sum(mejor), 0) into v_total from niveles where device_id = p_device;
  select count(*) + 1 into v_pos from (
    select device_id, sum(mejor) as t from niveles group by device_id) x where x.t > v_total;
  return jsonb_build_object('ok', true, 'total', v_total, 'posicion', v_pos);
end;
$$;

create or replace function public.ver_ranking_total(p_limite integer default 50)
returns table (posicion bigint, apodo text, mejor bigint)
language sql stable security definer set search_path = public
as $$
  select rank() over (order by x.t desc) as posicion, j.apodo, x.t as mejor
  from (select device_id, sum(mejor) as t from niveles group by device_id) x
  join jugadores j on j.device_id = x.device_id
  where x.t > 0
  order by x.t desc
  limit least(greatest(coalesce(p_limite, 50), 1), 100);
$$;

create or replace function public.mi_ranking_total(p_device uuid)
returns table (posicion bigint, apodo text, mejor bigint)
language sql stable security definer set search_path = public
as $$
  with tot as (select device_id, sum(mejor) as t from niveles group by device_id)
  select (select count(*) + 1 from tot o where o.t > m.t) as posicion, j.apodo, m.t as mejor
  from tot m join jugadores j on j.device_id = m.device_id
  where m.device_id = p_device;
$$;

revoke all on function public.enviar_nivel(uuid, text, integer, integer) from public;
revoke all on function public.ver_ranking_total(integer) from public;
revoke all on function public.mi_ranking_total(uuid) from public;
grant execute on function public.enviar_nivel(uuid, text, integer, integer) to anon, authenticated;
grant execute on function public.ver_ranking_total(integer) to anon, authenticated;
grant execute on function public.mi_ranking_total(uuid) to anon, authenticated;

-- La carrera en vivo usa Supabase Realtime (canales "broadcast" y "presence"):
-- no necesita tablas. Solo revisa en Project Settings → Realtime que esté activo
-- y que "Allow public access" (o "Private channels only" desactivado) permita
-- canales públicos.
