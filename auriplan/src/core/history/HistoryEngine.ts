// ============================================
// History Engine - Undo/Redo system
// ============================================

import { produce, Draft } from 'immer';

export type ActionType = 
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'MOVE'
  | 'ROTATE'
  | 'SCALE'
  | 'GROUP'
  | 'UNGROUP'
  | 'IMPORT'
  | 'SETTINGS'
  | 'COMPOSITE';

export interface HistoryAction<T = unknown> {
  id: string;
  type: ActionType;
  description: string;
  timestamp: number;
  payload: T;
  undoPayload?: T;
  userId?: string;
}

export interface HistoryConfig {
  maxHistory: number;
  debounceMs: number;
  groupSimilarActions: boolean;
  excludeFromHistory: string[];
}

export const DEFAULT_HISTORY_CONFIG: HistoryConfig = {
  maxHistory: 100,
  debounceMs: 500,
  groupSimilarActions: true,
  excludeFromHistory: ['CAMERA_MOVE', 'SELECTION_CHANGE', 'HOVER'],
};

export class HistoryEngine<T> {
  private past: T[] = [];
  private present: T;
  private future: T[] = [];
  private actions: HistoryAction[] = [];
  private config: HistoryConfig;
  private lastActionTime: number = 0;
  private lastActionType: ActionType | null = null;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private listeners: Set<(state: { canUndo: boolean; canRedo: boolean }) => void> = new Set();

  constructor(initialState: T, config: Partial<HistoryConfig> = {}) {
    this.present = initialState;
    this.config = { ...DEFAULT_HISTORY_CONFIG, ...config };
  }

  // Getters
  getState(): T {
    return this.present;
  }

  getPast(): T[] {
    return [...this.past];
  }

  getFuture(): T[] {
    return [...this.future];
  }

  getActions(): HistoryAction[] {
    return [...this.actions];
  }

  canUndo(): boolean {
    return this.past.length > 0;
  }

  canRedo(): boolean {
    return this.future.length > 0;
  }

  getUndoDescription(): string | null {
    const lastAction = this.actions[this.actions.length - 1];
    return lastAction?.description || null;
  }

  getRedoDescription(): string | null {
    // Future actions would need to be stored for this
    return null;
  }

  // Subscribe to state changes
  subscribe(listener: (state: { canUndo: boolean; canRedo: boolean }) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const state = { canUndo: this.canUndo(), canRedo: this.canRedo() };
    this.listeners.forEach(listener => listener(state));
  }

  // Undo
  undo(): T | null {
    if (!this.canUndo()) return null;

    const previous = this.past[this.past.length - 1];
    this.future = [this.present, ...this.future];
    this.past = this.past.slice(0, -1);
    this.present = previous;
    this.actions.pop();

    this.notifyListeners();
    return this.present;
  }

  // Redo
  redo(): T | null {
    if (!this.canRedo()) return null;

    const next = this.future[0];
    this.past = [...this.past, this.present];
    this.future = this.future.slice(1);
    this.present = next;

    this.notifyListeners();
    return this.present;
  }

  // Push new state
  push(
    newState: T | ((current: T) => T),
    action: Omit<HistoryAction, 'id' | 'timestamp'>
  ): void {
    // Check if action should be excluded
    if (this.config.excludeFromHistory.includes(action.type)) {
      this.present = typeof newState === 'function' 
        ? (newState as (current: T) => T)(this.present)
        : newState;
      return;
    }

    const now = Date.now();
    const timeSinceLastAction = now - this.lastActionTime;

    // Debounce similar actions
    if (
      this.config.groupSimilarActions &&
      action.type === this.lastActionType &&
      timeSinceLastAction < this.config.debounceMs
    ) {
      this.present = typeof newState === 'function'
        ? (newState as (current: T) => T)(this.present)
        : newState;
      
      if (this.actions.length > 0) {
        this.actions[this.actions.length - 1].timestamp = now;
      }

      this.lastActionTime = now;
      this.notifyListeners();
      return;
    }

    // Clear debounce timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    // Calculate new state
    const resolvedState = typeof newState === 'function'
      ? (newState as (current: T) => T)(this.present)
      : newState;

    // Don't push if state hasn't changed
    if (this.isEqual(this.present, resolvedState)) {
      return;
    }

    // Add to history
    this.past = [...this.past, this.present];
    
    // Limit history size
    if (this.past.length > this.config.maxHistory) {
      this.past = this.past.slice(-this.config.maxHistory);
    }

    this.present = resolvedState;
    this.future = [];

    // Record action
    const historyAction: HistoryAction = {
      ...action,
      id: this.generateId(),
      timestamp: now,
    };

    this.actions.push(historyAction);
    
    // Limit action history
    if (this.actions.length > this.config.maxHistory) {
      this.actions = this.actions.slice(-this.config.maxHistory);
    }

    this.lastActionTime = now;
    this.lastActionType = action.type;

    this.notifyListeners();
  }

