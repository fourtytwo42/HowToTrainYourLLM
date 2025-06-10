# Model Workshop - Local Startup Script
Write-Host "🚀 Starting Model Workshop locally..." -ForegroundColor Green

# Check if Ollama is running
Write-Host "📡 Checking Ollama..." -ForegroundColor Yellow
try {
    $ollamaCheck = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -Method GET -ErrorAction Stop
    Write-Host "✅ Ollama is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Ollama is not running. Please start Ollama first." -ForegroundColor Red
    Write-Host "   Run: ollama serve" -ForegroundColor Yellow
    exit 1
}

# Start the backend server
Write-Host "🖥️  Starting Node.js backend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd server; npm run dev" -WindowStyle Normal

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Start the frontend
Write-Host "🌐 Starting React frontend..." -ForegroundColor Yellow  
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd client; npm run dev" -WindowStyle Normal

# Wait a moment for frontend to start
Start-Sleep -Seconds 3

# Start the Python worker
Write-Host "🐍 Starting Python worker..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd python; .\venv\Scripts\Activate.ps1; python worker_entrypoint.py" -WindowStyle Normal

Write-Host ""
Write-Host "🎉 Model Workshop is starting up!" -ForegroundColor Green
Write-Host "📱 Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "🔧 Backend:  http://localhost:3001" -ForegroundColor Cyan
Write-Host "🤖 Ollama:   http://localhost:11434" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to stop all services..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Stop all processes (this is basic - you might want to improve this)
Write-Host "🛑 Stopping services..." -ForegroundColor Red
Get-Process | Where-Object {$_.ProcessName -eq "node" -or $_.ProcessName -eq "python"} | Stop-Process -Force
Write-Host "✅ Services stopped" -ForegroundColor Green 