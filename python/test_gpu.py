#!/usr/bin/env python3
import torch
import sys

print("=== GPU Test Script ===")
print(f"Python version: {sys.version}")
print(f"PyTorch version: {torch.__version__}")
print(f"CUDA available: {torch.cuda.is_available()}")

if torch.cuda.is_available():
    print(f"CUDA version: {torch.version.cuda}")
    print(f"Number of GPUs: {torch.cuda.device_count()}")
    
    for i in range(torch.cuda.device_count()):
        gpu = torch.cuda.get_device_properties(i)
        print(f"GPU {i}: {gpu.name}")
        print(f"  Memory: {gpu.total_memory / 1024**3:.1f} GB")
        print(f"  Compute capability: {gpu.major}.{gpu.minor}")
    
    # Test tensor operations on GPU
    try:
        x = torch.randn(1000, 1000).cuda()
        y = torch.randn(1000, 1000).cuda()
        z = torch.matmul(x, y)
        print("✅ GPU tensor operations working!")
        print(f"Result shape: {z.shape}")
    except Exception as e:
        print(f"❌ GPU tensor operations failed: {e}")
else:
    print("❌ CUDA not available")

print("=== Test Complete ===") 