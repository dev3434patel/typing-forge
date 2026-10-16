-- Disposable migrated PostgreSQL fixture. Synthetic database rows are never
-- shipped as application entries. This entire fixture rolls back.
begin;
-- The minimal PGlite auth fixture needs explicit claims even for public reads.
-- Supabase provides its own auth.uid implementation in deployed databases.
select set_config('request.jwt.claims','{"role":"anon"}',true);
create function pg_temp.period_assert(condition boolean, message text)
returns void language plpgsql as $$
begin
  if condition is distinct from true then
    raise exception 'PERIOD RANKING ASSERTION FAILED: %', message;
  end if;
end
$$;

select pg_temp.period_assert((select prosecdef from pg_proc where oid = 'public.forge_rankings_period(text,text,integer,integer)'::regprocedure), 'Public aggregate uses an explicit definer boundary');
select pg_temp.period_assert((select 'search_path=""' = any(proconfig) from pg_proc where oid = 'public.forge_rankings_period(text,text,integer,integer)'::regprocedure), 'Definer has an empty search path');
select pg_temp.period_assert(has_function_privilege('anon', 'public.forge_rankings_period(text,text,integer,integer)', 'EXECUTE'), 'Anonymous users can read public period aggregates');
select pg_temp.period_assert(has_function_privilege('authenticated', 'public.forge_rankings_period(text,text,integer,integer)', 'EXECUTE'), 'Authenticated users can read public period aggregates');
select pg_temp.period_assert(not exists(
  select 1 from pg_proc p, lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
  where p.oid = 'public.forge_rankings_period(text,text,integer,integer)'::regprocedure
    and a.grantee = 0 and a.privilege_type = 'EXECUTE'
), 'Unrestricted PUBLIC execute is revoked');
select pg_temp.period_assert((select not prosecdef from pg_proc where oid = 'public.forge_rankings(text,integer,integer)'::regprocedure), 'Existing all-time invoker endpoint is preserved');
select pg_temp.period_assert(not has_table_privilege('authenticated', 'public.test_sessions', 'INSERT'), 'Owners still cannot write scores');
select pg_temp.period_assert(not has_table_privilege('authenticated', 'public.test_sessions', 'UPDATE'), 'Owners still cannot rewrite scores');
select pg_temp.period_assert(not has_function_privilege('anon', 'public.forge_update_preferences(uuid,bigint,jsonb)', 'EXECUTE'), 'Anonymous role cannot change presentation preferences');

insert into auth.users(id,email) values
  ('a1111111-1111-4111-8111-111111111111', 'period-alice@example.invalid'),
  ('b2222222-2222-4222-8222-222222222222', 'period-bob@example.invalid'),
  ('c3333333-3333-4333-8333-333333333333', 'period-charlie@example.invalid'),
  ('d4444444-4444-4444-8444-444444444444', 'period-private@example.invalid');
update public.public_identities set handle = 'period_alice' where user_id = 'a1111111-1111-4111-8111-111111111111';
update public.public_identities set handle = 'period_bob' where user_id = 'b2222222-2222-4222-8222-222222222222';
update public.public_identities set handle = 'period_charlie' where user_id = 'c3333333-3333-4333-8333-333333333333';
-- A private profile alone must never supply a ranking handle.
delete from public.public_identities where user_id = 'd4444444-4444-4444-8444-444444444444';
update public.profiles set username = 'private-fixture-identity' where id = 'd4444444-4444-4444-8444-444444444444';

create function pg_temp.add_period_fixture(
  p_user uuid, p_key text, p_created timestamptz, p_wpm double precision,
  p_accuracy double precision default 95, p_metrics text default 'forge-v3',
  p_eligibility jsonb default '{"eligible":true}'
) returns void language sql as $$
  insert into public.test_sessions(user_id, test_mode, duration_seconds, elapsed_ms, total_characters,
    metrics_version, eligibility, comparison_key, created_at, net_wpm,
    accuracy_percent, accepted_result, per_char_metrics)
  values(p_user, 'time', 30, 30000, 100, p_metrics, p_eligibility, p_key, p_created, p_wpm,
    p_accuracy, '{"target":"private-fixture-passage","typed":"private-fixture-writing"}',
    '{"private-fixture-input-evidence":true}')
