import { EventEmitter } from '../../utils/EventEmitter';
import type { Project } from '@auriplan-types';

// Local types for ProjectManager
interface FloorPlan {
  id?: string;
  name?: string;
  scenes?: any[];
  walls?: any[];
  rooms?: any[];
  furniture?: any[];
  settings?: any;
  [key: string]: any;
}

interface ProjectMetadata {
  name?: string;
  description?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  version?: string;
  author?: string;
  tags?: string[];
  [key: string]: any;
}


import { ProjectSerializer } from './ProjectSerializer';
import { ProjectLoader } from './ProjectLoader';
import { ProjectHistory } from './ProjectHistory';

export interface ProjectSettings {
  name: string;
  description: string;
  units: 'metric' | 'imperial';
  precision: number;
  gridSize: number;
  snapToGrid: boolean;
  autoSave: boolean;
  autoSaveInterval: number;
}

export interface ProjectState {
  floorPlan: FloorPlan;
  settings: ProjectSettings;
  metadata: ProjectMetadata;
}

export class ProjectManager extends EventEmitter {
  private currentProject: Project | null = null;
  private serializer: ProjectSerializer;
  private loader: ProjectLoader;
  private history: ProjectHistory;
  private settings: ProjectSettings;
  private autoSaveInterval: ReturnType<typeof setTimeout> | null = null;
  private isDirty = false;
  
  // Default settings
  private static readonly DEFAULT_SETTINGS: ProjectSettings = {
    name: 'Untitled Project',
    description: '',
    units: 'metric',
    precision: 2,
    gridSize: 0.1,
    snapToGrid: true,
    autoSave: true,
    autoSaveInterval: 60000, // 1 minute
  };

  constructor() {
    super();
    
    this.serializer = new ProjectSerializer();
    this.loader = new ProjectLoader();
    this.history = new ProjectHistory();
    this.settings = { ...ProjectManager.DEFAULT_SETTINGS };
    
    this.setupHistoryListeners();
  }

  private setupHistoryListeners(): void {
    this.history.on('stateRestored', (state) => {
      if (this.currentProject) {
        this.currentProject.floorPlan = state.floorPlan;
        this.settings = state.settings;
        this.emit('projectChanged', this.currentProject);
      }
    });
  }

  // Project creation
  public createProject(name?: string, description?: string): Project {
    const now = new Date().toISOString();
    
    this.currentProject = {
      id: this.generateId(),
      name: name ?? ProjectManager.DEFAULT_SETTINGS.name,
      description: description ?? ProjectManager.DEFAULT_SETTINGS.description,
      createdAt: now,
      updatedAt: now,
      owner: { id: '', name: name ?? 'User', email: '', role: 'owner' } as any,
      collaborators: [],
      settings: {
        units: 'metric',
        currency: 'BRL',
      },
      floorPlan: {
        walls: [],
        rooms: [],
        furniture: [],
        dimensions: [],
      },
      metadata: {
        version: '1.0.0',
        author: '',
        tags: [],
        thumbnail: '',
      },
    };
    
    this.settings = { ...ProjectManager.DEFAULT_SETTINGS };
    this.settings.name = this.currentProject.name ?? '';
    this.settings.description = this.currentProject.description ?? '';
    
    this.history.clear();
    this.saveToHistory();
    
    this.isDirty = false;
    this.startAutoSave();
    
    this.emit('projectCreated', this.currentProject);
    
    return this.currentProject;
  }

  // Project loading
  public async loadProject(source: string | File | Project): Promise<Project> {
    let project: Project;
    
    try {
      if (typeof source === 'string') {
        // Load from URL or localStorage key
        if (source.startsWith('http')) {
          project = await this.loader.loadFromURL(source);
        } else {
          project = await this.loader.loadFromStorage(source);
        }
      } else if (source instanceof File) {
        // Load from file
        project = await this.loader.loadFromFile(source);
      } else {
        // Already a project object
        project = source;
      }
      
      this.currentProject = project;
      this.settings.name = project.name ?? '';
      this.settings.description = project.description ?? '';
      
      this.history.clear();
      this.saveToHistory();
      
      this.isDirty = false;
      this.startAutoSave();
      
      this.emit('projectLoaded', this.currentProject);
      
      return this.currentProject;
    } catch (error) {
      this.emit('error', { type: 'load', error });
      throw error;
    }
  }

  // Project saving
  public async saveProject(): Promise<string> {
    if (!this.currentProject) {
      throw new Error('No project to save');
    }
    
    try {
      this.currentProject.updatedAt = new Date().toISOString();
      
      const serialized = this.serializer.serialize(this.currentProject);
      const key = `auriaplan-project-${this.currentProject.id}`;
      
      await this.loader.saveToStorage(key, serialized);
      
      this.isDirty = false;
      this.emit('projectSaved', this.currentProject);
      
      return key;
    } catch (error) {
      this.emit('error', { type: 'save', error });
      throw error;
    }
  }