  // Push with debounce
  pushDebounced(
    newState: T | ((current: T) => T),
    action: Omit<HistoryAction, 'id' | 'timestamp'>
  ): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.push(newState, action);
      this.debounceTimer = null;
    }, this.config.debounceMs);
  }

  // Batch multiple operations using Immer
  batch(
    operations: ((draft: Draft<T>) => void)[],
    action: Omit<HistoryAction, 'id' | 'timestamp'>
  ): void {
    const newState = produce(this.present, (draft) => {
      for (const operation of operations) {
        operation(draft);
      }
    });

    this.push(newState, action);
  }

  // Update state without adding to history
  silentUpdate(updater: (draft: Draft<T>) => void): void {
    this.present = produce(this.present, updater);
  }

  // Reset history
  reset(newState: T): void {
    this.past = [];
    this.present = newState;
    this.future = [];
    this.actions = [];
    this.lastActionTime = 0;
    this.lastActionType = null;
    this.notifyListeners();
  }

  // Clear future (after branch)
  clearFuture(): void {
    this.future = [];
    this.notifyListeners();
  }

  // Jump to specific point in history
  jumpTo(index: number): T | null {
    const totalStates = this.past.length + 1 + this.future.length;
    
    if (index < 0 || index >= totalStates) return null;

    const allStates = [...this.past, this.present, ...this.future];
    this.present = allStates[index];
    this.past = allStates.slice(0, index);
    this.future = allStates.slice(index + 1);
    this.actions = this.actions.slice(0, index);

    this.notifyListeners();
    return this.present;
  }

  // Get history info
  getInfo(): {
    pastCount: number;
    futureCount: number;
    totalActions: number;
    canUndo: boolean;
    canRedo: boolean;
  } {
    return {
      pastCount: this.past.length,
      futureCount: this.future.length,
      totalActions: this.actions.length,
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
    };
  }

  // Export/Import
  serialize(): string {
    return JSON.stringify({
      past: this.past,
      present: this.present,
      future: this.future,
      actions: this.actions,
      config: this.config,
    });
  }

  deserialize(serialized: string): void {
    const data = JSON.parse(serialized);
    this.past = data.past || [];
    this.present = data.present;
    this.future = data.future || [];
    this.actions = data.actions || [];
    this.config = { ...this.config, ...data.config };
    this.notifyListeners();
  }

  // Private helpers
  private isEqual(a: T, b: T): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  private generateId(): string {
    return `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Transaction support for complex operations
export class HistoryTransaction<T> {
  private operations: ((draft: Draft<T>) => void)[] = [];
  private committed = false;

  constructor(
    private history: HistoryEngine<T>,
    private description: string
  ) {}

  add(operation: (draft: Draft<T>) => void): this {
    if (this.committed) {
      throw new Error('Transaction already committed');
    }
    this.operations.push(operation);
    return this;
  }

  commit(): void {
    if (this.committed) {
      throw new Error('Transaction already committed');
    }
    
    this.history.batch(this.operations, {
      type: 'COMPOSITE',
      description: this.description,
      payload: { operationCount: this.operations.length },
    });
    
    this.committed = true;
  }

  rollback(): void {
    this.operations = [];
    this.committed = true;
  }
}
