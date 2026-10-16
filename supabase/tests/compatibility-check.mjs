// PostgreSQL/WASM syntax + SQL RLS checks with a minimal Supabase auth fixture.
// This complements real local Supabase tests; it does not emulate API/Reatime/Auth.
// node supabase/tests/compatibility-check.mjs <path-to-installed-pglite-package>
import {readFile,readdir} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
if(!process.argv[2])throw new Error('Pass the path to an installed @electric-sql/pglite package.');
const {PGlite}=await import(pathToFileURL(path.join(process.argv[2],'dist','index.js')).href);
const db=new PGlite();
const prelude=`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;
 create table auth.users(id uuid primary key,email text);
 create function auth.uid() returns uuid language sql stable as $$select (current_setting('request.jwt.claims',true)::jsonb->>'sub')::uuid$$;
 create function auth.role() returns text language sql stable as $$select current_setting('request.jwt.claims',true)::jsonb->>'role'$$;
 grant usage on schema public,auth to anon,authenticated,service_role;
 alter default privileges in schema public grant all on tables to anon,authenticated,service_role;
 create publication supabase_realtime;`;
try {
 await db.exec(prelude);
 const root=path.resolve(import.meta.dirname,'..','migrations');
 for(const file of (await readdir(root)).filter(name=>name.endsWith('.sql')).sort()){
  await db.exec(await readFile(path.join(root,file),'utf8'));process.stdout.write(`Replayed ${file}\n`);
 }
 await db.exec(await readFile(path.resolve(import.meta.dirname,'integrity.sql'),'utf8'));
 process.stdout.write('PostgreSQL compatibility replay + SQL integrity assertions passed.\n');
 await db.exec(await readFile(path.resolve(import.meta.dirname,'trust-boundary-audit.sql'),'utf8'));
 process.stdout.write('Owner-intent deletion, matched-duration rooms and one-use challenge assertions passed.\n');
 await db.exec(await readFile(path.resolve(import.meta.dirname,'period-rankings.sql'),'utf8'));
 process.stdout.write('UTC period rankings, bounded pagination, rejected periods, public aggregate privacy and owner/version-checked sound/reduced-motion preference assertions passed.\n');
 const upgrade=new PGlite();
 try{
  await upgrade.exec(prelude);
  const files=(await readdir(root)).filter(name=>name.endsWith('.sql')).sort();
  for(const file of files.filter(name=>name<'20261015'))await upgrade.exec(await readFile(path.join(root,file),'utf8'));
  await upgrade.exec(`insert into auth.users(id,email)values('44444444-4444-4444-8444-444444444444','legacy@example.invalid');
   insert into public.test_sessions(user_id,test_mode,duration_seconds,net_wpm)values('44444444-4444-4444-8444-444444444444','time',30,999);
   insert into public.leaderboards(user_id,wpm_best)values('44444444-4444-4444-8444-444444444444',999);
   insert into public.race_sessions(room_code,host_id,expected_text,status)values('LEGACY','44444444-4444-4444-8444-444444444444','legacy passage','waiting');`);
  for(const file of files.filter(name=>name>='20261015'))await upgrade.exec(await readFile(path.join(root,file),'utf8'));
  const [{rows}]=await upgrade.exec(`select
   (select count(*)=1 from public.test_sessions where metrics_version='legacy-unverified' and net_wpm=999) as history_preserved,
   (select count(*)=0 from public.leaderboards) as legacy_unranked,
   (select count(*)=1 from public.profiles where username not like '%@%') as safe_handle,
   (select status='cancelled' from public.race_sessions where room_code='LEGACY') as old_room_cancelled;`);
  if(Object.values(rows[0]).some(value=>value!==true))throw new Error('Legacy upgrade invariants failed.');
  process.stdout.write('Legacy upgrade fixture passed: history preserved, scores quarantined, handles safe, old rooms cancelled.\n');
 }finally{await upgrade.close();}
}catch(error){process.stderr.write(`SQL verification failed: ${error.message}\n${error.where??''}\n`);process.exitCode=1;}finally{await db.close();}
