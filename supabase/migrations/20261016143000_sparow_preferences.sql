-- Add validated presentation preferences without changing ownership/version semantics.
create or replace function public.forge_update_preferences(p_owner uuid,p_expected_version bigint,p_patch jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare v_row public.user_preferences;v_key text;
begin
  if auth.uid() is null or auth.uid()<>p_owner then raise exception 'Owner authentication required' using errcode='42501';end if;
  if jsonb_typeof(p_patch)<>'object' or pg_column_size(p_patch)>32768 then raise exception 'Invalid preference payload';end if;
  for v_key in select jsonb_object_keys(p_patch) loop
    if v_key not in('theme','targetWpm','language','layout','fontSize','caretStyle','smoothCaret','sound','volume','dailyGoalMinutes','liveStats','focusMode','paceCaret','soundPack','reducedMotion') then raise exception 'Unknown preference key';end if;
  end loop;
  if p_patch ? 'soundPack' and (jsonb_typeof(p_patch->'soundPack') <> 'string' or p_patch->>'soundPack' not in ('soft','mechanical','typewriter','arcade','minimal')) then raise exception 'Invalid sound pack';end if;
  if p_patch ? 'reducedMotion' and jsonb_typeof(p_patch->'reducedMotion') <> 'boolean' then raise exception 'Invalid reduced motion preference';end if;
  perform pg_advisory_xact_lock(hashtextextended('forge-preferences-'||p_owner::text,0));
  select * into v_row from public.user_preferences where user_id=p_owner for update;
  if coalesce(v_row.version,0)<>p_expected_version then return jsonb_build_object('conflict',true,'preferences',coalesce(v_row.preferences,'{}'),'version',coalesce(v_row.version,0));end if;
  insert into public.user_preferences(user_id,preferences,version)values(p_owner,p_patch,1)
  on conflict(user_id)do update set preferences=public.user_preferences.preferences||excluded.preferences,version=public.user_preferences.version+1,updated_at=now() returning * into v_row;
  return jsonb_build_object('conflict',false,'preferences',v_row.preferences,'version',v_row.version);
end $$;
revoke all on function public.forge_update_preferences(uuid,bigint,jsonb) from public,anon;
grant execute on function public.forge_update_preferences(uuid,bigint,jsonb) to authenticated;
