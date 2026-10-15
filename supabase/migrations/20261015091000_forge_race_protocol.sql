-- Human rooms have two participants. Joining means ready; both share a 3s countdown.
-- Finish receipt order is network-sensitive. Progress is provisional until Edge replay.
drop policy if exists "Can join as opponent when empty" on public.race_sessions;
drop policy if exists "Host can manage race status" on public.race_sessions;
drop policy if exists "Host can update own progress" on public.race_sessions;
drop policy if exists "Opponent can update own progress" on public.race_sessions;
drop policy if exists "Authenticated users can create races" on public.race_sessions;
drop policy if exists "Authenticated users can view waiting races" on public.race_sessions;
revoke insert,update,delete on public.race_sessions from anon,authenticated;
drop trigger if exists set_race_winner on public.race_sessions;
revoke all on function public.determine_race_winner() from public,anon,authenticated;
alter table public.race_sessions drop constraint if exists race_sessions_status_check;
alter table public.race_sessions add constraint race_sessions_status_check check(status in ('waiting','countdown','active','completed','cancelled','abandoned'));
alter table public.race_sessions
  add column duration_seconds integer not null default 30 check(duration_seconds in (15,30,60,120)),
  add column deadline_at timestamptz,
  add column is_public boolean not null default false,
  add column expires_at timestamptz not null default now()+interval '10 minutes',
  alter column host_progress type double precision,
  alter column opponent_progress type double precision;
-- Old in-flight rooms lack trustworthy timing. Preserve them as cancelled history.
update public.race_sessions set status='cancelled',ended_at=now(),version=version+1 where status in ('waiting','countdown','active');

create table public.race_outcomes (
  race_id uuid not null references public.race_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  progress double precision not null check(progress>=0 and progress<=100),
  wpm double precision, accuracy double precision,
  incorrect_attempts integer not null,
  exact_completion boolean not null default false,
  accepted_at timestamptz not null default now(),
  sequence integer not null,
  primary key(race_id,user_id)
);
create unique index test_sessions_one_race_outcome on public.test_sessions(user_id,(accepted_result->>'raceId')) where accepted_result ? 'raceId';
alter table public.race_outcomes enable row level security;
create policy "Members read room outcomes" on public.race_outcomes for select to authenticated using(exists(select 1 from public.race_sessions r where r.id=race_id and auth.uid() in(r.host_id,r.opponent_id)));
grant select on public.race_outcomes to authenticated;
revoke insert,update,delete on public.race_outcomes from anon,authenticated;

create function forge_private.room_json(p_room public.race_sessions) returns jsonb
language sql stable set search_path='' as $$ select to_jsonb(p_room)||jsonb_build_object('server_now',clock_timestamp()) $$;
create function forge_private.race_target(p_seed uuid) returns text
language sql immutable set search_path='' as $$
  select string_agg((array['build','clear','focus','steady','practice','river','light','think','world','bright','calm','learn','flow','forge','type','quick','quiet','small','space','strong','read','write','daily','skill'])[
    1+((('x'||substr(md5(p_seed::text||i::text),1,8))::bit(32)::bigint)%24)::int], ' ' order by i)
  from generate_series(1,800) i
$$;
revoke all on function forge_private.room_json(public.race_sessions),forge_private.race_target(uuid) from public,anon,authenticated;

