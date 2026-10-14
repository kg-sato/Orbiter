param([switch]$Expanded, [string]$Executable, [string]$Profile)
$ErrorActionPreference = 'Stop'
$orbitRepo = Split-Path -Parent $PSScriptRoot
$orbitExecutable = if ($Executable) { $Executable } else { Join-Path $orbitRepo 'desktop\src-tauri\target\release\orbit-companion.exe' }
$orbitProfile = if ($Profile) { $Profile } else { Join-Path $orbitRepo 'build\desktop-performance' }
# Single-instance routing is application-wide. Never let QA hide/quit a live study session.
if (Get-Process -Name 'orbit-companion' -ErrorAction SilentlyContinue) {
  throw 'Close Orbiter explicitly before measuring a release. A QA profile does not isolate native single-instance commands.'
}
New-Item -ItemType Directory -Path $orbitProfile -Force | Out-Null
$orbitReady = Join-Path $orbitProfile 'ui-ready.json'
if (Test-Path -LiteralPath $orbitReady) { Remove-Item -LiteralPath $orbitReady }
$orbitArgs = @('--profile-dir', $orbitProfile, '--measure')
if ($Expanded) { $orbitArgs += '--measure-expanded' }
$orbitWatch = [System.Diagnostics.Stopwatch]::StartNew()
$orbitProcess = Start-Process -FilePath $orbitExecutable -ArgumentList $orbitArgs -PassThru -WindowStyle Hidden
while (-not (Test-Path -LiteralPath $orbitReady) -and $orbitWatch.Elapsed.TotalSeconds -lt 15) { Start-Sleep -Milliseconds 100 }
if (-not (Test-Path -LiteralPath $orbitReady)) { throw 'The native UI did not report readiness. Check IPC and window permissions.' }
$orbitStartup = $orbitWatch.Elapsed.TotalSeconds
function Get-OrbitProcesses {
  $orbitInventory = @(Get-CimInstance Win32_Process | Select-Object ProcessId, ParentProcessId)
  $orbitIds = [System.Collections.Generic.HashSet[int]]::new()
  [void]$orbitIds.Add($orbitProcess.Id)
  do { $orbitAdded = $false; foreach ($orbitRow in $orbitInventory) { if ($orbitIds.Contains([int]$orbitRow.ParentProcessId) -and $orbitIds.Add([int]$orbitRow.ProcessId)) { $orbitAdded = $true } } } while ($orbitAdded)
  @(Get-Process -Id @($orbitIds) -ErrorAction SilentlyContinue)
}
function Measure-Orbit([string]$Mode) {
  $orbitInitial = @(Get-OrbitProcesses)
  $orbitCpuStart = ($orbitInitial | Measure-Object -Property CPU -Sum).Sum
  $orbitClock = [System.Diagnostics.Stopwatch]::StartNew()
  Start-Sleep -Seconds 20
  $orbitFinal = @(Get-OrbitProcesses)
  $orbitCpuEnd = ($orbitFinal | Measure-Object -Property CPU -Sum).Sum
  [pscustomobject]@{
    Mode = $Mode
    Processes = $orbitFinal.Count
    CpuPercent = [math]::Round([math]::Max(0,($orbitCpuEnd-$orbitCpuStart)) / $orbitClock.Elapsed.TotalSeconds / [int]$env:NUMBER_OF_PROCESSORS * 100, 3)
    PrivateMB = [math]::Round(($orbitFinal | Measure-Object -Property PrivateMemorySize64 -Sum).Sum / 1MB, 1)
    WorkingSetMB = [math]::Round(($orbitFinal | Measure-Object -Property WorkingSet64 -Sum).Sum / 1MB, 1)
  }
}
Start-Sleep -Seconds 3
$orbitVisible = Measure-Orbit $(if($Expanded){'expanded'}else{'buddy'})
Start-Process -FilePath $orbitExecutable -ArgumentList @('--profile-dir', $orbitProfile, '--hide') -WindowStyle Hidden -Wait
Start-Sleep -Seconds 3
if (-not (Get-Process -Id $orbitProcess.Id -ErrorAction SilentlyContinue)) { throw 'Closing the buddy exited Orbit instead of keeping it in the tray.' }
$orbitTray = Measure-Orbit 'tray'
$orbitReport = [pscustomobject]@{ StartupSeconds = [math]::Round($orbitStartup,3); Ui = (Get-Content -LiteralPath $orbitReady | ConvertFrom-Json); Visible = $orbitVisible; Tray = $orbitTray; ExeMB = [math]::Round((Get-Item -LiteralPath $orbitExecutable).Length/1MB,2) }
$orbitReport | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $orbitProfile $(if($Expanded){'expanded.json'}else{'buddy.json'}))
$orbitReport | ConvertTo-Json -Depth 4
Start-Process -FilePath $orbitExecutable -ArgumentList @('--profile-dir', $orbitProfile, '--quit') -WindowStyle Hidden -Wait
