import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { getGpuStats, startGpuMonitoring, stopGpuMonitoring } from '../utils/gpuMonitor';
import { logger } from '../utils/logger';

let io: Server;

// Handle job progress updates
export function emitJobProgress(jobId: string, progress: number): void {
  io?.emit(`job-progress-${jobId}`, { progress });
}

// Handle job completion
export function emitJobComplete(jobId: string, result: any): void {
  io?.emit(`job-complete-${jobId}`, result);
}

// Handle job error
export function emitJobError(jobId: string, error: Error): void {
  io?.emit(`job-error-${jobId}`, { error: error.message });
}

export function setupWebSocket(httpServer: HttpServer): void {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    logger.info('Client connected:', socket.id);

    // Start GPU monitoring for this client
    startGpuMonitoring((stats) => {
      socket.emit('gpu-stats', stats);
    });

    socket.on('disconnect', () => {
      logger.info('Client disconnected:', socket.id);
      stopGpuMonitoring();
    });
  });

  logger.info('WebSocket server initialized');
} 