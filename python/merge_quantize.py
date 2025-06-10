import argparse
import subprocess
import os
import sys

def parse_args():
    parser = argparse.ArgumentParser(description="Merge LoRA adapters and quantize model")
    parser.add_argument("--base_fp16", required=True, help="Path to base model in FP16 format")
    parser.add_argument("--lora_adapter", required=True, help="Path to LoRA adapter")
    parser.add_argument("--out_gguf", required=True, help="Output path for quantized GGUF model")
    parser.add_argument("--quant_bits", type=int, choices=[2, 4, 8], default=4, help="Number of bits for quantization")
    return parser.parse_args()

def run_command(cmd, error_msg):
    try:
        subprocess.run(cmd, check=True, capture_output=True, text=True)
    except subprocess.CalledProcessError as e:
        print(f"Error: {error_msg}")
        print(f"Command output: {e.stdout}")
        print(f"Command error: {e.stderr}")
        sys.exit(1)

def main():
    args = parse_args()
    
    # Ensure llama.cpp scripts are available
    llama_cpp_dir = os.path.join(os.path.dirname(__file__), "llama.cpp")
    if not os.path.exists(llama_cpp_dir):
        print("Error: llama.cpp directory not found. Please clone it first:")
        print("git clone https://github.com/ggerganov/llama.cpp.git")
        sys.exit(1)

    # Convert base model to GGUF FP16
    print("Converting base model to GGUF FP16...")
    base_fp16_gguf = args.base_fp16.replace(".gguf", "-f16.gguf")
    run_command(
        ["python3", "convert_hf_to_gguf.py", "--outfile", base_fp16_gguf, args.base_fp16],
        "Failed to convert base model to GGUF"
    )

    # Convert LoRA adapter to GGUF
    print("Converting LoRA adapter to GGUF...")
    run_command(
        ["python3", "convert_lora_to_gguf.py", "--base", args.base_fp16, "--outfile", "lora-adapter.gguf", args.lora_adapter],
        "Failed to convert LoRA adapter to GGUF"
    )

    # Merge base model with LoRA adapter
    print("Merging base model with LoRA adapter...")
    merged_f16 = "merged-f16.gguf"
    run_command(
        ["./llama.cpp/bin/llama-export-lora", "-m", base_fp16_gguf, "--lora", "lora-adapter.gguf", "-o", merged_f16],
        "Failed to merge models"
    )

    # Quantize the merged model
    print(f"Quantizing model to {args.quant_bits} bits...")
    run_command(
        ["./llama.cpp/bin/llama-quantize", merged_f16, args.out_gguf, str(args.quant_bits)],
        "Failed to quantize model"
    )

    # Clean up temporary files
    print("Cleaning up temporary files...")
    for temp_file in [base_fp16_gguf, "lora-adapter.gguf", merged_f16]:
        if os.path.exists(temp_file):
            os.remove(temp_file)

    print("Model conversion complete!")

if __name__ == "__main__":
    main() 