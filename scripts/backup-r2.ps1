[CmdletBinding()]
param(
  [string]$BucketName = $env:R2_BACKUP_BUCKET,
  [string]$ObjectPrefix = "backups/$env:COMPUTERNAME/webseeite-main",
  [string]$TempDirectory = $env:TEMP,
  [switch]$SkipUpload,
  [switch]$IncludeEnvFiles,
  [switch]$KeepLocalArchive
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

function Write-Step {
  param([string]$Message)
  Write-Host "[backup-r2] $Message" -ForegroundColor Cyan
}

function Get-Sha256Hex {
  param(
    [Parameter(Mandatory = $true)][string]$Path
  )

  $sha256 = [System.Security.Cryptography.SHA256]::Create()
  $stream = [System.IO.File]::OpenRead($Path)
  try {
    $hashBytes = $sha256.ComputeHash($stream)
  } finally {
    $stream.Dispose()
    $sha256.Dispose()
  }

  return ([System.BitConverter]::ToString($hashBytes)).Replace('-', '').ToLowerInvariant()
}

function Require-Command {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string]$Hint
  )

  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "$Name not found. $Hint"
  }
}

if (-not $BucketName) {
  if (-not $SkipUpload) {
    if ($env:R2_BUCKET_NAME) {
      $BucketName = $env:R2_BUCKET_NAME
    } else {
      throw "Bucket missing. Use -BucketName or set env:R2_BACKUP_BUCKET (or env:R2_BUCKET_NAME)."
    }
  } else {
    $BucketName = '<skip-upload>'
  }
}

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$archiveName = "webseeite-main_$timestamp.tar.gz"
$archivePath = Join-Path $TempDirectory $archiveName
$checksumPath = "$archivePath.sha256"

$prefix = $ObjectPrefix.Trim('/')
if (-not $prefix) {
  throw "ObjectPrefix must not be empty."
}

$objectKey = if ($SkipUpload) { "<skip-upload>/$archiveName" } else { "$prefix/$archiveName" }
$checksumKey = "$objectKey.sha256"

$excludePatterns = @(
  '.git',
  '.wrangler',
  'node_modules',
  'dist',
  'build',
  'release',
  'playwright-report',
  'test-results',
  'scratch',
  '*.log',
  '.env',
  '.dev.vars'
)

if ($IncludeEnvFiles) {
  $excludePatterns = $excludePatterns | Where-Object { $_ -notin @('.env', '.dev.vars') }
}

Require-Command -Name 'tar.exe' -Hint 'Install Windows tar support.'

if ($SkipUpload -and -not $KeepLocalArchive) {
  $KeepLocalArchive = $true
}

$npxCommand = $null
if (-not $SkipUpload) {
  $npxCommand = Get-Command npx.cmd -ErrorAction SilentlyContinue
  if (-not $npxCommand) {
    $npxCommand = Get-Command npx -ErrorAction SilentlyContinue
  }
  if (-not $npxCommand) {
    throw "npx command not found. Install Node.js and npm."
  }
}

Write-Step "Repository root: $repoRoot"
Write-Step "Creating archive: $archivePath"

$tarArguments = @('-czf', $archivePath)
foreach ($pattern in $excludePatterns) {
  $tarArguments += "--exclude=$pattern"
}
$tarArguments += '.'

Push-Location $repoRoot
try {
  & tar.exe @tarArguments
  if ($LASTEXITCODE -ne 0) {
    throw "tar failed with exit code $LASTEXITCODE."
  }
} finally {
  Pop-Location
}

if (-not (Test-Path -LiteralPath $archivePath)) {
  throw "Archive was not created: $archivePath"
}

$archiveFile = Get-Item -LiteralPath $archivePath
Write-Step ("Archive size: {0:N2} MB" -f ($archiveFile.Length / 1MB))

try {
  $hash = Get-Sha256Hex -Path $archivePath
  $hashLine = "$hash  $archiveName"
  Set-Content -LiteralPath $checksumPath -Value $hashLine -Encoding ascii

  if ($SkipUpload) {
    Write-Step "Upload skipped. Archive created locally."
    Write-Host "Archive: $archivePath"
    Write-Host "Checksum: $checksumPath"
    return
  }

  Write-Step "Uploading backup to R2: $BucketName/$objectKey"
  & $npxCommand.Source wrangler r2 object put "$BucketName/$objectKey" --file "$archivePath"
  if ($LASTEXITCODE -ne 0) {
    throw "Upload failed for $BucketName/$objectKey."
  }

  Write-Step "Uploading checksum to R2: $BucketName/$checksumKey"
  & $npxCommand.Source wrangler r2 object put "$BucketName/$checksumKey" --file "$checksumPath" --content-type "text/plain"
  if ($LASTEXITCODE -ne 0) {
    throw "Upload failed for $BucketName/$checksumKey."
  }

  Write-Step "Backup completed."
  Write-Host "R2 object: $BucketName/$objectKey"
} finally {
  if (-not $KeepLocalArchive) {
    Remove-Item -LiteralPath $archivePath -Force -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath $checksumPath -Force -ErrorAction SilentlyContinue
  }
}