$$;
-- Calculate expected boundaries independently of the RPC's date_trunc calls.
create temp table period_boundaries as select
  ((now() at time zone 'UTC')::date)::timestamp at time zone 'UTC' as day_start,
  ((now() at time zone 'UTC')::date + 1)::timestamp at time zone 'UTC' as day_end,
  ((now() at time zone 'UTC')::date - (extract(isodow from now() at time zone 'UTC')::integer - 1))::timestamp at time zone 'UTC' as week_start,
  ((now() at time zone 'UTC')::date + (8 - extract(isodow from now() at time zone 'UTC')::integer))::timestamp at time zone 'UTC' as week_end;

select pg_temp.add_period_fixture('a1111111-1111-4111-8111-111111111111', 'period-main', now(), 80, 90);
select pg_temp.add_period_fixture('a1111111-1111-4111-8111-111111111111', 'period-main', now(), 100, 100);
select pg_temp.add_period_fixture('b2222222-2222-4222-8222-222222222222', 'period-main', now(), 100, 95);
select pg_temp.add_period_fixture('c3333333-3333-4333-8333-333333333333', 'period-main', now(), 90, 100);
select pg_temp.add_period_fixture('a1111111-1111-4111-8111-111111111111', 'period-main', now(), 9999, 1, 'forge-v3', '{"eligible":false}');
select pg_temp.add_period_fixture('a1111111-1111-4111-8111-111111111111', 'period-main', now(), 8888, 1, 'legacy-unverified');
select pg_temp.add_period_fixture('a1111111-1111-4111-8111-111111111111', 'period-main', now(), null, 1);
select pg_temp.add_period_fixture('a1111111-1111-4111-8111-111111111111', 'period-main', now(), 7777, 1, 'forge-v3', '{}');
select pg_temp.add_period_fixture('a1111111-1111-4111-8111-111111111111', 'period-other', now(), 6666, 1);
select pg_temp.add_period_fixture('d4444444-4444-4444-8444-444444444444', 'period-main', now(), 99999, 100);

-- The upper boundary belongs to the next period, not this period. The lower
-- boundary is included, and even one microsecond before it is excluded.
select pg_temp.add_period_fixture('a1111111-1111-4111-8111-111111111111', 'period-day-boundary', day_start, 100) from period_boundaries;
select pg_temp.add_period_fixture('b2222222-2222-4222-8222-222222222222', 'period-day-boundary', day_start - interval '1 microsecond', 500) from period_boundaries;
select pg_temp.add_period_fixture('c3333333-3333-4333-8333-333333333333', 'period-day-boundary', day_end, 600) from period_boundaries;
select pg_temp.add_period_fixture('a1111111-1111-4111-8111-111111111111', 'period-week-boundary', week_start, 100) from period_boundaries;
select pg_temp.add_period_fixture('b2222222-2222-4222-8222-222222222222', 'period-week-boundary', week_start - interval '1 microsecond', 500) from period_boundaries;
select pg_temp.add_period_fixture('c3333333-3333-4333-8333-333333333333', 'period-week-boundary', week_end, 600) from period_boundaries;

select pg_temp.period_assert((select count(*) = 3 from public.forge_rankings_period('period-main', 'day')), 'Only eligible forge-v3 non-null scores with approved identities enter public results');
select pg_temp.period_assert((select best_wpm = 100 and avg_accuracy = 95 and test_count = 2 and total_entries = 3 from public.forge_rankings_period('period-main', 'day') where handle = 'period_alice'), 'Period aggregates use actual accepted tests only');
select pg_temp.period_assert((select count(*) = 2 from public.forge_rankings_period('period-main', 'day') where "position" = 1), 'Equal speed and accuracy share rank one');
select pg_temp.period_assert((select "position" = 3 from public.forge_rankings_period('period-main', 'day') where handle = 'period_charlie'), 'Rank after a tie leaves the expected gap');
select pg_temp.period_assert((select count(*) = 1 and min(handle) = 'period_alice' from public.forge_rankings_period('period-day-boundary', 'day')), 'UTC day lower inclusive and upper exclusive boundaries');
select pg_temp.period_assert((select count(*) = 1 and min(handle) = 'period_alice' from public.forge_rankings_period('period-week-boundary', 'week')), 'UTC ISO week lower inclusive and upper exclusive boundaries');
select pg_temp.period_assert((select count(*) = 3 from public.forge_rankings_period('period-day-boundary', 'alltime')), 'Explicit alltime aggregate has no period cutoff');
select pg_temp.period_assert((select count(*) = 0 from public.forge_rankings_period('period-no-scores', 'day')), 'An empty period remains empty');
select pg_temp.period_assert((select count(*) = 0 from public.forge_rankings_period(null, 'week')), 'A missing comparison cannot expand to all comparisons');
select pg_temp.period_assert((select handle = 'period_bob' and "position" = 1 and total_entries = 3 from public.forge_rankings_period('period-main', 'day', 1, 1)), 'Pagination preserves full-table rank and totals');
select pg_temp.period_assert((select handle = 'period_alice' from public.forge_rankings_period('period-main', 'day', 0, -1)), 'Zero limit clamps to one and negative offset to zero');
select pg_temp.period_assert((select count(*) = 3 from public.forge_rankings_period('period-main', 'day', null, null)), 'Null pagination uses bounded defaults');

