import type { Project } from '@auriplan-types';
import { ProjectSerializer } from './ProjectSerializer';

export class ProjectLoader {
  private serializer: ProjectSerializer;

  constructor() {
    this.serializer = new ProjectSerializer();
  }

  // Load from URL
  public async loadFromURL(url: string): Promise<Project> {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to load project from URL: ${response.statusText}`);
    }
    
    const json = await response.text();
    return this.serializer.deserialize(json);
  }

  // Load from File
  public async loadFromFile(file: File): Promise<Project> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const json = event.target?.result as string;
          const project = this.serializer.deserialize(json);
          resolve(project);
        } catch (error) {
          reject(new Error(`Failed to parse project file: ${error}`));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsText(file);
    });
  }

  // Load from localStorage
  public async loadFromStorage(key: string): Promise<Project> {
    const json = localStorage.getItem(key);
    
    if (!json) {
      throw new Error(`Project not found in storage: ${key}`);
    }
    
    return this.serializer.deserialize(json);
  }

  // Save to localStorage
  public async saveToStorage(key: string, json: string): Promise<void> {
    try {
      localStorage.setItem(key, json);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        throw new Error('Storage quota exceeded. Please delete some projects.');
      }
      throw error;
    }
  }

  // Load from IndexedDB
  public async loadFromIndexedDB(dbName: string, storeName: string, key: string): Promise<Project> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName);
      
      request.onerror = () => reject(new Error('Failed to open IndexedDB'));
      
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const getRequest = store.get(key);
        
        getRequest.onsuccess = () => {
          if (getRequest.result) {
            resolve(getRequest.result);
          } else {
            reject(new Error(`Project not found in IndexedDB: ${key}`));
          }
        };
        
        getRequest.onerror = () => reject(new Error('Failed to get project from IndexedDB'));
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id' });
        }
      };
    });
  }

  // Save to IndexedDB
  public async saveToIndexedDB(dbName: string, storeName: string, project: Project): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName);
      
      request.onerror = () => reject(new Error('Failed to open IndexedDB'));
      
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const putRequest = store.put(project);
        
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(new Error('Failed to save project to IndexedDB'));
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id' });
        }
      };
    });
  }

  // Import from various formats
  public async importFromFormat(data: string, format: 'json' | 'svg' | 'dxf'): Promise<Partial<Project>> {
    switch (format) {
      case 'json':
        return this.serializer.deserialize(data);
        
      case 'svg':
        return this.importFromSVG(data);
        
      case 'dxf':
        return this.importFromDXF(data);
        
      default:
        throw new Error(`Unsupported import format: ${format}`);
    }
  }

  private importFromSVG(svgData: string): Partial<Project> {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgData, 'image/svg+xml');
    
    // Extract walls from SVG lines and rectangles
    const walls: any[] = [];
    const lines = doc.querySelectorAll('line');
    
    lines.forEach((line, index) => {
      const x1 = parseFloat(line.getAttribute('x1') || '0');
      const y1 = parseFloat(line.getAttribute('y1') || '0');
      const x2 = parseFloat(line.getAttribute('x2') || '0');
      const y2 = parseFloat(line.getAttribute('y2') || '0');
      
      walls.push({
        id: `imported-wall-${index}`,
        start: { x: x1 / 100, y: y1 / 100 }, // Convert from cm to m
        end: { x: x2 / 100, y: y2 / 100 },
        thickness: 0.15,
        height: 2.8,
      });
    });
    
    return {
      name: 'Imported from SVG',
      floorPlan: {
        walls,
        rooms: [],
        furniture: [],
        dimensions: [],
      },
    };
  }

  private importFromDXF(dxfData: string): Partial<Project> {
    // Basic DXF parser for lines
    const walls: any[] = [];
    const lines = dxfData.match(/LINE[\s\S]*?AcDbLine[\s\S]*?\n/g);
    
    if (lines) {
      lines.forEach((line, index) => {
        const x1Match = line.match(/10\s+([\d.-]+)/);
        const y1Match = line.match(/20\s+([\d.-]+)/);
        const x2Match = line.match(/11\s+([\d.-]+)/);
        const y2Match = line.match(/21\s+([\d.-]+)/);
        
        if (x1Match && y1Match && x2Match && y2Match) {
          walls.push({
            id: `imported-wall-${index}`,
            start: { 
              x: parseFloat(x1Match[1]) / 1000, 
              y: parseFloat(y1Match[1]) / 1000 
            },
            end: { 
              x: parseFloat(x2Match[1]) / 1000, 
              y: parseFloat(y2Match[1]) / 1000 
            },
            thickness: 0.15,
            height: 2.8,
          });
        }
      });
    }
    
    return {
      name: 'Imported from DXF',
      floorPlan: {
        walls,
        rooms: [],
        furniture: [],
        dimensions: [],
      },
    };
  }

  // List all saved projects
  public listSavedProjects(): { key: string; name: string; updatedAt: string }[] {
    const projects: { key: string; name: string; updatedAt: string }[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('auriaplan-project-')) {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            const project = JSON.parse(data);
            projects.push({
              key,
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

  // Delete project
  public deleteProject(key: string): void {
    localStorage.removeItem(key);
  }

  // Clear all projects
  public clearAllProjects(): void {
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('auriaplan-project-')) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  // Get storage stats
  public getStorageStats(): { used: number; total: number; projects: number } {
    let used = 0;
    let projects = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('auriaplan-project-')) {
        const data = localStorage.getItem(key);
        if (data) {
          used += data.length * 2; // UTF-16 encoding
          projects++;
        }
      }
    }
    
    // Estimate total storage (typically 5-10 MB)
    const total = 5 * 1024 * 1024;
    
    return { used, total, projects };
  }
}
