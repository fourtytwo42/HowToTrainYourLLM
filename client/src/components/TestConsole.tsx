import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { FiSend, FiSettings, FiPlay } from 'react-icons/fi';

interface TestConfig {
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
}

interface TestConsoleProps {
  modelId: string;
}

const defaultConfig: TestConfig = {
  temperature: 0.7,
  maxTokens: 512,
  topP: 1,
  frequencyPenalty: 0,
  presencePenalty: 0,
};

export function TestConsole({ modelId }: TestConsoleProps) {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(512);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [config, setConfig] = useState<TestConfig>(defaultConfig);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      toast.warning('Please enter a prompt');
      return;
    }

    setIsLoading(true);
    setResponse('');

    try {
      const response = await fetch(`http://localhost:3001/api/models/${modelId}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          temperature,
          maxTokens
        })
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();
      setResponse(data.response || 'No response received');
    } catch (error) {
      toast.error('Failed to get response from model');
      console.error('Test error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">Test Model</h2>
        <button
          onClick={() => setShowConfig(!showConfig)}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
        >
          <FiSettings className="h-4 w-4 mr-2" />
          {showConfig ? 'Hide Config' : 'Show Config'}
        </button>
      </div>

      {showConfig && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Temperature
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full"
              />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {temperature.toFixed(1)}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Max Tokens
              </label>
              <input
                type="range"
                min="64"
                max="2048"
                step="64"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                className="mt-1 block w-full"
              />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {maxTokens}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Top P
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={config.topP}
                onChange={(e) =>
                  setConfig({ ...config, topP: parseFloat(e.target.value) })
                }
                className="w-full"
              />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {config.topP}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Frequency Penalty
              </label>
              <input
                type="range"
                min="-2"
                max="2"
                step="0.1"
                value={config.frequencyPenalty}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    frequencyPenalty: parseFloat(e.target.value),
                  })
                }
                className="w-full"
              />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {config.frequencyPenalty}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Presence Penalty
              </label>
              <input
                type="range"
                min="-2"
                max="2"
                step="0.1"
                value={config.presencePenalty}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    presencePenalty: parseFloat(e.target.value),
                  })
                }
                className="w-full"
              />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {config.presencePenalty}
              </span>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="prompt"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Prompt
          </label>
          <div className="mt-1">
            <textarea
              id="prompt"
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Enter your prompt here..."
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <FiPlay className="animate-spin h-4 w-4 mr-2" />
                Generating...
              </>
            ) : (
              <>
                <FiSend className="h-4 w-4 mr-2" />
                Generate Response
              </>
            )}
          </button>
        </div>
      </form>

      {response && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Response
          </h3>
          <div className="prose dark:prose-invert max-w-none">
            <p className="whitespace-pre-wrap">{response}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default TestConsole; 