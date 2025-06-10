import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { queueService } from './services/queueService';

export function setupSocketIO(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
    },
  });

  // Handle client connections
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Join the logs room
    socket.join('logs-room');

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  // Listen for logs from the queue service
  queueService.onLog((log) => {
    io.to('logs-room').emit('log', log);
  });

  return io;
} 