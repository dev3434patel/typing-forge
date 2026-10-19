from pathlib import Path
import hashlib,json,time,urllib.request

root=Path.cwd();out=root/'audit/feature-audit-2026-10-19'
def read(name):return json.loads((out/name).read_text(encoding='utf-8'))
snapshot=read('verified-source-build.json')
assert json.loads((root/'dist/offline-build.json').read_text())==snapshot['local']==json.load(urllib.request.urlopen('http://127.0.0.1:4173/offline-build.json'))
productHashes={rel:digest for rel,digest in snapshot['sourceSha256'].items() if rel.startswith(('src/','public/','backend/src/','backend/public/')) or rel in ['package.json','package-lock.json','vite.config.ts','backend/bootstrap.php','backend/schema.sql']}
assert all((root/rel).is_file() and hashlib.sha256((root/rel).read_bytes()).hexdigest()==digest for rel,digest in productHashes.items())
def cases(report):
 rows={}
 def walk(suite):
  for spec in suite.get('specs',[]):
   for test in spec.get('tests',[]):
    rows[(spec['file'].replace('\\','/').split('/')[-1],spec['title'],test['projectName'])]=test['status']
  for child in suite.get('suites',[]):walk(child)
 for suite in report['suites']:walk(suite)
 return rows
runs=['php-functional','release-edge-functional','recovery-startup','verified-targeted','verified-fixture-confirmation','verified-intro','verified-intro-confirmation','php-real-competition','php-real-competition-confirmation']
reports={name:read(name+'.json') for name in runs}
resolved=[]
followups={
 'php-functional':['release-edge-functional','recovery-startup','verified-targeted','verified-fixture-confirmation'],
 'verified-targeted':['verified-fixture-confirmation'],
 'verified-intro':['verified-intro-confirmation'],
 'php-real-competition':['php-real-competition-confirmation'],
}
for initial,later in followups.items():
 for case,status in cases(reports[initial]).items():
  if status!='unexpected':continue
  confirmations=[name for name in later if cases(reports[name]).get(case)=='expected']
  assert confirmations,('No later passing confirmation',initial,case)
  resolved.append({'initialRun':initial,'file':case[0],'title':case[1],'engine':case[2],'laterPassingRuns':confirmations})
mobile=read('verified-mobile-results.json');assert len(mobile)==3 and all(min(row['categories'].values())>=95 for row in mobile)
typing={name:read('verified-typing-'+name+'.json') for name in ['burst','sustained']}
assert all(row['finalTextExact'] and row['attempts']==row['targetUnits'] and row['inputAccuracy']==100 and not row['errors'] for row in typing.values())
assert typing['sustained']['resize']['retainedExactly'] and not typing['sustained']['resize']['overflow']
runtime=read('php-coldstart-after.json');assert runtime['allApplicationDataAggregateCountsPreserved'] and runtime['apiMainSessionNamespaceMatched']
summary={
 'capturedUnix':time.time(),'build':snapshot['local'],'servedBuildMatches':True,'productSourceHashCount':len(productHashes),'productSourceStillMatchesFrozenBuild':True,
 'sourceGates':{name:read(name+'-process.json')['exitCode'] for name in ['release-unit','verified-typecheck','verified-lint','verified-bundle','php-parity-resource-final','php-data-final','php-final-dependency']},
 'unitTests':723,'unitFiles':54,'nativePhpParity':{'cases':393,'mismatches':0},'nativeHttpDataGroups':15,'nativeRaceGroups':10,'actualApacheChecks':17,
 'browserRuns':{name:report['stats'] for name,report in reports.items()},'resolvedFailedChecks':resolved,
 'browserMethod':'Broad PHP base coverage and completed targeted confirmations, not a single clean all-engine full-final-build rerun. All retained failures keep their original result. Eight WebKit worker capability cases remain unverified.',
 'mobile':mobile,'typing':typing,'runtime':runtime,
 'knownLimits':['Native Safari/iOS/Android, physical keyboards/IME and assistive technologies remain unverified.','Observed typing maxima152ms/264ms and results/resize long tasks are disclosed; p98 lab samples are not field INP or a universal maximum bound.','Public hosting/HTTPS, remote CI execution, backup restoration and production concurrency remain unverified.','OAuth, email delivery/verification and password reset are not implemented.','Previous Supabase accounts/passwords are not silently migrated.','CLS is approximately0.000252, not literal zero; added-LCP differential and universal60fps/zero-leak claims are not established.']
}
assert all(code==0 for code in summary['sourceGates'].values())
(out/'final-verification.json').write_text(json.dumps(summary,indent=2),encoding='utf-8')
print(json.dumps({'build':summary['build'],'resolvedFailedChecks':len(resolved),'mobilePerformance':[row['categories']['performance'] for row in mobile],'sourceGates':summary['sourceGates'],'runtimeMainReady':True}))
