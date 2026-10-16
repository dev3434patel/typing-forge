param([switch]$OwnedBrowserWorkloadsClosedBeforeSet)

$ErrorActionPreference = 'Stop'
if (-not $OwnedBrowserWorkloadsClosedBeforeSet.IsPresent) {
  throw 'Close the owned browser lease and await all trace/report writes, then invoke with -OwnedBrowserWorkloadsClosedBeforeSet. No workloads are stopped by this script.'
}
$taskRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$taskCli = 'C:\Users\DELL\AppData\Local\npm-cache\_npx\1722e863ebfd623b\node_modules\lighthouse\cli\index.js'
$taskChrome = 'C:\Users\DELL\AppData\Local\ms-playwright\chromium-1248\chrome-win64\chrome.exe'
$taskUrl = 'http://127.0.0.1:4175/'
$taskFlags = @('--chrome-flags=--headless=new --no-sandbox', '--output=json', '--output=html', '--only-categories=performance,accessibility,best-practices,seo', '--quiet')
$taskResults = @()
$taskProtocolPath = Join-Path $PSScriptRoot 'lighthouse-release-protocol.json'
$taskProtocolArchive = Join-Path $PSScriptRoot 'lighthouse-hidden-animation-protocol.json'

function Read-TaskNumber($value) {
  if ($null -eq $value) { return 'unavailable' }
  try {
    $taskNumber = [double]$value
    if ([double]::IsNaN($taskNumber) -or [double]::IsInfinity($taskNumber)) { return 'unavailable' }
    return $taskNumber
  } catch { return 'unavailable' }
}

function Get-TaskLighthouseBrowsers {
  try {
    $taskProcesses = @(Get-CimInstance Win32_Process -Filter "Name = 'chrome.exe' OR Name = 'msedge.exe' OR Name = 'headless_shell.exe'" -ErrorAction Stop)
    $taskMatchingIds = [System.Collections.Generic.HashSet[uint32]]::new()
    foreach ($taskProcess in $taskProcesses) {
      # Chrome-launcher creates a fresh lighthouse.* temporary profile for every CLI run.
      # Inspect locally to identify ownership; never export command lines or profile paths.
      if ($taskProcess.CommandLine -match '(?i)--user-data-dir(?:=|\s+)"?[^\r\n]*[\\/]lighthouse\.') {
        [void]$taskMatchingIds.Add([uint32]$taskProcess.ProcessId)
      }
    }
    do {
      $taskAdded = $false
      foreach ($taskProcess in $taskProcesses) {
        if ($taskMatchingIds.Contains([uint32]$taskProcess.ParentProcessId) -and $taskMatchingIds.Add([uint32]$taskProcess.ProcessId)) { $taskAdded = $true }
      }
    } while ($taskAdded)
    $taskInventory = @($taskProcesses | Where-Object { $taskMatchingIds.Contains([uint32]$_.ProcessId) } | ForEach-Object {
      [ordered]@{ processId = $_.ProcessId; parentProcessId = $_.ParentProcessId; name = $_.Name; createdAtUtc = if ($_.CreationDate) { $_.CreationDate.ToUniversalTime().ToString('o') } else { 'unavailable' } }
    })
    return [ordered]@{ status = 'available'; matchingCount = $taskInventory.Count; processes = $taskInventory; scope = 'Only lighthouse.* profile browser processes and their browser descendants; unrelated user browsers are not stopped or classified as owned.' }
  } catch {
    return [ordered]@{ status = 'unavailable'; matchingCount = 'unavailable'; processes = @(); scope = 'CIM process inventory unavailable; zero owned browsers cannot be verified.' }
  }
}

