-- Disposable local PostgreSQL fixture. No remote account deletion is performed.
begin;
create function pg_temp.audit_assert(condition boolean,message text) returns void language plpgsql as $$ begin if condition is distinct from true then raise exception 'AUDIT ASSERTION FAILED: %',message;end if;end $$;
select pg_temp.audit_assert(not has_function_privilege('authenticated','public.forge_delete_session(text)','EXECUTE'),'Legacy deletion cannot omit explicit owner intent');
select pg_temp.audit_assert(not has_function_privilege('anon','public.forge_delete_session_for_owner(uuid,text)','EXECUTE'),'Anonymous role cannot use owner deletion');
select pg_temp.audit_assert(has_function_privilege('authenticated','public.forge_delete_session_for_owner(uuid,text)','EXECUTE'),'Authenticated role can request checked deletion');

insert into auth.users(id,email) values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','audit-a@example.invalid'),('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','audit-b@example.invalid');
select set_config('request.jwt.claims','{"role":"service_role"}',true);
select public.forge_commit_session('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','same-client-id','sha256:'||repeat('c',64),'{"metricsVersion":"forge-v3","mode":"quote","comparisonKey":"audit","elapsedMs":1000,"metrics":{"wpm":12,"rawWpm":12,"inputAccuracy":100,"consistency":null,"retainedUnits":1,"correct":1,"incorrectAttempts":0},"eligibility":{"eligible":false},"timeSeries":[]}','{}','[]');
select public.forge_commit_session('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','same-client-id','sha256:'||repeat('d',64),'{"metricsVersion":"forge-v3","mode":"quote","comparisonKey":"audit","elapsedMs":1000,"metrics":{"wpm":12,"rawWpm":12,"inputAccuracy":100,"consistency":null,"retainedUnits":1,"correct":1,"incorrectAttempts":0},"eligibility":{"eligible":false},"timeSeries":[]}','{}','[]');

set local role authenticated;
select set_config('request.jwt.claims','{"role":"authenticated","sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"}',true);
do $$ begin begin
  perform public.forge_delete_session_for_owner('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','same-client-id');
  raise exception 'Stale account A intent deleted account B session';
exception when insufficient_privilege then null;end;end $$;
select pg_temp.audit_assert((select count(*)=1 from public.test_sessions where client_session_id='same-client-id'),'B retains its same-ID session after rejecting stale A intent');
select public.forge_delete_session_for_owner('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','same-client-id');
select pg_temp.audit_assert((select count(*)=0 from public.test_sessions),'Confirmed owner can delete its own session');
reset role;
select pg_temp.audit_assert((select count(*)=1 from public.test_sessions where user_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),'A session remains after B deletes its same client ID');

-- Matching must preserve the duration that the user selected, including when
-- this owner already has a public waiting room for a different duration.
set local role authenticated;
select set_config('request.jwt.claims','{"role":"authenticated","sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"}',true);
create temp table audit_waiting_30 as select public.forge_quick_match(30) room;
create temp table audit_waiting_60 as select public.forge_quick_match(60) room;
select pg_temp.audit_assert((select (room->>'duration_seconds')::integer=60 from audit_waiting_60),'Requesting 60 seconds does not reuse the owner 30 second room');
select pg_temp.audit_assert((select (a.room->>'id')<>(b.room->>'id') from audit_waiting_30 a cross join audit_waiting_60 b),'Different duration requests have different rooms');
select pg_temp.audit_assert((public.forge_quick_match(30)->>'id')=(select room->>'id' from audit_waiting_30),'Same duration reuses the matching owner waiting room');
select set_config('request.jwt.claims','{"role":"authenticated","sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"}',true);
select pg_temp.audit_assert((public.forge_quick_match(60)->>'id')=(select room->>'id' from audit_waiting_60),'Other owner matches a room with the requested duration');

-- A challenge is a one-use server resource, even when two synthetic accepted
-- envelopes attempt to consume it. This tests SQL effects, not human typing.
select set_config('request.jwt.claims','{"role":"authenticated","sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"}',true);
create temp table audit_challenge as select public.forge_issue_challenge(30) challenge;
reset role;
update public.typing_challenges set starts_at=now()-interval '31 seconds',deadline_at=now()-interval '1 second' where id=(select (challenge->>'id')::uuid from audit_challenge);
select set_config('request.jwt.claims','{"role":"service_role"}',true);
select public.forge_commit_session('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','ranked-first','sha256:'||repeat('e',64),jsonb_build_object('metricsVersion','forge-v3','mode','time','comparisonKey','ranked-audit','elapsedMs',30000,'metrics','{"wpm":12,"rawWpm":12,"inputAccuracy":100,"consistency":null,"retainedUnits":30,"correct":30,"incorrectAttempts":0}'::jsonb,'eligibility','{"eligible":true}'::jsonb,'challengeId',(select challenge->>'id' from audit_challenge),'timeSeries','[]'::jsonb),'{}','[]');
do $$ begin begin
  perform public.forge_commit_session('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','ranked-second','sha256:'||repeat('f',64),jsonb_build_object('metricsVersion','forge-v3','mode','time','comparisonKey','ranked-audit','elapsedMs',30000,'metrics','{"wpm":12,"rawWpm":12,"inputAccuracy":100,"consistency":null,"retainedUnits":30,"correct":30,"incorrectAttempts":0}'::jsonb,'eligibility','{"eligible":true}'::jsonb,'challengeId',(select challenge->>'id' from audit_challenge),'timeSeries','[]'::jsonb),'{}','[]');
  raise exception 'One-use challenge accepted twice';
exception when raise_exception then if sqlerrm='One-use challenge accepted twice' then raise;end if;end;end $$;
select pg_temp.audit_assert((select count(*)=1 from public.test_sessions where client_session_id in('ranked-first','ranked-second')),'A consumed challenge has one session effect');
rollback;
