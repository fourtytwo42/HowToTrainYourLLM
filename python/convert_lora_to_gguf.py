#!/usr/bin/env python3

import argparse
import os
import sys
from pathlib import Path

def parse_args():
    parser = argparse.ArgumentParser(description='Convert LoRA model to GGUF format')
    parser.add_argument('--base_model', type=str, required=True, help='Path to the base model directory')
    parser.add_argument('--lora_model', type=str, required=True, help='Path to the LoRA model directory')
    parser.add_argument('--outfile', type=str, required=True, help='Output GGUF file path')
    parser.add_argument('--outtype', type=str, default='q4_0', choices=['q4_0', 'q4_1', 'q5_0', 'q5_1', 'q8_0'], help='Quantization type')
    parser.add_argument('--context_size', type=int, default=2048, help='Context size for the model')
    return parser.parse_args()

def main():
    args = parse_args()
    
    # Check if required packages are installed
    try:
        import torch
        from peft import PeftModel, PeftConfig
        from transformers import AutoModelForCausalLM, AutoTokenizer
    except ImportError as e:
        print(f"Error: Required package not installed: {str(e)}")
        print("Please install required packages:")
        print("pip install torch transformers peft")
        sys.exit(1)
    
    # Check if llama.cpp is installed
    try:
        import llama_cpp
    except ImportError:
        print("Error: llama.cpp is not installed. Please install it first:")
        print("pip install llama-cpp-python")
        sys.exit(1)
    
    # Check if model directories exist
    base_model_dir = Path(args.base_model)
    lora_model_dir = Path(args.lora_model)
    
    if not base_model_dir.exists():
        print(f"Error: Base model directory {args.base_model} does not exist")
        sys.exit(1)
    
    if not lora_model_dir.exists():
        print(f"Error: LoRA model directory {args.lora_model} does not exist")
        sys.exit(1)
    
    # Check if output directory exists
    outfile = Path(args.outfile)
    outfile.parent.mkdir(parents=True, exist_ok=True)
    
    try:
        print("Loading base model...")
        base_model = AutoModelForCausalLM.from_pretrained(
            args.base_model,
            torch_dtype=torch.float16,
            device_map="auto"
        )
        
        print("Loading LoRA model...")
        model = PeftModel.from_pretrained(base_model, args.lora_model)
        
        print("Merging LoRA weights with base model...")
        model = model.merge_and_unload()
        
        # Create temporary directory for merged model
        temp_dir = Path("temp_merged_model")
        temp_dir.mkdir(exist_ok=True)
        
        print("Saving merged model...")
        model.save_pretrained(temp_dir)
        
        # Convert to GGUF format
        print(f"Converting merged model to GGUF format: {args.outfile}")
        from llama_cpp.convert import convert_hf_to_gguf
        
        convert_hf_to_gguf(
            model_dir=str(temp_dir),
            outfile=str(outfile),
            outtype=args.outtype,
            context_size=args.context_size
        )
        
        # Clean up temporary directory
        import shutil
        shutil.rmtree(temp_dir)
        
        print("Conversion completed successfully!")
        
    except Exception as e:
        print(f"Error during conversion: {str(e)}")
        sys.exit(1)

if __name__ == '__main__':
    main() 