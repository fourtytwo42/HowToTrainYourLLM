declare module 'node-nvidia-smi' {
  interface NvidiaSmiData {
    memory: {
      used: number;
      total: number;
    };
    gpu: number;
    temperature: {
      gpu: number;
    };
  }

  function nvsmi(): Promise<NvidiaSmiData>;
  export = nvsmi;
} 