/**
 * Workers Module Index for AuriPlan
 * Export all Web Worker related functionality
 */

// Worker hooks and utilities
export function createFloorPlanWorker(): Worker {
  return new Worker(new URL('./floorplanWorker.ts', import.meta.url), {
    type: 'module',
  });
}

export interface WorkerMessage<T = any> {
  type: string;
  payload?: T;
}

export interface WorkerResponse<T = any> {
  type: 'success' | 'error' | 'progress';
  payload?: T;
}

/**
 * Hook for using floor plan worker
 */
export function useFloorPlanWorker() {
  let worker: Worker | null = null;

  const initWorker = () => {
    if (!worker) {
      worker = createFloorPlanWorker();
    }
    return worker;
  };

  const terminateWorker = () => {
    if (worker) {
      worker.terminate();
      worker = null;
    }
  };

  const generateFloorPlans = <T>(
    request: any,
    variants: number = 3,
    onProgress?: (progress: number) => void
  ): Promise<T> => {
    return new Promise((resolve, reject) => {
      const w = initWorker();

      const handleMessage = (event: MessageEvent) => {
        const { type, payload } = event.data;

        switch (type) {
          case 'progress':
            onProgress?.(payload.progress);
            break;
          case 'success':
            w.removeEventListener('message', handleMessage);
            resolve(payload.plans as T);
            break;
          case 'error':
            w.removeEventListener('message', handleMessage);
            reject(new Error(payload.error));
            break;
        }
      };

      w.addEventListener('message', handleMessage);
      w.postMessage({
        type: 'generate',
        payload: { request, variants },
      });
    });
  };

  const cancelGeneration = () => {
    if (worker) {
      worker.postMessage({ type: 'cancel' });
    }
  };

  return {
    generateFloorPlans,
    cancelGeneration,
    terminateWorker,
  };
}
