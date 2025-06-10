import axios from 'axios';
import { logger } from '../utils/logger';

const OLLAMA_API_URL = process.env.OLLAMA_API_URL || 'http://localhost:11434';

interface ModelInfo {
  name: string;
  size: number;
  digest: string;
  modified_at: string;
  details?: {
    context_length?: number;
    parameter_size?: string;
    quantization_level?: string;
  };
}

interface OllamaModelsResponse {
  models: ModelInfo[];
}

interface ModelResponse {
  model: string;
  response: string;
  done: boolean;
}

export class OllamaService {
  private async request<T>(endpoint: string, method: string = 'GET', data?: any): Promise<T> {
    try {
      const response = await axios({
        method,
        url: `${OLLAMA_API_URL}${endpoint}`,
        data,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      logger.error('Ollama API request failed:', error);
      throw new Error('Failed to communicate with Ollama API');
    }
  }

  async listModels(): Promise<OllamaModelsResponse> {
    return this.request<OllamaModelsResponse>('/api/tags');
  }

  async pullModel(modelName: string): Promise<string> {
    try {
      await this.request('/api/pull', 'POST', { name: modelName });
      return modelName;
    } catch (error) {
      logger.error('Failed to pull model:', error);
      throw new Error(`Failed to pull model: ${modelName}`);
    }
  }

  async deleteModel(modelName: string): Promise<void> {
    try {
      await this.request('/api/delete', 'DELETE', { name: modelName });
    } catch (error) {
      logger.error('Failed to delete model:', error);
      throw new Error(`Failed to delete model: ${modelName}`);
    }
  }

  async createModel(modelName: string, modelfilePath: string): Promise<void> {
    try {
      await this.request('/api/create', 'POST', { 
        name: modelName,
        modelfile: modelfilePath
      });
    } catch (error) {
      logger.error('Failed to create model:', error);
      throw new Error(`Failed to create model: ${modelName}`);
    }
  }

  async *runModel(
    modelName: string,
    prompt: string,
    options: {
      temperature?: number;
      maxTokens?: number;
      topP?: number;
      topK?: number;
    } = {}
  ): AsyncGenerator<string> {
    try {
      const response = await axios.post(
        `${OLLAMA_API_URL}/api/generate`,
        {
          model: modelName,
          prompt,
          options: {
            temperature: options.temperature ?? 0.7,
            num_predict: options.maxTokens ?? 512,
            top_p: options.topP ?? 0.9,
            top_k: options.topK ?? 40,
          },
          stream: true,
        },
        {
          responseType: 'stream',
        }
      );

      for await (const chunk of response.data as any) {
        const lines = chunk.toString().split('\n').filter(Boolean);
        for (const line of lines) {
          try {
            const data = JSON.parse(line) as ModelResponse;
            if (data.response) {
              yield data.response;
            }
            if (data.done) {
              break;
            }
          } catch (e) {
            logger.error('Failed to parse model response:', e);
          }
        }
      }
    } catch (error) {
      logger.error('Failed to run model:', error);
      throw new Error(`Failed to run model: ${modelName}`);
    }
  }
}

export const ollamaService = new OllamaService(); 