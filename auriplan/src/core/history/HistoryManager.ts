// ============================================
// HISTORY MANAGER - Sistema Undo/Redo Profissional
// ============================================

import { produce } from 'immer';

// Tipo de ação
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
  | 'COMPLEX';

// Ação individual
export interface HistoryAction {
  id: string;
  type: ActionType;
  description: string;
  timestamp: number;
  userId?: string;
}

// Estado de histórico genérico
export interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

// Configuração
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

// ============================================
// HISTORY MANAGER
// ============================================

export class HistoryManager<T> {
  private state: HistoryState<T>;
  private config: HistoryConfig;
  private actionHistory: HistoryAction[] = [];
  private lastActionTime: number = 0;
  private lastActionType: ActionType | null = null;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    initialState: T,
    config: Partial<HistoryConfig> = {}
  ) {
    this.state = {
      past: [],
      present: initialState,
      future: [],
    };
    this.config = { ...DEFAULT_HISTORY_CONFIG, ...config };
  }

  // Getters
  getState(): T {
    return this.state.present;
  }

  getHistory(): HistoryAction[] {
    return [...this.actionHistory];
  }

  canUndo(): boolean {
    return this.state.past.length > 0;
  }

  canRedo(): boolean {
    return this.state.future.length > 0;
  }

  getUndoDescription(): string | null {
    const lastAction = this.actionHistory[this.actionHistory.length - 1];
    return lastAction?.description || null;
  }

  getRedoDescription(): string | null {
    // Redo description would require storing action metadata
    return null;
  }

  // Undo
  undo(): T | null {
    if (!this.canUndo()) return null;

    const previous = this.state.past[this.state.past.length - 1];
    const newPast = this.state.past.slice(0, -1);

    this.state = {
      past: newPast,
      present: previous,
      future: [this.state.present, ...this.state.future],
    };

    this.actionHistory.pop();

    return this.state.present;
  }

  // Redo
  redo(): T | null {
    if (!this.canRedo()) return null;

    const next = this.state.future[0];
    const newFuture = this.state.future.slice(1);

    this.state = {
      past: [...this.state.past, this.state.present],
      present: next,
      future: newFuture,
    };

    return this.state.present;
  }

  // Push new state
  push(
    newState: T | ((current: T) => T),
    action: Omit<HistoryAction, 'id' | 'timestamp'>
  ): void {
    // Check if action should be excluded
    if (this.config.excludeFromHistory.includes(action.type)) {
      if (typeof newState === 'function') {
        this.state.present = (newState as (current: T) => T)(this.state.present);
      } else {
        this.state.present = newState;
      }
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
      // Replace the last state instead of adding a new one
      const updatedState = typeof newState === 'function'
        ? (newState as (current: T) => T)(this.state.present)
        : newState;

      this.state.present = updatedState;
      
      // Update the last action timestamp
      if (this.actionHistory.length > 0) {
        this.actionHistory[this.actionHistory.length - 1].timestamp = now;
      }

      this.lastActionTime = now;
      return;
    }

    // Clear debounce timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    // Calculate new state
    const resolvedState = typeof newState === 'function'
      ? (newState as (current: T) => T)(this.state.present)
      : newState;

    // Don't push if state hasn't changed
    if (this.isEqual(this.state.present, resolvedState)) {
      return;
    }

    // Add to history
    const newPast = [...this.state.past, this.state.present];
    
    // Limit history size
    if (newPast.length > this.config.maxHistory) {
      newPast.shift();
    }

    this.state = {
      past: newPast,
      present: resolvedState,
      future: [], // Clear future on new action
    };

    // Record action
    const historyAction: HistoryAction = {
      ...action,
      id: this.generateId(),
      timestamp: now,
    };

    this.actionHistory.push(historyAction);
    
    // Limit action history
    if (this.actionHistory.length > this.config.maxHistory) {
      this.actionHistory.shift();
    }

    this.lastActionTime = now;
    this.lastActionType = action.type;
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
      this.push(newState as unknown as T, action);
      this.debounceTimer = null;
    }, this.config.debounceMs);
  }

  // Batch multiple operations
  batch(
    operations: ((draft: T) => void)[],
    action: Omit<HistoryAction, 'id' | 'timestamp'>
  ): void {
    // Use deepClone to get a mutable copy, apply operations, then push
    const cloned: T = JSON.parse(JSON.stringify(this.state.present));
    for (const operation of operations) {
      operation(cloned as any);
    }
    this.push(cloned, action);
  }

  // Reset history
  reset(newState: T): void {
    this.state = {
      past: [],
      present: newState,
      future: [],
    };
    this.actionHistory = [];
    this.lastActionTime = 0;
    this.lastActionType = null;
  }

  // Clear future (after branch)
  clearFuture(): void {
    this.state.future = [];
  }

  // Jump to specific point in history
  jumpTo(index: number): T | null {
    const totalStates = this.state.past.length + 1 + this.state.future.length;
    
    if (index < 0 || index >= totalStates) return null;

    const allStates = [...this.state.past, this.state.present, ...this.state.future];
    const targetState = allStates[index];

    this.state = {
      past: allStates.slice(0, index),
      present: targetState,
      future: allStates.slice(index + 1),
    };

    // Update action history
    this.actionHistory = this.actionHistory.slice(0, index);

    return targetState;
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
      pastCount: this.state.past.length,
      futureCount: this.state.future.length,
      totalActions: this.actionHistory.length,
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
    };
  }

  // Export/Import
  serialize(): string {
    return JSON.stringify({
      state: this.state,
      actionHistory: this.actionHistory,
      config: this.config,
    });
  }

  deserialize(serialized: string): void {
    const data = JSON.parse(serialized);
    this.state = data.state;
    this.actionHistory = data.actionHistory || [];
    this.config = { ...this.config, ...data.config };
  }

  // Private helpers
  private isEqual(a: T, b: T): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  private generateId(): string {
    return `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ============================================
// TRANSACTION MANAGER
// ============================================

export interface Transaction {
  id: string;
  description: string;
  operations: TransactionOperation[];
}

export interface TransactionOperation {
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  entityType: string;
  entityId: string;
  before: unknown;
  after: unknown;
}

export class TransactionManager {
  private transactions: Transaction[] = [];
  private activeTransaction: Transaction | null = null;

  begin(description: string): string {
    const id = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.activeTransaction = {
      id,
      description,
      operations: [],
    };
    return id;
  }

  addOperation(operation: TransactionOperation): void {
    if (!this.activeTransaction) {
      throw new Error('No active transaction');
    }
    this.activeTransaction.operations.push(operation);
  }

  commit(): Transaction | null {
    if (!this.activeTransaction) return null;
    
    const transaction = this.activeTransaction;
    this.transactions.push(transaction);
    this.activeTransaction = null;
    
    return transaction;
  }

  rollback(): void {
    this.activeTransaction = null;
  }

  getTransaction(id: string): Transaction | undefined {
    return this.transactions.find(t => t.id === id);
  }

  getAllTransactions(): Transaction[] {
    return [...this.transactions];
  }

  clear(): void {
    this.transactions = [];
    this.activeTransaction = null;
  }
}
