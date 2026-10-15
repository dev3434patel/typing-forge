create function public.forge_ranked_cohorts() returns table(comparison_key text,participants bigint)
language sql stable security invoker set search_path='' as $$
select b.comparison_key,count(*) from public.comparison_bests b where b.ranked group by b.comparison_key order by count(*) desc,b.comparison_key
$$;
revoke all on function public.forge_ranked_cohorts() from public;
grant execute on function public.forge_ranked_cohorts() to anon,authenticated;

create function public.forge_rankings(p_comparison_key text,p_limit integer default 25,p_offset integer default 0)
returns table("position" bigint,user_id uuid,handle text,best_wpm double precision,avg_accuracy double precision,test_count integer,total_entries bigint,is_own boolean)
language sql stable security invoker set search_path='' as $$
select rank() over(order by b.best_wpm desc nulls last,b.avg_accuracy desc nulls last),b.user_id,i.handle,b.best_wpm,b.avg_accuracy,b.test_count,count(*) over(),b.user_id=auth.uid()
from public.comparison_bests b join public.public_identities i on i.user_id=b.user_id
where b.ranked and b.comparison_key=p_comparison_key
order by b.best_wpm desc nulls last,b.avg_accuracy desc nulls last,b.user_id
limit least(greatest(p_limit,1),100) offset greatest(p_offset,0)
$$;
revoke all on function public.forge_rankings(text,integer,integer) from public;
grant execute on function public.forge_rankings(text,integer,integer) to anon,authenticated;