function Get-TaskHostSnapshot {
  $taskCpu = [ordered]@{ status = 'unavailable'; totalPercent = 'unavailable'; source = 'Win32_PerfFormattedData_PerfOS_Processor._Total' }
  $taskMemory = [ordered]@{ status = 'unavailable'; totalPhysicalBytes = 'unavailable'; freePhysicalBytes = 'unavailable'; availableBytes = 'unavailable'; committedBytes = 'unavailable'; commitLimitBytes = 'unavailable' }
  $taskPaging = [ordered]@{ status = 'unavailable'; pageFaultsPerSecond = 'unavailable'; pageReadsPerSecond = 'unavailable'; pagesInputPerSecond = 'unavailable'; pagesOutputPerSecond = 'unavailable'; source = 'Win32_PerfFormattedData_PerfOS_Memory' }
  try {
    $taskCpuRow = Get-CimInstance Win32_PerfFormattedData_PerfOS_Processor -Filter "Name = '_Total'" -ErrorAction Stop | Select-Object -First 1
    $taskCpu.totalPercent = Read-TaskNumber $taskCpuRow.PercentProcessorTime
    if ($taskCpu.totalPercent -is [double]) { $taskCpu.status = 'available' }
  } catch { }
  try {
    $taskOs = Get-CimInstance Win32_OperatingSystem -ErrorAction Stop | Select-Object -First 1
    if ($null -ne $taskOs.TotalVisibleMemorySize) { $taskMemory.totalPhysicalBytes = [double]$taskOs.TotalVisibleMemorySize * 1024 }
    if ($null -ne $taskOs.FreePhysicalMemory) { $taskMemory.freePhysicalBytes = [double]$taskOs.FreePhysicalMemory * 1024 }
  } catch { }
  try {
    $taskMemoryRow = Get-CimInstance Win32_PerfFormattedData_PerfOS_Memory -ErrorAction Stop | Select-Object -First 1
    $taskMemory.availableBytes = Read-TaskNumber $taskMemoryRow.AvailableBytes
    $taskMemory.committedBytes = Read-TaskNumber $taskMemoryRow.CommittedBytes
    $taskMemory.commitLimitBytes = Read-TaskNumber $taskMemoryRow.CommitLimit
    $taskPaging.pageFaultsPerSecond = Read-TaskNumber $taskMemoryRow.PageFaultsPersec
    $taskPaging.pageReadsPerSecond = Read-TaskNumber $taskMemoryRow.PageReadsPersec
    $taskPaging.pagesInputPerSecond = Read-TaskNumber $taskMemoryRow.PagesInputPersec
    $taskPaging.pagesOutputPerSecond = Read-TaskNumber $taskMemoryRow.PagesOutputPersec
    if ($taskPaging.pageFaultsPerSecond -is [double]) { $taskPaging.status = 'available' }
  } catch { }
  if ($taskMemory.totalPhysicalBytes -is [double] -or $taskMemory.availableBytes -is [double]) { $taskMemory.status = 'available' }
  return [ordered]@{ timestampUtc = [DateTime]::UtcNow.ToString('o'); cpu = $taskCpu; memory = $taskMemory; paging = $taskPaging; lighthouseBrowsers = (Get-TaskLighthouseBrowsers) }
}

function Assert-TaskNoLighthouseBrowser($snapshot) {
  if ($snapshot.lighthouseBrowsers.status -ne 'available' -or $snapshot.lighthouseBrowsers.matchingCount -ne 0) {
    throw 'Cannot verify zero remaining Lighthouse-profile browsers. No process is killed or performance run retried; retain metadata and resolve ownership explicitly.'
  }
}

function Get-TaskBuildIdentity($value) {
  return [ordered]@{ version = $value.version; publicFiles = $value.publicFiles; bytes = $value.bytes }
}

function Assert-TaskFrozenBuild($expected) {
  $taskLocal = Get-TaskBuildIdentity (Get-Content -LiteralPath (Join-Path $taskRoot 'dist/offline-build.json') -Raw | ConvertFrom-Json)
  $taskServed = Get-TaskBuildIdentity (Invoke-RestMethod -Uri ($taskUrl + 'offline-build.json') -Method Get)
  $taskExpectedJson = $expected | ConvertTo-Json -Compress
  if (($taskLocal | ConvertTo-Json -Compress) -ne $taskExpectedJson -or ($taskServed | ConvertTo-Json -Compress) -ne $taskExpectedJson) {
    throw 'Local or served build changed from the frozen build identity. No audit run is started.'
  }
  return [ordered]@{ local = $taskLocal; served = $taskServed }
}

