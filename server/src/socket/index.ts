import { Server } from 'socket.io';
import { logger } from '../utils/logger';
import { eventEmitter } from '../services/queueService';

export function setupSocketIO(io: Server) {
  // Handle client connections
  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);

    // Join the logs room
    socket.join('logs-room');

    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`);
    });
  });

  // Listen for job events from queueService
  eventEmitter.on('log', (log) => {
    io.to('logs-room').emit('job-log', log);
  });

  logger.info('Socket.IO system initialized');
} 