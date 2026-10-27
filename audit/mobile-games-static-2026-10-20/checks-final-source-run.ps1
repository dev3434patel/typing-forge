$ErrorActionPreference = 'Continue'
$taskWorkspace = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
Set-Location -LiteralPath $taskWorkspace
$taskRunId = (Get-Date).ToUniversalTime().ToString('yyyyMMddTHHmmssZ')
$taskNpm = (Get-Command npm.cmd -ErrorAction Stop).Source
$taskResults = [System.Collections.Generic.List[object]]::new()
$taskSummaryPath = Join-Path $PSScriptRoot "checks-final-source-summary-$taskRunId.json"
$taskSummary = [ordered]@{
  startedAt = (Get-Date).ToUniversalTime().ToString('o')
  completedAt = $null
  sourceHead = (& git rev-parse HEAD)
  scope = 'Final integrated source checks: app/node/domain/portable typecheck, lint and full configured coverage. No browser/build/HTTP/database jobs. Earlier native parity/content/audit receipts are retained.'
  status = 'running'
  checks = @()
}
$taskChecks = @(
  @{ name = 'typecheck'; arguments = @('run', 'typecheck') },
  @{ name = 'lint'; arguments = @('run', 'lint') },
  @{ name = 'coverage'; arguments = @('run', 'test:coverage', '--', '--maxWorkers=2') }
)
foreach ($taskCheck in $taskChecks) {
  $taskLog = Join-Path $PSScriptRoot "checks-final-$($taskCheck.name)-$taskRunId.log"
  $taskStarted = Get-Date
  & $taskNpm @($taskCheck.arguments) *> $taskLog
  $taskExitCode = $LASTEXITCODE
  $taskResults.Add([ordered]@{
    name = $taskCheck.name
    command = 'npm ' + ($taskCheck.arguments -join ' ')
    startedAt = $taskStarted.ToUniversalTime().ToString('o')
    durationSeconds = [Math]::Round(((Get-Date) - $taskStarted).TotalSeconds, 3)
    exitCode = $taskExitCode
    log = [System.IO.Path]::GetFileName($taskLog)
    tail = @((Get-Content -LiteralPath $taskLog -Tail 20))
  })
  $taskSummary.checks = $taskResults.ToArray()
  $taskSummary | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $taskSummaryPath -Encoding utf8
  Write-Output ([ordered]@{check = $taskCheck.name; exitCode = $taskExitCode; log = [System.IO.Path]::GetFileName($taskLog)} | ConvertTo-Json -Compress)
}
$taskSummary.completedAt = (Get-Date).ToUniversalTime().ToString('o')
$taskSummary.status = if (@($taskResults | Where-Object {$_.exitCode -ne 0}).Count -eq 0) {'passed'} else {'failed'}
$taskSummary | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $taskSummaryPath -Encoding utf8
Write-Output ([ordered]@{status = $taskSummary.status; summary = [System.IO.Path]::GetFileName($taskSummaryPath)} | ConvertTo-Json -Compress)
