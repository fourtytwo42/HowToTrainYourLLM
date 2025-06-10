import React, { useState } from 'react';
import { FiSend, FiDownload, FiCopy } from 'react-icons/fi';

interface TestResult {
  input: string;
  output: string;
  latency: number;
  timestamp: string;
}

export default function Testing() {
  const [selectedModel, setSelectedModel] = useState('');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModel || !input.trim()) return;

    setIsLoading(true);
    // Mock API call - replace with actual implementation
    setTimeout(() => {
      const newResult: TestResult = {
        input,
        output: `This is a mock response for the input: "${input}"`,
        latency: Math.random() * 1000,
        timestamp: new Date().toISOString()
      };
      setResults(prev => [newResult, ...prev]);
      setIsLoading(false);
    }, 1000);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Testing</h1>

      {/* Model Selection and Input Form */}
      <div className="bg-white shadow rounded-lg p-6 dark:bg-gray-800">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Select Model
            </label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
            >
              <option value="">Select a model...</option>
              <option value="llama2-7b">Llama 2 7B</option>
              <option value="mistral-7b">Mistral 7B</option>
              <option value="custom-model-1">Custom Model 1</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Input Text
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
              placeholder="Enter your test input here..."
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!selectedModel || !input.trim() || isLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiSend className="w-5 h-5 mr-2" />
              {isLoading ? 'Testing...' : 'Test Model'}
            </button>
          </div>
        </form>
      </div>

      {/* Test Results */}
      {results.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6 dark:bg-gray-800">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Test Results</h2>
          <div className="space-y-4">
            {results.map((result, index) => (
              <div
                key={index}
                className="border rounded-lg p-4 dark:border-gray-700"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(result.timestamp).toLocaleString()}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleCopy(result.output)}
                      className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                    >
                      <FiCopy className="w-5 h-5" />
                    </button>
                    <button className="text-primary-400 hover:text-primary-500 dark:hover:text-primary-300">
                      <FiDownload className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Input:</p>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">{result.input}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Output:</p>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">{result.output}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Latency: {result.latency.toFixed(2)}ms
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 