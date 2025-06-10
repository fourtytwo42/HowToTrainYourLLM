import React, { useState, useEffect, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { 
  CloudArrowDownIcon, 
  CloudArrowUpIcon, 
  TrashIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ClockIcon,
  TagIcon,
  ArrowPathIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { useFavorites } from '../hooks/useFavorites';

const API_BASE = 'http://localhost:3001';
const OLLAMA_SEARCH_API = 'https://ollamadb.dev/api/v1';

interface Model {
  id: string;
  name: string;
  size: string;
  context: number;
  modified?: string;
  digest?: string;
  details?: {
    parent_model?: string;
    format?: string;
    family?: string;
    families?: string[];
    parameter_size?: string;
    quantization_level?: string;
  };
}

interface SearchableModel {
  model_identifier: string;
  namespace: string | null;
  model_name: string;
  model_type: 'official' | 'community';
  description: string;
  capability: string | null;
  labels: string[];
  pulls: number;
  tags: number;
  last_updated: string;
  last_updated_str: string;
  url: string;
}

interface SearchResponse {
  models: SearchableModel[];
  total_count: number;
  limit: number;
  skip: number;
  data_updated: string;
}

// Fallback popular models in case API is unavailable
const FALLBACK_MODELS: SearchableModel[] = [
  {
    model_identifier: "llama3.1:8b",
    namespace: null,
    model_name: "llama3.1",
    model_type: "official",
    description: "Meta Llama 3.1: The most capable openly available LLM to date with 8B parameters",
    capability: "Tools",
    labels: ["8B", "instruct"],
    pulls: 95000000,
    tags: 93,
    last_updated: "2024-11-30",
    last_updated_str: "6 months ago",
    url: "https://ollama.com/library/llama3.1"
  },
  {
    model_identifier: "llama3.2:3b",
    namespace: null,
    model_name: "llama3.2",
    model_type: "official",
    description: "Llama 3.2 3B: Lightweight model perfect for edge deployment and mobile applications",
    capability: null,
    labels: ["3B", "lightweight"],
    pulls: 19100000,
    tags: 63,
    last_updated: "2024-09-23",
    last_updated_str: "8 months ago",
    url: "https://ollama.com/library/llama3.2"
  },
  {
    model_identifier: "mistral:7b",
    namespace: null,
    model_name: "mistral",
    model_type: "official",
    description: "Mistral 7B: Fast and efficient general-purpose model with excellent performance",
    capability: null,
    labels: ["7B", "fast"],
    pulls: 45000000,
    tags: 45,
    last_updated: "2024-10-15",
    last_updated_str: "7 months ago",
    url: "https://ollama.com/library/mistral"
  },
  {
    model_identifier: "codellama:7b",
    namespace: null,
    model_name: "codellama",
    model_type: "official",
    description: "Code Llama: Specialized model for code generation and programming tasks",
    capability: null,
    labels: ["7B", "code"],
    pulls: 25000000,
    tags: 32,
    last_updated: "2024-08-20",
    last_updated_str: "9 months ago",
    url: "https://ollama.com/library/codellama"
  },
  {
    model_identifier: "phi3:mini",
    namespace: null,
    model_name: "phi3",
    model_type: "official",
    description: "Microsoft Phi-3 Mini: Compact but powerful model optimized for efficiency",
    capability: null,
    labels: ["3.8B", "mini", "efficient"],
    pulls: 15000000,
    tags: 28,
    last_updated: "2024-09-10",
    last_updated_str: "8 months ago",
    url: "https://ollama.com/library/phi3"
  },
  {
    model_identifier: "gemma:7b",
    namespace: null,
    model_name: "gemma",
    model_type: "official",
    description: "Google Gemma 7B: Research-friendly open model with strong performance",
    capability: null,
    labels: ["7B", "google"],
    pulls: 12000000,
    tags: 24,
    last_updated: "2024-07-25",
    last_updated_str: "10 months ago",
    url: "https://ollama.com/library/gemma"
  }
];

export function ModelManager() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchableModel[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedType, setSelectedType] = useState<'all' | 'official' | 'community'>('all');
  const [downloadingModels, setDownloadingModels] = useState<Set<string>>(new Set());
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const queryClient = useQueryClient();
  const { favorites, toggleFavorite } = useFavorites();

  const { data: installedModels, isLoading } = useQuery<Model[]>({
    queryKey: ['models'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/api/models`);
      if (!response.ok) throw new Error('Failed to fetch models');
      const result = await response.json();
      return result.models || result;
    },
  });

  // Debounced search function
  const searchModels = useCallback(async (query: string, modelType: string = 'all') => {
    if (!query.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    console.log('🔍 Starting search for:', query, 'type:', modelType);
    
    try {
      const params = new URLSearchParams({
        search: query,
        limit: '20',
        sort_by: 'pulls',
        order: 'desc'
      });

      if (modelType !== 'all') {
        params.append('model_type', modelType);
      }

      const searchUrl = `${OLLAMA_SEARCH_API}/models?${params}`;
      console.log('🌐 Fetching from URL:', searchUrl);

      const response = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        mode: 'cors', // Explicitly set CORS mode
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response not OK:', response.status, response.statusText);
        console.error('❌ Error body:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }
      
      const contentType = response.headers.get('content-type');
      console.log('📄 Content-Type:', contentType);
      
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('❌ Invalid content type. Expected JSON, got:', contentType);
        console.error('❌ Response body:', responseText);
        throw new Error(`Invalid response format. Expected JSON, got: ${contentType}`);
      }

      const data: SearchResponse = await response.json();
      console.log('✅ Search successful. Found models:', data.models?.length || 0);
      console.log('📊 Full response:', data);
      
      if (!data.models || !Array.isArray(data.models)) {
        console.error('❌ Invalid response structure:', data);
        throw new Error('Invalid response structure: missing or invalid models array');
      }
      
      setSearchResults(data.models);
      setHasSearched(true);
      toast.success(`Found ${data.models.length} models`);
      
    } catch (error) {
      console.error('💥 Search error details:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        query,
        modelType,
        timestamp: new Date().toISOString()
      });
      
      // Try fallback search through our backend
      console.log('🔄 Attempting fallback search through backend...');
      try {
        const fallbackResponse = await fetch(`${API_BASE}/api/models/search`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query,
            modelType,
            limit: 20
          })
        });

        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          console.log('✅ Fallback search successful:', fallbackData);
          setSearchResults(fallbackData.models || []);
          setHasSearched(true);
          toast.success(`Found ${fallbackData.models?.length || 0} models (via backend)`);
          return;
        } else {
          console.log('❌ Fallback also failed:', fallbackResponse.status);
        }
      } catch (fallbackError) {
        console.error('💥 Fallback search also failed:', fallbackError);
      }

      // If both direct and fallback fail, use hardcoded popular models
      console.log('🔄 Using fallback popular models...');
      const filteredFallback = FALLBACK_MODELS.filter(model => {
        const matchesSearch = model.model_identifier.toLowerCase().includes(query.toLowerCase()) ||
                             model.description.toLowerCase().includes(query.toLowerCase()) ||
                             model.labels.some(label => label.toLowerCase().includes(query.toLowerCase()));
        const matchesType = modelType === 'all' || model.model_type === modelType;
        return matchesSearch && matchesType;
      });
      
      setSearchResults(filteredFallback);
      setHasSearched(true);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.warning(`API unavailable. Showing ${filteredFallback.length} popular models. Error: ${errorMessage}`);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchModels(searchTerm, selectedType);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, selectedType, searchModels]);

  // Show popular models on initial load
  useEffect(() => {
    if (!hasSearched && searchResults.length === 0 && !searchTerm) {
      console.log('🎯 Showing initial popular models...');
      setSearchResults(FALLBACK_MODELS);
      setHasSearched(true);
    }
  }, [hasSearched, searchResults.length, searchTerm]);

  const downloadModelMutation = useMutation({
    mutationFn: async (modelName: string) => {
      const response = await fetch(`${API_BASE}/api/models/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: modelName })
      });
      if (!response.ok) throw new Error('Failed to start download');
      return response.json();
    },
    onSuccess: (_, modelName) => {
      toast.success(`Started downloading ${modelName}`);
      queryClient.invalidateQueries({ queryKey: ['models'] });
    },
    onError: (error, modelName) => {
      toast.error(`Failed to download ${modelName}: ${error.message}`);
      setDownloadingModels(prev => {
        const newSet = new Set(prev);
        newSet.delete(modelName);
        return newSet;
      });
    }
  });

  const uploadModelMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('model', file);
      
      const response = await fetch(`${API_BASE}/api/models/upload`, {
        method: 'POST',
        body: formData
      });
      if (!response.ok) throw new Error('Failed to upload model');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Model uploaded successfully!');
      setUploadFile(null);
      queryClient.invalidateQueries({ queryKey: ['models'] });
    },
    onError: (error) => {
      toast.error(`Failed to upload model: ${error.message}`);
    }
  });

  const deleteModelMutation = useMutation({
    mutationFn: async (modelId: string) => {
      const response = await fetch(`${API_BASE}/api/models/${modelId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete model');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Model deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['models'] });
    },
    onError: (error) => {
      toast.error(`Failed to delete model: ${error.message}`);
    }
  });

  const handleDownload = (modelName: string) => {
    setDownloadingModels(prev => new Set(prev).add(modelName));
    downloadModelMutation.mutate(modelName);
  };

  const handleUpload = () => {
    if (uploadFile) {
      uploadModelMutation.mutate(uploadFile);
    }
  };

  const isModelInstalled = (modelName: string) => {
    return installedModels?.some(m => 
      m.name.includes(modelName.split(':')[0]) || 
      m.name === modelName ||
      m.name === `${modelName}:latest`
    );
  };

  const formatPullCount = (pulls: number) => {
    if (pulls >= 1000000) {
      return `${(pulls / 1000000).toFixed(1)}M`;
    } else if (pulls >= 1000) {
      return `${(pulls / 1000).toFixed(1)}K`;
    }
    return pulls.toString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Model Manager</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Search and download models from the Ollama registry</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {isSearching ? (
                <ArrowPathIcon className="h-5 w-5 text-gray-400 animate-spin" />
              ) : (
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              )}
            </div>
            <input
              type="text"
              placeholder="Search models (e.g., llama, mistral, codellama)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            />
          </div>

          {/* Type Filter */}
          <div className="flex space-x-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by type:</label>
            <div className="flex space-x-4">
              {[
                { value: 'all', label: 'All Models' },
                { value: 'official', label: 'Official' },
                { value: 'community', label: 'Community' }
              ].map(({ value, label }) => (
                <label key={value} className="flex items-center">
                  <input
                    type="radio"
                    name="modelType"
                    value={value}
                    checked={selectedType === value}
                    onChange={(e) => setSelectedType(e.target.value as any)}
                    className="mr-2 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Search Results */}
      {hasSearched && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {searchTerm ? 'Search Results' : 'Popular Models'}
              {searchResults.length > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                  ({searchResults.length} models {searchTerm ? 'found' : 'available'})
                </span>
              )}
            </h3>
          </div>
          
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {isSearching ? (
              <div className="p-8 text-center">
                <ArrowPathIcon className="h-8 w-8 text-gray-400 animate-spin mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Searching models...</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="p-8 text-center">
                <MagnifyingGlassIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  {searchTerm ? 'No models found matching your search.' : 'Enter a search term to find models, or browse popular models above.'}
                </p>
                {searchTerm && (
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                    Try searching for: llama, mistral, codellama, phi3, gemma
                  </p>
                )}
              </div>
            ) : (
              searchResults.map((model) => {
                const isInstalled = isModelInstalled(model.model_identifier);
                const isDownloading = downloadingModels.has(model.model_identifier);
                
                return (
                  <div key={model.model_identifier} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {model.model_identifier}
                          </h4>
                          <div className="flex items-center space-x-2">
                            {model.model_type === 'official' && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                <CheckCircleIcon className="h-3 w-3 mr-1" />
                                Official
                              </span>
                            )}
                            {model.capability && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                <TagIcon className="h-3 w-3 mr-1" />
                                {model.capability}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">
                          {model.description}
                        </p>
                        
                        <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center">
                            <CloudArrowDownIcon className="h-4 w-4 mr-1" />
                            {formatPullCount(model.pulls)} pulls
                          </div>
                          <div className="flex items-center">
                            <TagIcon className="h-4 w-4 mr-1" />
                            {model.tags} variants
                          </div>
                          <div className="flex items-center">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            Updated {model.last_updated_str}
                          </div>
                        </div>
                        
                        {model.labels.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {model.labels.map((label) => (
                              <span
                                key={label}
                                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                              >
                                {label}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="ml-6 flex-shrink-0">
                        {isInstalled ? (
                          <div className="flex items-center text-green-600 dark:text-green-400">
                            <CheckCircleIcon className="h-5 w-5 mr-2" />
                            <span className="text-sm font-medium">Installed</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleDownload(model.model_identifier)}
                            disabled={isDownloading}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md 
                                     text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                                     disabled:opacity-50 disabled:cursor-not-allowed dark:focus:ring-offset-gray-800"
                          >
                            {isDownloading ? (
                              <>
                                <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                                Downloading...
                              </>
                            ) : (
                              <>
                                <CloudArrowDownIcon className="h-4 w-4 mr-2" />
                                Download
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Upload Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Upload Custom Model</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Model File (.gguf, .bin)
            </label>
            <input
              type="file"
              accept=".gguf,.bin"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-500 dark:text-gray-400
                       file:mr-4 file:py-2 file:px-4
                       file:rounded-md file:border-0
                       file:text-sm file:font-medium
                       file:bg-blue-50 file:text-blue-700
                       hover:file:bg-blue-100
                       dark:file:bg-blue-900 dark:file:text-blue-200"
            />
          </div>
          {uploadFile && (
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {uploadFile.name} ({(uploadFile.size / (1024 * 1024 * 1024)).toFixed(2)} GB)
              </span>
              <button
                onClick={handleUpload}
                disabled={uploadModelMutation.isPending}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md 
                         text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500
                         disabled:opacity-50 disabled:cursor-not-allowed dark:focus:ring-offset-gray-800"
              >
                {uploadModelMutation.isPending ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <CloudArrowUpIcon className="h-4 w-4 mr-2" />
                    Upload
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Installed Models */}
      {installedModels && installedModels.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Installed Models ({installedModels.length})
              </h3>
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <StarIcon className="h-4 w-4 text-yellow-500" />
                <span>{favorites.size} favorited</span>
              </div>
            </div>
            {favorites.size === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Click the star icon next to models to add them to your favorites. Only starred models appear in dropdowns throughout the app.
              </p>
            )}
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {installedModels.map((model) => (
              <div key={model.id} className="p-6 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                      {model.name}
                    </h4>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      <CheckCircleIcon className="h-3 w-3 mr-1" />
                      Installed
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>Size: {model.size}</span>
                    <span>Context: {model.context?.toLocaleString()}</span>
                    {model.details?.parameter_size && (
                      <span>Parameters: {model.details.parameter_size}</span>
                    )}
                    {model.details?.quantization_level && (
                      <span>Quantization: {model.details.quantization_level}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => toggleFavorite(model.id)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title={favorites.has(model.id) ? "Remove from favorites" : "Add to favorites"}
                  >
                    {favorites.has(model.id) ? (
                      <StarIconSolid className="h-5 w-5 text-yellow-500" />
                    ) : (
                      <StarIcon className="h-5 w-5 text-gray-400 hover:text-yellow-500" />
                    )}
                  </button>
                  <button
                    onClick={() => deleteModelMutation.mutate(model.id)}
                    disabled={deleteModelMutation.isPending}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md 
                             text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500
                             disabled:opacity-50 disabled:cursor-not-allowed dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800 dark:focus:ring-offset-gray-800"
                  >
                    <TrashIcon className="h-4 w-4 mr-2" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 