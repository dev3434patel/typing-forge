-- Forge v3: preserves legacy history, confines trusted score writes, and gives races
-- row-locked server operations. Replay runs in the Edge function, never in SQL.
create schema if not exists forge_private;
revoke all on schema forge_private from public, anon, authenticated;

drop policy if exists "Authenticated users can view profiles" on public.profiles;
create policy "Owners read private profiles" on public.profiles for select to authenticated using (id = auth.uid());
create table public.public_identities (
  user_id uuid primary key references auth.users(id) on delete cascade,
  handle text not null unique check (handle ~ '^[a-z][a-z0-9_]{2,23}$'),
  avatar_id text check (avatar_id is null or avatar_id in ('forge','comet','leaf','mountain')),
  created_at timestamptz not null default now()
);
alter table public.public_identities enable row level security;
create policy "Public approved identities" on public.public_identities for select using (true);
create policy "Owners edit identity" on public.public_identities for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select on public.public_identities to anon, authenticated;
grant update (handle, avatar_id) on public.public_identities to authenticated;
create function forge_private.ensure_identity(p_user uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare v_handle text; v_attempt integer := 0;
begin
  select handle into v_handle from public.public_identities where user_id=p_user;
  if found then return v_handle; end if;
  loop
    v_handle := 'forge_' || substr(md5(p_user::text || ':' || v_attempt::text),1,18);
    begin
      insert into public.public_identities(user_id,handle) values(p_user,v_handle);
      return v_handle;
    exception when unique_violation then v_attempt := v_attempt+1;
    end;
  end loop;
end $$;
revoke all on function forge_private.ensure_identity(uuid) from public,anon,authenticated;
do $$ declare v_id uuid; begin
  for v_id in select id from public.profiles loop perform forge_private.ensure_identity(v_id); end loop;
end $$;
update public.profiles p set username=i.handle from public.public_identities i
where p.id=i.user_id and (p.username is null or p.username !~ '^[a-z][a-z0-9_]{2,23}$');
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_handle text;
begin
  v_handle := forge_private.ensure_identity(new.id);
  insert into public.profiles(id,username) values(new.id,v_handle) on conflict(id) do nothing;
  return new;
end $$;
revoke all on function public.handle_new_user() from public,anon,authenticated;

create table public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  preferences jsonb not null default '{}', version bigint not null default 1,
  updated_at timestamptz not null default now(), check (pg_column_size(preferences) <= 32768)
);
alter table public.user_preferences enable row level security;
create policy "Owners read preferences" on public.user_preferences for select to authenticated using(user_id=auth.uid());
create policy "Owners write preferences" on public.user_preferences for insert to authenticated with check(user_id=auth.uid());
create policy "Owners update preferences" on public.user_preferences for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
grant select,insert,update on public.user_preferences to authenticated;

alter table public.test_sessions
  add column client_session_id text,
  add column metrics_version text not null default 'legacy-unverified',
  add column provenance text not null default 'legacy',
  add column comparison_key text,
  add column elapsed_ms double precision,
  add column eligibility jsonb not null default '{"eligible":false,"reasons":["legacy-unverified"]}',
  add column accepted_result jsonb,
  alter column duration_seconds type double precision,
  alter column gross_wpm type double precision,
  alter column net_wpm type double precision,
  alter column accuracy_percent type double precision,
  alter column consistency_percent type double precision;
create unique index test_sessions_owner_client on public.test_sessions(user_id,client_session_id) where client_session_id is not null;
create index test_sessions_comparison on public.test_sessions(user_id,comparison_key,created_at desc);

