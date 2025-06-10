import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ModelSelector } from './components/ModelSelector';
import DataUploader from './components/DataUploader';
import { HyperparamForm } from './components/HyperparamForm';
import { LogsViewer } from './components/LogsViewer';
import { TestConsole } from './components/TestConsole';
import { ThemeToggle } from './components/ThemeToggle';
import { ModelManager } from './components/ModelManager';
import { ModelComparison } from './components/ModelComparison';
import { TrainedModels } from './components/TrainedModels';
import { 
  CpuChipIcon, 
  CircleStackIcon, 
  RocketLaunchIcon,
  Cog6ToothIcon,
  ArrowsRightLeftIcon,
  CloudArrowDownIcon
} from '@heroicons/react/24/outline';
import type { Model, Hyperparameters } from './types';

const queryClient = new QueryClient();
const API_BASE = 'http://localhost:3001';

function GPUStatus() {
  return (
    <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg p-4 border border-green-200 dark:border-green-700">
      <div className="flex items-center space-x-3">
        <CpuChipIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">RTX 3090 Ready</h3>
          <p className="text-xs text-gray-600 dark:text-gray-300">24GB VRAM • CUDA 12.7 • PyTorch Ready</p>
        </div>
        <div className="ml-auto">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}

function StatsCard({ title, value, icon: Icon, color }: { title: string; value: string; icon: any; color: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}

type ViewType = 'training' | 'models' | 'comparison';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>('training');
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [trainingData, setTrainingData] = useState<{ prompt: string; completion: string }[]>([]);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);

  const handleModelSelect = (model: Model) => {
    setSelectedModel(model);
  };

  const handleModelDelete = async (modelId: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/models/${modelId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete model');
      setSelectedModel(null);
    } catch (error) {
      console.error('Failed to delete model:', error);
    }
  };

  const handleModelRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['models'] });
  };

  const handleDataUpload = (data: { prompt: string; completion: string }[]) => {
    setTrainingData(data);
  };

  const handleTrainingStart = async (hyperparams: Hyperparameters) => {
    if (!selectedModel) return;

    try {
      const response = await fetch(`${API_BASE}/api/jobs/train`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId: selectedModel.id,
          hyperparameters: hyperparams,
          trainingData
        })
      });

      if (!response.ok) throw new Error('Failed to start training');
      const { jobId } = await response.json();
      setCurrentJobId(jobId);
    } catch (error) {
      console.error('Failed to start training:', error);
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        {/* Header */}
        <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                  <RocketLaunchIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Model Workshop
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Local LLM Fine-tuning Platform</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <GPUStatus />
                <ThemeToggle />
              </div>
            </div>
          </div>
        </header>

        {/* Navigation */}
        <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8">
              <button
                onClick={() => setCurrentView('training')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  currentView === 'training'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Cog6ToothIcon className="h-5 w-5 inline mr-2" />
                Training
              </button>
              <button
                onClick={() => setCurrentView('models')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  currentView === 'models'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <CloudArrowDownIcon className="h-5 w-5 inline mr-2" />
                Model Manager
              </button>
              <button
                onClick={() => setCurrentView('comparison')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  currentView === 'comparison'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <ArrowsRightLeftIcon className="h-5 w-5 inline mr-2" />
                Compare Models
              </button>
            </div>
          </div>
        </nav>

        {/* Stats Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatsCard
              title="Available Models"
              value="24"
              icon={CircleStackIcon}
              color="bg-blue-500"
            />
            <StatsCard
              title="Training Data"
              value={trainingData.length.toString()}
              icon={CircleStackIcon}
              color="bg-green-500"
            />
            <StatsCard
              title="Active Jobs"
              value={currentJobId ? "1" : "0"}
              icon={CpuChipIcon}
              color="bg-purple-500"
            />
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          {currentView === 'training' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* Left Column - Configuration */}
              <div className="xl:col-span-2 space-y-8">
                {/* Model Selection */}
                <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Select Base Model</h2>
                  </div>
                  <ModelSelector
                    selectedModel={selectedModel}
                    onSelect={handleModelSelect}
                    onRefresh={handleModelRefresh}
                    onDelete={handleModelDelete}
                  />
                  {selectedModel && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        <strong>Selected:</strong> {selectedModel.name} • Context: {selectedModel.context} • Size: {selectedModel.size}
                      </p>
                    </div>
                  )}
                </section>

                {/* Data Upload */}
                <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Upload Training Data</h2>
                  </div>
                  <DataUploader onUpload={handleDataUpload} />
                  {trainingData.length > 0 && (
                    <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                      <p className="text-sm text-green-800 dark:text-green-200">
                        <strong>Loaded:</strong> {trainingData.length} training examples ready for fine-tuning
                      </p>
                    </div>
                  )}
                </section>

                {/* Training Configuration */}
                <section>
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Training Configuration</h2>
                  </div>
                  <HyperparamForm onSubmit={handleTrainingStart} />
                </section>
              </div>

              {/* Right Column - Monitoring & Testing */}
              <div className="space-y-8">
                {currentJobId && (
                  <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Training Logs</h2>
                    </div>
                    <div className="h-96">
                      <LogsViewer jobId={currentJobId} />
                    </div>
                  </section>
                )}

                {selectedModel && (
                  <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Test Model</h2>
                    </div>
                    <TestConsole modelId={selectedModel.id} />
                  </section>
                )}

                <TrainedModels 
                  onTestModel={(modelId) => setSelectedModel({ id: modelId, name: modelId, context: 4096, size: 'Unknown' })}
                  onCompareModel={(modelId) => setCurrentView('comparison')}
                />

                {!selectedModel && !currentJobId && (
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-8 text-center border border-blue-200 dark:border-blue-700">
                    <RocketLaunchIcon className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Ready to Train!</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Select a model and upload training data to get started with fine-tuning your LLM.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentView === 'models' && <ModelManager />}
          
          {currentView === 'comparison' && <ModelComparison />}
        </main>
      </div>
      <ToastContainer 
        position="bottom-right" 
        theme="colored"
        toastClassName="!bg-white dark:!bg-gray-800 !text-gray-900 dark:!text-white"
      />
    </QueryClientProvider>
  );
} 