import { EventEmitter } from '../utils/EventEmitter';

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  entryPoint: string;
  permissions: PluginPermission[];
  dependencies?: string[];
  minAppVersion?: string;
}

export type PluginPermission = 
  | 'read:floorplan'
  | 'write:floorplan'
  | 'read:project'
  | 'write:project'
  | 'ui:toolbar'
  | 'ui:sidebar'
  | 'ui:menu'
  | 'ui:panel'
  | 'api:render2d'
  | 'api:render3d'
  | 'api:materials'
  | 'api:lighting'
  | 'api:camera'
  | 'storage:local'
  | 'storage:session'
  | 'network:fetch';

export interface Plugin {
  manifest: PluginManifest;
  instance: PluginInstance;
  isActive: boolean;
  isLoaded: boolean;
  error?: string;
}

export interface PluginInstance {
  activate(): void | Promise<void>;
  deactivate(): void | Promise<void>;
  onEvent?(event: string, data: any): void;
  dispose?(): void;
}

export interface PluginAPI {
  // Floor plan API
  getFloorPlan(): any;
  setFloorPlan(floorPlan: any): void;
  onFloorPlanChange(callback: (floorPlan: any) => void): () => void;
  
  // Project API
  getProject(): any;
  saveProject(): Promise<void>;
  onProjectChange(callback: (project: any) => void): () => void;
  
  // UI API
  registerToolbarButton(config: ToolbarButtonConfig): string;
  unregisterToolbarButton(id: string): void;
  registerSidebarPanel(config: SidebarPanelConfig): string;
  unregisterSidebarPanel(id: string): void;
  registerMenuItem(config: MenuItemConfig): string;
  unregisterMenuItem(id: string): void;
  showNotification(message: string, type?: 'info' | 'success' | 'warning' | 'error'): void;
  
  // Render API
  getRender2D(): any;
  getRender3D(): any;
  
  // Material API
  getMaterialSystem(): any;
  createMaterial(definition: any): any;
  
  // Lighting API
  getLightingSystem(): any;
  createLight(definition: any): any;
  
  // Camera API
  getCameraSystem(): any;
  setCameraPosition(x: number, y: number, z: number): void;
  
  // Storage API
  getStorageItem(key: string): string | null;
  setStorageItem(key: string, value: string): void;
  removeStorageItem(key: string): void;
  
  // Event API
  emit(event: string, data: any): void;
  on(event: string, callback: (data: any) => void): () => void;
  
  // Utils
  log(message: string, level?: 'debug' | 'info' | 'warn' | 'error'): void;
  fetch(url: string, options?: RequestInit): Promise<Response>;
}

export interface ToolbarButtonConfig {
  id: string;
  icon: string;
  label: string;
  tooltip?: string;
  onClick: () => void;
}

export interface SidebarPanelConfig {
  id: string;
  title: string;
  icon?: string;
  component: React.ComponentType<any>;
  position?: 'left' | 'right';
}

export interface MenuItemConfig {
  id: string;
  label: string;
  path: string[];
  shortcut?: string;
  onClick: () => void;
}

export class PluginManager extends EventEmitter {
  private plugins: Map<string, Plugin> = new Map();
  private api: PluginAPI;
  private isInitialized = false;

  constructor(api: PluginAPI) {
    super();
    this.api = api;
  }

  public initialize(): void {
    if (this.isInitialized) return;
    
    this.isInitialized = true;
    this.loadBuiltInPlugins();
    this.emit('initialized');
  }

  // Plugin loading
  public async loadPlugin(manifest: PluginManifest, instance: PluginInstance): Promise<Plugin> {
    // Check if plugin already exists
    if (this.plugins.has(manifest.id)) {
      throw new Error(`Plugin ${manifest.id} is already loaded`);
    }

    // Validate manifest
    this.validateManifest(manifest);

    // Check dependencies
    if (manifest.dependencies) {
      for (const dep of manifest.dependencies) {
        if (!this.plugins.has(dep)) {
          throw new Error(`Plugin ${manifest.id} requires dependency ${dep}`);
        }
      }
    }

    // Create plugin
    const plugin: Plugin = {
      manifest,
      instance,
      isActive: false,
      isLoaded: true,
    };

    this.plugins.set(manifest.id, plugin);
    this.emit('pluginLoaded', plugin);

    // Auto-activate if no permissions required
    if (manifest.permissions.length === 0) {
      await this.activatePlugin(manifest.id);
    }

    return plugin;
  }