create table forge_private.submission_receipts (
  user_id uuid not null references auth.users(id) on delete cascade,
  client_session_id text not null,
  payload_hash text not null,
  session_id uuid references public.test_sessions(id) on delete set null,
  accepted_result jsonb,
  deleted_at timestamptz,
  primary key(user_id,client_session_id)
);
create table public.session_evidence (
  session_id uuid primary key references public.test_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  evidence jsonb not null,
  expires_at timestamptz not null default now()+interval '90 days'
);
create table public.typing_challenges (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  nonce uuid not null default gen_random_uuid(), configuration jsonb not null, target_text text not null,
  issued_at timestamptz not null default now(), starts_at timestamptz not null, deadline_at timestamptz not null,
  expires_at timestamptz not null, consumed_by text
);
alter table public.typing_challenges enable row level security;
create policy "Owners read challenges" on public.typing_challenges for select to authenticated using(user_id=auth.uid());
grant select on public.typing_challenges to authenticated;
revoke insert,update,delete on public.typing_challenges from anon,authenticated;
create table public.session_key_summaries (
  session_id uuid not null references public.test_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  dimensions text not null,
  character text not null,
  attempts integer not null check(attempts>=0),
  correct_attempts integer not null check(correct_attempts>=0 and correct_attempts<=attempts),
  interval_count integer not null default 0,
  interval_sum_ms double precision not null default 0,
  primary key(session_id,character)
);
create table public.comparison_bests (
  user_id uuid not null references auth.users(id) on delete cascade,
  comparison_key text not null,
  best_wpm double precision,
  test_count integer not null,
  avg_wpm double precision,
  avg_accuracy double precision,
  duration_ms double precision not null,
  ranked boolean not null default false,
  primary key(user_id,comparison_key,ranked)
);
create table public.learning_state (
  user_id uuid not null references auth.users(id) on delete cascade,
  dimensions text not null,
  version bigint not null default 0,
  key_summary jsonb not null default '{}',
  updated_at timestamptz not null default now(),
  primary key(user_id,dimensions)
);
create table public.session_learning_evidence (
  session_id uuid primary key references public.test_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  server_sequence bigint generated always as identity,
  evidence jsonb not null
);
create table public.user_data_versions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  version bigint not null default 0
);
create table public.result_shares (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null references public.test_sessions(id) on delete cascade,
  -- Public sharing stores only a consented summary, never raw typing evidence.
  summary jsonb not null, created_at timestamptz not null default now(),
  expires_at timestamptz not null default now()+interval '30 days'
);
do $$ declare v_table text; begin
  foreach v_table in array array['session_evidence','session_key_summaries','comparison_bests','learning_state','session_learning_evidence','user_data_versions','result_shares'] loop
    execute format('alter table public.%I enable row level security',v_table);
    execute format('create policy "Owner reads" on public.%I for select to authenticated using (user_id=auth.uid())',v_table);
    execute format('grant select on public.%I to authenticated',v_table);
  end loop;
end $$;
-- Public result links are opt-in records. No browser role can manufacture them.
create policy "Consented unexpired shares" on public.result_shares for select using(expires_at>now());
grant select on public.result_shares to anon;

-- Remove the previous browser-controlled score/aggregate paths, including DELETE which
-- must reconcile the derived tables transactionally instead of orphaning rankings.
drop policy if exists "Users can insert their own test sessions" on public.test_sessions;
drop policy if exists "Users can delete their own test sessions" on public.test_sessions;
drop policy if exists "Users can upsert their own leaderboard entry" on public.leaderboards;
drop policy if exists "Users can update their own leaderboard entry" on public.leaderboards;
revoke insert,update,delete on public.test_sessions,public.leaderboards from anon,authenticated;
revoke insert,update,delete on public.session_evidence,public.session_key_summaries,public.comparison_bests,public.learning_state,public.session_learning_evidence,public.user_data_versions,public.result_shares from anon,authenticated;
-- Legacy character confidence remains historical; accepted evidence is the cloud source.
revoke insert,update,delete on public.character_confidence from anon,authenticated;
-- Legacy leaderboard values are not verified observations and must not remain ranked.
delete from public.leaderboards;

