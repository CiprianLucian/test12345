# Start the backend server in a new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\backend'; npm run dev"

# Start the frontend server in a new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\frontend'; npm run dev"

Write-Host "Development servers started!"
Write-Host "Frontend will be available at: http://localhost:5173"
Write-Host "Backend will be available at: http://localhost:5000"
Write-Host "Press Ctrl+C in the respective windows to stop the servers"
