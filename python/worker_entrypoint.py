import os
import time
import subprocess
import sqlite3
import json
import sys

# Add the project root to Python path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Database path - adjust for local execution
DB_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "dev.db")

print("[Worker] Started, polling for jobs...")

def run_job(job):
    print(f"[Worker] Running job: {job}")
    job_type = job.get("type")
    if job_type == "train":
        args = [
            "python3", "train.py",
            "--base", job["base_model"],
            "--data", job["data_path"],
            "--out", job["output_path"],
            "--batch_size", str(job["batch_size"]),
            "--epochs", str(job["epochs"]),
            "--lr", str(job["learning_rate"]),
            "--lora_r", str(job["lora_r"]),
            "--lora_alpha", str(job["lora_alpha"]),
            "--dropout", str(job["dropout"]),
            "--quantization", job["quantization"]
        ]
        subprocess.run(args, check=True)
        # After training, run merge_quantize.py
        merge_args = [
            "python3", "merge_quantize.py",
            "--base_fp16", job["base_model"],
            "--lora_adapter", os.path.join(job["output_path"], "lora_adapter"),
            "--out_gguf", os.path.join(job["output_path"], "model.gguf"),
            "--quant_bits", str(job["quant_bits"])
        ]
        subprocess.run(merge_args, check=True)
    else:
        print(f"[Worker] Unknown job type: {job_type}")

while True:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT id, type, dataPath, outputPath FROM Job WHERE status = 'pending' LIMIT 1")
    job_row = cursor.fetchone()
    if job_row:
        job_id, job_type, data_path, output_path = job_row
        try:
            # Build job object from columns
            job = {
                "type": job_type,
                "data_path": data_path,
                "output_path": output_path,
                # Add default values for missing fields
                "base_model": "llama3.1:8b-instruct-q4_0",
                "batch_size": 4,
                "epochs": 3,
                "learning_rate": 2e-4,
                "lora_r": 16,
                "lora_alpha": 16,
                "dropout": 0.1,
                "quantization": "q4_0",
                "quant_bits": 4
            }
            cursor.execute("UPDATE Job SET status = 'running' WHERE id = ?", (job_id,))
            conn.commit()
            run_job(job)
            cursor.execute("UPDATE Job SET status = 'completed' WHERE id = ?", (job_id,))
        except Exception as e:
            print(f"[Worker] Job failed: {e}")
            cursor.execute("UPDATE Job SET status = 'failed', error = ? WHERE id = ?", (str(e), job_id))
        conn.commit()
    conn.close()
    time.sleep(2) 