create function forge_private.settle_race(p_id uuid) returns public.race_sessions
language plpgsql security definer set search_path='' as $$
declare v_room public.race_sessions; v_host public.race_outcomes; v_other public.race_outcomes;
begin
  select * into v_room from public.race_sessions where id=p_id for update;
  if not found then raise exception 'Room not found'; end if;
  if v_room.status='waiting' and v_room.expires_at<=now() then
    update public.race_sessions set status='abandoned',ended_at=now(),version=version+1 where id=p_id returning * into v_room;
  elsif v_room.status='countdown' and v_room.started_at<=now() then
    update public.race_sessions set status='active',version=version+1 where id=p_id returning * into v_room;
  end if;
  if v_room.status='active' and v_room.deadline_at<=now() then
    select * into v_host from public.race_outcomes where race_id=p_id and user_id=v_room.host_id;
    select * into v_other from public.race_outcomes where race_id=p_id and user_id=v_room.opponent_id;
    update public.race_sessions set status=case when coalesce(v_host.progress,0)=0 and coalesce(v_other.progress,0)=0 then 'abandoned' else 'completed' end,
      winner_id=case
        when coalesce(v_host.progress,0)>coalesce(v_other.progress,0) then v_room.host_id
        when coalesce(v_other.progress,0)>coalesce(v_host.progress,0) then v_room.opponent_id
        when coalesce(v_host.wpm,0)>coalesce(v_other.wpm,0) then v_room.host_id
        when coalesce(v_other.wpm,0)>coalesce(v_host.wpm,0) then v_room.opponent_id
        when coalesce(v_host.incorrect_attempts,0)<coalesce(v_other.incorrect_attempts,0) then v_room.host_id
        when coalesce(v_other.incorrect_attempts,0)<coalesce(v_host.incorrect_attempts,0) then v_room.opponent_id
        else null end,
      ended_at=v_room.deadline_at,version=version+1 where id=p_id returning * into v_room;
  end if;
  return v_room;
end $$;
revoke all on function forge_private.settle_race(uuid) from public,anon,authenticated;

create function public.forge_create_race(p_duration integer default 30) returns jsonb
language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid(); v_room public.race_sessions; v_seed uuid:=gen_random_uuid(); v_code text;
begin
  if v_user is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if p_duration not in (15,30,60,120) then raise exception 'Unsupported duration'; end if;
  if (select count(*) from public.race_sessions where host_id=v_user and created_at>now()-interval '1 minute')>=10 then raise exception 'Please wait before creating more rooms'; end if;
  loop
    v_code:=upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));
    begin
      insert into public.race_sessions(room_code,host_id,expected_text,duration_seconds,status,is_bot_race)
      values(v_code,v_user,forge_private.race_target(v_seed),p_duration,'waiting',false) returning * into v_room;
      return forge_private.room_json(v_room);
    exception when unique_violation then null;
    end;
  end loop;
end $$;
revoke all on function public.forge_create_race(integer) from public,anon;
grant execute on function public.forge_create_race(integer) to authenticated;

