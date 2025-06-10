# Model Workshop - Local Setup

🎉 **Simplified Local Installation** - No Docker required!

## Prerequisites

- **Python 3.11+** ✅ (You have 3.11.0)
- **Node.js 18+** 
- **NVIDIA RTX 3090** ✅ (24GB VRAM detected)
- **Ollama** (for model inference)

## Quick Start

### 1. Install Ollama (if not already installed)
```bash
# Download from https://ollama.ai/download
# Or use winget:
winget install Ollama.Ollama
```

### 2. Start Ollama
```bash
ollama serve
```

### 3. Pull a base model
```bash
ollama pull llama3.1:8b-instruct-q4_0
```

### 4. Set up Python Environment (Already Done! ✅)
```bash
cd python
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 5. Install Node.js Dependencies
```bash
# Backend
cd server
npm install

# Frontend  
cd ../client
npm install
```

### 6. Start All Services

**Option A: Manual (Recommended for development)**
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client  
npm run dev

# Terminal 3 - Python Worker
cd python
.\venv\Scripts\Activate.ps1
python worker_entrypoint.py
```

**Option B: Automated Script**
```bash
.\start_local.ps1
```

## Access Points

- 🌐 **Frontend**: http://localhost:5173
- 🔧 **Backend API**: http://localhost:3001  
- 🤖 **Ollama**: http://localhost:11434

## GPU Training Ready! 🚀

Your RTX 3090 is fully configured and ready for training:

```
=== GPU Test Results ===
✅ CUDA available: True
✅ GPU: NVIDIA GeForce RTX 3090  
✅ Memory: 24.0 GB
✅ Compute capability: 8.6
✅ PyTorch tensor operations working!
```

## Training Workflow

1. **Upload Training Data**: Drag & drop JSONL files
2. **Configure Hyperparameters**: LoRA rank, batch size, epochs
3. **Start Training**: Uses your RTX 3090 locally
4. **Monitor Progress**: Real-time logs and GPU utilization
5. **Test Model**: Chat with your fine-tuned model

## File Structure

```
HowToTrainYourLLM/
├── client/          # React frontend
├── server/          # Node.js backend  
├── python/          # ML training scripts
│   ├── venv/        # Python virtual environment ✅
│   ├── train.py     # LoRA fine-tuning
│   └── worker_entrypoint.py
├── data/            # Training data & models
└── logs/            # Training logs
```

## Troubleshooting

### GPU Issues
- Run `python python/test_gpu.py` to verify GPU access
- Ensure NVIDIA drivers are up to date

### Ollama Issues  
- Check if running: `curl http://localhost:11434/api/tags`
- Restart: `ollama serve`

### Port Conflicts
- Frontend: Change port in `client/vite.config.js`
- Backend: Change PORT in `server/package.json` dev script

## Next Steps

1. **Upload your training data** (JSONL format)
2. **Configure training parameters** 
3. **Start your first fine-tuning job**
4. **Monitor with real-time GPU stats**

Your local Model Workshop is ready for serious LLM fine-tuning! 🎯 