# Create a virtual environment
python -m venv venv

# Activate the virtual environment
.\venv\Scripts\Activate

# Install dependencies
pip install -r requirements.txt

# Create necessary directories
New-Item -ItemType Directory -Force -Path "..\data\raw"
New-Item -ItemType Directory -Force -Path "..\data\corpus"
New-Item -ItemType Directory -Force -Path "..\output"

Write-Host "Python environment setup complete!" 