  public async loadPluginFromURL(url: string): Promise<Plugin> {
    try {
      // Fetch manifest
      const manifestResponse = await fetch(`${url}/manifest.json`);
      if (!manifestResponse.ok) {
        throw new Error(`Failed to load plugin manifest from ${url}`);
      }
      
      const manifest: PluginManifest = await manifestResponse.json();

      // Load plugin code
      const scriptResponse = await fetch(`${url}/${manifest.entryPoint}`);
      if (!scriptResponse.ok) {
        throw new Error(`Failed to load plugin code from ${url}/${manifest.entryPoint}`);
      }

      const code = await scriptResponse.text();
      
      // Create plugin instance from code
      const instance = this.createPluginInstance(code, manifest);

      return this.loadPlugin(manifest, instance);
    } catch (error) {
      this.emit('pluginError', { url, error });
      throw error;
    }
  }

  public async loadPluginFromFile(file: File): Promise<Plugin> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          const content = event.target?.result as string;
          const parsed = JSON.parse(content);
          
          if (!parsed.manifest || !parsed.code) {
            throw new Error('Invalid plugin file format');
          }

          const instance = this.createPluginInstance(parsed.code, parsed.manifest);
          const plugin = await this.loadPlugin(parsed.manifest, instance);
          resolve(plugin);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read plugin file'));
      reader.readAsText(file);
    });
  }

  private createPluginInstance(code: string, manifest: PluginManifest): PluginInstance {
    // Create a sandboxed function
    const sandbox = {
      api: this.createPluginAPI(manifest),
      console: {
        log: (...args: any[]) => this.api.log(args.join(' '), 'info'),
        warn: (...args: any[]) => this.api.log(args.join(' '), 'warn'),
        error: (...args: any[]) => this.api.log(args.join(' '), 'error'),
      },
    };

    // Execute plugin code
    const pluginFunction = new Function('sandbox', `
      with (sandbox) {
        ${code}
        return typeof activate === 'function' ? { activate, deactivate, onEvent, dispose } : exports;
      }
    `);

    return pluginFunction(sandbox);
  }

  private createPluginAPI(manifest: PluginManifest): PluginAPI {
    const allowedPermissions = new Set(manifest.permissions);

    const createRestrictedAPI = (permission: string, api: any) => {
      if (!allowedPermissions.has(permission as PluginPermission)) {
        return () => {
          throw new Error(`Plugin ${manifest.id} does not have permission: ${permission}`);
        };
      }
      return api;
    };

    return {
      // Floor plan API
      getFloorPlan: createRestrictedAPI('read:floorplan', () => this.api.getFloorPlan()),
      setFloorPlan: createRestrictedAPI('write:floorplan', (fp: any) => this.api.setFloorPlan(fp)),
      onFloorPlanChange: createRestrictedAPI('read:floorplan', (cb: any) => this.api.onFloorPlanChange(cb)),

      // Project API
      getProject: createRestrictedAPI('read:project', () => this.api.getProject()),
      saveProject: createRestrictedAPI('write:project', () => this.api.saveProject()),
      onProjectChange: createRestrictedAPI('read:project', (cb: any) => this.api.onProjectChange(cb)),

      // UI API
      registerToolbarButton: createRestrictedAPI('ui:toolbar', (config: any) => this.api.registerToolbarButton(config)),
      unregisterToolbarButton: createRestrictedAPI('ui:toolbar', (id: any) => this.api.unregisterToolbarButton(id)),
      registerSidebarPanel: createRestrictedAPI('ui:sidebar', (config: any) => this.api.registerSidebarPanel(config)),
      unregisterSidebarPanel: createRestrictedAPI('ui:sidebar', (id: any) => this.api.unregisterSidebarPanel(id)),
      registerMenuItem: createRestrictedAPI('ui:menu', (config: any) => this.api.registerMenuItem(config)),
      unregisterMenuItem: createRestrictedAPI('ui:menu', (id: any) => this.api.unregisterMenuItem(id)),
      showNotification: (message, type) => this.api.showNotification(message, type),

      // Render API
      getRender2D: createRestrictedAPI('api:render2d', () => this.api.getRender2D()),
      getRender3D: createRestrictedAPI('api:render3d', () => this.api.getRender3D()),

      // Material API
      getMaterialSystem: createRestrictedAPI('api:materials', () => this.api.getMaterialSystem()),
      createMaterial: createRestrictedAPI('api:materials', (def: any) => this.api.createMaterial(def)),

      // Lighting API
      getLightingSystem: createRestrictedAPI('api:lighting', () => this.api.getLightingSystem()),
      createLight: createRestrictedAPI('api:lighting', (def: any) => this.api.createLight(def)),

      // Camera API
      getCameraSystem: createRestrictedAPI('api:camera', () => this.api.getCameraSystem()),
      setCameraPosition: createRestrictedAPI('api:camera', (x: any, y: any, z: any) => this.api.setCameraPosition(x, y, z)),

      // Storage API
      getStorageItem: createRestrictedAPI('storage:local', (key: any) => this.api.getStorageItem(`${manifest.id}:${key}`)),
      setStorageItem: createRestrictedAPI('storage:local', (key: any, value: any) => this.api.setStorageItem(`${manifest.id}:${key}`, value)),
      removeStorageItem: createRestrictedAPI('storage:local', (key: any) => this.api.removeStorageItem(`${manifest.id}:${key}`)),

      // Event API
      emit: (event, data) => this.emit(`plugin:${manifest.id}:${event}`, data),
      on: (event, callback) => {
        const handler = (data: any) => callback(data);
        this.on(`app:${event}`, handler);
        return () => this.off(`app:${event}`, handler);
      },

      // Utils
      log: (message, level = 'info') => this.api.log(`[${manifest.id}] ${message}`, level),
      fetch: createRestrictedAPI('network:fetch', (url: any, options: any) => this.api.fetch(url, options)),
    };
  }

  // Plugin activation
  public async activatePlugin(id: string): Promise<void> {
    const plugin = this.plugins.get(id);
    if (!plugin) {
      throw new Error(`Plugin ${id} not found`);
    }

    if (plugin.isActive) return;

    try {
      await plugin.instance.activate();
      plugin.isActive = true;
      this.emit('pluginActivated', plugin);
    } catch (error) {
      plugin.error = error instanceof Error ? error.message : String(error);
      this.emit('pluginError', { id, error });
      throw error;
    }
  }

  public async deactivatePlugin(id: string): Promise<void> {
    const plugin = this.plugins.get(id);
    if (!plugin) {
      throw new Error(`Plugin ${id} not found`);
    }

    if (!plugin.isActive) return;

    try {
      await plugin.instance.deactivate();
      plugin.isActive = false;
      this.emit('pluginDeactivated', plugin);
    } catch (error) {
      plugin.error = error instanceof Error ? error.message : String(error);
      this.emit('pluginError', { id, error });
      throw error;
    }
  }

  // Plugin removal
  public async unloadPlugin(id: string): Promise<void> {
    const plugin = this.plugins.get(id);
    if (!plugin) {
      throw new Error(`Plugin ${id} not found`);
    }

    // Deactivate first
    if (plugin.isActive) {
      await this.deactivatePlugin(id);
    }

    // Dispose if available
    if (plugin.instance.dispose) {
      plugin.instance.dispose();
    }

    this.plugins.delete(id);
    this.emit('pluginUnloaded', plugin);
  }

  // Getters
  public getPlugin(id: string): Plugin | undefined {
    return this.plugins.get(id);
  }

  public getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  public getActivePlugins(): Plugin[] {
    return this.getAllPlugins().filter(p => p.isActive);
  }

  public isPluginLoaded(id: string): boolean {
    return this.plugins.has(id);
  }

  public isPluginActive(id: string): boolean {
    return this.plugins.get(id)?.isActive ?? false;
  }

  // Broadcast event to all active plugins
  public broadcastEvent(event: string, data: any): void {
    this.getActivePlugins().forEach(plugin => {
      if (plugin.instance.onEvent) {
        try {
          plugin.instance.onEvent(event, data);
        } catch (error) {
          console.error(`Plugin ${plugin.manifest.id} failed to handle event ${event}:`, error);
        }
      }
    });
    
    this.emit(`app:${event}`, data);
  }

  // Validation
  private validateManifest(manifest: PluginManifest): void {
    const required = ['id', 'name', 'version', 'entryPoint'];
    for (const field of required) {
      if (!manifest[field as keyof PluginManifest]) {
        throw new Error(`Plugin manifest missing required field: ${field}`);
      }
    }

    if (!/^[a-z0-9-]+$/.test(manifest.id)) {
      throw new Error('Plugin ID must contain only lowercase letters, numbers, and hyphens');
    }

    if (!manifest.permissions) {
      manifest.permissions = [];
    }
  }

  // Built-in plugins
  private loadBuiltInPlugins(): void {
    // These would be loaded from actual files in production
    // For now, they're placeholders
  }

  // Storage
  public async savePluginList(): Promise<void> {
    const pluginList = this.getAllPlugins().map(p => ({
      id: p.manifest.id,
      version: p.manifest.version,
      isActive: p.isActive,
    }));
    
    localStorage.setItem('auriaplan-plugins', JSON.stringify(pluginList));
  }

  public async loadPluginList(): Promise<void> {
    const saved = localStorage.getItem('auriaplan-plugins');
    if (saved) {
      try {
        const pluginList = JSON.parse(saved);
        this.emit('pluginListLoaded', pluginList);
      } catch (e) {
        console.warn('Failed to load plugin list');
      }
    }
  }

  // Cleanup
  public dispose(): void {
    this.getActivePlugins().forEach(plugin => {
      this.deactivatePlugin(plugin.manifest.id).catch(console.error);
    });
    
    this.plugins.clear();
    this.removeAllListeners();
  }
}