set local timezone = 'America/Los_Angeles';
select pg_temp.period_assert((select count(*) = 1 and min(handle) = 'period_alice' from public.forge_rankings_period('period-day-boundary', 'day')), 'Session timezone cannot move the UTC day boundary');
select pg_temp.period_assert((select count(*) = 1 and min(handle) = 'period_alice' from public.forge_rankings_period('period-week-boundary', 'week')), 'Session timezone cannot move the ISO week boundary');
reset timezone;

-- Check the actual hard limit with more distinct approved participants than a
-- page can return. These are local fixture users, not app fallback content.
insert into auth.users(id,email)
select md5('period-cap-' || n)::uuid, 'period-cap-' || n || '@example.invalid'
from generate_series(1,105) n;
insert into public.test_sessions(user_id,test_mode,duration_seconds,metrics_version,eligibility,comparison_key,created_at,net_wpm,accuracy_percent)
select md5('period-cap-' || n)::uuid, 'time',30,'forge-v3','{"eligible":true}','period-cap',now(),n,95
from generate_series(1,105) n;
select pg_temp.period_assert((select count(*) = 100 and min(total_entries) = 105 from public.forge_rankings_period('period-cap', 'day', 100000, 0)), 'A caller cannot exceed the 100-row cap');
select pg_temp.period_assert((select count(*) = 5 and min(total_entries) = 105 from public.forge_rankings_period('period-cap', 'day', 100000, 100)), 'Offset uses accepted participant count, not raw session count');
select pg_temp.period_assert((select count(*) = 0 from public.forge_rankings_period('period-cap', 'day', 25, 1000)), 'An offset beyond the final row is empty');
select pg_temp.period_assert((select count(*) = 25 from public.forge_rankings_period('period-cap', 'day', null, null)), 'The nullable default limit is 25');

set local role anon;
select set_config('request.jwt.claims','{"role":"anon"}',true);
select pg_temp.period_assert((select count(*) = 0 from public.test_sessions), 'Public ranking access does not expose raw session rows');
select pg_temp.period_assert((select count(*) = 0 from public.profiles), 'Public ranking access does not expose private profiles');
select pg_temp.period_assert((select count(*) = 3 from public.forge_rankings_period('period-main', 'day')), 'Anon receives approved aggregates across owners');
select pg_temp.period_assert((select bool_and(not is_own) from public.forge_rankings_period('period-main', 'day')), 'Anonymous results never claim an owner');
select pg_temp.period_assert((select bool_and(
  (select array_agg(k order by k) from jsonb_object_keys(to_jsonb(r)) keys(k)) =
    array['avg_accuracy','best_wpm','handle','is_own','position','test_count','total_entries','user_id']
  and to_jsonb(r)::text not like '%private-fixture%'
  and to_jsonb(r)::text not like '%@example.invalid%'
) from public.forge_rankings_period('period-main', 'day') r), 'RPC exposes exactly eight approved public fields, no passage, evidence or email');
do $$ declare invalid_period text; begin
  foreach invalid_period in array array['month','DAY','','all',null] loop
    begin
      perform public.forge_rankings_period('period-main', invalid_period);
      raise exception 'Invalid period was accepted';
    exception when invalid_parameter_value then null;
    end;
  end loop;
end $$;
reset role;

