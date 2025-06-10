import React, { useState } from 'react';
import { FiDownload, FiTrash2, FiPlay, FiPause } from 'react-icons/fi';

interface Model {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'training';
  size: string;
  lastUpdated: string;
}

export default function Models() {
  // Mock data - replace with actual API calls
  const [models, setModels] = useState<Model[]>([
    {
      id: '1',
      name: 'llama2-7b',
      status: 'active',
      size: '4.2 GB',
      lastUpdated: '2024-03-15'
    },
    {
      id: '2',
      name: 'mistral-7b',
      status: 'inactive',
      size: '4.1 GB',
      lastUpdated: '2024-03-14'
    },
    {
      id: '3',
      name: 'custom-model-1',
      status: 'training',
      size: '3.8 GB',
      lastUpdated: '2024-03-13'
    }
  ]);

  const handleStatusToggle = (modelId: string) => {
    setModels(models.map(model => {
      if (model.id === modelId) {
        return {
          ...model,
          status: model.status === 'active' ? 'inactive' : 'active'
        };
      }
      return model;
    }));
  };

  const handleDelete = (modelId: string) => {
    setModels(models.filter(model => model.id !== modelId));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Models</h1>
        <button className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
          Add Model
        </button>
      </div>

      {/* Models Table */}
      <div className="bg-white shadow rounded-lg dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                  Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                  Last Updated
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
              {models.map((model) => (
                <tr key={model.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {model.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      model.status === 'active'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : model.status === 'training'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                    }`}>
                      {model.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {model.size}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {model.lastUpdated}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleStatusToggle(model.id)}
                        className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                      >
                        {model.status === 'active' ? (
                          <FiPause className="w-5 h-5" />
                        ) : (
                          <FiPlay className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(model.id)}
                        className="text-red-400 hover:text-red-500 dark:hover:text-red-300"
                      >
                        <FiTrash2 className="w-5 h-5" />
                      </button>
                      <button className="text-primary-400 hover:text-primary-500 dark:hover:text-primary-300">
                        <FiDownload className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 