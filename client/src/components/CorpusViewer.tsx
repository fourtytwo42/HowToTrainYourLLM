import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiTrash2, FiEdit2, FiDownload, FiUpload } from 'react-icons/fi';

interface CorpusEntry {
  id: string;
  prompt: string;
  completion: string;
  metadata: {
    source: string;
    category: string;
    tags: string[];
    createdAt: string;
  };
}

const CorpusViewer: React.FC = () => {
  const [selectedEntry, setSelectedEntry] = useState<CorpusEntry | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const queryClient = useQueryClient();

  const { data: entries, isLoading } = useQuery<CorpusEntry[]>({
    queryKey: ['corpus'],
    queryFn: async () => {
      const response = await fetch('/api/corpus');
      if (!response.ok) throw new Error('Failed to fetch corpus');
      return response.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (entry: CorpusEntry) => {
      const response = await fetch(`/api/corpus/${entry.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
      if (!response.ok) throw new Error('Failed to update entry');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['corpus'] });
      setIsEditing(false);
      setSelectedEntry(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/corpus/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete entry');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['corpus'] });
    },
  });

  const handleExport = async () => {
    if (!entries) return;
    const blob = new Blob([JSON.stringify(entries, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'corpus.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredEntries = entries?.filter((entry) => {
    const matchesSearch =
      entry.prompt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.completion.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || entry.metadata.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return <div>Loading corpus...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">
          Training Corpus
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={handleExport}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
          >
            <FiDownload className="h-4 w-4 mr-2" />
            Export
          </button>
          <button
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.json,.jsonl';
              input.onchange = async (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = async (e) => {
                  try {
                    const content = e.target?.result as string;
                    const data = JSON.parse(content);
                    const response = await fetch('/api/corpus/import', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(data),
                    });
                    if (!response.ok) throw new Error('Failed to import corpus');
                    queryClient.invalidateQueries({ queryKey: ['corpus'] });
                  } catch (error) {
                    console.error('Failed to import corpus:', error);
                  }
                };
                reader.readAsText(file);
              };
              input.click();
            }}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
          >
            <FiUpload className="h-4 w-4 mr-2" />
            Import
          </button>
        </div>
      </div>

      <div className="flex space-x-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search corpus..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
          />
        </div>
        <div className="w-48">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
          >
            <option value="all">All Categories</option>
            <option value="instruction">Instruction</option>
            <option value="chat">Chat</option>
            <option value="completion">Completion</option>
          </select>
        </div>
      </div>

      {isEditing && selectedEntry && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Prompt
            </label>
            <textarea
              value={selectedEntry.prompt}
              onChange={(e) =>
                setSelectedEntry((prev) =>
                  prev ? { ...prev, prompt: e.target.value } : null
                )
              }
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Completion
            </label>
            <textarea
              value={selectedEntry.completion}
              onChange={(e) =>
                setSelectedEntry((prev) =>
                  prev ? { ...prev, completion: e.target.value } : null
                )
              }
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Category
            </label>
            <select
              value={selectedEntry.metadata.category}
              onChange={(e) =>
                setSelectedEntry((prev) =>
                  prev
                    ? {
                        ...prev,
                        metadata: {
                          ...prev.metadata,
                          category: e.target.value,
                        },
                      }
                    : null
                )
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
            >
              <option value="instruction">Instruction</option>
              <option value="chat">Chat</option>
              <option value="completion">Completion</option>
            </select>
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setSelectedEntry(null);
              }}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                updateMutation.mutate(selectedEntry);
              }}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Save Changes
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {filteredEntries?.map((entry) => (
          <div
            key={entry.id}
            className="bg-white dark:bg-gray-800 shadow rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-800 dark:text-primary-100">
                  {entry.metadata.category}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(entry.metadata.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setSelectedEntry(entry);
                    setIsEditing(true);
                  }}
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                >
                  <FiEdit2 className="h-5 w-5" />
                </button>
                <button
                  onClick={() => deleteMutation.mutate(entry.id)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <FiTrash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="mt-2">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                Prompt
              </h4>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {entry.prompt}
              </p>
            </div>
            <div className="mt-2">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                Completion
              </h4>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {entry.completion}
              </p>
            </div>
            {entry.metadata.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {entry.metadata.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CorpusViewer; 