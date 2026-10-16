$ErrorActionPreference = 'Stop'
$taskRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$taskChecksPath = Join-Path $PSScriptRoot 'final-source-checks.json'
$taskChecks = Get-Content -LiteralPath $taskChecksPath -Raw | ConvertFrom-Json
$taskCommands = @(
  @{ Name = 'typecheck'; Script = 'typecheck'; File = 'typecheck-final.txt' },
  @{ Name = 'lint'; Script = 'lint'; File = 'lint-final.txt' },
  @{ Name = 'unitCoverage'; Script = 'test:coverage'; File = 'coverage-final.txt' },
  @{ Name = 'build'; Script = 'build'; File = 'build-final.txt' },
  @{ Name = 'bundle'; Script = 'check:bundle'; File = 'bundle-final.json' }
)
Push-Location $taskRoot
try {
  foreach ($taskCommand in $taskCommands) {
    $taskLog = Join-Path $PSScriptRoot $taskCommand.File
    if ($taskCommand.Name -eq 'unitCoverage') {
      & npm.cmd run $taskCommand.Script -- --maxWorkers=2 *> $taskLog
    } elseif ($taskCommand.Name -eq 'bundle') {
      # The evidence file must remain JSON rather than npm's prefixed console log.
      & node scripts/check-bundle.mjs *> $taskLog
    } else {
      & npm.cmd run $taskCommand.Script *> $taskLog
    }
    $taskExit = $LASTEXITCODE
    $taskChecks.($taskCommand.Name).exitCode = $taskExit
    $taskChecks.($taskCommand.Name).evidence = $taskCommand.File
    $taskChecks.($taskCommand.Name).evidenceSha256 = (Get-FileHash -LiteralPath $taskLog -Algorithm SHA256).Hash.ToLowerInvariant()
    $taskChecks | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $taskChecksPath -Encoding utf8
    Write-Output "$($taskCommand.Name) exit=$taskExit"
    if ($taskExit -ne 0) {
      Get-Content -LiteralPath $taskLog -Tail 70
      throw "The $($taskCommand.Name) source gate failed."
    }
  }
  Copy-Item -LiteralPath dist/offline-build.json -Destination (Join-Path $PSScriptRoot 'final-build-identity.json')
  Get-Content -LiteralPath (Join-Path $PSScriptRoot 'final-build-identity.json') -Raw
} finally {
  Pop-Location
}