  public async exportProject(format: 'json' | 'obj' | 'dae' | 'gltf'): Promise<string | Blob> {
    if (!this.currentProject) {
      throw new Error('No project to export');
    }
    
    try {
      let result: string | Blob;
      
      switch (format) {
        case 'json':
          result = this.serializer.serialize(this.currentProject);
          break;
        case 'obj':
          result = this.serializer.toOBJ(this.currentProject);
          break;
        case 'dae':
          result = this.serializer.toDAE(this.currentProject);
          break;
        case 'gltf':
          result = await this.serializer.toGLTF(this.currentProject);
          break;
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
      
      this.emit('projectExported', { format, result });
      
      return result;
    } catch (error) {
      this.emit('error', { type: 'export', error });
      throw error;
    }
  }

  public downloadProject(format: 'json' | 'obj' | 'dae' | 'gltf' = 'json'): void {
    this.exportProject(format).then((result) => {
      const blob = result instanceof Blob ? result : new Blob([result], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${this.currentProject?.name ?? 'project'}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      URL.revokeObjectURL(url);
    });
  }

  // Floor plan operations
  public updateFloorPlan(floorPlan: FloorPlan): void {
    if (!this.currentProject) {
      throw new Error('No project loaded');
    }
    
    this.currentProject.floorPlan = floorPlan;
    this.currentProject.updatedAt = new Date().toISOString();
    this.isDirty = true;
    
    this.saveToHistory();
    this.emit('floorPlanChanged', floorPlan);
  }

  public getFloorPlan(): FloorPlan | null {
    return this.currentProject?.floorPlan ?? null;
  }

  // Settings
  public updateSettings(settings: Partial<ProjectSettings>): void {
    Object.assign(this.settings, settings);
    
    if (this.currentProject) {
      this.currentProject.name = this.settings.name;
      this.currentProject.description = this.settings.description;
    }
    
    this.isDirty = true;
    this.emit('settingsChanged', this.settings);
  }

  public getSettings(): ProjectSettings {
    return { ...this.settings };
  }

  // Metadata
  public updateMetadata(metadata: Partial<ProjectMetadata>): void {
    if (!this.currentProject) {
      throw new Error('No project loaded');
    }
    
    Object.assign((this.currentProject as any).metadata ?? {}, metadata);
    this.currentProject.updatedAt = new Date();
    this.isDirty = true;
    
    this.emit('metadataChanged', this.currentProject.metadata);
  }

  public getMetadata(): ProjectMetadata | null {
    return this.currentProject?.metadata ?? null;
  }

  // History operations
  public undo(): boolean {
    const result = this.history.undo();
    if (result) {
      this.isDirty = true;
      this.emit('undo');
    }
    return result;
  }

  public redo(): boolean {
    const result = this.history.redo();
    if (result) {
      this.isDirty = true;
      this.emit('redo');
    }
    return result;
  }

  public canUndo(): boolean {
    return this.history.canUndo();
  }

  public canRedo(): boolean {
    return this.history.canRedo();
  }

  private saveToHistory(): void {
    if (!this.currentProject) return;
    
    const state: ProjectState = {
      floorPlan: JSON.parse(JSON.stringify(this.currentProject.floorPlan)),
      settings: { ...this.settings },
      metadata: { ...this.currentProject.metadata },
    };
    
    this.history.saveState(state);
  }

  // Auto-save
  private startAutoSave(): void {
    this.stopAutoSave();
    
    if (this.settings.autoSave) {
      this.autoSaveInterval = setInterval(() => {
        if (this.isDirty) {
          this.saveProject().catch(console.error);
        }
      }, this.settings.autoSaveInterval);
    }
  }

  private stopAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }

  // Project list
  public async getSavedProjects(): Promise<{ id: string; name: string; updatedAt: string }[]> {
    const projects: { id: string; name: string; updatedAt: string }[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('auriaplan-project-')) {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            const project = JSON.parse(data);
            projects.push({
              id: project.id,
              name: project.name,
              updatedAt: project.updatedAt,
            });
          }
        } catch (e) {
          console.warn(`Failed to parse project: ${key}`);
        }
      }
    }
    
    return projects.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  public async deleteProject(id: string): Promise<void> {
    const key = `auriaplan-project-${id}`;
    localStorage.removeItem(key);
    this.emit('projectDeleted', id);
  }

  // Getters
  public getCurrentProject(): Project | null {
    return this.currentProject;
  }

  public isProjectDirty(): boolean {
    return this.isDirty;
  }

  public hasProject(): boolean {
    return this.currentProject !== null;
  }

  // Utility
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Cleanup
  public dispose(): void {
    this.stopAutoSave();
    this.history.removeAllListeners();
    this.removeAllListeners();
    this.currentProject = null;
  }
}
