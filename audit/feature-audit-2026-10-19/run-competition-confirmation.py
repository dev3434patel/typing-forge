from pathlib import Path
import subprocess,sys,time
root=Path.cwd();out=root/'audit/feature-audit-2026-10-19'
deadline=time.time()+900
while not (out/'verified-intro-confirmation-process.json').exists():
 if time.time()>deadline:raise RuntimeError('Intro confirmation browsers did not exit')
 time.sleep(2)
sys.exit(subprocess.run([sys.executable,str(out/'run-check.py'),'verified-php-competition-confirmation-command','node',str(out/'run-php-real-competition-confirmation.mjs')],cwd=root).returncode)