set local role authenticated;
select set_config('request.jwt.claims','{"role":"authenticated","sub":"a1111111-1111-4111-8111-111111111111"}',true);
select pg_temp.period_assert((select count(*) = 1 from public.forge_rankings_period('period-main', 'week') where is_own), 'Only the current authenticated owner is marked own');
select pg_temp.period_assert((select count(*) = 0 from public.test_sessions where user_id = 'b2222222-2222-4222-8222-222222222222'), 'Definer aggregate does not broaden owner session RLS');
select pg_temp.period_assert((public.forge_update_preferences('a1111111-1111-4111-8111-111111111111',0,'{"fontSize":28,"soundPack":"soft","reducedMotion":false}')->>'conflict')::boolean = false, 'Owner can save sound and reduced-motion values with existing preferences');
do $$ declare v_pack text; v_result jsonb; v_version bigint := 1; v_patch jsonb; begin
  foreach v_pack in array array['soft','mechanical','typewriter','arcade','minimal'] loop
    v_result := public.forge_update_preferences('a1111111-1111-4111-8111-111111111111',v_version,jsonb_build_object('soundPack',v_pack,'reducedMotion',true));
    perform pg_temp.period_assert((v_result->>'conflict')::boolean = false and v_result->'preferences'->>'soundPack' = v_pack, 'Every advertised sound pack is accepted for its owner');
    v_version := (v_result->>'version')::bigint;
  end loop;
  for v_patch in select value from jsonb_array_elements('[{"soundPack":"unknown"},{"soundPack":42},{"soundPack":null},{"soundPack":[]}]') loop
    begin
      perform public.forge_update_preferences('a1111111-1111-4111-8111-111111111111',v_version,v_patch);
      raise exception 'Invalid sound pack was accepted';
    exception when raise_exception then
      if sqlerrm <> 'Invalid sound pack' then raise; end if;
    end;
  end loop;
  for v_patch in select value from jsonb_array_elements('[{"reducedMotion":"true"},{"reducedMotion":1},{"reducedMotion":null},{"reducedMotion":[]}]') loop
    begin
      perform public.forge_update_preferences('a1111111-1111-4111-8111-111111111111',v_version,v_patch);
      raise exception 'Invalid reduced motion was accepted';
    exception when raise_exception then
      if sqlerrm <> 'Invalid reduced motion preference' then raise; end if;
    end;
  end loop;
end $$;
select pg_temp.period_assert((select preferences->>'fontSize' = '28' and preferences->>'soundPack' = 'minimal' and preferences->>'reducedMotion' = 'true' and version = 6 from public.user_preferences where user_id = 'a1111111-1111-4111-8111-111111111111'), 'Valid presentation updates preserve other preferences and invalid writes have no effect');
select pg_temp.period_assert((public.forge_update_preferences('a1111111-1111-4111-8111-111111111111',0,'{"soundPack":"arcade","reducedMotion":false}')->>'conflict')::boolean, 'Stale presentation updates return a conflict');
select pg_temp.period_assert((select preferences->>'soundPack' = 'minimal' and preferences->>'reducedMotion' = 'true' and version = 6 from public.user_preferences where user_id = 'a1111111-1111-4111-8111-111111111111'), 'Stale presentation updates cannot overwrite newer settings');
do $$ begin
  begin
    perform public.forge_update_preferences('b2222222-2222-4222-8222-222222222222',0,'{"soundPack":"arcade","reducedMotion":true}');
    raise exception 'Another owner presentation preferences were changed';
  exception when insufficient_privilege then null;
  end;
end $$;
do $$ begin
  begin
    insert into public.test_sessions(user_id,test_mode,duration_seconds,metrics_version,eligibility,comparison_key,net_wpm)
    values('a1111111-1111-4111-8111-111111111111','time',30,'forge-v3','{"eligible":true}','period-main',99999);
    raise exception 'Owner manufactured a ranked score';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

-- Reconcile via the existing trusted path and prove that the old endpoint is
-- still callable with its original argument/result contract.
select forge_private.reconcile('a1111111-1111-4111-8111-111111111111');
select forge_private.reconcile('b2222222-2222-4222-8222-222222222222');
select forge_private.reconcile('c3333333-3333-4333-8333-333333333333');
set local role anon;
select set_config('request.jwt.claims','{"role":"anon"}',true);
select pg_temp.period_assert((select count(*) = 3 from public.forge_rankings('period-main',25,0)), 'Unchanged all-time RPC remains readable');
select pg_temp.period_assert((select best_wpm = 100 from public.forge_rankings('period-main',25,0) where handle = 'period_alice'), 'Existing trusted all-time score behavior remains intact');
reset role;
rollback;
