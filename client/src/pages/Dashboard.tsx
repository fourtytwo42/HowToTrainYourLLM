import React from 'react';
import { FiCpu, FiDatabase, FiClock } from 'react-icons/fi';

interface SystemStatus {
  gpuUsage: number;
  memoryUsage: number;
  activeModels: number;
}

interface ModelStats {
  total: number;
  active: number;
  training: number;
}

export default function Dashboard() {
  // Mock data - replace with actual API calls
  const systemStatus: SystemStatus = {
    gpuUsage: 45,
    memoryUsage: 60,
    activeModels: 2
  };

  const modelStats: ModelStats = {
    total: 5,
    active: 2,
    training: 1
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>

      {/* System Status */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800">
          <div className="flex items-center">
            <div className="p-3 bg-primary-100 rounded-full dark:bg-primary-900">
              <FiCpu className="w-6 h-6 text-primary-600 dark:text-primary-300" />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">GPU Usage</h2>
              <p className="text-2xl font-semibold text-gray-700 dark:text-gray-300">
                {systemStatus.gpuUsage}%
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800">
          <div className="flex items-center">
            <div className="p-3 bg-primary-100 rounded-full dark:bg-primary-900">
              <FiDatabase className="w-6 h-6 text-primary-600 dark:text-primary-300" />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Memory Usage</h2>
              <p className="text-2xl font-semibold text-gray-700 dark:text-gray-300">
                {systemStatus.memoryUsage}%
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800">
          <div className="flex items-center">
            <div className="p-3 bg-primary-100 rounded-full dark:bg-primary-900">
              <FiClock className="w-6 h-6 text-primary-600 dark:text-primary-300" />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Active Models</h2>
              <p className="text-2xl font-semibold text-gray-700 dark:text-gray-300">
                {systemStatus.activeModels}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Model Overview */}
      <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Model Overview</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="p-4 bg-gray-50 rounded-lg dark:bg-gray-700">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Models</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{modelStats.total}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg dark:bg-gray-700">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Models</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{modelStats.active}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg dark:bg-gray-700">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Training</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{modelStats.training}</p>
          </div>
        </div>
      </div>
    </div>
  );
} 