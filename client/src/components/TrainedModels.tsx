import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  SparklesIcon, 
  PlayIcon, 
  ArrowsRightLeftIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const API_BASE = 'http://localhost:3001';

interface TrainedModel {
  id: string;
  name: string;
  baseModel: string;
  status: 'completed' | 'training' | 'failed';
  createdAt: string;
  size: string;
  trainingTime?: number;
}

interface TrainedModelsProps {
  onTestModel?: (modelId: string) => void;
  onCompareModel?: (modelId: string) => void;
}

export function TrainedModels({ onTestModel, onCompareModel }: TrainedModelsProps) {
  const { data: models, isLoading } = useQuery<TrainedModel[]>({
    queryKey: ['trained-models'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/api/models`);
      if (!response.ok) throw new Error('Failed to fetch models');
      const result = await response.json();
      
      // Filter for trained/custom models
      const trainedModels = result.models
        ?.filter((model: any) => model.name.includes('custom-') || model.name.includes('fine-tuned'))
        ?.map((model: any) => ({
          id: model.id,
          name: model.name,
          baseModel: 'Unknown', // Could be extracted from model metadata
          status: 'completed',
          createdAt: new Date().toISOString(), // Placeholder
          size: model.size,
          trainingTime: Math.floor(Math.random() * 3600) // Placeholder
        })) || [];
      
      return trainedModels;
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20';
      case 'training':
        return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20';
      case 'failed':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20';
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center space-x-2 mb-4">
        <SparklesIcon className="h-5 w-5 text-purple-500" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Trained Models ({models?.length || 0})
        </h3>
      </div>

      {!models || models.length === 0 ? (
        <div className="text-center py-8">
          <SparklesIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Trained Models</h4>
          <p className="text-gray-600 dark:text-gray-400">
            Complete a training job to see your fine-tuned models here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {models.map((model) => (
            <div
              key={model.id}
              className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {model.name}
                    </h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(model.status)}`}>
                      {model.status === 'completed' && <CheckCircleIcon className="h-3 w-3 inline mr-1" />}
                      {model.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div>
                      <span className="font-medium">Base Model:</span> {model.baseModel}
                    </div>
                    <div>
                      <span className="font-medium">Size:</span> {model.size}
                    </div>
                    <div className="flex items-center">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      <span>Training: {model.trainingTime ? formatTime(model.trainingTime) : 'Unknown'}</span>
                    </div>
                    <div>
                      <span className="font-medium">Created:</span> {new Date(model.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  {onTestModel && (
                    <button
                      onClick={() => onTestModel(model.id)}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      title="Test model"
                    >
                      <PlayIcon className="h-4 w-4" />
                    </button>
                  )}
                  
                  {onCompareModel && (
                    <button
                      onClick={() => onCompareModel(model.id)}
                      className="p-2 text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                      title="Compare models"
                    >
                      <ArrowsRightLeftIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 