$NodeDir = Join-Path (Get-Location) ".node"
$ZipPath = Join-Path $NodeDir "node.zip"
$NodeUrl = "https://nodejs.org/dist/v22.11.0/node-v22.11.0-win-x64.zip"

if (-not (Test-Path $NodeDir)) {
    New-Item -ItemType Directory -Path $NodeDir | Out-Null
}

$NodeExePath = Join-Path $NodeDir "node-v22.11.0-win-x64\node.exe"
if (-not (Test-Path $NodeExePath)) {
    Write-Host "Downloading portable Node.js v22.11.0 from $NodeUrl..."
    Invoke-WebRequest -Uri $NodeUrl -OutFile $ZipPath
    
    Write-Host "Extracting Node.js..."
    Expand-Archive -Path $ZipPath -DestinationPath $NodeDir
    
    Write-Host "Cleaning up zip file..."
    Remove-Item -Path $ZipPath
}

Write-Host "Portable Node.js v22.11.0 is ready at $NodeExePath"
