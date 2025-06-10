import nvsmi from 'node-nvidia-smi';
import { EventEmitter } from 'events';
import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from '../utils/logger';

const execAsync = promisify(exec);

const eventEmitter = new EventEmitter();

export interface GpuStats {
  vramUsed: number;
  vramTotal: number;
  utilization: number;
  temperature: number;
}

export class GpuMonitor extends EventEmitter {
  private static instance: GpuMonitor;
  private monitoringInterval: NodeJS.Timeout | null = null;

  private constructor() {
    super();
  }

  static getInstance(): GpuMonitor {
    if (!GpuMonitor.instance) {
      GpuMonitor.instance = new GpuMonitor();
    }
    return GpuMonitor.instance;
  }

  async getStats() {
    try {
      // In Docker, we might not have GPU access
      return {
        vramUsed: 0,
        vramTotal: 0,
        utilization: 0,
        temperature: 0
      };
    } catch (error) {
      logger.warn('GPU monitoring not available:', error);
      return null;
    }
  }

  startMonitoring(intervalMs: number = 2000) {
    if (this.monitoringInterval) {
      return;
    }

    this.monitoringInterval = setInterval(async () => {
      try {
        const stats = await this.getStats();
        if (stats) {
          logger.debug('GPU Stats:', stats);
        }
      } catch (error) {
        logger.error('Error getting GPU stats:', error);
      }
    }, intervalMs);

    logger.info('GPU monitoring started');
  }

  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      logger.info('GPU monitoring stopped');
    }
  }

  isMonitoring(): boolean {
    return this.monitoringInterval !== null;
  }

  public onStats(callback: (stats: GpuStats) => void) {
    this.on('stats', callback);
  }

  public offStats(callback: (stats: GpuStats) => void) {
    this.off('stats', callback);
  }
}

export const gpuMonitor = GpuMonitor.getInstance(); 