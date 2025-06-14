# Start a simple HTTP server for Time Design Test UI
Write-Host "Starting HTTP server for Time Design Test UI..." -ForegroundColor Green
Write-Host "Server will be available at: http://localhost:8080" -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Change to the current directory
Set-Location $PSScriptRoot

# Start Python HTTP server
if (Get-Command python -ErrorAction SilentlyContinue) {
    python -m http.server 8080
} elseif (Get-Command python3 -ErrorAction SilentlyContinue) {
    python3 -m http.server 8080
} else {
    Write-Host "Python is not installed. Please install Python to run the server." -ForegroundColor Red
    Write-Host "Alternatively, you can use any other HTTP server." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
} 