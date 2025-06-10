import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from './logger';

const execAsync = promisify(exec);

interface GPUInfo {
  id: string;
  name: string;
  memory: {
    total: number;
    used: number;
    free: number;
  };
  temperature: number;
  utilization: {
    gpu: number;
    memory: number;
  };
  power: {
    draw: number;
    limit: number;
  };
}

class GPUMonitor {
  private static instance: GPUMonitor;
  private isMonitoring: boolean = false;
  private interval: NodeJS.Timeout | null = null;

  private constructor() {}

  public static getInstance(): GPUMonitor {
    if (!GPUMonitor.instance) {
      GPUMonitor.instance = new GPUMonitor();
    }
    return GPUMonitor.instance;
  }

  async getGPUInfo(): Promise<GPUInfo[]> {
    try {
      const { stdout } = await execAsync('nvidia-smi --query-gpu=index,name,memory.total,memory.used,memory.free,temperature.gpu,utilization.gpu,utilization.memory,power.draw,power.limit --format=csv,noheader,nounits');
      
      return stdout.trim().split('\n').map(line => {
        const [
          id,
          name,
          memoryTotal,
          memoryUsed,
          memoryFree,
          temperature,
          gpuUtil,
          memUtil,
          powerDraw,
          powerLimit
        ] = line.split(', ').map(s => s.trim());

        return {
          id,
          name,
          memory: {
            total: parseInt(memoryTotal),
            used: parseInt(memoryUsed),
            free: parseInt(memoryFree)
          },
          temperature: parseInt(temperature),
          utilization: {
            gpu: parseInt(gpuUtil),
            memory: parseInt(memUtil)
          },
          power: {
            draw: parseFloat(powerDraw),
            limit: parseFloat(powerLimit)
          }
        };
      });
    } catch (error) {
      logger.error('Failed to get GPU info:', error);
      throw new Error('Failed to get GPU information');
    }
  }

  startMonitoring(intervalMs: number = 5000): void {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    this.interval = setInterval(async () => {
      try {
        const gpuInfo = await this.getGPUInfo();
        logger.info('GPU Status:', gpuInfo);
      } catch (error) {
        logger.error('GPU monitoring error:', error);
      }
    }, intervalMs);

    logger.info('GPU monitoring started');
  }

  stopMonitoring(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      this.isMonitoring = false;
      logger.info('GPU monitoring stopped');
    }
  }

  isGPUMonitoring(): boolean {
    return this.isMonitoring;
  }
}

export const gpuMonitor = GPUMonitor.getInstance(); 