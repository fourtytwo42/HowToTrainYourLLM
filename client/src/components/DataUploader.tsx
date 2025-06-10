import React, { useState, useCallback } from 'react';
import { FiUpload, FiX } from 'react-icons/fi';
import { useDropzone } from 'react-dropzone';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import Ajv from 'ajv';

interface DataFile {
  id: string;
  filename: string;
  status: string;
}

const ajv = new Ajv();
const trainingDataSchema = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      prompt: { type: 'string' },
      completion: { type: 'string' }
    },
    required: ['prompt', 'completion']
  }
};
const validate = ajv.compile(trainingDataSchema);

interface DataUploaderProps {
  onUpload: (data: { prompt: string; completion: string }[]) => void;
}

export default function DataUploader({ onUpload }: DataUploaderProps) {
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:3001/api/data/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data'] });
      setError(null);
      toast.success('Data uploaded successfully!');
    },
    onError: (error) => {
      setError(error.message);
      toast.error('Failed to upload data. Please try again later.');
    },
  });

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!validate(data)) {
        toast.error('Invalid JSONL format. Each line must have prompt and completion fields.');
        return;
      }

      onUpload(data);
    } catch (error) {
      toast.error('Failed to parse JSONL file. Please check the format.');
    } finally {
      setIsLoading(false);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/json': ['.jsonl']
    },
    multiple: false
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">Training Data</h2>
      </div>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
      >
        <input {...getInputProps()} />
        {isLoading ? (
          <div className="text-gray-500">Processing...</div>
        ) : isDragActive ? (
          <div className="text-blue-500">Drop the JSONL file here</div>
        ) : (
          <div>
            <div className="text-gray-600">Drag and drop a JSONL file here, or click to select</div>
            <div className="text-sm text-gray-500 mt-2">
              File should contain an array of objects with prompt and completion fields
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiX className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Error
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 