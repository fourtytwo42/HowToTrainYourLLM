export interface Model {
  id: string;
  name: string;
  context: number;
  size: string;
}

export interface TrainingData {
  prompt: string;
  completion: string;
}

export interface Hyperparameters {
  batchSize: number;
  epochs: number;
  learningRate: number;
  gradientAccumulation: number;
  loraRank: number;
  loraAlpha: number;
  dropout: number;
  quantization: 'none' | 'q4_0' | 'q4_1';
  earlyStop: {
    patience: number;
    minDelta: number;
  };
}

export interface Job {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  model: string;
  hyperparameters: Hyperparameters;
  createdAt: string;
  updatedAt: string;
  logs: string[];
} 