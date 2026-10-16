$ErrorActionPreference = 'Stop'
$taskRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$taskCli = 'C:\Users\DELL\AppData\Local\npm-cache\_npx\1722e863ebfd623b\node_modules\lighthouse\cli\index.js'
$env:CHROME_PATH = 'C:\Users\DELL\AppData\Local\ms-playwright\chromium-1248\chrome-win64\chrome.exe'
$taskResults = @()
Push-Location $taskRoot
try {
  Copy-Item -LiteralPath dist/offline-build.json -Destination (Join-Path $PSScriptRoot 'lighthouse-release-build.json')
  foreach ($taskRun in 1..3) {
    Copy-Item -LiteralPath dist/offline-build.json -Destination (Join-Path $PSScriptRoot "lighthouse-release-$taskRun-build.json")
    $taskOutput = "audit/performance-polish-2026-10-16/lighthouse-mobile-release-$taskRun"
    node $taskCli 'http://127.0.0.1:4175/' '--chrome-flags=--headless=new --no-sandbox' '--output=json' '--output=html' '--only-categories=performance,accessibility,best-practices,seo' "--output-path=$taskOutput" '--quiet' *> (Join-Path $PSScriptRoot "lighthouse-release-$taskRun-command.txt")
    if ($LASTEXITCODE -ne 0) {
      Get-Content (Join-Path $PSScriptRoot "lighthouse-release-$taskRun-command.txt") -Tail 25
      throw "Lighthouse run $taskRun failed to complete."
    }
    $taskReport = Get-Content -LiteralPath "$taskOutput.report.json" -Raw | ConvertFrom-Json
    $taskBridge = $taskReport.audits.'network-requests'.details.items | Where-Object { $_.url -match '/assets/keyboard-scene-bridge-' } | Select-Object -First 1
    $taskMetrics = $taskReport.audits.metrics.details.items[0]
    $taskResult = [ordered]@{
      run = $taskRun
      performance = [math]::Round($taskReport.categories.performance.score * 100)
      accessibility = [math]::Round($taskReport.categories.accessibility.score * 100)
      bestPractices = [math]::Round($taskReport.categories.'best-practices'.score * 100)
      seo = [math]::Round($taskReport.categories.seo.score * 100)
      fcp = $taskReport.audits.'first-contentful-paint'.displayValue
      lcp = $taskReport.audits.'largest-contentful-paint'.displayValue
      tbt = $taskReport.audits.'total-blocking-time'.displayValue
      rawCls = $taskReport.audits.'cumulative-layout-shift'.numericValue
      observedFcpMs = $taskMetrics.observedFirstContentfulPaint
      sceneBridgeRequestMs = $taskBridge.rendererStartTime
      sceneStartsAfterObservedPaint = [bool]($taskBridge -and $taskBridge.rendererStartTime -ge ($taskMetrics.observedFirstContentfulPaint - 1))
    }
    $taskResults += $taskResult
    $taskResult | ConvertTo-Json -Compress
    $taskResults | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $PSScriptRoot 'lighthouse-release-results.json') -Encoding utf8
  }
  if (@($taskResults | Where-Object { $_.performance -lt 95 -or -not $_.sceneStartsAfterObservedPaint }).Count) {
    throw 'A measured mobile performance or paint-order gate did not pass. Preserve every report.'
  }
}
finally {
  Pop-Location
}
