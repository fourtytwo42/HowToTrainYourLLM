import { Router } from 'express';
import { gpuMonitor } from '../utils/gpuMonitor';

const router = Router();

// Get current GPU status
router.get('/status', async (req, res) => {
  try {
    const gpuInfo = await gpuMonitor.getGPUInfo();
    res.json({
      gpus: gpuInfo,
      monitoring: gpuMonitor.isGPUMonitoring(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to get GPU status:', error);
    res.status(500).json({ error: 'Failed to get GPU status' });
  }
});

// Start GPU monitoring
router.post('/monitoring/start', (req, res) => {
  try {
    const { interval = 5000 } = req.body;
    gpuMonitor.startMonitoring(interval);
    res.json({ message: 'GPU monitoring started', interval });
  } catch (error) {
    console.error('Failed to start GPU monitoring:', error);
    res.status(500).json({ error: 'Failed to start GPU monitoring' });
  }
});

// Stop GPU monitoring
router.post('/monitoring/stop', (req, res) => {
  try {
    gpuMonitor.stopMonitoring();
    res.json({ message: 'GPU monitoring stopped' });
  } catch (error) {
    console.error('Failed to stop GPU monitoring:', error);
    res.status(500).json({ error: 'Failed to stop GPU monitoring' });
  }
});

export default router; 