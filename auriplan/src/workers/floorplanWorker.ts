/**
 * Floor Plan Worker for AuriPlan
 * Runs floor plan generation in background thread
 */

import FloorPlanGenerator, { FloorPlanRequest, FloorPlan } from '../ai/generators/floorplan/FloorPlanGenerator';

// Worker context
const ctx = self as unknown as Worker;

interface WorkerMessage {
  type: 'generate' | 'cancel';
  payload?: {
    request: FloorPlanRequest;
    variants?: number;
  };
}

interface WorkerResponse {
  type: 'success' | 'error' | 'progress';
  payload?: {
    plans?: FloorPlan[];
    error?: string;
    progress?: number;
  };
}

// Handle incoming messages
ctx.addEventListener('message', (event: MessageEvent<WorkerMessage>) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'generate':
      handleGenerate(payload);
      break;
    case 'cancel':
      handleCancel();
      break;
    default:
      sendResponse({
        type: 'error',
        payload: { error: `Unknown message type: ${type}` },
      });
  }
});

let currentGenerator: FloorPlanGenerator | null = null;
let isCancelled = false;

/**
 * Handle floor plan generation request
 */
async function handleGenerate(payload?: WorkerMessage['payload']): Promise<void> {
  if (!payload?.request) {
    sendResponse({
      type: 'error',
      payload: { error: 'Missing request payload' },
    });
    return;
  }

  try {
    isCancelled = false;
    
    // Send progress update
    sendResponse({
      type: 'progress',
      payload: { progress: 10 },
    });

    // Create generator
    currentGenerator = new FloorPlanGenerator(payload.request);

    // Send progress update
    sendResponse({
      type: 'progress',
      payload: { progress: 30 },
    });

    // Check if cancelled
    if (isCancelled) {
      sendResponse({
        type: 'error',
        payload: { error: 'Generation cancelled' },
      });
      return;
    }

    // Generate variants
    const variants = payload.variants || 3;
    const plans = currentGenerator.generateVariants(variants);

    // Check if cancelled
    if (isCancelled) {
      sendResponse({
        type: 'error',
        payload: { error: 'Generation cancelled' },
      });
      return;
    }

    // Send progress update
    sendResponse({
      type: 'progress',
      payload: { progress: 90 },
    });

    // Send success response
    sendResponse({
      type: 'success',
      payload: { plans },
    });

  } catch (error) {
    sendResponse({
      type: 'error',
      payload: { 
        error: error instanceof Error ? error.message : 'Unknown error during generation' 
      },
    });
  } finally {
    currentGenerator = null;
  }
}

/**
 * Handle cancellation request
 */
function handleCancel(): void {
  isCancelled = true;
  currentGenerator = null;
}

/**
 * Send response to main thread
 */
function sendResponse(response: WorkerResponse): void {
  ctx.postMessage(response);
}

// Export for TypeScript
export {};
