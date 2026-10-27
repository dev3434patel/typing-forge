$ErrorActionPreference = 'Continue'
$taskWorkspace = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
Set-Location -LiteralPath $taskWorkspace
$taskRunId = (Get-Date).ToUniversalTime().ToString('yyyyMMddTHHmmssZ')
$taskStarted = (Get-Date).ToUniversalTime().ToString('o')
$taskNpm = (Get-Command npm.cmd -ErrorAction Stop).Source
$taskResults = [System.Collections.Generic.List[object]]::new()
$taskSummaryPath = Join-Path $PSScriptRoot "checks-summary-$taskRunId.json"
$env:SPAROWTYPE_PHP_PARITY_REPORT = Join-Path $PSScriptRoot "checks-php-parity-$taskRunId.json"
$env:SPAROWTYPE_COURSE_TEST_REPORT = Join-Path $PSScriptRoot "checks-php-course-$taskRunId.json"
$taskSummary = [ordered]@{
  startedAt = $taskStarted
  completedAt = $null
  sourceHead = (& git rev-parse HEAD)
  scope = 'Sequential source checks; no browser, build or HTTP/database mutation. test:database uses the historical isolated WASM compatibility fixture.'
  status = 'running'
  checks = @()
}
$taskChecks = @(
  @{ name = 'typecheck'; arguments = @('run', 'typecheck') },
  @{ name = 'lint'; arguments = @('run', 'lint') },
  @{ name = 'coverage'; arguments = @('run', 'test:coverage', '--', '--maxWorkers=2') },
  @{ name = 'database-portable'; arguments = @('run', 'test:database') },
  @{ name = 'content'; arguments = @('run', 'test:content') },
  @{ name = 'php-parity'; arguments = @('run', 'test:php') },
  @{ name = 'php-course'; arguments = @('run', 'test:course-php') },
  @{ name = 'dependency-audit'; arguments = @('audit', '--omit=dev', '--audit-level=high') }
)
foreach ($taskCheck in $taskChecks) {
  $taskName = $taskCheck.name
  $taskArguments = $taskCheck.arguments
  $taskLog = Join-Path $PSScriptRoot "checks-$taskName-$taskRunId.log"
  $taskGateStarted = Get-Date
  & $taskNpm @taskArguments *> $taskLog
  $taskExitCode = $LASTEXITCODE
  $taskGateCompleted = Get-Date
  $taskResults.Add([ordered]@{
    name = $taskName
    command = 'npm ' + ($taskArguments -join ' ')
    startedAt = $taskGateStarted.ToUniversalTime().ToString('o')
    durationSeconds = [Math]::Round(($taskGateCompleted - $taskGateStarted).TotalSeconds, 3)
    exitCode = $taskExitCode
    log = [System.IO.Path]::GetFileName($taskLog)
    tail = @((Get-Content -LiteralPath $taskLog -Tail 18))
  })
  $taskSummary.checks = $taskResults.ToArray()
  $taskSummary | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $taskSummaryPath -Encoding utf8
  Write-Output ([ordered]@{ check = $taskName; exitCode = $taskExitCode; durationSeconds = $taskResults[$taskResults.Count - 1].durationSeconds; log = [System.IO.Path]::GetFileName($taskLog) } | ConvertTo-Json -Compress)
}
$taskSummary.completedAt = (Get-Date).ToUniversalTime().ToString('o')
$taskSummary.status = if (@($taskResults | Where-Object { $_.exitCode -ne 0 }).Count -eq 0) { 'passed' } else { 'failed' }
$taskSummary | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $taskSummaryPath -Encoding utf8
Write-Output ([ordered]@{ status = $taskSummary.status; checks = $taskResults.Count; summary = [System.IO.Path]::GetFileName($taskSummaryPath) } | ConvertTo-Json -Compress)
