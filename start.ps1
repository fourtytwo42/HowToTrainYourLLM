# Start the server
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd server; npm run dev"

# Start the client
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd client; npm run dev"

Write-Host "Starting server and client..." 