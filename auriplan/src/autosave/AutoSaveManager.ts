import { EventEmitter } from '../utils/EventEmitter';

export interface AutoSaveConfig {
  enabled: boolean;
  interval: number; // milliseconds
  maxBackups: number;
  backupPrefix: string;
  compressBackups: boolean;
  saveOnVisibilityChange: boolean;
  saveOnBeforeUnload: boolean;
}

export interface BackupInfo {
  id: string;
  timestamp: number;
  size: number;
  compressed: boolean;
  data: string;
}

export interface AutoSaveState {
  lastSaveTime: number;
  isSaving: boolean;
  pendingSave: boolean;
  backupCount: number;
  totalSize: number;
}

export class AutoSaveManager extends EventEmitter {
  private config: AutoSaveConfig;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private state: AutoSaveState;
  private saveCallback: (() => Promise<string>) | null = null;
  private backups: Map<string, BackupInfo> = new Map();

  constructor(config: Partial<AutoSaveConfig> = {}) {
    super();

    this.config = {
      enabled: true,
      interval: 60000, // 1 minute
      maxBackups: 10,
      backupPrefix: 'auriaplan-autosave-',
      compressBackups: false,
      saveOnVisibilityChange: true,
      saveOnBeforeUnload: true,
      ...config
    };

    this.state = {
      lastSaveTime: 0,
      isSaving: false,
      pendingSave: false,
      backupCount: 0,
      totalSize: 0
    };

    this.setupEventListeners();
    this.loadBackupsFromStorage();
  }

  // Configuration
  public setConfig(config: Partial<AutoSaveConfig>): void {
    const wasEnabled = this.config.enabled;
    Object.assign(this.config, config);

    if (wasEnabled !== this.config.enabled) {
      if (this.config.enabled) {
        this.start();
      } else {
        this.stop();
      }
    }

    if (this.config.enabled && this.intervalId) {
      // Restart with new interval
      this.stop();
      this.start();
    }

    this.emit('configChanged', this.config);
  }

  public getConfig(): AutoSaveConfig {
    return { ...this.config };
  }

  // Registration
  public registerSaveCallback(callback: () => Promise<string>): void {
    this.saveCallback = callback;
  }

  public unregisterSaveCallback(): void {
    this.saveCallback = null;
  }

