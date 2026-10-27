param([Parameter(Mandatory = $true)][string]$Destination)

$ErrorActionPreference = 'Stop'
if (Test-Path -LiteralPath $Destination) { throw "Preserve existing metadata: $Destination" }
$capturedAt = [DateTime]::UtcNow.ToString('o')
$operatingSystem = Get-CimInstance Win32_OperatingSystem
$packageMetadata = node -e @'
const fs = require('node:fs');
const p = require('playwright');
const declared = JSON.parse(fs.readFileSync('node_modules/playwright-core/browsers.json', 'utf8')).browsers;
console.log(JSON.stringify({playwrightVersion:require('playwright/package.json').version,
  browsers:['chromium','firefox','webkit'].map(name => ({name, executablePath:p[name].executablePath(),
    packageMetadata:declared.find(browser=>browser.name===name)})),
  headlessShell:declared.find(browser=>browser.name==='chromium-headless-shell')}));
'@
if ($LASTEXITCODE -ne 0) { throw 'Unable to read Playwright installation metadata.' }
$installation = $packageMetadata | ConvertFrom-Json
$browsers = @()
function FileMetadata([string]$Name, [string]$Executable, $Declared) {
  $present = Test-Path -LiteralPath $Executable -PathType Leaf
  $fileVersion = if ($present) { (Get-Item -LiteralPath $Executable).VersionInfo } else { $null }
  return [ordered]@{ name = $Name; executablePath = $Executable; installed = $present;
    executableProductVersion = $fileVersion.ProductVersion; executableFileVersion = $fileVersion.FileVersion;
    declaredEngineVersion = $Declared.browserVersion; declaredRevision = $Declared.revision;
    versionObservation = 'Read-only executable file resources and Playwright package metadata; browser not launched.' }
}
foreach ($browser in $installation.browsers) {
  $browsers += FileMetadata $browser.name $browser.executablePath $browser.packageMetadata
}
$chromiumDirectory = Split-Path (Split-Path $installation.browsers[0].executablePath)
$installDirectory = Split-Path $chromiumDirectory
$shellDirectory = Join-Path $installDirectory ('chromium_headless_shell-' + $installation.headlessShell.revision)
$shellExecutable = Get-ChildItem -LiteralPath $shellDirectory -Filter 'chrome-headless-shell.exe' -File -Recurse |
  Select-Object -First 1 -ExpandProperty FullName
if ($shellExecutable) { $browsers += FileMetadata 'chromium-headless-shell' $shellExecutable $installation.headlessShell }
$edgeCandidates = @(
  (Join-Path ${env:ProgramFiles(x86)} 'Microsoft/Edge/Application/msedge.exe'),
  (Join-Path $env:ProgramFiles 'Microsoft/Edge/Application/msedge.exe')
)
$edgeExecutable = $edgeCandidates | Where-Object { Test-Path -LiteralPath $_ -PathType Leaf } | Select-Object -First 1
if ($edgeExecutable) { $browsers += FileMetadata 'edge' $edgeExecutable $null }
$totalBytes = [int64]$operatingSystem.TotalVisibleMemorySize * 1024
$freeBytes = [int64]$operatingSystem.FreePhysicalMemory * 1024
$receipt = [ordered]@{
  capturedAt = $capturedAt
  purpose = 'Descriptive environment metadata before final verification/measurement; not a selection or retry criterion.'
  collection = 'Win32_OperatingSystem CIM plus executable file-version resources and local package JSON; no browser/app launched or closed.'
  memory = [ordered]@{ source = 'Win32_OperatingSystem'; totalVisiblePhysicalBytes = $totalBytes;
    freePhysicalBytes = $freeBytes; freePhysicalPercent = [math]::Round(100 * $freeBytes / $totalBytes, 2) }
  playwrightVersion = $installation.playwrightVersion
  browsers = $browsers
  limitations = 'A point-in-time memory snapshot does not establish causes of historical timeouts. Package engine versions describe this Playwright installation; WebKit runner file versions are not Safari release versions. Runtime browser versions are recorded separately by runners when available.'
  userAppsClosed = $false
  browserLaunches = 0
  memoryBasedRetriesOrFiltering = $false
}
$receipt | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $Destination -Encoding utf8
Write-Output ([pscustomobject]$receipt | Select-Object capturedAt, memory, playwrightVersion | ConvertTo-Json -Compress)
