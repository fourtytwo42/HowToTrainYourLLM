import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { Fragment } from 'react';
import type { Hyperparameters } from '../types';

const hyperparamSchema = z.object({
  batchSize: z.number().min(1).max(32),
  epochs: z.number().min(1).max(10),
  learningRate: z.number().min(1e-6).max(1e-2),
  gradientAccumulation: z.number().min(1).max(16),
  loraRank: z.number().min(1).max(64),
  loraAlpha: z.number().min(1).max(64),
  dropout: z.number().min(0).max(0.5),
  quantization: z.enum(['none', 'q4_0', 'q4_1']),
  earlyStop: z.object({
    patience: z.number().min(1).max(10),
    minDelta: z.number().min(0).max(0.1)
  })
});

interface HyperparamFormProps {
  onSubmit: (data: Hyperparameters) => void;
  defaultValues?: Partial<Hyperparameters>;
}

const quantizationOptions = [
  { value: 'none', label: 'None', description: 'Full precision (highest quality)' },
  { value: 'q4_0', label: 'Q4_0', description: '4-bit quantization (balanced)' },
  { value: 'q4_1', label: 'Q4_1', description: '4-bit quantization (faster)' }
];

const batchSizeOptions = [1, 2, 4, 8, 16, 32];
const epochOptions = [1, 2, 3, 5, 8, 10];

interface SliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  description?: string;
  formatValue?: (value: number) => string;
}

function Slider({ label, value, onChange, min, max, step = 1, description, formatValue }: SliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
          {formatValue ? formatValue(value) : value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 slider"
      />
      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
      )}
    </div>
  );
}

interface DropdownProps {
  label: string;
  value: string | number;
  onChange: (value: string | number) => void;
  options: Array<{ value: string | number; label: string; description?: string }>;
  description?: string;
}

function Dropdown({ label, value, onChange, options, description }: DropdownProps) {
  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <Menu as="div" className="relative">
        <Menu.Button className="relative w-full cursor-default rounded-lg bg-white dark:bg-gray-800 py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm border border-gray-300 dark:border-gray-600">
          <span className="block truncate text-gray-900 dark:text-gray-100">
            {selectedOption?.label || value}
          </span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </span>
        </Menu.Button>
        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Menu.Items className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
            {options.map((option) => (
              <Menu.Item key={option.value}>
                {({ active }) => (
                  <button
                    className={`${
                      active ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-gray-100'
                    } relative cursor-default select-none py-2 pl-3 pr-4 w-full text-left`}
                    onClick={() => onChange(option.value)}
                  >
                    <div>
                      <span className="block truncate font-medium">{option.label}</span>
                      {option.description && (
                        <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
                          {option.description}
                        </span>
                      )}
                    </div>
                  </button>
                )}
              </Menu.Item>
            ))}
          </Menu.Items>
        </Transition>
      </Menu>
      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
      )}
    </div>
  );
}

