import { v4 as uuidv4 } from 'uuid';
import type { 
  Project, 
  ProjectSettings, 
  Floor, 
  User,
  Vec2 
} from '@auriplan-types';

// ============================================
// PROJECT MODEL - Gerenciamento de Projetos
// ============================================

export const DEFAULT_PROJECT_SETTINGS: ProjectSettings = {
  units: 'metric',
  currency: 'BRL',
  precision: 2,
  gridSize: 0.5,
  snapToGrid: true,
  snapToObjects: true,
  defaultWallHeight: 2.8,
  defaultWallThickness: 0.15,
  defaultFloorHeight: 0.15,
  renderQuality: 'high',
  shadows: true,
  ambientOcclusion: true,
  antialiasing: true,
};

export class ProjectModel {
  private project: Project;

  constructor(name: string, author: User, description?: string) {
    const defaultFloor = this.createDefaultFloor();
    
    this.project = {
      id: uuidv4(),
      name,
      description: description || '',
      version: '1.0.0',
      createdAt: new Date(),
      updatedAt: new Date(),
      author,
      owner: author,
      collaborators: [],
      floors: [defaultFloor],
      currentFloorId: defaultFloor.id,
      settings: { ...DEFAULT_PROJECT_SETTINGS },
      tags: [],
      isPublic: false,
      // isTemplate removed - not in Project type
    };
  }

  static fromJSON(json: string): ProjectModel {
    const data = JSON.parse(json) as Project;
    const model = new ProjectModel(data.name, data.author as User, data.description);
    model.project = {
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
    };
    return model;
  }

  // Getters
  getId(): string {
    return this.project.id;
  }

  getProject(): Project {
    return this.project;
  }

  getCurrentFloor(): Floor | undefined {
    return (this.project.floors ?? []).find(f => f.id === this.project.currentFloorId);
  }

  getFloorById(id: string): Floor | undefined {
    return (this.project.floors ?? []).find(f => f.id === id);
  }

  // Setters
  setName(name: string): void {
    this.project.name = name;
    this.touch();
  }

  setDescription(description: string): void {
    this.project.description = description;
    this.touch();
  }

  setSettings(settings: Partial<ProjectSettings>): void {
    this.project.settings = { ...this.project.settings, ...settings };
    this.touch();
  }

  // Floor Management
  addFloor(name: string, level?: number): Floor {
    const newFloor: Floor = {
      id: uuidv4(),
      name,
      level: level ?? (this.project.floors ?? []).length,
      height: this.project.settings?.defaultWallHeight ?? 2.8,
      rooms: [],
      walls: [],
      windows: [],
      doors: [],
      furniture: [],
      measurements: [],
      annotations: [],
      visible: true,
      locked: false,
    };

    (this.project.floors ?? []).push(newFloor);
    this.project.currentFloorId = newFloor.id;
    this.touch();
    
    return newFloor;
  }

  deleteFloor(id: string): boolean {
    if ((this.project.floors ?? []).length <= 1) {
      return false; // Can't delete the last floor
    }

    const index = (this.project.floors ?? []).findIndex(f => f.id === id);
    if (index === -1) return false;

    (this.project.floors ?? []).splice(index, 1);
    
    // Update current floor if needed
    if (this.project.currentFloorId === id) {
      this.project.currentFloorId = (this.project.floors ?? [])[0]?.id || '';
    }

    this.touch();
    return true;
  }

  setCurrentFloor(id: string): boolean {
    const floor = (this.project.floors ?? []).find(f => f.id === id);
    if (!floor) return false;
    
    this.project.currentFloorId = id;
    this.touch();
    return true;
  }

  reorderFloors(floorIds: string[]): void {
    const newFloors: Floor[] = [];
    floorIds.forEach((id, index) => {
      const floor = (this.project.floors ?? []).find(f => f.id === id);
      if (floor) {
        floor.level = index;
        newFloors.push(floor);
      }
    });
    
    this.project.floors = newFloors;
    this.touch();
  }

  // Collaboration
  addCollaborator(user: User): void {
    if (!this.project.collaborators.find(c => c.id === user.id)) {
      this.project.collaborators.push(user);
      this.touch();
    }
  }

  removeCollaborator(userId: string): void {
    this.project.collaborators = this.project.collaborators.filter(c => c.id !== userId);
    this.touch();
  }

  // Tags
  addTag(tag: string): void {
    if (!(this.project.tags ?? []).includes(tag)) {
      (this.project.tags ?? []).push(tag);
      this.touch();
    }
  }

  removeTag(tag: string): void {
    this.project.tags = (this.project.tags ?? []).filter(t => t !== tag);
    this.touch();
  }

  // Serialization
  toJSON(): string {
    return JSON.stringify(this.project, null, 2);
  }

  toObject(): Project {
    return JSON.parse(JSON.stringify(this.project));
  }

  clone(): ProjectModel {
    const cloned = ProjectModel.fromJSON(this.toJSON());
    cloned.project.id = uuidv4();
    cloned.project.name = `${this.project.name} (Copy)`;
    cloned.project.createdAt = new Date();
    cloned.project.updatedAt = new Date();
    return cloned;
  }

  // Statistics
  getStatistics(): {
    totalFloors: number;
    totalRooms: number;
    totalWalls: number;
    totalFurniture: number;
    totalArea: number;
  } {
    return {
      totalFloors: (this.project.floors ?? []).length,
      totalRooms: (this.project.floors ?? []).reduce((sum, f) => sum + (f.rooms?.length ?? 0), 0),
      totalWalls: (this.project.floors ?? []).reduce((sum, f) => sum + (f.walls?.length ?? 0), 0),
      totalFurniture: (this.project.floors ?? []).reduce((sum, f) => sum + (f.furniture?.length ?? 0), 0),
      totalArea: (this.project.floors ?? []).reduce((sum, f) =>
        sum + (f.rooms ?? []).reduce((roomSum, r) => roomSum + (r.area ?? 0), 0), 0
      ),
    };
  }

  // Private methods
  private createDefaultFloor(): Floor {
    return {
      id: uuidv4(),
      name: 'Térreo',
      level: 0,
      height: 2.8,
      rooms: [],
      walls: [],
      windows: [],
      doors: [],
      furniture: [],
      measurements: [],
      annotations: [],
      visible: true,
      locked: false,
    };
  }

  private touch(): void {
    this.project.updatedAt = new Date();
    this.project.version = String((parseInt(String(this.project.version)) || 0) + 1);
  }
}

// Factory function
export const createProject = (
  name: string, 
  author: User, 
  description?: string
): ProjectModel => {
  return new ProjectModel(name, author, description);
};
