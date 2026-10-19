from pathlib import Path
import subprocess,json,time,os,urllib.request,sys
sys.stdout.reconfigure(encoding='utf-8',errors='replace')
root=Path.cwd();out=root/'audit/feature-audit-2026-10-19'
cli=Path('C:/Users/DELL/AppData/Local/npm-cache/_npx/1722e863ebfd623b/node_modules/lighthouse/cli/index.js')
chrome=Path('C:/Users/DELL/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe')
url='http://127.0.0.1:4173/'
expected=json.loads((out/'php-source-build.json').read_text())['local']
def identity():
 local=json.loads((root/'dist/offline-build.json').read_text());served=json.load(urllib.request.urlopen(url+'offline-build.json'))
 assert local==served==expected,'Build identity changed'
 return {'local':local,'served':served}
def host():
 script="$ErrorActionPreference='Stop'; $cpu=Get-CimInstance Win32_PerfFormattedData_PerfOS_Processor -Filter \"Name = '_Total'\"; $mem=Get-CimInstance Win32_OperatingSystem; [ordered]@{timestampUtc=[DateTime]::UtcNow.ToString('o');cpuPercent=$cpu.PercentProcessorTime;totalPhysicalKiB=$mem.TotalVisibleMemorySize;freePhysicalKiB=$mem.FreePhysicalMemory} | ConvertTo-Json -Compress"
 result=subprocess.run(['powershell','-NoProfile','-Command',script],capture_output=True,text=True,creationflags=0x08000000)
 try:return json.loads(result.stdout)
 except:return {'status':'unavailable','exitCode':result.returncode}
for phase in ['php-functional','php-intro']:
 receipt=json.loads((out/(phase+'-process.json')).read_text())
 assert 'exitCode' in receipt,'Browser process has not finished'
assert cli.is_file() and chrome.is_file()
protocol={'declaredUnix':time.time(),'runCount':3,'automaticRetries':0,'quietBeforeEachSeconds':30,'qualityOverrides':False,'introSkip':False,'reducedMotionOverride':False,'freshProfiles':True,'scoreFiltering':False,'build':expected,'url':url,'cli':str(cli),'chrome':str(chrome),'method':'Default Lighthouse mobile simulated throttling. Owned browser test commands have exited; other user applications are left alone. Host counters are recorded without thresholds, filtering or retries.'}
protocolPath=out/'php-mobile-protocol.json';assert not protocolPath.exists(),'Fixed run set already started'
protocolPath.write_text(json.dumps(protocol,indent=2))
env=os.environ.copy();env['CHROME_PATH']=str(chrome)
rows=[]
for i in range(1,4):
 print('Mobile Lighthouse fixed run',i,'of 3: 30-second quiet window',flush=True);time.sleep(30)
 before={'host':host(),'identity':identity()};started=time.time()
 output=out/f'php-mobile-{i}'
 command=['node',str(cli),url,'--chrome-flags=--headless=new --no-sandbox','--output=json','--output=html','--only-categories=performance,accessibility,best-practices,seo','--quiet',f'--output-path={output}']
 with (out/f'php-mobile-{i}-command.log').open('w',encoding='utf-8') as log:
  completed=subprocess.run(command,cwd=root,env=env,stdout=log,stderr=subprocess.STDOUT)
 receipt={'command':command,'exitCode':completed.returncode,'durationSeconds':time.time()-started,'before':before,'after':{'host':host(),'identity':identity()}}
 (out/f'php-mobile-{i}-process.json').write_text(json.dumps(receipt,indent=2))
 if completed.returncode: raise RuntimeError(f'Lighthouse run{i} did not complete; retained without retry')
 report=json.loads((out/f'php-mobile-{i}.report.json').read_text());audits=report['audits'];metrics=audits['metrics']['details']['items'][0]
 bridge=next((x for x in audits['network-requests']['details']['items'] if '/assets/keyboard-scene-bridge-' in x['url']),None)
 row={'run':i,'categories':{k:round(v['score']*100) if v.get('score') is not None else None for k,v in report['categories'].items()},'fcpMs':audits['first-contentful-paint']['numericValue'],'lcpMs':audits['largest-contentful-paint']['numericValue'],'tbtMs':audits['total-blocking-time']['numericValue'],'cls':audits['cumulative-layout-shift']['numericValue'],'observedFcpMs':metrics.get('observedFirstContentfulPaint'),'sceneBridgeRequestMs':bridge.get('rendererStartTime') if bridge else None,'benchmarkIndex':report['environment'].get('benchmarkIndex'),'lighthouseVersion':report['lighthouseVersion']}
 row['sceneAfterPaint']=bool(row['sceneBridgeRequestMs'] is not None and row['observedFcpMs'] is not None and row['sceneBridgeRequestMs']>=row['observedFcpMs']-1)
 rows.append(row);(out/'php-mobile-results.json').write_text(json.dumps(rows,indent=2));print(json.dumps(row),flush=True)
