# Airdox Cloudflare Deployment Script

Write-Host "--- Start Airdox Cloudflare Deployment ---" -ForegroundColor Cyan

# 1. Check for Wrangler
if (Get-Command npx -ErrorAction SilentlyContinue) {
    Write-Host "[1/3] Checking for Cloudflare Wrangler..." -ForegroundColor Yellow
} else {
    Write-Error "npm/npx not found. Please install Node.js."
    exit 1
}

# 2. Build the project
Write-Host "[2/3] Building the project..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Error "Build failed!"
    exit 1
}

# 3. Deploy to Cloudflare Pages
Write-Host "[3/3] Deploying to Cloudflare Pages..." -ForegroundColor Yellow
Write-Host "Note: You might need to login first with 'npx wrangler login'" -ForegroundColor Gray

# Use npx wrangler pages deploy to upload the dist folder
# You will be prompted for your project name if not specified
npx wrangler pages deploy dist

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n--- Deployment Successful! ---" -ForegroundColor Green
    Write-Host "Your site is now live on Cloudflare Pages."
} else {
    Write-Error "Deployment failed!"
}
