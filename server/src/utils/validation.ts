interface TrainingConfig {
  modelId: string;
  dataId: string;
  batchSize: number;
  epochs: number;
  learningRate: number;
  loraRank: number;
  loraAlpha: number;
  dropout: number;
  quantization: 'none' | 'q4_0' | 'q4_1';
  earlyStop?: {
    patience: number;
    minDelta: number;
  };
}

export function validateTrainingConfig(config: any): string | null {
  if (!config) {
    return 'Configuration is required';
  }

  const requiredFields = [
    'modelId',
    'dataId',
    'batchSize',
    'epochs',
    'learningRate',
    'loraRank',
    'loraAlpha',
    'dropout',
    'quantization'
  ];

  for (const field of requiredFields) {
    if (!(field in config)) {
      return `Missing required field: ${field}`;
    }
  }

  // Validate numeric fields
  if (typeof config.batchSize !== 'number' || config.batchSize <= 0) {
    return 'Batch size must be a positive number';
  }

  if (typeof config.epochs !== 'number' || config.epochs <= 0) {
    return 'Epochs must be a positive number';
  }

  if (typeof config.learningRate !== 'number' || config.learningRate <= 0) {
    return 'Learning rate must be a positive number';
  }

  if (typeof config.loraRank !== 'number' || config.loraRank <= 0) {
    return 'LoRA rank must be a positive number';
  }

  if (typeof config.loraAlpha !== 'number' || config.loraAlpha <= 0) {
    return 'LoRA alpha must be a positive number';
  }

  if (typeof config.dropout !== 'number' || config.dropout < 0 || config.dropout > 1) {
    return 'Dropout must be a number between 0 and 1';
  }

  // Validate quantization
  const validQuantizations = ['none', 'q4_0', 'q4_1'];
  if (!validQuantizations.includes(config.quantization)) {
    return 'Invalid quantization value';
  }

  // Validate early stop if provided
  if (config.earlyStop) {
    if (typeof config.earlyStop.patience !== 'number' || config.earlyStop.patience <= 0) {
      return 'Early stop patience must be a positive number';
    }
    if (typeof config.earlyStop.minDelta !== 'number' || config.earlyStop.minDelta < 0) {
      return 'Early stop min delta must be a non-negative number';
    }
  }

  return null;
} 