$env:JAVA_HOME = "C:\Users\p_kro\.antigravity\extensions\redhat.java-1.53.0-win32-x64\jre\21.0.10-win32-x86_64"
$env:ANDROID_HOME = "D:\antigravity\android_sdk"
$env:PATH = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\cmdline-tools\latest\bin;$env:PATH"

Write-Host "--- Using JAVA_HOME: $env:JAVA_HOME ---" -ForegroundColor Cyan
Write-Host "--- Using ANDROID_HOME: $env:ANDROID_HOME ---" -ForegroundColor Cyan

cd d:\webseeite-main\android-app\android

Write-Host "--- Cleaning build ---" -ForegroundColor Yellow
./gradlew clean

Write-Host "--- Starting APK Build (Release) ---" -ForegroundColor Green
./gradlew assembleRelease

if ($LASTEXITCODE -eq 0) {
    Write-Host "--- Build SUCCESSFUL! ---" -ForegroundColor Green
    $apkPath = Get-ChildItem -Path "app\build\outputs\apk\release\*.apk" | Select-Object -First 1
    Write-Host "APK Location: $($apkPath.FullName)" -ForegroundColor Cyan
} else {
    Write-Host "--- Build FAILED! ---" -ForegroundColor Red
}
