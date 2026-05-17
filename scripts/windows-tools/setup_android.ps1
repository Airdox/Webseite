$ErrorActionPreference = "Stop"
$WorkingDir = "D:\android-sdk"
$JdkUrl = "https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.10%2B7/OpenJDK17U-jdk_x64_windows_hotspot_17.0.10_7.zip"
$CmdLineToolsUrl = "https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip"

Write-Host "Creating directories..."
if (Test-Path $WorkingDir) {
    Remove-Item -Recurse -Force $WorkingDir -ErrorAction SilentlyContinue
}
New-Item -ItemType Directory -Force -Path "$WorkingDir" | Out-Null
New-Item -ItemType Directory -Force -Path "$WorkingDir\cmdline-tools" | Out-Null

Add-Type -AssemblyName System.IO.Compression.FileSystem

$ProgressPreference = 'SilentlyContinue'

# 1. Download and Extract JDK
Write-Host "Downloading JDK..."
$JdkZip = "$WorkingDir\jdk.zip"
Invoke-WebRequest -Uri $JdkUrl -OutFile $JdkZip -UseBasicParsing
Write-Host "Extracting JDK..."
[System.IO.Compression.ZipFile]::ExtractToDirectory($JdkZip, "$WorkingDir\jdk_temp")
$JdkExtractedFolder = Get-ChildItem "$WorkingDir\jdk_temp" | Select-Object -First 1
Move-Item -Path $JdkExtractedFolder.FullName -Destination "$WorkingDir\jdk"
Remove-Item -Force $JdkZip
Remove-Item -Force -Recurse "$WorkingDir\jdk_temp"

# 2. Download and Extract Command Line Tools
Write-Host "Downloading Android Command Line Tools..."
$CmdZip = "$WorkingDir\cmdline-tools.zip"
Invoke-WebRequest -Uri $CmdLineToolsUrl -OutFile $CmdZip -UseBasicParsing
Write-Host "Extracting Command Line Tools..."
[System.IO.Compression.ZipFile]::ExtractToDirectory($CmdZip, "$WorkingDir\cmdline_temp")
Move-Item -Path "$WorkingDir\cmdline_temp\cmdline-tools" -Destination "$WorkingDir\cmdline-tools\latest"
Remove-Item -Force $CmdZip
Remove-Item -Force -Recurse "$WorkingDir\cmdline_temp"

# 3. Setup Environment Variables
Write-Host "Setting Environment Variables..."
$env:JAVA_HOME = "$WorkingDir\jdk"
$env:ANDROID_HOME = "$WorkingDir"
$env:Path += ";$env:JAVA_HOME\bin;$env:ANDROID_HOME\cmdline-tools\latest\bin;$env:ANDROID_HOME\platform-tools"

# 4. Accept Licenses and install required sub-packages
Write-Host "Accepting licenses and installing SDK packages..."
try {
    Write-Output "y" | cmd.exe /c "`"$env:ANDROID_HOME\cmdline-tools\latest\bin\sdkmanager.bat`" --licenses"
    Write-Output "y" | cmd.exe /c "`"$env:ANDROID_HOME\cmdline-tools\latest\bin\sdkmanager.bat`" --licenses"
    Write-Output "y" | cmd.exe /c "`"$env:ANDROID_HOME\cmdline-tools\latest\bin\sdkmanager.bat`" --licenses"
    Write-Output "y" | cmd.exe /c "`"$env:ANDROID_HOME\cmdline-tools\latest\bin\sdkmanager.bat`" --licenses"
    Write-Output "y" | cmd.exe /c "`"$env:ANDROID_HOME\cmdline-tools\latest\bin\sdkmanager.bat`" --licenses"
    Write-Output "y" | cmd.exe /c "`"$env:ANDROID_HOME\cmdline-tools\latest\bin\sdkmanager.bat`" --licenses"
} catch {}

cmd.exe /c "`"$env:ANDROID_HOME\cmdline-tools\latest\bin\sdkmanager.bat`" `"platforms;android-34`" `"build-tools;34.0.0`" `"platform-tools`"" | Write-Host

Write-Host "Done!"
