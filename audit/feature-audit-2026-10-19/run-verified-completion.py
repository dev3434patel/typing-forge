from pathlib import Path
import json, os, subprocess, sys, time

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
root=Path.cwd(); out=root/'audit/feature-audit-2026-10-19'
deadline=time.time()+2400
while not (out/'verified-intro-process.json').exists():
    if time.time()>deadline: raise RuntimeError('Intro suite did not finish')
    time.sleep(2)

def run(name,command,env=None):
    return subprocess.run([sys.executable,str(out/'run-check.py'),name,*command],cwd=root,env=env).returncode

env=os.environ.copy()
env.update(PLAYWRIGHT_BASE_URL='http://127.0.0.1:4173',PLAYWRIGHT_BROWSERS='chromium,edge,firefox,webkit',PHP_E2E_ACCEPTANCE='1',PLAYWRIGHT_JSON_OUTPUT_NAME=str(out/'verified-fixture-confirmation.json'))
run('verified-fixture-confirmation',['node','node_modules/@playwright/test/cli.js','test','e2e/profile-identity.spec.ts','e2e/php-account-flow.spec.ts','e2e/input-guardrails.spec.ts','--grep','delayed initial profile|same-account auth refresh|initial profile fetch error|real PHP account|ordinary-clock cold startup','--workers=1','--retries=0','--forbid-only','--reporter=list,json','--output=audit/feature-audit-2026-10-19/verified-fixture-confirmation-artifacts'],env)
competition=out/'run-php-real-competition.mjs'
deadline=time.time()+600
while not competition.exists():
    if time.time()>deadline: raise RuntimeError('Competition harness was not prepared')
    time.sleep(2)
run('verified-php-competition-command',['node',str(competition)])
run('verified-mobile-command',[sys.executable,str(out/'run-verified-mobile.py')])
run('verified-typing-burst-command',['node',str(out/'measure-verified-typing.mjs')])
env=os.environ.copy();env['TYPING_BENCH_REPETITIONS']='16'
run('verified-typing-sustained-command',['node',str(out/'measure-verified-typing.mjs')],env)
