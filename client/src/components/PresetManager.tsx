import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiSave, FiTrash2, FiEdit2 } from 'react-icons/fi';

interface Preset {
  id: string;
  name: string;
  description: string;
  config: {
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
  };
}

const PresetManager: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingPreset, setEditingPreset] = useState<Preset | null>(null);
  const queryClient = useQueryClient();

  const { data: presets, isLoading } = useQuery<Preset[]>({
    queryKey: ['presets'],
    queryFn: async () => {
      const response = await fetch('/api/presets');
      if (!response.ok) throw new Error('Failed to fetch presets');
      return response.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (preset: Omit<Preset, 'id'>) => {
      const response = await fetch('/api/presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preset),
      });
      if (!response.ok) throw new Error('Failed to create preset');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['presets'] });
      setIsEditing(false);
      setEditingPreset(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (preset: Preset) => {
      const response = await fetch(`/api/presets/${preset.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preset),
      });
      if (!response.ok) throw new Error('Failed to update preset');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['presets'] });
      setIsEditing(false);
      setEditingPreset(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/presets/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete preset');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['presets'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPreset) return;

    if (editingPreset.id) {
      updateMutation.mutate(editingPreset);
    } else {
      createMutation.mutate(editingPreset);
    }
  };

  if (isLoading) {
    return <div>Loading presets...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">
          Training Presets
        </h2>
        <button
          onClick={() => {
            setIsEditing(true);
            setEditingPreset({
              id: '',
              name: '',
              description: '',
              config: {
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
              },
            });
          }}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <FiSave className="h-4 w-4 mr-2" />
          New Preset
        </button>
      </div>

      {isEditing && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Name
            </label>
            <input
              type="text"
              value={editingPreset?.name || ''}
              onChange={(e) =>
                setEditingPreset((prev) =>
                  prev ? { ...prev, name: e.target.value } : null
                )
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              value={editingPreset?.description || ''}
              onChange={(e) =>
                setEditingPreset((prev) =>
                  prev ? { ...prev, description: e.target.value } : null
                )
              }
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Batch Size
              </label>
              <input
                type="number"
                value={editingPreset?.config.batchSize || 4}
                onChange={(e) =>
                  setEditingPreset((prev) =>
                    prev
                      ? {
                          ...prev,
                          config: {
                            ...prev.config,
                            batchSize: parseInt(e.target.value),
                          },
                        }
                      : null
                  )
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Epochs
              </label>
              <input
                type="number"
                value={editingPreset?.config.epochs || 3}
                onChange={(e) =>
                  setEditingPreset((prev) =>
                    prev
                      ? {
                          ...prev,
                          config: {
                            ...prev.config,
                            epochs: parseInt(e.target.value),
                          },
                        }
                      : null
                  )
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
              />
            </div>

            {/* Add more config fields as needed */}
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setEditingPreset(null);
              }}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Save Preset
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {presets?.map((preset) => (
          <div
            key={preset.id}
            className="bg-white dark:bg-gray-800 shadow rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {preset.name}
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setEditingPreset(preset);
                  }}
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                >
                  <FiEdit2 className="h-5 w-5" />
                </button>
                <button
                  onClick={() => deleteMutation.mutate(preset.id)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <FiTrash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {preset.description}
            </p>
            <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Batch Size</dt>
                <dd className="text-gray-900 dark:text-white">
                  {preset.config.batchSize}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Epochs</dt>
                <dd className="text-gray-900 dark:text-white">
                  {preset.config.epochs}
                </dd>
              </div>
              {/* Add more config details as needed */}
            </dl>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PresetManager; 