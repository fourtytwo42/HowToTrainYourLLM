import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowsRightLeftIcon, 
  SparklesIcon, 
  ClockIcon,
  ChatBubbleLeftRightIcon,
  BeakerIcon
} from '@heroicons/react/24/outline';
import { ModelSelector } from './ModelSelector';
import type { Model } from '../types';

const API_BASE = 'http://localhost:3001';

interface ComparisonResult {
  prompt: string;
  originalResponse: string;
  trainedResponse: string;
  originalTime: number;
  trainedTime: number;
  timestamp: string;
}

const samplePrompts = [
  "Explain quantum computing in simple terms.",
  "Write a Python function to calculate fibonacci numbers.",
  "What are the benefits of renewable energy?",
  "How does machine learning work?",
  "Describe the process of photosynthesis.",
  "What is the difference between AI and ML?",
  "Explain blockchain technology.",
  "How do neural networks learn?"
];

export function ModelComparison() {
  const [originalModel, setOriginalModel] = useState<Model | null>(null);
  const [trainedModel, setTrainedModel] = useState<Model | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonHistory, setComparisonHistory] = useState<ComparisonResult[]>([]);

  const { data: models } = useQuery<Model[]>({
    queryKey: ['models'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/api/models`);
      if (!response.ok) throw new Error('Failed to fetch models');
      const result = await response.json();
      return result.models || result;
    },
  });

  const runComparison = async () => {
    if (!originalModel || !trainedModel || !currentPrompt.trim()) return;

    setIsComparing(true);
    try {
      // Run both models in parallel
      const [originalResponse, trainedResponse] = await Promise.all([
        fetch(`${API_BASE}/api/models/${originalModel.id}/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: currentPrompt })
        }).then(res => res.json()),
        fetch(`${API_BASE}/api/models/${trainedModel.id}/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: currentPrompt })
        }).then(res => res.json())
      ]);
      
      const result: ComparisonResult = {
        prompt: currentPrompt,
        originalResponse: originalResponse.response || 'No response',
        trainedResponse: trainedResponse.response || 'No response',
        originalTime: originalResponse.eval_duration || 0,
        trainedTime: trainedResponse.eval_duration || 0,
        timestamp: new Date().toISOString()
      };

      setComparisonHistory(prev => [result, ...prev]);
      setCurrentPrompt('');
    } catch (error) {
      console.error('Comparison failed:', error);
    } finally {
      setIsComparing(false);
    }
  };

  const formatTime = (nanoseconds: number) => {
    const milliseconds = nanoseconds / 1000000;
    return `${milliseconds.toFixed(0)}ms`;
  };

  const getTrainedModels = () => {
    return models?.filter(m => m.name.includes('custom-') || m.name.includes('fine-tuned')) || [];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center justify-center">
          <ArrowsRightLeftIcon className="h-6 w-6 mr-2 text-blue-500" />
          Model Comparison
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Compare responses between original and fine-tuned models side by side
        </p>
      </div>

      {/* Model Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <BeakerIcon className="h-5 w-5 mr-2 text-blue-500" />
            Original Model
          </h3>
          <ModelSelector
            selectedModel={originalModel}
            onSelect={setOriginalModel}
            onRefresh={() => {}}
            onDelete={() => {}}
          />
          {originalModel && (
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Selected:</strong> {originalModel.name}
              </p>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <SparklesIcon className="h-5 w-5 mr-2 text-purple-500" />
            Fine-tuned Model
          </h3>
          <select
            value={trainedModel?.id || ''}
            onChange={(e) => {
              const model = models?.find(m => m.id === e.target.value);
              setTrainedModel(model || null);
            }}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Select a fine-tuned model</option>
            {getTrainedModels().map((model) => (
              <option key={model.id} value={model.id}>
                {model.name} ({model.size})
              </option>
            ))}
          </select>
          {trainedModel && (
            <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <p className="text-sm text-purple-800 dark:text-purple-200">
                <strong>Selected:</strong> {trainedModel.name}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Prompt Input */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2 text-green-500" />
          Test Prompt
        </h3>
        
        {/* Sample Prompts */}
        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Quick prompts:</p>
          <div className="flex flex-wrap gap-2">
            {samplePrompts.map((prompt, index) => (
              <button
                key={index}
                onClick={() => setCurrentPrompt(prompt)}
                className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {prompt.length > 30 ? prompt.substring(0, 30) + '...' : prompt}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          <textarea
            value={currentPrompt}
            onChange={(e) => setCurrentPrompt(e.target.value)}
            placeholder="Enter your prompt to compare models..."
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
            rows={3}
          />
          <button
            onClick={runComparison}
            disabled={!originalModel || !trainedModel || !currentPrompt.trim() || isComparing}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isComparing ? 'Comparing...' : 'Compare'}
          </button>
        </div>
      </div>

      {/* Comparison Results */}
      {comparisonHistory.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Comparison Results</h3>
          {comparisonHistory.map((result, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              {/* Prompt */}
              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="font-medium text-gray-900 dark:text-white">Prompt:</p>
                <p className="text-gray-700 dark:text-gray-300 mt-1">{result.prompt}</p>
              </div>

              {/* Responses */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Original Model Response */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-blue-600 dark:text-blue-400 flex items-center">
                      <BeakerIcon className="h-4 w-4 mr-1" />
                      Original Model
                    </h4>
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      {formatTime(result.originalTime)}
                    </div>
                  </div>
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                    <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                      {result.originalResponse}
                    </p>
                  </div>
                </div>

                {/* Trained Model Response */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-purple-600 dark:text-purple-400 flex items-center">
                      <SparklesIcon className="h-4 w-4 mr-1" />
                      Fine-tuned Model
                    </h4>
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      {formatTime(result.trainedTime)}
                    </div>
                  </div>
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                    <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                      {result.trainedResponse}
                    </p>
                  </div>
                </div>
              </div>

              {/* Metadata */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Compared on {new Date(result.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {comparisonHistory.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <ArrowsRightLeftIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Comparisons Yet</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Select two models and enter a prompt to start comparing responses
          </p>
        </div>
      )}
    </div>
  );
} 