create function public.forge_join_race(p_code text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid(); v_room public.race_sessions;
begin
  if v_user is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if p_code !~ '^[0-9A-Z]{6}$' then raise exception 'Invalid room code'; end if;
  select * into v_room from public.race_sessions where room_code=p_code for update;
  if not found then raise exception 'Room not found'; end if;
  v_room:=forge_private.settle_race(v_room.id);
  if v_user=v_room.opponent_id then return forge_private.room_json(v_room); end if;
  if v_user=v_room.host_id then raise exception 'Open this code with another account to join'; end if;
  if v_room.status<>'waiting' or v_room.opponent_id is not null then raise exception 'Room is no longer available'; end if;
  update public.race_sessions set opponent_id=v_user,status='countdown',countdown_started_at=now(),started_at=now()+interval '3 seconds',deadline_at=now()+interval '3 seconds'+make_interval(secs=>duration_seconds),version=version+1
  where id=v_room.id returning * into v_room;
  return forge_private.room_json(v_room);
end $$;
revoke all on function public.forge_join_race(text) from public,anon;
grant execute on function public.forge_join_race(text) to authenticated;

create function public.forge_get_race(p_code text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare v_room public.race_sessions;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
  select * into v_room from public.race_sessions where room_code=p_code;
  if not found or auth.uid() not in(v_room.host_id,coalesce(v_room.opponent_id,v_room.host_id)) then raise exception 'Room membership required' using errcode='42501'; end if;
  v_room:=forge_private.settle_race(v_room.id);
  return forge_private.room_json(v_room);
end $$;
revoke all on function public.forge_get_race(text) from public,anon;
grant execute on function public.forge_get_race(text) to authenticated;

create function public.forge_quick_match(p_duration integer default 30) returns jsonb
language plpgsql security definer set search_path='' as $$
declare v_room public.race_sessions; v_created jsonb;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if p_duration not in(15,30,60,120) then raise exception 'Unsupported duration'; end if;
  perform pg_advisory_xact_lock(hashtextextended('forge-match-'||p_duration::text,0));
  select * into v_room from public.race_sessions where is_public and status='waiting' and opponent_id is null and duration_seconds=p_duration and expires_at>now() and host_id<>auth.uid() order by created_at for update skip locked limit 1;
  if found then return public.forge_join_race(v_room.room_code); end if;
  select * into v_room from public.race_sessions where is_public and status='waiting' and host_id=auth.uid() and expires_at>now() order by created_at limit 1;
  if found then return forge_private.room_json(v_room); end if;
  v_created:=public.forge_create_race(p_duration);
  update public.race_sessions set is_public=true,version=version+1 where id=(v_created->>'id')::uuid returning * into v_room;
  return forge_private.room_json(v_room);
end $$;
revoke all on function public.forge_quick_match(integer) from public,anon;
grant execute on function public.forge_quick_match(integer) to authenticated;

create function public.forge_leave_race(p_race_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare v_room public.race_sessions;
begin
  select * into v_room from public.race_sessions where id=p_race_id for update;
  if auth.uid() is null or not found or auth.uid() not in(v_room.host_id,coalesce(v_room.opponent_id,v_room.host_id)) then raise exception 'Membership required' using errcode='42501'; end if;
  v_room:=forge_private.settle_race(v_room.id);
  if v_room.status in('waiting','countdown') then update public.race_sessions set status='cancelled',ended_at=now(),version=version+1 where id=p_race_id returning * into v_room;
  elsif v_room.status='active' then update public.race_sessions set status='completed',winner_id=case when auth.uid()=host_id then opponent_id else host_id end,ended_at=now(),version=version+1 where id=p_race_id returning * into v_room;
  end if;
  return forge_private.room_json(v_room);
end $$;
revoke all on function public.forge_leave_race(uuid) from public,anon;
grant execute on function public.forge_leave_race(uuid) to authenticated;

create function public.forge_rematch_race(p_race_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare v_room public.race_sessions;
begin
  select * into v_room from public.race_sessions where id=p_race_id;
  if auth.uid() is null or not found or auth.uid() not in(v_room.host_id,coalesce(v_room.opponent_id,v_room.host_id)) then raise exception 'Membership required' using errcode='42501'; end if;
  if v_room.status not in('completed','cancelled','abandoned') then raise exception 'Finish the current room before a rematch'; end if;
  return public.forge_create_race(v_room.duration_seconds);
end $$;
revoke all on function public.forge_rematch_race(uuid) from public,anon;
grant execute on function public.forge_rematch_race(uuid) to authenticated;

create function public.forge_commit_race_progress(p_owner uuid,p_race_id uuid,p_progress double precision,p_wpm double precision,p_accuracy double precision,p_errors integer,p_sequence integer,p_complete boolean,p_session jsonb default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare v_room public.race_sessions; v_existing public.race_outcomes;
begin
  if auth.role() is distinct from 'service_role' then raise exception 'Trusted server only' using errcode='42501'; end if;
  select * into v_room from public.race_sessions where id=p_race_id for update;
  if not found or p_owner not in(v_room.host_id,coalesce(v_room.opponent_id,v_room.host_id)) then raise exception 'Membership required' using errcode='42501'; end if;
  v_room:=forge_private.settle_race(p_race_id);
  if p_session is not null then
    perform public.forge_commit_session(p_owner,p_session->>'clientId',p_session->>'hash',p_session->'accepted',p_session->'evidence',p_session->'keys');
  end if;
  if v_room.status in('completed','cancelled','abandoned') then return forge_private.room_json(v_room); end if;
  if v_room.status<>'active' then raise exception 'Room is not active'; end if;
  select * into v_existing from public.race_outcomes where race_id=p_race_id and user_id=p_owner;
  if found and v_existing.sequence>=p_sequence then return forge_private.room_json(v_room); end if;
  if p_complete and p_progress<>100 then raise exception 'Exact completion requires all target slots'; end if;
  insert into public.race_outcomes(race_id,user_id,progress,wpm,accuracy,incorrect_attempts,exact_completion,sequence)
  values(p_race_id,p_owner,p_progress,p_wpm,p_accuracy,p_errors,p_complete,p_sequence)
  on conflict(race_id,user_id) do update set progress=excluded.progress,wpm=excluded.wpm,accuracy=excluded.accuracy,incorrect_attempts=excluded.incorrect_attempts,exact_completion=excluded.exact_completion,sequence=excluded.sequence,accepted_at=now();
  update public.race_sessions set
    host_progress=case when p_owner=host_id then p_progress else host_progress end,
    host_wpm=case when p_owner=host_id then p_wpm else host_wpm end,
    host_accuracy=case when p_owner=host_id then p_accuracy else host_accuracy end,
    opponent_progress=case when p_owner=opponent_id then p_progress else opponent_progress end,
    opponent_wpm=case when p_owner=opponent_id then p_wpm else opponent_wpm end,
    opponent_accuracy=case when p_owner=opponent_id then p_accuracy else opponent_accuracy end,
    status=case when p_complete then 'completed' else status end,
    winner_id=case when p_complete then p_owner else winner_id end,
    ended_at=case when p_complete then now() else ended_at end,version=version+1 where id=p_race_id returning * into v_room;
  return forge_private.room_json(v_room);
end $$;
revoke all on function public.forge_commit_race_progress(uuid,uuid,double precision,double precision,double precision,integer,integer,boolean,jsonb) from public,anon,authenticated;
grant execute on function public.forge_commit_race_progress(uuid,uuid,double precision,double precision,double precision,integer,integer,boolean,jsonb) to service_role;

create function forge_private.expire_rooms() returns void language plpgsql security definer set search_path='' as $$
declare v_id uuid; v_count integer:=0;
begin
  for v_id in select id from public.race_sessions where (status='waiting' and expires_at<=now()) or (status in('countdown','active') and deadline_at<=now()) loop perform forge_private.settle_race(v_id);v_count:=v_count+1;end loop;
  insert into forge_private.job_runs values('race-settlement',now(),v_count) on conflict(job_name) do update set completed_at=excluded.completed_at,affected_rows=excluded.affected_rows;
end $$;
revoke all on function forge_private.expire_rooms() from public,anon,authenticated;

create function public.forge_issue_challenge(p_duration integer default 30) returns jsonb
language plpgsql security definer set search_path='' as $$
declare v_row public.typing_challenges; v_seed uuid:=gen_random_uuid();
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if p_duration not in(15,30,60,120) then raise exception 'Unsupported duration'; end if;
  if (select count(*) from public.typing_challenges where user_id=auth.uid() and issued_at>now()-interval '1 minute')>=10 then raise exception 'Please wait before requesting more challenges'; end if;
  insert into public.typing_challenges(user_id,configuration,target_text,starts_at,deadline_at,expires_at)
  values(auth.uid(),jsonb_build_object('mode','time','durationMs',p_duration*1000,'language','en','keyboardLayout','qwerty','inputMethod','keyboard','scoringPolicy','prose','contentRevision','forge-ranked-en-v1'),forge_private.race_target(v_seed),now()+interval '3 seconds',now()+interval '3 seconds'+make_interval(secs=>p_duration),now()+interval '10 minutes') returning * into v_row;
  return to_jsonb(v_row)||jsonb_build_object('server_now',clock_timestamp());
end $$;
revoke all on function public.forge_issue_challenge(integer) from public,anon;
grant execute on function public.forge_issue_challenge(integer) to authenticated;
