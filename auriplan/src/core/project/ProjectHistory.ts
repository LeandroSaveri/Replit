import { EventEmitter } from '../../utils/EventEmitter';
import type { ProjectState } from './ProjectManager';

export interface HistoryEntry {
  id: string;
  timestamp: number;
  state: ProjectState;
  description: string;
}

export class ProjectHistory extends EventEmitter {
  private history: HistoryEntry[] = [];
  private currentIndex = -1;
  private maxSize = 100;
  private isBatching = false;
  private batchEntries: HistoryEntry[] = [];

  constructor(maxSize = 100) {
    super();
    this.maxSize = maxSize;
  }

  // Save a new state
  public saveState(state: ProjectState, description = 'Change'): void {
    if (this.isBatching) {
      // During batching, just store the latest state
      this.batchEntries = [{
        id: this.generateId(),
        timestamp: Date.now(),
        state: JSON.parse(JSON.stringify(state)),
        description,
      }];
      return;
    }

    // Remove any future states if we're not at the end
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }

    // Create new entry
    const entry: HistoryEntry = {
      id: this.generateId(),
      timestamp: Date.now(),
      state: JSON.parse(JSON.stringify(state)),
      description,
    };

    // Add to history
    this.history.push(entry);
    this.currentIndex++;

    // Trim history if it exceeds max size
    if (this.history.length > this.maxSize) {
      this.history.shift();
      this.currentIndex--;
    }

    this.emit('stateSaved', entry);
    this.emit('historyChanged', {
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      currentIndex: this.currentIndex,
      totalStates: this.history.length,
    });
  }

  // Undo
  public undo(): boolean {
    if (!this.canUndo()) {
      return false;
    }

    this.currentIndex--;
    const entry = this.history[this.currentIndex];
    
    this.emit('stateRestored', entry.state);
    this.emit('undo', entry);
    this.emit('historyChanged', {
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      currentIndex: this.currentIndex,
      totalStates: this.history.length,
    });

    return true;
  }

  // Redo
  public redo(): boolean {
    if (!this.canRedo()) {
      return false;
    }

    this.currentIndex++;
    const entry = this.history[this.currentIndex];
    
    this.emit('stateRestored', entry.state);
    this.emit('redo', entry);
    this.emit('historyChanged', {
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      currentIndex: this.currentIndex,
      totalStates: this.history.length,
    });

    return true;
  }

  // Check if can undo
  public canUndo(): boolean {
    return this.currentIndex > 0;
  }

  // Check if can redo
  public canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  // Get current state
  public getCurrentState(): ProjectState | null {
    if (this.currentIndex >= 0 && this.currentIndex < this.history.length) {
      return this.history[this.currentIndex].state;
    }
    return null;
  }

  // Get all history entries
  public getHistory(): HistoryEntry[] {
    return [...this.history];
  }

  // Get current index
  public getCurrentIndex(): number {
    return this.currentIndex;
  }

  // Jump to specific state
  public jumpTo(index: number): boolean {
    if (index < 0 || index >= this.history.length) {
      return false;
    }

    this.currentIndex = index;
    const entry = this.history[this.currentIndex];
    
    this.emit('stateRestored', entry.state);
    this.emit('historyChanged', {
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      currentIndex: this.currentIndex,
      totalStates: this.history.length,
    });

    return true;
  }

  // Batch operations
  public startBatch(description = 'Batch operation'): void {
    this.isBatching = true;
    this.batchEntries = [];
    this.emit('batchStarted', description);
  }

  public endBatch(): void {
    if (!this.isBatching) return;

    this.isBatching = false;

    // If we have batch entries, save the last one
    if (this.batchEntries.length > 0) {
      const lastEntry = this.batchEntries[this.batchEntries.length - 1];
      
      // Remove any future states
      if (this.currentIndex < this.history.length - 1) {
        this.history = this.history.slice(0, this.currentIndex + 1);
      }

      this.history.push(lastEntry);
      this.currentIndex++;

      // Trim history
      if (this.history.length > this.maxSize) {
        this.history.shift();
        this.currentIndex--;
      }

      this.emit('batchEnded', lastEntry);
      this.emit('historyChanged', {
        canUndo: this.canUndo(),
        canRedo: this.canRedo(),
        currentIndex: this.currentIndex,
        totalStates: this.history.length,
      });
    }

    this.batchEntries = [];
  }

  public cancelBatch(): void {
    if (!this.isBatching) return;

    this.isBatching = false;
    this.batchEntries = [];
    this.emit('batchCancelled');
  }

  public isInBatch(): boolean {
    return this.isBatching;
  }

  // Clear history
  public clear(): void {
    this.history = [];
    this.currentIndex = -1;
    this.batchEntries = [];
    this.isBatching = false;
    
    this.emit('historyCleared');
    this.emit('historyChanged', {
      canUndo: false,
      canRedo: false,
      currentIndex: -1,
      totalStates: 0,
    });
  }

  // Get history statistics
  public getStats(): {
    totalStates: number;
    currentIndex: number;
    canUndo: boolean;
    canRedo: boolean;
    memoryUsage: number;
  } {
    let memoryUsage = 0;
    for (const entry of this.history) {
      memoryUsage += JSON.stringify(entry).length * 2;
    }

    return {
      totalStates: this.history.length,
      currentIndex: this.currentIndex,
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      memoryUsage,
    };
  }

  // Compress history to save memory
  public compress(): void {
    // Keep every Nth state for older entries
    const compressionThreshold = 20;
    const keepEvery = 5;

    if (this.history.length <= compressionThreshold) return;

    const compressed: HistoryEntry[] = [];
    
    for (let i = 0; i < this.history.length; i++) {
      // Always keep recent states
      if (i >= this.history.length - compressionThreshold) {
        compressed.push(this.history[i]);
      } 
      // Compress older states
      else if (i % keepEvery === 0) {
        compressed.push(this.history[i]);
      }
    }

    // Update current index
    const oldIndex = this.currentIndex;
    this.history = compressed;
    
    // Find closest state to previous index
    if (oldIndex >= this.history.length) {
      this.currentIndex = this.history.length - 1;
    } else {
      this.currentIndex = oldIndex;
    }

    this.emit('historyCompressed', {
      oldSize: oldIndex + 1,
      newSize: this.history.length,
    });
  }

  // Export/Import history
  public export(): string {
    return JSON.stringify({
      history: this.history,
      currentIndex: this.currentIndex,
    });
  }

  public import(data: string): void {
    try {
      const parsed = JSON.parse(data);
      this.history = parsed.history || [];
      this.currentIndex = parsed.currentIndex || -1;
      
      this.emit('historyImported', {
        entries: this.history.length,
        currentIndex: this.currentIndex,
      });
    } catch (error) {
      console.error('Failed to import history:', error);
      throw new Error('Invalid history data');
    }
  }

  // Get history description for UI
  public getHistoryDescriptions(): { index: number; description: string; timestamp: number }[] {
    return this.history.map((entry, index) => ({
      index,
      description: entry.description,
      timestamp: entry.timestamp,
    }));
  }

  // Utility
  private generateId(): string {
    return `hist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Dispose
  public dispose(): void {
    this.clear();
    this.removeAllListeners();
  }
}
