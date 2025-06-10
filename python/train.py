import argparse
import os
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM, Trainer, TrainingArguments
from peft import LoraConfig, get_peft_model
from datasets import load_dataset

def parse_args():
    parser = argparse.ArgumentParser(description="LoRA fine-tuning script")
    parser.add_argument("--base", required=True, help="Base model path or HuggingFace ID")
    parser.add_argument("--data", required=True, help="Path to training data JSONL file")
    parser.add_argument("--out", required=True, help="Output directory for the fine-tuned model")
    parser.add_argument("--batch_size", type=int, default=4, help="Training batch size")
    parser.add_argument("--epochs", type=int, default=3, help="Number of training epochs")
    parser.add_argument("--lr", type=float, default=2e-4, help="Learning rate")
    parser.add_argument("--lora_r", type=int, default=16, help="LoRA rank")
    parser.add_argument("--lora_alpha", type=int, default=16, help="LoRA alpha")
    parser.add_argument("--dropout", type=float, default=0.1, help="Dropout rate")
    parser.add_argument("--quantization", choices=["none", "q4_0", "q4_1"], default="none", help="Quantization type")
    return parser.parse_args()

def main():
    args = parse_args()
    
    # Configure quantization if requested
    bnb_config = None
    if args.quantization != "none":
        from transformers import BitsAndBytesConfig
        bnb_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_compute_dtype=torch.bfloat16,
        )

    # Load tokenizer and model
    print("Loading tokenizer and model...")
    tokenizer = AutoTokenizer.from_pretrained(args.base)
    model = AutoModelForCausalLM.from_pretrained(
        args.base,
        quantization_config=bnb_config,
        device_map="auto"
    )
    model.config.use_cache = False

    # Configure LoRA
    print("Configuring LoRA...")
    lora_config = LoraConfig(
        task_type="CAUSAL_LM",
        r=args.lora_r,
        lora_alpha=args.lora_alpha,
        lora_dropout=args.dropout,
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj"]
    )
    model = get_peft_model(model, lora_config)

    # Load and preprocess dataset
    print("Loading dataset...")
    raw_dataset = load_dataset("json", data_files=args.data)["train"]
    
    def preprocess_function(examples):
        return tokenizer(
            examples["prompt"] + examples["completion"],
            truncation=True,
            max_length=512,
            padding="max_length"
        )
    
    dataset = raw_dataset.map(
        preprocess_function,
        batched=True,
        remove_columns=raw_dataset.column_names
    )

    # Configure training arguments
    training_args = TrainingArguments(
        output_dir=args.out,
        per_device_train_batch_size=args.batch_size,
        num_train_epochs=args.epochs,
        learning_rate=args.lr,
        fp16=True,
        logging_steps=10,
        save_strategy="no",
        gradient_accumulation_steps=4,
        warmup_steps=100,
        weight_decay=0.01,
        logging_dir=os.path.join(args.out, "logs"),
    )

    # Initialize trainer
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=dataset,
        tokenizer=tokenizer,
    )

    # Train the model
    print("Starting training...")
    trainer.train()

    # Save the model
    print("Saving model...")
    model.save_pretrained(os.path.join(args.out, "lora_adapter"))
    tokenizer.save_pretrained(os.path.join(args.out, "lora_adapter"))
    print("Training complete!")

if __name__ == "__main__":
    main() 