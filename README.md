# Model Workshop

A locally-hosted dashboard for fine-tuning and managing language models.

## Prerequisites

- **OS:** Linux/macOS/Windows WSL
- **GPU:** NVIDIA RTX 3090 (24 GB VRAM)
- **Node.js** ≥ 18.16.1 (LTS)
- **Python** ≥ 3.10.12
- **Redis** ≥ 6.2 (local or Docker)
- **Ollama CLI** ≥ 0.4.0
- **Git** (for cloning llama.cpp)

## Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/model-workshop.git
   cd model-workshop
   ```

2. **Install frontend dependencies:**
   ```bash
   cd client
   npm install
   ```

3. **Install backend dependencies:**
   ```bash
   cd ../server
   npm install
   npx prisma migrate dev
   ```

4. **Set up Python environment:**
   ```bash
   cd ../python
   python setup.py
   python setup_llama.cpp
   ```

5. **Configure environment variables:**
   Create `.env` files in both `client` and `server` directories with the following variables:

   **server/.env:**
   ```
   DATABASE_URL="file:./dev.db"
   REDIS_HOST="localhost"
   REDIS_PORT="6379"
   ```

   **client/.env:**
   ```
   VITE_API_URL="http://localhost:3000"
   ```

6. **Start Redis:**
   ```bash
   # If using Docker
   docker run -d -p 6379:6379 redis:6.2
   ```

7. **Start the development servers:**
   ```bash
   # Terminal 1 - Frontend
   cd client
   npm run dev

   # Terminal 2 - Backend
   cd server
   npm run dev
   ```

## Features

- Pull Llama 3.1 (8B) variants via Ollama
- Upload JSONL training data
- Configure hyperparameters for fine-tuning
- Train LoRA-augmented, quantized models
- Monitor GPU utilization and training progress
- Test models with custom prompts
- Manage presets and prompt templates
- Dark/light theme support

## Project Structure

```
model-workshop/
├── client/                 # React + Tailwind UI
├── server/                 # Node.js + Express API
├── python/                 # Training & conversion scripts
│   ├── train.py           # LoRA fine-tuning
│   ├── merge_quantize.py  # Model conversion
│   └── llama.cpp/         # Model quantization
└── data/                  # Training data storage
```

## Development

- Frontend runs on `http://localhost:5173`
- Backend API runs on `http://localhost:3000`
- WebSocket connections for real-time updates
- GPU monitoring every 2 seconds

## Troubleshooting

1. **CUDA out of memory:**
   - Reduce batch size
   - Use Q4_0 quantization
   - Free VRAM using `nvidia-smi`

2. **Training data validation:**
   - Ensure JSONL format is correct
   - Check schema validation errors

3. **Ollama issues:**
   - Verify Ollama is in PATH
   - Run `ollama self-update`

4. **Performance:**
   - Pre-pull base models
   - Cache models in `~/.ollama/models`

## License

MIT

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request 