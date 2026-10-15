param([string]$SigningKey = "$PSScriptRoot\..\.release-keys\orbiter-updater.key")
$ErrorActionPreference = 'Stop'
$project = (Resolve-Path "$PSScriptRoot\..").Path
if (!(Test-Path -LiteralPath $SigningKey)) { throw 'Updater signing key missing. Restore the original private key; do not generate a replacement for an existing update channel.' }
$env:TAURI_SIGNING_PRIVATE_KEY = (Resolve-Path -LiteralPath $SigningKey).Path
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = ''
$env:CARGO_TARGET_DIR = "$project\build\desktop-target-040"
$env:PATH = "$env:USERPROFILE\.cargo\bin;$env:PATH"
try {
    Push-Location $project
    npm.cmd run build:core
    if ($LASTEXITCODE) { throw 'Frontend build failed' }
    npm.cmd run desktop:prepare
    if ($LASTEXITCODE) { throw 'Native asset preparation failed' }
    Push-Location "$project\desktop"
    try {
        & "$project\node_modules\.bin\tauri.cmd" build
        if ($LASTEXITCODE) { throw 'Native build failed' }
    } finally { Pop-Location }
    python "$project\scripts\prepare_update.py"
    if ($LASTEXITCODE) { throw 'Release staging failed' }
} finally {
    Pop-Location
    Remove-Item Env:\TAURI_SIGNING_PRIVATE_KEY -ErrorAction SilentlyContinue
    Remove-Item Env:\TAURI_SIGNING_PRIVATE_KEY_PASSWORD -ErrorAction SilentlyContinue
}
