create function public.forge_prepare_account_deletion(p_owner uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
  if auth.role() is distinct from 'service_role' then raise exception 'Trusted server only' using errcode='42501'; end if;
  -- Host-owned rooms cascade on account deletion. Other hosts retain shared room
  -- history with the departing opponent and winner anonymized by ON DELETE SET NULL.
  update public.race_sessions set winner_id=null,version=version+1 where winner_id=p_owner;
  update public.race_sessions set status='cancelled',ended_at=now(),version=version+1 where (host_id=p_owner or opponent_id=p_owner) and status in('waiting','countdown','active');
end $$;
revoke all on function public.forge_prepare_account_deletion(uuid) from public,anon,authenticated;
grant execute on function public.forge_prepare_account_deletion(uuid) to service_role;
