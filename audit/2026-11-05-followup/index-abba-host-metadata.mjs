import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpus, freemem, totalmem, loadavg } from 'node:os';
import v8 from 'node:v8';

// Read-only counters. Never query command lines, environment values or file contents.
export function indexAbbaHostMetadata(label) {
  const script = String.raw`$ErrorActionPreference='Stop'
$first=@(Get-CimInstance Win32_Process | Select-Object Name,ProcessId,ParentProcessId,CreationDate,WorkingSetSize,PrivatePageCount,KernelModeTime,UserModeTime)
$began=[DateTime]::UtcNow
Start-Sleep -Milliseconds 750
$second=@(Get-CimInstance Win32_Process | Select-Object Name,ProcessId,ParentProcessId,CreationDate,WorkingSetSize,PrivatePageCount,KernelModeTime,UserModeTime)
$ended=[DateTime]::UtcNow
$system=Get-CimInstance Win32_OperatingSystem | Select-Object TotalVisibleMemorySize,FreePhysicalMemory,TotalVirtualMemorySize,FreeVirtualMemory
$cpu=@(Get-CimInstance Win32_Processor | Select-Object Name,LoadPercentage,CurrentClockSpeed,MaxClockSpeed,NumberOfCores,NumberOfLogicalProcessors)
$timeWait=@(Get-NetTCPConnection -State TimeWait -ErrorAction SilentlyContinue)
[pscustomobject]@{first=$first;second=$second;began=$began.ToString('o');ended=$ended.ToString('o');system=$system;cpu=$cpu;timeWaitTotal=$timeWait.Count;timeWaitLoopback=@($timeWait|Where-Object {$_.LocalAddress -in @('127.0.0.1','::1')}).Count}|ConvertTo-Json -Depth 5 -Compress`;
  const measured = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], {encoding:'utf8', windowsHide:true, timeout:20000, maxBuffer:4*1024*1024});
  let windows;
  if (measured.status === 0) {
    const raw=JSON.parse(measured.stdout.replace(/^\uFEFF/,'')), prior=new Map(raw.first.map(p=>[p.ProcessId,p]));
    const rows=raw.second.map(p=>{
      const before=prior.get(p.ProcessId), same=before&&before.CreationDate===p.CreationDate;
      return {name:p.Name,pid:p.ProcessId,parentPid:p.ParentProcessId,started:p.CreationDate,workingSetBytes:Number(p.WorkingSetSize),privateBytes:Number(p.PrivatePageCount),cpuDeltaSeconds:same?Math.max(0,(Number(p.KernelModeTime)+Number(p.UserModeTime)-Number(before.KernelModeTime)-Number(before.UserModeTime))/1e7):null};
    });
    const grouped=Object.values(rows.reduce((groups,p)=>{const g=groups[p.name]??={name:p.name,count:0,workingSetBytes:0,privateBytes:0,cpuDeltaSeconds:0};g.count++;g.workingSetBytes+=p.workingSetBytes;g.privateBytes+=p.privateBytes;g.cpuDeltaSeconds+=p.cpuDeltaSeconds??0;return groups;},{}));
    windows={status:'OBSERVED',interval:{began:raw.began,ended:raw.ended,seconds:(Date.parse(raw.ended)-Date.parse(raw.began))/1000},system:raw.system,cpu:raw.cpu,processCount:rows.length,aggregateCpuDeltaSeconds:rows.reduce((s,p)=>s+(p.cpuDeltaSeconds??0),0),aggregateByName:grouped.sort((a,b)=>b.privateBytes-a.privateBytes),timeWait:{total:raw.timeWaitTotal,loopback:raw.timeWaitLoopback},nativeProcessCounts:grouped.filter(p=>['httpd.exe','mysqld.exe','php.exe'].includes(p.name))};
  } else windows={status:'UNVERIFIED',exitCode:measured.status,errorName:measured.error?.name??null};
  return {at:new Date().toISOString(),label,collector:{pid:process.pid,node:process.version,logicalCpus:cpus().length,cpuModel:cpus()[0]?.model,totalMemoryBytes:totalmem(),freeMemoryBytes:freemem(),loadAverage:loadavg(),v8HeapSizeLimitBytes:v8.getHeapStatistics().heap_size_limit,runtimeFlagsSha256:createHash('sha256').update(JSON.stringify(process.execArgv)).digest('hex'),nodeOptionsSha256:createHash('sha256').update(process.env.NODE_OPTIONS??'').digest('hex')},windows,limitations:['CIM clock is nominal reporting, not effective-frequency measurement.','Counters outside the timed actions provide context, not proof of a causal performance bottleneck.','No process command lines, environment contents or private file contents are collected; no process or OS setting is changed.']};
}
