-- Explicit owner intent prevents an action started in account A from mutating B
-- if the browser authentication changes before the request is dispatched.
create function public.forge_delete_session_for_owner(p_owner uuid,p_client_id text) returns void
language plpgsql security definer set search_path='' as $$
begin
  if auth.uid() is null or auth.uid()<>p_owner then
    raise exception 'Owner authentication required' using errcode='42501';
  end if;
  perform public.forge_delete_session(p_client_id);
end $$;
revoke all on function public.forge_delete_session_for_owner(uuid,text) from public,anon;
grant execute on function public.forge_delete_session_for_owner(uuid,text) to authenticated;
-- The old transaction implementation remains internal to the checked facade.
revoke execute on function public.forge_delete_session(text) from authenticated;

create or replace function public.forge_quick_match(p_duration integer default 30) returns jsonb
language plpgsql security definer set search_path='' as $$
declare v_room public.race_sessions; v_created jsonb;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if p_duration not in(15,30,60,120) then raise exception 'Unsupported duration'; end if;
  perform pg_advisory_xact_lock(hashtextextended('forge-match-'||p_duration::text,0));
  select * into v_room from public.race_sessions where is_public and status='waiting' and opponent_id is null and duration_seconds=p_duration and expires_at>now() and host_id<>auth.uid() order by created_at for update skip locked limit 1;
  if found then return public.forge_join_race(v_room.room_code); end if;
  select * into v_room from public.race_sessions where is_public and status='waiting' and host_id=auth.uid() and duration_seconds=p_duration and expires_at>now() order by created_at limit 1;
  if found then return forge_private.room_json(v_room); end if;
  v_created:=public.forge_create_race(p_duration);
  update public.race_sessions set is_public=true,version=version+1 where id=(v_created->>'id')::uuid returning * into v_room;
  return forge_private.room_json(v_room);
end $$;
revoke all on function public.forge_quick_match(integer) from public,anon;
grant execute on function public.forge_quick_match(integer) to authenticated;
