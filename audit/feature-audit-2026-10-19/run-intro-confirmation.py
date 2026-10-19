from pathlib import Path
import os,subprocess,sys,time
root=Path.cwd();out=root/'audit/feature-audit-2026-10-19'
deadline=time.time()+900
while not (out/'verified-php-competition-command-process.json').exists():
 if time.time()>deadline:raise RuntimeError('Competition browser process did not exit')
 time.sleep(2)
env=os.environ.copy();env.update(PLAYWRIGHT_BASE_URL='http://127.0.0.1:4173',PLAYWRIGHT_BROWSERS='chromium,edge,firefox,webkit',PLAYWRIGHT_JSON_OUTPUT_NAME=str(out/'verified-intro-confirmation.json'))
command=['node','node_modules/@playwright/test/cli.js','test','e2e/caret-handoff-readiness.spec.ts','e2e/opening-single-keyboard.spec.ts','e2e/opening-worker.spec.ts','--grep','real delayed workspace|an actual caret module|normal-clock production worker|native worker transport failure|actual worker WebGL context loss','--workers=1','--retries=0','--forbid-only','--reporter=list,json','--output=audit/feature-audit-2026-10-19/verified-intro-confirmation-artifacts']
sys.exit(subprocess.run([sys.executable,str(out/'run-check.py'),'verified-intro-confirmation',*command],cwd=root,env=env).returncode)
