import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FiDownload, FiTrash2, FiPlay, FiSquare } from 'react-icons/fi';

interface Job {
  id: string;
  type: 'train' | 'test' | 'pull';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  model: string;
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
  metrics?: {
    loss: number;
    accuracy: number;
    duration: number;
  };
  createdAt: string;
  completedAt?: string;
  error?: string;
}

const JobHistory: React.FC = () => {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showLogs, setShowLogs] = useState(false);

  const { data: jobs, isLoading } = useQuery<Job[]>({
    queryKey: ['jobs'],
    queryFn: async () => {
      const response = await fetch('/api/jobs');
      if (!response.ok) throw new Error('Failed to fetch jobs');
      return response.json();
    },
  });

  const handleDownload = async (jobId: string) => {
    const response = await fetch(`/api/jobs/${jobId}/download`);
    if (!response.ok) throw new Error('Failed to download job');
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `job-${jobId}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (jobId: string) => {
    const response = await fetch(`/api/jobs/${jobId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete job');
    // Refresh jobs list
    window.location.reload();
  };

  const handleRetry = async (jobId: string) => {
    const response = await fetch(`/api/jobs/${jobId}/retry`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to retry job');
    // Refresh jobs list
    window.location.reload();
  };

  const handleCancel = async (jobId: string) => {
    const response = await fetch(`/api/jobs/${jobId}/cancel`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to cancel job');
    // Refresh jobs list
    window.location.reload();
  };

  if (isLoading) {
    return <div>Loading job history...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">
          Job History
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {jobs?.map((job) => (
          <div
            key={job.id}
            className="bg-white dark:bg-gray-800 shadow rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    job.status === 'completed'
                      ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                      : job.status === 'failed'
                      ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                      : job.status === 'running'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  {job.status}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {job.type}
                </span>
              </div>
              <div className="flex space-x-2">
                {job.status === 'completed' && (
                  <button
                    onClick={() => handleDownload(job.id)}
                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                    title="Download results"
                  >
                    <FiDownload className="h-5 w-5" />
                  </button>
                )}
                {job.status === 'failed' && (
                  <button
                    onClick={() => handleRetry(job.id)}
                    className="text-gray-400 hover:text-green-500"
                    title="Retry job"
                  >
                    <FiPlay className="h-5 w-5" />
                  </button>
                )}
                {job.status === 'running' && (
                  <button
                    onClick={() => handleCancel(job.id)}
                    className="text-gray-400 hover:text-red-500"
                    title="Cancel job"
                  >
                    <FiSquare className="h-5 w-5" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(job.id)}
                  className="text-gray-400 hover:text-red-500"
                  title="Delete job"
                >
                  <FiTrash2 className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="mt-2">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                {job.model}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Started:{' '}
                {new Date(job.createdAt).toLocaleString()}
                {job.completedAt &&
                  ` • Completed: ${new Date(
                    job.completedAt
                  ).toLocaleString()}`}
              </p>
            </div>

            {job.metrics && (
              <div className="mt-2 grid grid-cols-3 gap-4">
                <div>
                  <dt className="text-xs text-gray-500 dark:text-gray-400">
                    Loss
                  </dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-white">
                    {job.metrics.loss.toFixed(4)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500 dark:text-gray-400">
                    Accuracy
                  </dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-white">
                    {(job.metrics.accuracy * 100).toFixed(2)}%
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500 dark:text-gray-400">
                    Duration
                  </dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-white">
                    {Math.round(job.metrics.duration / 60)}m
                  </dd>
                </div>
              </div>
            )}

            {job.error && (
              <div className="mt-2">
                <p className="text-sm text-red-600 dark:text-red-400">
                  Error: {job.error}
                </p>
              </div>
            )}

            <div className="mt-4">
              <button
                onClick={() => {
                  setSelectedJob(job);
                  setShowLogs(true);
                }}
                className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
              >
                View Logs
              </button>
            </div>
          </div>
        ))}
      </div>

      {showLogs && selectedJob && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Job Logs - {selectedJob.model}
              </h3>
              <button
                onClick={() => setShowLogs(false)}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                ×
              </button>
            </div>
            <div className="p-4 flex-1 overflow-auto">
              <pre className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 p-4 rounded overflow-x-auto">
                {/* Fetch and display logs here */}
                Loading logs...
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobHistory; 