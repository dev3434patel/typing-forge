-- Operator action on the chosen environment AFTER reviewing/replaying migrations.
-- Requires the pg_cron extension and a role allowed to create scheduled DB jobs.
create extension if not exists pg_cron with schema pg_catalog;
select cron.schedule('forge-evidence-retention','15 3 * * *','select forge_private.expire_evidence()');
select cron.schedule('forge-race-settlement','* * * * *','select forge_private.expire_rooms()');
-- Verify both cron.job rows and cron.job_run_details after an actual execution.