Push-Location $taskRoot
try {
  # Preserve the failed unconditioned checkpoint's protocol before declaring a new set.
  if (-not (Test-Path -LiteralPath $taskProtocolArchive)) {
    if (-not (Test-Path -LiteralPath $taskProtocolPath)) { throw 'Prior Lighthouse protocol is missing; preserve it before starting a new controlled set.' }
    Copy-Item -LiteralPath $taskProtocolPath -Destination $taskProtocolArchive
  }
  if (Test-Path -LiteralPath (Join-Path $PSScriptRoot 'lighthouse-control-host-1.json')) {
    throw 'This controlled set already started. Its reports and metadata will not be overwritten or automatically retried.'
  }
  $taskExpectedBuild = Get-TaskBuildIdentity (Get-Content -LiteralPath (Join-Path $PSScriptRoot 'final-build-identity.json') -Raw | ConvertFrom-Json)
  $null = Assert-TaskFrozenBuild $taskExpectedBuild
  $taskProtocol = [ordered]@{
    kind = 'controlled-fixed-quiet'; declaredAtUtc = [DateTime]::UtcNow.ToString('o'); quietBeforeEachRunSeconds = 30; runCount = 3; repeats = 3; automaticRetries = 0
    normalLighthouse = $true; qualityChanges = $false; scoreFiltering = $false; freshProfilePerRun = $true; ownedBrowserWorkloadsClosedBeforeSet = $true
    ownedBrowserClosureEvidence = 'Explicit caller attestation after parent browser lease handback and completed trace/report writes; matching Lighthouse process inventory before every run.'
    buildIdentity = $taskExpectedBuild; cli = $taskCli; chromePath = $taskChrome; url = $taskUrl; cliArguments = $taskFlags; flags = $taskFlags
    throttling = 'Unchanged default mobile simulated Lighthouse settings; no intro skip, renderer override, reduced motion or audit exclusions.'; lighthouseVersion = '13.5.0'; storageReset = $true
    hostPolicy = 'Counters are recorded, never used to threshold, filter or retry a score. Missing counters are unavailable. No unrelated process is killed. Every fixed run remains in the results.'
  }
  $taskProtocol | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $taskProtocolPath -Encoding utf8
  Copy-Item -LiteralPath dist/offline-build.json -Destination (Join-Path $PSScriptRoot 'lighthouse-release-build.json')
  $env:CHROME_PATH = $taskChrome
  foreach ($taskRun in 1..3) {
    $taskHostPath = Join-Path $PSScriptRoot "lighthouse-control-host-$taskRun.json"
    $taskHost = [ordered]@{ run = $taskRun; buildIdentity = $taskExpectedBuild; requestedQuietPeriodMs = 30000; quietElapsedMs = 'unavailable'; beforeQuiet = (Get-TaskHostSnapshot); beforeRun = 'unavailable'; afterRun = 'unavailable'; benchmarkIndex = 'unavailable'; cliExitCode = 'unavailable' }
    $taskHost | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $taskHostPath -Encoding utf8
    Assert-TaskNoLighthouseBrowser $taskHost.beforeQuiet
    $null = Assert-TaskFrozenBuild $taskExpectedBuild
    $taskQuietClock = [System.Diagnostics.Stopwatch]::StartNew()
    Start-Sleep -Seconds 30
    $taskQuietClock.Stop()
    $taskHost.quietElapsedMs = $taskQuietClock.Elapsed.TotalMilliseconds
    $taskHost.beforeRun = Get-TaskHostSnapshot
    $taskHost.buildCheckBeforeRun = Assert-TaskFrozenBuild $taskExpectedBuild
    $taskHost | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $taskHostPath -Encoding utf8
    Assert-TaskNoLighthouseBrowser $taskHost.beforeRun
    Copy-Item -LiteralPath dist/offline-build.json -Destination (Join-Path $PSScriptRoot "lighthouse-release-$taskRun-build.json")
    $taskOutput = "audit/performance-polish-2026-10-16/lighthouse-mobile-release-$taskRun"
    node $taskCli $taskUrl @taskFlags "--output-path=$taskOutput" *> (Join-Path $PSScriptRoot "lighthouse-release-$taskRun-command.txt")
    $taskHost.cliExitCode = $LASTEXITCODE
    $taskHost.afterRun = Get-TaskHostSnapshot
    $taskHost.buildCheckAfterRun = Assert-TaskFrozenBuild $taskExpectedBuild
    $taskHost | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $taskHostPath -Encoding utf8
    if ($taskHost.cliExitCode -ne 0) { throw "Lighthouse run $taskRun failed to complete; no automatic retry. Preserve its command output and host metadata." }
    $taskReport = Get-Content -LiteralPath "$taskOutput.report.json" -Raw | ConvertFrom-Json
    $taskHost.benchmarkIndex = Read-TaskNumber $taskReport.environment.benchmarkIndex
    $taskHost | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $taskHostPath -Encoding utf8
    Assert-TaskNoLighthouseBrowser $taskHost.afterRun
    $taskBridge = $taskReport.audits.'network-requests'.details.items | Where-Object { $_.url -match '/assets/keyboard-scene-bridge-' } | Select-Object -First 1
    $taskMetrics = $taskReport.audits.metrics.details.items[0]
    $taskResult = [ordered]@{
      run = $taskRun; performance = [math]::Round($taskReport.categories.performance.score * 100); accessibility = [math]::Round($taskReport.categories.accessibility.score * 100)
      bestPractices = [math]::Round($taskReport.categories.'best-practices'.score * 100); seo = [math]::Round($taskReport.categories.seo.score * 100)
      fcp = $taskReport.audits.'first-contentful-paint'.displayValue; lcp = $taskReport.audits.'largest-contentful-paint'.displayValue; tbt = $taskReport.audits.'total-blocking-time'.displayValue
      rawCls = $taskReport.audits.'cumulative-layout-shift'.numericValue; observedFcpMs = $taskMetrics.observedFirstContentfulPaint; sceneBridgeRequestMs = $taskBridge.rendererStartTime
      sceneStartsAfterObservedPaint = [bool]($taskBridge -and $taskBridge.rendererStartTime -ge ($taskMetrics.observedFirstContentfulPaint - 1))
      benchmarkIndex = $taskHost.benchmarkIndex; hostMetadata = "lighthouse-control-host-$taskRun.json"
    }
    $taskResults += $taskResult
    $taskResult | ConvertTo-Json -Compress
    $taskResults | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath (Join-Path $PSScriptRoot 'lighthouse-release-results.json') -Encoding utf8
  }
  if (@($taskResults | Where-Object { $_.performance -lt 95 -or $_.accessibility -ne 100 -or $_.bestPractices -ne 100 -or $_.seo -ne 100 -or -not $_.sceneStartsAfterObservedPaint }).Count) {
    throw 'A fixed controlled mobile score or paint-order gate did not pass. All three reports remain; no scores are filtered or retried.'
  }
} finally {
  Pop-Location
}
