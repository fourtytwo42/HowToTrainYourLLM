import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { 
  ChevronDownIcon, 
  ArrowPathIcon, 
  TrashIcon,
  CheckCircleIcon,
  CpuChipIcon,
  CircleStackIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { useQuery } from '@tanstack/react-query';
import { useFavorites } from '../hooks/useFavorites';
import type { Model } from '../types';

interface ModelSelectorProps {
  selectedModel: Model | null;
  onSelect: (model: Model) => void;
  onRefresh: () => void;
  onDelete: (modelId: string) => void;
}

export function ModelSelector({ selectedModel, onSelect, onRefresh, onDelete }: ModelSelectorProps) {
  const { getFavoriteModels, favoriteCount } = useFavorites();
  
  const { data: allModels, isLoading, refetch } = useQuery<Model[]>({
    queryKey: ['models'],
    queryFn: async () => {
      const response = await fetch('http://localhost:3001/api/models');
      if (!response.ok) throw new Error('Failed to fetch models');
      const result = await response.json();
      return result.models || result;
    },
  });

  // Filter to only show favorite models
  const models = allModels ? getFavoriteModels(allModels) : [];

  const handleRefresh = () => {
    refetch();
    onRefresh();
  };

  return (
    <div className="space-y-4">
      {/* Selected Model Display */}
      {selectedModel && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
              <CpuChipIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100">{selectedModel.name}</h4>
              <div className="flex items-center space-x-4 text-sm text-blue-700 dark:text-blue-300">
                <span className="flex items-center">
                  <CircleStackIcon className="h-4 w-4 mr-1" />
                  {selectedModel.size}
                </span>
                <span>Context: {selectedModel.context.toLocaleString()}</span>
              </div>
            </div>
            <CheckCircleIcon className="h-5 w-5 text-green-500" />
          </div>
        </div>
      )}

      {/* Model Selection Controls */}
      <div className="flex items-center space-x-3">
        <div className="flex-1">
          <Menu as="div" className="relative">
            <Menu.Button className="relative w-full cursor-pointer rounded-lg bg-white dark:bg-gray-800 py-3 pl-4 pr-10 text-left shadow-md ring-1 ring-gray-300 dark:ring-gray-600 hover:ring-blue-500 dark:hover:ring-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200">
              <span className="flex items-center">
                <CpuChipIcon className="h-5 w-5 text-gray-400 mr-3" />
                <span className="block truncate text-gray-900 dark:text-gray-100 font-medium">
                  {selectedModel ? selectedModel.name : favoriteCount > 0 ? 'Choose a favorite model' : 'No favorite models - star some models first'}
                </span>
              </span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <ChevronDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </span>
            </Menu.Button>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-200"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-150"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute left-0 z-20 mt-2 w-full origin-top-left rounded-lg bg-white dark:bg-gray-800 shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none max-h-80 overflow-auto">
                <div className="py-2">
                  {isLoading ? (
                    <div className="px-4 py-8 text-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Loading models...</div>
                    </div>
                  ) : models.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <StarIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">No favorite models</div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 leading-relaxed">
                        Go to Model Manager and click the star icon next to installed models to add them to your favorites
                      </div>
                    </div>
                  ) : (
                    models.map((model) => (
                      <Menu.Item key={model.id}>
                        {({ active }) => (
                          <div className={`${active ? 'bg-blue-50 dark:bg-blue-900/20' : ''} mx-2 rounded-md`}>
                            <div className="flex items-center justify-between p-3">
                              <button
                                className="flex-1 text-left"
                                onClick={() => onSelect(model)}
                              >
                                <div className="flex items-center space-x-3">
                                  <div className={`p-2 rounded-lg ${
                                    selectedModel?.id === model.id 
                                      ? 'bg-blue-100 dark:bg-blue-800' 
                                      : 'bg-gray-100 dark:bg-gray-700'
                                  }`}>
                                    <CpuChipIcon className={`h-4 w-4 ${
                                      selectedModel?.id === model.id 
                                        ? 'text-blue-600 dark:text-blue-400' 
                                        : 'text-gray-500 dark:text-gray-400'
                                    }`} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2">
                                      <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                        {model.name}
                                      </p>
                                      <StarIcon className="h-3 w-3 text-yellow-500 flex-shrink-0" />
                                      {selectedModel?.id === model.id && (
                                        <CheckCircleIcon className="h-4 w-4 text-green-500 flex-shrink-0" />
                                      )}
                                    </div>
                                    <div className="flex items-center space-x-3 mt-1">
                                      <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                                        <CircleStackIcon className="h-3 w-3 mr-1" />
                                        {model.size}
                                      </span>
                                      <span className="text-xs text-gray-500 dark:text-gray-400">
                                        Context: {model.context.toLocaleString()}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDelete(model.id);
                                }}
                                className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ml-2"
                                title="Delete model"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </Menu.Item>
                    ))
                  )}
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>

        {/* Refresh Button */}
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="flex items-center justify-center p-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg shadow-md ring-1 ring-gray-300 dark:ring-gray-600 hover:ring-blue-500 dark:hover:ring-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Refresh models"
        >
          <ArrowPathIcon className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Model Count Info */}
      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
        <span>
          {favoriteCount > 0 ? (
            `${models?.length || 0} favorite models available`
          ) : (
            'No favorite models - star some models in Model Manager'
          )}
        </span>
        {isLoading && (
          <span className="flex items-center">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500 mr-2"></div>
            Refreshing...
          </span>
        )}
      </div>
    </div>
  );
} 