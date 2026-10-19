from pathlib import Path
import hashlib,json,os,subprocess,sys,time,urllib.request

sys.stdout.reconfigure(encoding='utf-8',errors='replace')
root=Path.cwd();out=root/'audit/feature-audit-2026-10-19'
deadline=time.time()+1800
while not (out/'php-functional-process.json').exists():
    if time.time()>deadline:raise RuntimeError('Initial browser matrix did not exit before rebuild deadline')
    time.sleep(1)

def run(name,command,env=None):
    return subprocess.run([sys.executable,str(out/'run-check.py'),name,*command],cwd=root,env=env).returncode

if run('release-build',['npm.cmd','run','build']):sys.exit(1)
if run('release-bundle',['npm.cmd','run','check:bundle']):sys.exit(1)
paths=[]
for folder in ['src','e2e','backend','scripts','build','public']:
    for path in (root/folder).rglob('*'):
        if path.is_file() and 'storage' not in path.parts and path.name!='config.php' and not path.name.endswith('.local.php') and path.suffix!='.log':paths.append(path)
for name in ['package.json','package-lock.json','vite.config.ts']:paths.append(root/name)
local=json.loads((root/'dist/offline-build.json').read_text())
served=json.load(urllib.request.urlopen('http://127.0.0.1:4173/offline-build.json'))
assert local==served,'Release is not the served build'
snapshot={'capturedUnix':time.time(),'local':local,'served':served,'sourceSha256':{str(p.relative_to(root)).replace('\\','/'):hashlib.sha256(p.read_bytes()).hexdigest() for p in paths}}
(out/'release-source-build.json').write_text(json.dumps(snapshot,indent=2),encoding='utf-8')
print(json.dumps({'releaseBuild':local,'hashedFiles':len(paths)}),flush=True)
heavy=['opening-experience.spec.ts','opening-low-power.spec.ts','opening-single-keyboard.spec.ts','opening-worker.spec.ts','caret-handoff-readiness.spec.ts']
env=os.environ.copy();env.update(PLAYWRIGHT_BASE_URL='http://127.0.0.1:4173',PHP_E2E_ACCEPTANCE='1')
cli=['node','node_modules/@playwright/test/cli.js','test']
functional=[str(p.relative_to(root)).replace('\\','/') for p in (root/'e2e').glob('*.spec.ts') if p.name not in heavy]
env['PLAYWRIGHT_BROWSERS']='edge';env['PLAYWRIGHT_JSON_OUTPUT_NAME']=str(out/'release-edge-functional.json')
run('release-edge-functional',cli+functional+['--workers=1','--retries=0','--forbid-only','--reporter=list,json','--output=audit/feature-audit-2026-10-19/release-edge-functional-artifacts'],env)
files=['profile-identity','php-account-flow','accessibility-audit','account-workspace','input-guardrails','secondary-pages','typing-audit-regressions','startup-recovery']
grep='delayed initial profile|same-account auth refresh|initial profile fetch error|real PHP account|existing guest pages|cross-tab account change|ordinary-clock cold startup|public information pages|delayed canonical-equivalent|startup recovers'
env['PLAYWRIGHT_BROWSERS']='chromium,firefox,webkit';env['PLAYWRIGHT_JSON_OUTPUT_NAME']=str(out/'release-targeted.json')
run('release-targeted',cli+['e2e/'+name+'.spec.ts' for name in files]+['--grep',grep,'--workers=1','--retries=0','--forbid-only','--reporter=list,json','--output=audit/feature-audit-2026-10-19/release-targeted-artifacts'],env)
env['PLAYWRIGHT_BROWSERS']='chromium,edge,firefox,webkit';env['PLAYWRIGHT_JSON_OUTPUT_NAME']=str(out/'release-intro.json')
run('release-intro',cli+['e2e/'+name for name in heavy]+['--workers=1','--retries=0','--forbid-only','--reporter=list,json','--output=audit/feature-audit-2026-10-19/release-intro-artifacts'],env)