create function forge_private.reconcile(p_user uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
  insert into public.user_data_versions(user_id,version) values(p_user,1) on conflict(user_id) do update set version=public.user_data_versions.version+1;
  delete from public.comparison_bests where user_id=p_user;
  insert into public.comparison_bests(user_id,comparison_key,best_wpm,test_count,avg_wpm,avg_accuracy,duration_ms,ranked)
  select p_user,comparison_key,max(net_wpm) filter(where coalesce((accepted_result->>'personalBestEligible')::boolean,false)),count(*)::int,avg(net_wpm),avg(accuracy_percent),sum(elapsed_ms),false
  from public.test_sessions where user_id=p_user and metrics_version='forge-v3' group by comparison_key;
  insert into public.comparison_bests(user_id,comparison_key,best_wpm,test_count,avg_wpm,avg_accuracy,duration_ms,ranked)
  select p_user,comparison_key,max(net_wpm),count(*)::int,avg(net_wpm),avg(accuracy_percent),sum(elapsed_ms),true
  from public.test_sessions where user_id=p_user and metrics_version='forge-v3' and (eligibility->>'eligible')::boolean group by comparison_key;
  delete from public.leaderboards where user_id=p_user;
  insert into public.leaderboards(user_id,wpm_best,wpm_avg,accuracy_avg,consistency_avg,tests_completed,total_characters)
  select p_user,max(net_wpm),avg(net_wpm),avg(accuracy_percent),avg(consistency_percent),count(*)::int,sum(total_characters)::int
  from public.test_sessions where user_id=p_user and metrics_version='forge-v3' and (eligibility->>'eligible')::boolean having count(*)>0;
  insert into public.learning_state(user_id,dimensions,version,key_summary)
  select p_user,dimensions,1,jsonb_object_agg(character,summary) from (
    select dimensions,character,jsonb_build_object('attempts',sum(attempts),'correctAttempts',sum(correct_attempts),'intervalCount',sum(interval_count),'intervalSumMs',sum(interval_sum_ms)) summary
    from public.session_key_summaries where user_id=p_user group by dimensions,character
  ) keys group by dimensions
  on conflict(user_id,dimensions) do update set key_summary=excluded.key_summary,version=public.learning_state.version+1,updated_at=now();
  delete from public.learning_state l where l.user_id=p_user and not exists(select 1 from public.session_key_summaries k where k.user_id=p_user and k.dimensions=l.dimensions);
end $$;
revoke all on function forge_private.reconcile(uuid) from public,anon,authenticated;

-- This exposed facade is executable ONLY with the server service credential. It is
-- intentionally inaccessible to authenticated/anonymous browser JWTs.
create function public.forge_commit_session(p_owner uuid,p_client_id text,p_hash text,p_accepted jsonb,p_evidence jsonb,p_keys jsonb default '[]') returns jsonb
language plpgsql security definer set search_path='' as $$
declare v_receipt forge_private.submission_receipts; v_id uuid; v_metrics jsonb := p_accepted->'metrics'; v_key jsonb; v_challenge public.typing_challenges;
begin
  if auth.role() is distinct from 'service_role' then raise exception 'Trusted server only' using errcode='42501'; end if;
  if p_client_id is null or length(p_client_id)>128 or p_hash !~ '^sha256:[a-f0-9]{64}$' or p_accepted->>'metricsVersion'<>'forge-v3' then raise exception 'Invalid validated payload'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_owner::text,0));
  select * into v_receipt from forge_private.submission_receipts where user_id=p_owner and client_session_id=p_client_id for update;
  if found then
    if v_receipt.deleted_at is not null then raise exception 'This session was deleted' using errcode='23505'; end if;
    if v_receipt.payload_hash<>p_hash then raise exception 'Idempotency conflict' using errcode='23505'; end if;
    return v_receipt.accepted_result;
  end if;
  if (p_accepted->'eligibility'->>'eligible')::boolean then
    select * into v_challenge from public.typing_challenges where id=(p_accepted->>'challengeId')::uuid for update;
    if not found or v_challenge.user_id<>p_owner or v_challenge.consumed_by is not null or now()<v_challenge.deadline_at or now()>v_challenge.expires_at then raise exception 'Challenge unavailable or consumed'; end if;
    update public.typing_challenges set consumed_by=p_client_id where id=v_challenge.id;
  end if;
  insert into public.test_sessions(user_id,client_session_id,metrics_version,provenance,comparison_key,elapsed_ms,test_mode,duration_seconds,gross_wpm,net_wpm,accuracy_percent,consistency_percent,total_characters,correct_characters,error_count,wpm_history,eligibility,accepted_result)
  values(p_owner,p_client_id,'forge-v3','edge-replayed',p_accepted->>'comparisonKey',(p_accepted->>'elapsedMs')::double precision,p_accepted->>'mode',(p_accepted->>'elapsedMs')::double precision/1000,(v_metrics->>'rawWpm')::double precision,(v_metrics->>'wpm')::double precision,(v_metrics->>'inputAccuracy')::double precision,(v_metrics->>'consistency')::double precision,(v_metrics->>'retainedUnits')::int,(v_metrics->>'correct')::int,(v_metrics->>'incorrectAttempts')::int,p_accepted->'timeSeries',p_accepted->'eligibility',p_accepted)
  returning id into v_id;
  insert into public.session_evidence(session_id,user_id,evidence) values(v_id,p_owner,p_evidence);
  if p_accepted->'learningEvidence' is not null and p_accepted->'learningEvidence'<>'null'::jsonb then
    insert into public.session_learning_evidence(session_id,user_id,evidence) values(v_id,p_owner,p_accepted->'learningEvidence');
  end if;
  for v_key in select * from jsonb_array_elements(p_keys) loop
    insert into public.session_key_summaries(session_id,user_id,dimensions,character,attempts,correct_attempts,interval_count,interval_sum_ms)
    values(v_id,p_owner,v_key->>'dimensions',v_key->>'character',(v_key->>'attempts')::int,(v_key->>'correctAttempts')::int,(v_key->>'intervalCount')::int,(v_key->>'intervalSumMs')::double precision);
  end loop;
  perform forge_private.reconcile(p_owner);
  insert into forge_private.submission_receipts(user_id,client_session_id,payload_hash,session_id,accepted_result) values(p_owner,p_client_id,p_hash,v_id,p_accepted);
  return p_accepted;
