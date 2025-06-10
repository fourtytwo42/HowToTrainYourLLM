import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FiPlay, FiSquare } from 'react-icons/fi';
import ModelSelector from '../components/ModelSelector';
import DataUploader from '../components/DataUploader';
import HyperparamForm from '../components/HyperparamForm';
import LogsViewer from '../components/LogsViewer';
import TestConsole from '../components/TestConsole';
import ThemeToggle from '../components/ThemeToggle';

interface TrainingConfig {
  batchSize: number;
  epochs: number;
  learningRate: number;
  gradientAccumulation: number;
  loraRank: number;
  loraAlpha: number;
  dropout: number;
  quantization: string;
  earlyStopPatience: number;
  earlyStopThreshold: number;
}

const defaultConfig: TrainingConfig = {
  batchSize: 4,
  epochs: 3,
  learningRate: 2e-4,
  gradientAccumulation: 4,
  loraRank: 8,
  loraAlpha: 16,
  dropout: 0.1,
  quantization: '4bit',
  earlyStopPatience: 3,
  earlyStopThreshold: 0.01,
};

const Training: React.FC = () => {
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedData, setSelectedData] = useState<string>('');
  const [config, setConfig] = useState<TrainingConfig>(defaultConfig);
  const [isTraining, setIsTraining] = useState(false);

  const { data: jobs } = useQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      const response = await fetch('/api/jobs');
      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }
      return response.json();
    },
  });

  const startTraining = async () => {
    if (!selectedModel || !selectedData) return;

    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          modelId: selectedModel,
          dataId: selectedData,
          config,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start training');
      }

      setIsTraining(true);
    } catch (error) {
      console.error('Error starting training:', error);
    }
  };

  const stopTraining = async () => {
    if (!jobs?.length) return;

    const currentJob = jobs[0];
    try {
      const response = await fetch(`/api/jobs/${currentJob.id}/cancel`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to stop training');
      }

      setIsTraining(false);
    } catch (error) {
      console.error('Error stopping training:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Model Training
            </h1>
            <ThemeToggle />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="space-y-6">
              <ModelSelector
                selectedModel={selectedModel}
                onSelectModel={setSelectedModel}
              />
              <DataUploader onUploadComplete={setSelectedData} />
              <HyperparamForm
                config={config}
                onChange={setConfig}
                onSubmit={startTraining}
              />
            </div>

            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                    Training Status
                  </h2>
                  <button
                    onClick={isTraining ? stopTraining : startTraining}
                    disabled={!selectedModel || !selectedData}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isTraining ? (
                      <>
                        <FiSquare className="h-4 w-4 mr-2" />
                        Stop Training
                      </>
                    ) : (
                      <>
                        <FiPlay className="h-4 w-4 mr-2" />
                        Start Training
                      </>
                    )}
                  </button>
                </div>
                <LogsViewer />
              </div>

              {selectedModel && (
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
                  <TestConsole modelId={selectedModel} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Training; 