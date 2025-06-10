import subprocess
import sys

def install_requirements():
    requirements = [
        "transformers==4.33.2",
        "accelerate==0.18.0",
        "bitsandbytes==0.39.0",
        "peft==0.4.0",
        "datasets==2.12.0",
        "huggingface-hub==0.17.4",
        "torch==2.1.1"
    ]
    
    print("Installing Python dependencies...")
    for package in requirements:
        print(f"Installing {package}...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", package])
    
    print("All dependencies installed successfully!")

if __name__ == "__main__":
    install_requirements() 