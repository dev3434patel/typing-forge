from pathlib import Path
import subprocess, json, time, os, sys
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
root=Path.cwd(); out=root/'audit/feature-audit-2026-10-19'; out.mkdir(exist_ok=True)
name=sys.argv[1]; command=sys.argv[2:]
if name=='php-intro' and (out/'frontend-rebuild-required.json').exists():
    receipt={'name':name,'command':command,'notExecuted':True,'exitCode':130,'reason':'Profile identity race and retention copy changed; run the intro on the rebuilt release instead of superseded frontend assets.'}
    (out/(name+'-process.json')).write_text(json.dumps(receipt,indent=2),encoding='utf-8')
    print(json.dumps(receipt));sys.exit(130)
if name in ['release-targeted','release-intro'] and (out/'recovery-rebuild-required.json').exists():
    receipt={'name':name,'command':command,'notExecuted':True,'exitCode':130,'reason':'Verify the WebKit module-preload recovery workaround on a new build before final targeted and intro acceptance.'}
    (out/(name+'-process.json')).write_text(json.dumps(receipt,indent=2),encoding='utf-8')
    print(json.dumps(receipt));sys.exit(130)
started=time.time()
with (out/(name+'.log')).open('w',encoding='utf-8') as log:
    child=subprocess.run(command,stdout=log,stderr=subprocess.STDOUT,cwd=root,env=os.environ.copy())
receipt={'name':name,'command':command,'exitCode':child.returncode,'durationSeconds':round(time.time()-started,3),'startedUnix':started,'finishedUnix':time.time()}
(out/(name+'-process.json')).write_text(json.dumps(receipt,indent=2),encoding='utf-8')
print(json.dumps(receipt))
print((out/(name+'.log')).read_text(encoding='utf-8',errors='replace')[-3500:])
sys.exit(child.returncode)