export function HyperparamForm({ onSubmit, defaultValues }: HyperparamFormProps) {
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<Hyperparameters>({
    resolver: zodResolver(hyperparamSchema),
    defaultValues: {
      batchSize: 4,
      epochs: 3,
      learningRate: 2e-4,
      gradientAccumulation: 4,
      loraRank: 16,
      loraAlpha: 16,
      dropout: 0.1,
      quantization: 'none',
      earlyStop: {
        patience: 3,
        minDelta: 0.01
      },
      ...defaultValues
    }
  });

  const watchedValues = watch();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Training Parameters */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
            Basic Parameters
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Controller
              name="batchSize"
              control={control}
              render={({ field }) => (
                <Dropdown
                  label="Batch Size"
                  value={field.value}
                  onChange={field.onChange}
                  options={batchSizeOptions.map(size => ({
                    value: size,
                    label: `${size}`,
                    description: size <= 4 ? 'Lower memory usage' : size >= 16 ? 'Higher memory usage' : 'Balanced'
                  }))}
                  description="Number of samples processed together. Lower values use less GPU memory."
                />
              )}
            />

            <Controller
              name="epochs"
              control={control}
              render={({ field }) => (
                <Dropdown
                  label="Epochs"
                  value={field.value}
                  onChange={field.onChange}
                  options={epochOptions.map(epoch => ({
                    value: epoch,
                    label: `${epoch}`,
                    description: epoch <= 2 ? 'Quick training' : epoch >= 8 ? 'Thorough training' : 'Standard'
                  }))}
                  description="Number of complete passes through the training data."
                />
              )}
            />
          </div>
        </div>

        {/* Advanced Parameters */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            Advanced Parameters
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Controller
              name="learningRate"
              control={control}
              render={({ field }) => (
                <Slider
                  label="Learning Rate"
                  value={field.value}
                  onChange={field.onChange}
                  min={1e-6}
                  max={1e-2}
                  step={1e-6}
                  formatValue={(val) => val.toExponential(1)}
                  description="How fast the model learns. Lower is more stable."
                />
              )}
            />

            <Controller
              name="gradientAccumulation"
              control={control}
              render={({ field }) => (
                <Slider
                  label="Gradient Accumulation"
                  value={field.value}
                  onChange={field.onChange}
                  min={1}
                  max={16}
                  description="Simulates larger batch sizes without using more memory."
                />
              )}
            />
          </div>
        </div>

        {/* LoRA Parameters */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
            LoRA Configuration
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Controller
              name="loraRank"
              control={control}
              render={({ field }) => (
                <Slider
                  label="LoRA Rank"
                  value={field.value}
                  onChange={field.onChange}
                  min={1}
                  max={64}
                  description="Higher rank = more parameters but better adaptation."
                />
              )}
            />

            <Controller
              name="loraAlpha"
              control={control}
              render={({ field }) => (
                <Slider
                  label="LoRA Alpha"
                  value={field.value}
                  onChange={field.onChange}
                  min={1}
                  max={64}
                  description="Scaling factor for LoRA adaptation strength."
                />
              )}
            />

            <Controller
              name="dropout"
              control={control}
              render={({ field }) => (
                <Slider
                  label="Dropout"
                  value={field.value}
                  onChange={field.onChange}
                  min={0}
                  max={0.5}
                  step={0.01}
                  formatValue={(val) => `${(val * 100).toFixed(0)}%`}
                  description="Prevents overfitting. 10-20% is usually good."
                />
              )}
            />
          </div>
        </div>

        {/* Optimization */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
            Optimization
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Controller
              name="quantization"
              control={control}
              render={({ field }) => (
                <Dropdown
                  label="Quantization"
                  value={field.value}
                  onChange={field.onChange}
                  options={quantizationOptions}
                  description="Reduces memory usage and speeds up training."
                />
              )}
            />

            <Controller
              name="earlyStop.patience"
              control={control}
              render={({ field }) => (
                <Slider
                  label="Early Stop Patience"
                  value={field.value}
                  onChange={field.onChange}
                  min={1}
                  max={10}
                  description="Stop training if no improvement for N epochs."
                />
              )}
            />

            <Controller
              name="earlyStop.minDelta"
              control={control}
              render={({ field }) => (
                <Slider
                  label="Min Delta"
                  value={field.value}
                  onChange={field.onChange}
                  min={0}
                  max={0.1}
                  step={0.001}
                  formatValue={(val) => val.toFixed(3)}
                  description="Minimum improvement to consider as progress."
                />
              )}
            />
          </div>
        </div>

        {/* Training Summary */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Training Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Batch Size:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">{watchedValues.batchSize}</span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Epochs:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">{watchedValues.epochs}</span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">LoRA Rank:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">{watchedValues.loraRank}</span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Quantization:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">{watchedValues.quantization}</span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-600">
          <button
            type="submit"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
          >
            🚀 Start Training
          </button>
        </div>
      </form>
    </div>
  );
} 