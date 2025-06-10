import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { setupSocketIO } from './socket';
import { gpuMonitor } from './utils/gpuMonitor';
import modelRoutes from './routes/modelRoutes';
import dataRoutes from './routes/dataRoutes';
import jobRoutes from './routes/jobRoutes';
import presetRoutes from './routes/presetRoutes';
import templateRoutes from './routes/templateRoutes';
import gpuRoutes from './routes/gpuRoutes';

const app = express();
const httpServer = createServer(app);

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
app.use(express.json());

// Routes
app.use('/api/models', modelRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/presets', presetRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/gpu', gpuRoutes);

// Socket.IO setup
const io = setupSocketIO(httpServer);

// GPU monitoring
gpuMonitor.startMonitoring();

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { app, httpServer }; 