end $$;
revoke all on function public.forge_commit_session(uuid,text,text,jsonb,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.forge_commit_session(uuid,text,text,jsonb,jsonb,jsonb) to service_role;

create function public.forge_get_submission_receipt(p_owner uuid,p_client_id text,p_hash text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare v_receipt forge_private.submission_receipts;
begin
  if auth.role() is distinct from 'service_role' then raise exception 'Trusted server only' using errcode='42501';end if;
  select * into v_receipt from forge_private.submission_receipts where user_id=p_owner and client_session_id=p_client_id;
  if not found then return null;end if;
  if v_receipt.deleted_at is not null then raise exception 'This session was deleted' using errcode='23505';end if;
  if v_receipt.payload_hash<>p_hash then raise exception 'Idempotency conflict' using errcode='23505';end if;
  return v_receipt.accepted_result;
end $$;
revoke all on function public.forge_get_submission_receipt(uuid,text,text) from public,anon,authenticated;
grant execute on function public.forge_get_submission_receipt(uuid,text,text) to service_role;

create function public.forge_delete_session(p_client_id text) returns void
language plpgsql security definer set search_path='' as $$
declare v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'Authentication required' using errcode='42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended(v_user::text,0));
  update forge_private.submission_receipts set deleted_at=now(),accepted_result=null where user_id=v_user and client_session_id=p_client_id;
  insert into forge_private.submission_receipts(user_id,client_session_id,payload_hash,deleted_at) values(v_user,p_client_id,'deleted',now()) on conflict(user_id,client_session_id) do nothing;
  delete from public.test_sessions where user_id=v_user and (client_session_id=p_client_id or id::text=p_client_id);
  perform forge_private.reconcile(v_user);
end $$;
revoke all on function public.forge_delete_session(text) from public,anon;
grant execute on function public.forge_delete_session(text) to authenticated;

create function public.forge_share_result(p_client_id text) returns uuid
language plpgsql security definer set search_path='' as $$
declare v_session public.test_sessions; v_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
  select * into v_session from public.test_sessions where user_id=auth.uid() and client_session_id=p_client_id;
  if not found then raise exception 'Session not found'; end if;
  insert into public.result_shares(user_id,session_id,summary) values(auth.uid(),v_session.id,jsonb_build_object('metrics',v_session.accepted_result->'metrics','mode',v_session.test_mode,'elapsedMs',v_session.elapsed_ms,'metricsVersion',v_session.metrics_version)) returning id into v_id;
  return v_id;
end $$;
revoke all on function public.forge_share_result(text) from public,anon;
grant execute on function public.forge_share_result(text) to authenticated;

create view public.ranked_results with (security_invoker=true) as
select b.*,i.handle,i.avatar_id from public.comparison_bests b join public.public_identities i on i.user_id=b.user_id where b.ranked=true;
create policy "Eligible cohort rankings are public" on public.comparison_bests for select using(ranked=true);
grant select on public.ranked_results,public.comparison_bests to anon,authenticated;

create table forge_private.job_runs(job_name text primary key,completed_at timestamptz not null,affected_rows integer not null);
create function forge_private.expire_evidence() returns void language plpgsql security definer set search_path='' as $$
declare v_count integer;
begin
  delete from public.session_evidence where expires_at<=now(); get diagnostics v_count=row_count;
  delete from public.result_shares where expires_at<=now();
  delete from public.typing_challenges where expires_at<=now()-interval '90 days';
  insert into forge_private.job_runs values('evidence-retention',now(),v_count) on conflict(job_name) do update set completed_at=excluded.completed_at,affected_rows=excluded.affected_rows;
end $$;
revoke all on function forge_private.expire_evidence() from public,anon,authenticated;
-- Retention scheduling is installed by the companion operator script after pg_cron
-- is enabled. Installation must fail visibly if the scheduler is unavailable.