  // Control
  public start(): void {
    if (!this.config.enabled || this.intervalId) return;

    this.intervalId = setInterval(() => {
      this.performAutoSave();
    }, this.config.interval);

    this.emit('started');
  }

  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.emit('stopped');
  }

  public async forceSave(): Promise<boolean> {
    return this.performAutoSave();
  }

  // Main save operation
  private async performAutoSave(): Promise<boolean> {
    if (!this.saveCallback || this.state.isSaving) {
      if (this.state.isSaving) {
        this.state.pendingSave = true;
      }
      return false;
    }

    this.state.isSaving = true;
    this.emit('saveStarted');

    try {
      const data = await this.saveCallback();
      const backup = await this.createBackup(data);

      this.state.lastSaveTime = Date.now();
      this.state.pendingSave = false;

      this.emit('saveCompleted', backup);

      // Handle pending save
      if (this.state.pendingSave) {
        setTimeout(() => this.performAutoSave(), 100);
      }

      return true;
    } catch (error) {
      this.emit('saveError', error);
      return false;
    } finally {
      this.state.isSaving = false;
    }
  }

  // Backup management
  private async createBackup(data: string): Promise<BackupInfo> {
    const id = `${this.config.backupPrefix}${Date.now()}`;
    const timestamp = Date.now();

    let processedData = data;
    let compressed = false;

    if (this.config.compressBackups) {
      processedData = await this.compressData(data);
      compressed = true;
    }

    const backup: BackupInfo = {
      id,
      timestamp,
      size: processedData.length,
      compressed,
      data: processedData
    };

    // Store backup
    this.backups.set(id, backup);
    this.saveBackupToStorage(id, backup);

    // Clean up old backups
    this.cleanupOldBackups();

    // Update state
    this.updateState();

    return backup;
  }

  private async compressData(data: string): Promise<string> {
    // Simple compression using LZ-string or similar
    // For now, just return as-is
    return data;
  }

  private async decompressData(data: string): Promise<string> {
    // Decompress data
    return data;
  }

  private saveBackupToStorage(id: string, backup: BackupInfo): void {
    try {
      const storageData = {
        timestamp: backup.timestamp,
        size: backup.size,
        compressed: backup.compressed,
        data: backup.data
      };
      localStorage.setItem(id, JSON.stringify(storageData));
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        // Remove oldest backup and try again
        this.removeOldestBackup();
        this.saveBackupToStorage(id, backup);
      } else {
        throw error;
      }
    }
  }

  private loadBackupsFromStorage(): void {
    const backupIds: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.config.backupPrefix)) {
        backupIds.push(key);
      }
    }

    // Sort by timestamp
    backupIds.sort((a, b) => {
      const timeA = parseInt(a.replace(this.config.backupPrefix, ''));
      const timeB = parseInt(b.replace(this.config.backupPrefix, ''));
      return timeA - timeB;
    });

    // Load backups
    for (const id of backupIds) {
      try {
        const stored = localStorage.getItem(id);
        if (stored) {
          const parsed = JSON.parse(stored);
          this.backups.set(id, {
            id,
            timestamp: parsed.timestamp,
            size: parsed.size,
            compressed: parsed.compressed,
            data: parsed.data
          });
        }
      } catch (e) {
        console.warn(`Failed to load backup: ${id}`);
      }
    }

    this.updateState();
  }

  private cleanupOldBackups(): void {
    const sortedBackups = Array.from(this.backups.entries())
      .sort((a, b) => b[1].timestamp - a[1].timestamp);

    // Keep only maxBackups
    while (sortedBackups.length > this.config.maxBackups) {
      const [oldestId] = sortedBackups.pop()!;
      this.removeBackup(oldestId);
    }
  }

  private removeOldestBackup(): void {
    const sortedBackups = Array.from(this.backups.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);

    if (sortedBackups.length > 0) {
      const [oldestId] = sortedBackups[0];
      this.removeBackup(oldestId);
    }
  }

  private removeBackup(id: string): void {
    this.backups.delete(id);
    localStorage.removeItem(id);
  }

  private updateState(): void {
    this.state.backupCount = this.backups.size;
    this.state.totalSize = Array.from(this.backups.values())
      .reduce((sum, backup) => sum + backup.size, 0);
  }

  // Event listeners
  private setupEventListeners(): void {
    // Visibility change
    if (this.config.saveOnVisibilityChange) {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.performAutoSave();
        }
      });
    }

    // Before unload
    if (this.config.saveOnBeforeUnload) {
      window.addEventListener('beforeunload', () => {
        this.performAutoSave();
      });
    }
  }

  // Backup retrieval
  public getBackup(id: string): BackupInfo | undefined {
    return this.backups.get(id);
  }

  public getAllBackups(): BackupInfo[] {
    return Array.from(this.backups.values())
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  public getLatestBackup(): BackupInfo | undefined {
    const backups = this.getAllBackups();
    return backups[0];
  }

  public async restoreBackup(id: string): Promise<string | null> {
    const backup = this.backups.get(id);
    if (!backup) return null;

    let data = backup.data;
    if (backup.compressed) {
      data = await this.decompressData(data);
    }

    this.emit('backupRestored', backup);
    return data;
  }

  public deleteBackup(id: string): boolean {
    if (!this.backups.has(id)) return false;

    this.removeBackup(id);
    this.updateState();

    this.emit('backupDeleted', id);
    return true;
  }

  public clearAllBackups(): void {
    for (const id of this.backups.keys()) {
      localStorage.removeItem(id);
    }
    this.backups.clear();
    this.updateState();

    this.emit('allBackupsCleared');
  }

  // State
  public getState(): AutoSaveState {
    return { ...this.state };
  }

  public isEnabled(): boolean {
    return this.config.enabled;
  }

  public isSaving(): boolean {
    return this.state.isSaving;
  }

  public hasPendingSave(): boolean {
    return this.state.pendingSave;
  }

  // Storage stats
  public getStorageStats(): { used: number; available: number; backups: number } {
    return {
      used: this.state.totalSize,
      available: 5 * 1024 * 1024 - this.state.totalSize, // Assume 5MB limit
      backups: this.state.backupCount
    };
  }

  // Cleanup
  public dispose(): void {
    this.stop();
    this.removeAllListeners();
    this.saveCallback = null;
  }
}
