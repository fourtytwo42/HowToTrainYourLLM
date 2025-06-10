import { PrismaClient } from '@prisma/client';
import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import path from 'path';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();
export const eventEmitter = new EventEmitter();

export interface JobData {
  modelId: string;
  dataId?: string;
  config?: any;
  type: 'PULL' | 'TRAIN' | 'TEST';
}

export class QueueService {
  private static instance: QueueService;
  private isProcessing: boolean = false;

  constructor() {
    this.startProcessing();
  }

  public static getInstance(): QueueService {
    if (!QueueService.instance) {
      QueueService.instance = new QueueService();
    }
    return QueueService.instance;
  }

  public async addJob(data: JobData): Promise<string> {
    const job = await prisma.job.create({
      data: {
        type: data.type,
        status: 'PENDING',
        modelId: data.modelId,
        dataId: data.dataId,
        config: data.config,
      },
    });

    this.startProcessing();
    return job.id;
  }

  async startProcessing() {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    logger.info('Starting job processing...');

    while (true) {
      try {
        const job = await prisma.job.findFirst({
          where: { status: 'pending' }
        });

        if (job) {
          logger.info(`Processing job ${job.id}...`);
          await this.processJob(job);
        } else {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        logger.error('Error processing job:', error);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }

  private async processJob(job: any) {
    try {
      await prisma.job.update({
        where: { id: job.id },
        data: { status: 'running' }
      });

      switch (job.type) {
        case 'PULL':
          await this.pullModel(job);
          break;
        case 'TRAIN':
          await this.trainModel(job);
          break;
        case 'TEST':
          await this.testModel(job);
          break;
        default:
          throw new Error(`Unknown job type: ${job.type}`);
      }

      await prisma.job.update({
        where: { id: job.id },
        data: { status: 'completed' }
      });
    } catch (error) {
      logger.error(`Error processing job ${job.id}:`, error);
      await prisma.job.update({
        where: { id: job.id },
        data: { 
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }

  private async pullModel(job: any) {
    const ollama = spawn('ollama', ['pull', job.modelId]);

    ollama.stdout.on('data', (data) => {
      this.emitLog(job.id, 'INFO', data.toString());
    });

    ollama.stderr.on('data', (data) => {
      this.emitLog(job.id, 'ERROR', data.toString());
    });

    return new Promise((resolve, reject) => {
      ollama.on('close', (code) => {
        if (code === 0) {
          resolve(null);
        } else {
          reject(new Error(`Ollama pull failed with code ${code}`));
        }
      });
    });
  }

  private async trainModel(job: any) {
    const pythonPath = process.env.PYTHON_PATH || 'python';
    const trainScript = path.join(__dirname, '../../python/train.py');
    
    const train = spawn(pythonPath, [
      trainScript,
      '--base', job.modelId,
      '--data', path.join(__dirname, `../../data/corpus/${job.dataId}.jsonl`),
      '--out', path.join(__dirname, `../../output/${job.id}`),
      '--batch_size', job.config.batchSize,
      '--epochs', job.config.epochs,
      '--lr', job.config.learningRate,
      '--lora_r', job.config.loraRank,
      '--lora_alpha', job.config.loraAlpha,
      '--dropout', job.config.dropout,
      '--quantization', job.config.quantization,
    ]);

    train.stdout.on('data', (data) => {
      this.emitLog(job.id, 'INFO', data.toString());
    });

    train.stderr.on('data', (data) => {
      this.emitLog(job.id, 'ERROR', data.toString());
    });

    return new Promise((resolve, reject) => {
      train.on('close', (code) => {
        if (code === 0) {
          resolve(null);
        } else {
          reject(new Error(`Training failed with code ${code}`));
        }
      });
    });
  }

  private async testModel(job: any) {
    const ollama = spawn('ollama', ['run', job.modelId, job.config.prompt]);

    ollama.stdout.on('data', (data) => {
      this.emitLog(job.id, 'INFO', data.toString());
    });

    ollama.stderr.on('data', (data) => {
      this.emitLog(job.id, 'ERROR', data.toString());
    });

    return new Promise((resolve, reject) => {
      ollama.on('close', (code) => {
        if (code === 0) {
          resolve(null);
        } else {
          reject(new Error(`Model test failed with code ${code}`));
        }
      });
    });
  }

  private async emitLog(jobId: string, level: 'INFO' | 'WARN' | 'ERROR', message: string) {
    const log = await prisma.log.create({
      data: {
        jobId,
        level,
        message,
      },
    });

    eventEmitter.emit('log', log);
  }

  public onLog(callback: (log: any) => void) {
    eventEmitter.on('log', callback);
  }
}

export const queueService = QueueService.getInstance(); 