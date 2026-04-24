# Airdox Cloudflare Deployment Script

Write-Host "--- Start Airdox Cloudflare Deployment ---" -ForegroundColor Cyan

# 1. Check for Wrangler
if (Get-Command npx.cmd -ErrorAction SilentlyContinue) {
    Write-Host "[1/4] Checking for Cloudflare Wrangler..." -ForegroundColor Yellow
} else {
    Write-Error "npm/npx not found. Please install Node.js."
    exit 1
}

# 2. Build the project
Write-Host "[2/4] Building the project..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Error "Build failed!"
    exit 1
}

# 3. Deploy to Cloudflare Pages
Write-Host "[3/4] Deploying to Cloudflare Pages..." -ForegroundColor Yellow
Write-Host "Note: You might need to login first with 'npx.cmd wrangler login'" -ForegroundColor Gray

# Use npx.cmd wrangler deploy (Worker with Static Assets)
npx.cmd wrangler deploy

if ($LASTEXITCODE -ne 0) {
    Write-Error "Deployment failed!"
    exit 1
}

# 4. Bind Custom Domain (Manual Step)
Write-Host "`n--- Deployment Successful! ---" -ForegroundColor Green
Write-Host "Your site is now live on Cloudflare Pages."
Write-Host "`nWICHTIG: Die Einbindung der Domain 'airdox.info' muss zwingend im Cloudflare Dashboard erfolgen." -ForegroundColor Yellow
Write-Host "1. Loggen Sie sich in Ihr Cloudflare Konto ein."
Write-Host "2. Gehen Sie zu 'Workers & Pages' -> 'airdox-webseite'."
Write-Host "3. Klicken Sie auf den Tab 'Custom domains'."
Write-Host "4. Klicken Sie auf 'Set up a custom domain'."
Write-Host "5. Geben Sie 'airdox.info' und in einem zweiten Schritt 'www.airdox.info' ein."
Write-Host "Cloudflare konfiguriert das DNS und die SSL-Zertifikate dann automatisch."
