#!/usr/bin/env python3

import argparse
import os
import sys
from pathlib import Path

def parse_args():
    parser = argparse.ArgumentParser(description='Convert Hugging Face model to GGUF format')
    parser.add_argument('--model_dir', type=str, required=True, help='Path to the Hugging Face model directory')
    parser.add_argument('--outfile', type=str, required=True, help='Output GGUF file path')
    parser.add_argument('--outtype', type=str, default='q4_0', choices=['q4_0', 'q4_1', 'q5_0', 'q5_1', 'q8_0'], help='Quantization type')
    parser.add_argument('--context_size', type=int, default=2048, help='Context size for the model')
    return parser.parse_args()

def main():
    args = parse_args()
    
    # Check if llama.cpp is installed
    try:
        import llama_cpp
    except ImportError:
        print("Error: llama.cpp is not installed. Please install it first:")
        print("pip install llama-cpp-python")
        sys.exit(1)
    
    # Check if model directory exists
    model_dir = Path(args.model_dir)
    if not model_dir.exists():
        print(f"Error: Model directory {args.model_dir} does not exist")
        sys.exit(1)
    
    # Check if output directory exists
    outfile = Path(args.outfile)
    outfile.parent.mkdir(parents=True, exist_ok=True)
    
    try:
        # Convert model to GGUF format
        from llama_cpp.convert import convert_hf_to_gguf
        
        print(f"Converting model from {args.model_dir} to {args.outfile}")
        convert_hf_to_gguf(
            model_dir=str(model_dir),
            outfile=str(outfile),
            outtype=args.outtype,
            context_size=args.context_size
        )
        print("Conversion completed successfully!")
        
    except Exception as e:
        print(f"Error during conversion: {str(e)}")
        sys.exit(1)

if __name__ == '__main__':
    main() 