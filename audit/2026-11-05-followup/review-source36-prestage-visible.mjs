import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { lstat, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const output='audit/2026-11-05-followup/source36-prestage-visible-review.json';
const root=process.cwd(),sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const git=(args,input)=>{const r=spawnSync('git',args,{input,windowsHide:true,maxBuffer:32*1024*1024});assert.ok([0,1].includes(r.status));return {status:r.status,stdout:r.stdout};};
const text=bytes=>new TextDecoder('utf-8',{fatal:true}).decode(bytes);
const names=args=>{const r=git(args);assert.equal(r.status,0);return text(r.stdout).split('\0').filter(Boolean);};
const tracked=names(['diff','HEAD','--name-only','-z','--diff-filter=ACMR']),untracked=names(['ls-files','--others','--exclude-standard','-z']);
const paths=[...new Set([...tracked,...untracked])].sort();
const ignoredResult=git(['check-ignore','--no-index','--stdin','-z'],Buffer.from(paths.join('\0')+'\0'));
const ignored=new Set(text(ignoredResult.stdout).split('\0').filter(Boolean));
const deleted=names(['diff','HEAD','--name-only','-z','--diff-filter=D']);
const staged=names(['diff','--cached','--name-only','-z']);
const head=text(git(['rev-parse','HEAD']).stdout).trim();
const establishedScanner='audit/2026-11-04/review-staged-release.mjs';
const patterns=[
  ['private-key',/-----BEGIN (?:RSA |EC |OPENSSH |DSA |ENCRYPTED )?PRIVATE KEY-----/g],
  ['aws-access-id',/\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g],
  ['github-token',/\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})\b/g],
  ['jwt',/\beyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\b/g],
  ['stripe-secret',/\bsk_(?:live|test)_[A-Za-z0-9]{20,}\b/g],
  ['literal-session-cookie',/(?:PHPSESSID|sparowtype_session)=[A-Za-z0-9,-]{20,}/g],
];
const forbidden=/(?:^|\/)(?:node_modules|backend\/storage|\.final[^/]*|\.playwright-artifacts[^/]*|verified-head-[^/]*)(?:\/|$)|(?:^|\/)backend\/config\.php$|(?:^|\/)\.env(?:\.|$)(?!example$)|\.(?:exe|dll|zip|7z|cpuprofile)$/i;
const runtimeArtifact=/^audit\/[^/]+\/(?:\.[^/]*artifacts|[^/]*-artifacts)(?:\/|$)/i;
const privateRuntimeBasename=/(?:^|\/)(?:app-config\.php|app\.json|admin\.json|browser-env\.json|ownership\.json|php\.ini|mariadb\.pid)$/i;
const media=/\.(?:png|jpe?g|webp|gif|ico|woff2?|mp[34]|ogg|webm|pdf)$/i;
const inventory=[],findings=[],forbiddenPaths=[],unwantedRuntimePaths=[],ignoredPaths=[],nonregular=[],decodingIssues=[],sparseNulFiles=[],changedDuringRead=[];
let scannedBytes=0,visibleBytes=0,textFiles=0,binaryFiles=0;
for(const file of paths){
  assert.ok(!path.isAbsolute(file)&&!file.split('/').includes('..'));
  const absolute=path.resolve(root,file);assert.ok(absolute.startsWith(root+path.sep));
  const before=await lstat(absolute);visibleBytes+=before.size;
  const row={file,bytes:before.size,trackedChanged:tracked.includes(file),untracked:untracked.includes(file),contentRead:false};
  inventory.push(row);
  if(ignored.has(file)){ignoredPaths.push(file);row.skipped='Ignored path: no contents read.';continue;}
  if(forbidden.test(file)||privateRuntimeBasename.test(file)){forbiddenPaths.push(file);row.skipped='Forbidden/private runtime path: no contents read.';continue;}
  if(runtimeArtifact.test(file)){unwantedRuntimePaths.push(file);row.skipped='Unreviewed runtime artifact directory: no contents read.';continue;}
  let regular=before.isFile()&&!before.isSymbolicLink();
  let ancestor=root;for(const component of path.relative(root,absolute).split(path.sep).slice(0,-1)){ancestor=path.join(ancestor,component);const info=await lstat(ancestor);if(!info.isDirectory()||info.isSymbolicLink())regular=false;}
  if(!regular){nonregular.push(file);row.skipped='Nonregular file or symlink ancestor: no contents read.';continue;}
  const bytes=await readFile(absolute),after=await lstat(absolute);
  row.contentRead=true;row.bytes=bytes.length;row.sha256=sha(bytes);scannedBytes+=bytes.length;
  if(before.size!==after.size||before.mtimeMs!==after.mtimeMs){changedDuringRead.push(file);row.changedDuringRead=true;}
  let content=null,encoding=null;
  if(bytes[0]===0xff&&bytes[1]===0xfe){encoding='utf16le-bom';try{content=new TextDecoder('utf-16le',{fatal:true}).decode(bytes.subarray(2));}catch{decodingIssues.push({file,kind:'invalid-utf16le'});}}
  else if(bytes[0]===0xfe&&bytes[1]===0xff){encoding='utf16be-bom';try{content=new TextDecoder('utf-16be',{fatal:true}).decode(bytes.subarray(2));}catch{decodingIssues.push({file,kind:'invalid-utf16be'});}}
  else if(media.test(file)){encoding='binary-media-not-text-scanned';binaryFiles++;}
  else{try{content=text(bytes);const nulCount=bytes.reduce((n,b)=>n+(b===0?1:0),0);encoding=nulCount?'utf8-with-nul':'utf8';if(nulCount/Math.max(1,bytes.length)>=0.1)decodingIssues.push({file,kind:'ambiguous-nul-heavy-text',nulCount,bytes:bytes.length});else if(nulCount)sparseNulFiles.push({file,nulCount,bytes:bytes.length});}catch{decodingIssues.push({file,kind:'invalid-utf8'});}}
  row.encoding=encoding;
  if(content!==null){textFiles++;for(const [kind,pattern]of patterns){pattern.lastIndex=0;for(const match of content.matchAll(pattern))findings.push({file,kind,line:content.slice(0,match.index).split('\n').length});}}
}
const result={
  recordedAt:new Date().toISOString(),status:findings.length||forbiddenPaths.length||unwantedRuntimePaths.length||nonregular.length||decodingIssues.length||changedDuringRead.length?'REVIEW-REQUIRED':'PASS-SCOPED-PRELIMINARY',
  scope:'Pre-stage working-tree scan of Git-visible tracked changes against HEAD plus untracked nonignored files. No staging or indexed-blob certification. Ignored/private/forbidden/runtime-artifact paths are classified before content reads. Six established credential patterns are applied to strictly decoded text; media are hashed but not text-scanned. No matched values are emitted. The active functional matrix may create additional files after this snapshot.',
  head,scanner:{file:'audit/2026-11-05-followup/review-source36-prestage-visible.mjs',sha256:sha(await readFile('audit/2026-11-05-followup/review-source36-prestage-visible.mjs')),patternSource:establishedScanner,patternSourceSha256:sha(await readFile(establishedScanner)),patternNames:patterns.map(([name])=>name)},
  trackedChangedCount:tracked.length,untrackedNonignoredCount:untracked.length,candidateFileCount:paths.length,textFiles,binaryFiles,visibleBytes,scannedBytes,stagedPathCount:staged.length,deletedPaths:deleted,
  largest20:inventory.slice().sort((a,b)=>b.bytes-a.bytes).slice(0,20).map(({file,bytes,contentRead,skipped})=>({file,bytes,contentRead,...(skipped?{skipped}:{})})),
  forbiddenPaths,unwantedRuntimePaths,ignoredPaths,nonregular,decodingIssues,sparseNulFiles,changedDuringRead,findings,inventory,
  limitations:['Preliminary only; final explicit staging review must scan actual indexed bytes and verify index/working equality or exact allowed line-ending normalization.','Ignored public logs are outside this Git-visible snapshot and require separate explicit review before any force-add.','No detected declared pattern is not a guarantee that all secrets, private information or vulnerabilities are absent.','Runtime artifacts classified as unwanted were not opened or visually inspected. No decision to publish them is implied.'],
  mutations:{production:false,tests:false,frozenHelpers:false,index:false,commit:false,services:false,testsExecuted:false,loadExecuted:false},
};
await writeFile(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({output,status:result.status,candidateFileCount:paths.length,trackedChanged:tracked.length,untracked:untracked.length,textFiles,binaryFiles,visibleBytes,scannedBytes,forbiddenPaths,unwantedRuntimePaths,ignoredPaths,nonregular,decodingIssues,sparseNulFiles,changedDuringRead,findingCount:findings.length,findings:findings.slice(0,30)}));
