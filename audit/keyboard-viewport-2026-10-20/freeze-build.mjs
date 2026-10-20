import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const directory='audit/keyboard-viewport-2026-10-20';
const local=JSON.parse(await readFile('dist/offline-build.json','utf8'));
const served=await fetch('http://127.0.0.1:4173/offline-build.json').then(response=>response.json());
if(JSON.stringify(local)!==JSON.stringify(served))throw Error('Build mismatch');
execFileSync('git',['diff','--exit-code','e525bc1','--','src/components/brand','src/lib/typing-core','backend']);
const sourceSha256={},normalizedSourceSha256={};for(const file of ['src/index.css','src/components/layout/Header.tsx','src/components/typing/LiveKeyboard.tsx','src/components/typing/TypingArea.tsx','src/components/typing/TypingShortcutHelp.tsx','src/components/typing/live-keyboard.css']){const bytes=await readFile(file);sourceSha256[file]=createHash('sha256').update(bytes).digest('hex');normalizedSourceSha256[file]=createHash('sha256').update(bytes.toString('utf8').replace(/\r\n/g,'\n')).digest('hex');}
await writeFile(`${directory}/source-build.json`,JSON.stringify({capturedAt:new Date().toISOString(),baseline:'e525bc1',local,served,canonicalMetricsFull3DAndBackendUnchanged:true,sourceSha256,normalizedSourceSha256},null,2));
console.log(JSON.stringify({local,served,canonicalMetricsFull3DAndBackendUnchanged:true}));
