from pathlib import Path
import hashlib,json,os,subprocess,sys,time,urllib.request

sys.stdout.reconfigure(encoding='utf-8',errors='replace')
root=Path.cwd();out=root/'audit/feature-audit-2026-10-19'
deadline=time.time()+1200
while not (out/'release-edge-functional-process.json').exists():
    if time.time()>deadline:raise RuntimeError('Edge checkpoint did not exit')
    time.sleep(1)

def run(name,command,env=None):
    return subprocess.run([sys.executable,str(out/'run-check.py'),name,*command],cwd=root,env=env).returncode

if run('recovery-build',['npm.cmd','run','build']):sys.exit(1)
if run('verified-bundle',['npm.cmd','run','check:bundle']):sys.exit(1)
paths=[]
for folder in ['src','e2e','backend','scripts','build','public']:
    for path in (root/folder).rglob('*'):
        if path.is_file() and 'storage' not in path.parts and path.name!='config.php' and not path.name.endswith('.local.php') and path.suffix!='.log':paths.append(path)
for name in ['package.json','package-lock.json','vite.config.ts']:paths.append(root/name)
local=json.loads((root/'dist/offline-build.json').read_text());served=json.load(urllib.request.urlopen('http://127.0.0.1:4173/offline-build.json'))
assert local==served,'Current release is not the served build'
(out/'verified-source-build.json').write_text(json.dumps({'capturedUnix':time.time(),'local':local,'served':served,'sourceSha256':{str(p.relative_to(root)).replace('\\','/'):hashlib.sha256(p.read_bytes()).hexdigest() for p in paths}},indent=2),encoding='utf-8')
print(json.dumps({'verifiedCandidate':local}),flush=True)
env=os.environ.copy();env.update(PLAYWRIGHT_BASE_URL='http://127.0.0.1:4173',PLAYWRIGHT_BROWSERS='chromium,edge,firefox,webkit',PHP_E2E_ACCEPTANCE='1')
cli=['node','node_modules/@playwright/test/cli.js','test']
common=['--workers=1','--retries=0','--forbid-only','--reporter=list,json']
env['PLAYWRIGHT_JSON_OUTPUT_NAME']=str(out/'recovery-startup.json')
if run('recovery-startup',cli+['e2e/startup-recovery.spec.ts',*common,'--output=audit/feature-audit-2026-10-19/recovery-startup-artifacts'],env):sys.exit(1)
files=['profile-identity','php-account-flow','accessibility-audit','account-workspace','input-guardrails','secondary-pages','typing-audit-regressions']
grep='delayed initial profile|same-account auth refresh|initial profile fetch error|real PHP account|existing guest pages|cross-tab account change|ordinary-clock cold startup|public information pages|delayed canonical-equivalent'
env['PLAYWRIGHT_JSON_OUTPUT_NAME']=str(out/'verified-targeted.json')
run('verified-targeted',cli+['e2e/'+name+'.spec.ts' for name in files]+['--grep',grep,*common,'--output=audit/feature-audit-2026-10-19/verified-targeted-artifacts'],env)
heavy=['opening-experience','opening-low-power','opening-single-keyboard','opening-worker','caret-handoff-readiness']
env['PLAYWRIGHT_JSON_OUTPUT_NAME']=str(out/'verified-intro.json')
run('verified-intro',cli+['e2e/'+name+'.spec.ts' for name in heavy]+[*common,'--output=audit/feature-audit-2026-10-19/verified-intro-artifacts'],env)
