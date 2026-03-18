# PowerShell script to run Prisma migration for Customer PWA
Write-Host "Running Prisma migration for Customer PWA..." -ForegroundColor Green

# Navigate to backend directory
Set-Location -Path "backend"

# Run Prisma migration
Write-Host "Creating migration..." -ForegroundColor Yellow
npx prisma migrate dev --name add_customer_pwa_tables

# Generate Prisma client
Write-Host "Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate

Write-Host "Migration completed successfully!" -ForegroundColor Green
Write-Host "You can now start the backend server." -ForegroundColor Cyan

# Return to root directory
Set-Location -Path ".."
