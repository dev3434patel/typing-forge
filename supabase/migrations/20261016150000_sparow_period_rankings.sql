-- Public period aggregates read server-owned accepted sessions only. Existing
-- forge_rankings and comparison_bests remain the all-time compatibility path.
create index test_sessions_ranked_period
on public.test_sessions(comparison_key, created_at desc, user_id)
include(net_wpm, accuracy_percent)
where metrics_version = 'forge-v3'
  and eligibility->>'eligible' = 'true'
  and net_wpm is not null;

create function public.forge_rankings_period(
  p_comparison_key text,
  p_period text,
  p_limit integer default 25,
  p_offset integer default 0
)
returns table(
  "position" bigint,
  user_id uuid,
  handle text,
  best_wpm double precision,
  avg_accuracy double precision,
  test_count integer,
  total_entries bigint,
  is_own boolean
)
language plpgsql stable security definer set search_path = '' as $$
declare
  v_start timestamptz;
  v_end timestamptz;
begin
  if p_period is null or p_period not in ('day', 'week', 'alltime') then
    raise exception using errcode = '22023',
      message = 'Ranking period must be day, week or alltime.';
  end if;
  if p_period = 'day' then
    v_start := date_trunc('day', now() at time zone 'UTC') at time zone 'UTC';
    v_end := (date_trunc('day', now() at time zone 'UTC') + interval '1 day') at time zone 'UTC';
  elsif p_period = 'week' then
    -- PostgreSQL date_trunc('week') starts on ISO Monday. All arithmetic is on
    -- UTC wall time, so the caller's TimeZone and DST cannot move a boundary.
    v_start := date_trunc('week', now() at time zone 'UTC') at time zone 'UTC';
    v_end := (date_trunc('week', now() at time zone 'UTC') + interval '1 week') at time zone 'UTC';
  end if;

  return query
  with aggregates as (
    select s.user_id, max(s.net_wpm) as best_wpm,
      avg(s.accuracy_percent) as avg_accuracy, count(*)::integer as test_count
    from public.test_sessions s
    where s.comparison_key = p_comparison_key
      and s.metrics_version = 'forge-v3'
      and s.eligibility->>'eligible' = 'true'
      and s.net_wpm is not null
      and (v_start is null or (s.created_at >= v_start and s.created_at < v_end))
    group by s.user_id
  )
  select rank() over(order by a.best_wpm desc nulls last, a.avg_accuracy desc nulls last),
    a.user_id, i.handle, a.best_wpm, a.avg_accuracy, a.test_count,
    count(*) over(), coalesce(a.user_id = auth.uid(), false)
  from aggregates a
  join public.public_identities i on i.user_id = a.user_id
  order by a.best_wpm desc nulls last, a.avg_accuracy desc nulls last, a.user_id
  limit least(greatest(coalesce(p_limit, 25), 1), 100)
  offset greatest(coalesce(p_offset, 0), 0);
end
$$;

revoke all on function public.forge_rankings_period(text,text,integer,integer) from public;
grant execute on function public.forge_rankings_period(text,text,integer,integer) to anon,authenticated;
comment on function public.forge_rankings_period(text,text,integer,integer) is
  'Approved public handles and accepted forge-v3 aggregates for a UTC day, ISO week or all time. No raw session evidence is returned.';
