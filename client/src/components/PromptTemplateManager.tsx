import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiSave, FiTrash2, FiEdit2, FiCopy } from 'react-icons/fi';

interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  variables: string[];
  category: string;
}

const PromptTemplateManager: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | null>(null);
  const queryClient = useQueryClient();

  const { data: templates, isLoading } = useQuery<PromptTemplate[]>({
    queryKey: ['templates'],
    queryFn: async () => {
      const response = await fetch('/api/templates');
      if (!response.ok) throw new Error('Failed to fetch templates');
      return response.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (template: Omit<PromptTemplate, 'id'>) => {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template),
      });
      if (!response.ok) throw new Error('Failed to create template');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setIsEditing(false);
      setEditingTemplate(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (template: PromptTemplate) => {
      const response = await fetch(`/api/templates/${template.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template),
      });
      if (!response.ok) throw new Error('Failed to update template');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setIsEditing(false);
      setEditingTemplate(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/templates/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete template');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate) return;

    if (editingTemplate.id) {
      updateMutation.mutate(editingTemplate);
    } else {
      createMutation.mutate(editingTemplate);
    }
  };

  const handleCopy = (template: string) => {
    navigator.clipboard.writeText(template);
  };

  if (isLoading) {
    return <div>Loading templates...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">
          Prompt Templates
        </h2>
        <button
          onClick={() => {
            setIsEditing(true);
            setEditingTemplate({
              id: '',
              name: '',
              description: '',
              template: '',
              variables: [],
              category: 'general',
            });
          }}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <FiSave className="h-4 w-4 mr-2" />
          New Template
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
              value={editingTemplate?.name || ''}
              onChange={(e) =>
                setEditingTemplate((prev) =>
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
              value={editingTemplate?.description || ''}
              onChange={(e) =>
                setEditingTemplate((prev) =>
                  prev ? { ...prev, description: e.target.value } : null
                )
              }
              rows={2}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Template
            </label>
            <textarea
              value={editingTemplate?.template || ''}
              onChange={(e) =>
                setEditingTemplate((prev) =>
                  prev ? { ...prev, template: e.target.value } : null
                )
              }
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm font-mono"
              placeholder="Use {variable} for placeholders"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Variables (comma-separated)
            </label>
            <input
              type="text"
              value={editingTemplate?.variables.join(', ') || ''}
              onChange={(e) =>
                setEditingTemplate((prev) =>
                  prev
                    ? {
                        ...prev,
                        variables: e.target.value
                          .split(',')
                          .map((v) => v.trim())
                          .filter(Boolean),
                      }
                    : null
                )
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
              placeholder="variable1, variable2, variable3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Category
            </label>
            <select
              value={editingTemplate?.category || 'general'}
              onChange={(e) =>
                setEditingTemplate((prev) =>
                  prev ? { ...prev, category: e.target.value } : null
                )
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
            >
              <option value="general">General</option>
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
                setEditingTemplate(null);
              }}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Save Template
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates?.map((template) => (
          <div
            key={template.id}
            className="bg-white dark:bg-gray-800 shadow rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {template.name}
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleCopy(template.template)}
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                  title="Copy template"
                >
                  <FiCopy className="h-5 w-5" />
                </button>
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setEditingTemplate(template);
                  }}
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                >
                  <FiEdit2 className="h-5 w-5" />
                </button>
                <button
                  onClick={() => deleteMutation.mutate(template.id)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <FiTrash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {template.description}
            </p>
            <div className="mt-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-800 dark:text-primary-100">
                {template.category}
              </span>
            </div>
            <div className="mt-4">
              <pre className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 p-2 rounded overflow-x-auto">
                {template.template}
              </pre>
            </div>
            {template.variables.length > 0 && (
              <div className="mt-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Variables: {template.variables.join(', ')}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PromptTemplateManager; 