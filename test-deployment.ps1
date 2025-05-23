# Test URLs
$frontendUrl = "https://aim-possible-frontend.azurewebsites.net"
$backendUrl = "https://aim-possible-backend.azurewebsites.net"

Write-Host "Testing Frontend..." -ForegroundColor Yellow
try {
    $frontendResponse = Invoke-WebRequest -Uri $frontendUrl -Method Get
    Write-Host "Frontend Status: $($frontendResponse.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "Frontend Error: $_" -ForegroundColor Red
}

Write-Host "`nTesting Backend..." -ForegroundColor Yellow
try {
    $backendResponse = Invoke-WebRequest -Uri "$backendUrl/health" -Method Get
    Write-Host "Backend Status: $($backendResponse.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "Backend Error: $_" -ForegroundColor Red
}

Write-Host "`nApplication URLs:" -ForegroundColor Cyan
Write-Host "Frontend: $frontendUrl"
Write-Host "Backend: $backendUrl"
