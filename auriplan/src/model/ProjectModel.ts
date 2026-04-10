// ============================================
// Project Model - Project data management
// ============================================

import type { Project, ProjectSettings, Scene, User } from '@auriplan-types';
import { DEFAULT_PROJECT_SETTINGS } from '@auriplan-types';
import { v4 as uuidv4 } from 'uuid';

export interface ProjectCreateOptions {
  name: string;
  description?: string;
  authorId: string;
  settings?: Partial<ProjectSettings>;
}

export class ProjectModel {
  private project: Project;

  constructor(options: ProjectCreateOptions) {
    const now = new Date().toISOString();
    const defaultScene = this.createDefaultScene();

    this.project = {
      id: uuidv4(),
      name: options.name,
      description: options.description || '',
      version: '1.0.0',
      createdAt: now,
      updatedAt: now,
      authorId: options.authorId,
      owner: { id: options.authorId || '', name: options.authorId || 'User', email: '', role: 'owner' } as any,
      collaborators: [],
      scenes: [defaultScene],
      currentSceneId: defaultScene.id,
      settings: { ...DEFAULT_PROJECT_SETTINGS, ...options.settings },
      isPublic: false,
      tags: [],
    };
  }

  // Create from existing data
  static fromJSON(data: Project): ProjectModel {
    const model = new ProjectModel({
      name: data.name,
      description: data.description,
      authorId: (data as any).authorId || "",
      settings: data.settings,
    });
    model.project = { ...data };
    return model;
  }

  // Getters
  getId(): string {
    return this.project.id;
  }

  getProject(): Project {
    return { ...this.project };
  }

  getCurrentScene(): Scene | undefined {
    return (this.project.scenes ?? []).find(s => s.id === this.project.currentSceneId);
  }

  getSceneById(id: string): Scene | undefined {
    return (this.project.scenes ?? []).find(s => s.id === id);
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

  // Scene management
  addScene(name: string, level?: number): Scene {
    const newScene: Scene = {
      id: uuidv4(),
      name,
      level: level ?? (this.project.scenes ?? []).length,
      height: this.project.settings?.defaultWallHeight ?? 2.8,
      walls: [],
      rooms: [],
      doors: [],
      windows: [],
      furniture: [],
      measurements: [],
      annotations: [],
      visible: true,
      locked: false,
    };

    (this.project.scenes ?? []).push(newScene);
    this.project.currentSceneId = newScene.id;
    this.touch();

    return newScene;
  }

  deleteScene(id: string): boolean {
    if ((this.project.scenes ?? []).length <= 1) return false;

    const index = (this.project.scenes ?? []).findIndex(s => s.id === id);
    if (index === -1) return false;

    (this.project.scenes ?? []).splice(index, 1);

    if (this.project.currentSceneId === id) {
      this.project.currentSceneId = (this.project.scenes ?? [])[0]?.id || '';
    }

    this.touch();
    return true;
  }

  setCurrentScene(id: string): boolean {
    const scene = (this.project.scenes ?? []).find(s => s.id === id);
    if (!scene) return false;

    this.project.currentSceneId = id;
    this.touch();
    return true;
  }

  reorderScenes(sceneIds: string[]): void {
    const newScenes: Scene[] = [];
    sceneIds.forEach((id, index) => {
      const scene = (this.project.scenes ?? []).find(s => s.id === id);
      if (scene) {
        scene.level = index;
        newScenes.push(scene);
      }
    });

    this.project.scenes = newScenes;
    this.touch();
  }

  // Update scene
  updateScene(id: string, updates: Partial<Scene>): boolean {
    const scene = (this.project.scenes ?? []).find(s => s.id === id);
    if (!scene) return false;

    Object.assign(scene, updates);
    this.touch();
    return true;
  }

  // Collaboration
  addCollaborator(userId: string): void {
    if (!(this.project.collaborators as any[]).includes(userId)) {
      (this.project.collaborators as any[]).push(userId);
      this.touch();
    }
  }

  removeCollaborator(userId: string): void {
    this.project.collaborators = this.project.collaborators.filter((id: any) => id !== userId);
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

  // Statistics
  getStatistics(): {
    totalScenes: number;
    totalRooms: number;
    totalWalls: number;
    totalFurniture: number;
    totalArea: number;
  } {
    return {
      totalScenes: (this.project.scenes ?? []).length,
      totalRooms: (this.project.scenes ?? []).reduce((sum, s) => sum + s.rooms.length, 0),
      totalWalls: (this.project.scenes ?? []).reduce((sum, s) => sum + s.walls.length, 0),
      totalFurniture: (this.project.scenes ?? []).reduce((sum, s) => sum + s.furniture.length, 0),
      totalArea: (this.project.scenes ?? []).reduce((sum, s) =>
        sum + s.rooms.reduce((roomSum, r) => roomSum + (r.area ?? 0), 0), 0
      ),
    };
  }

  // Serialization
  toJSON(): string {
    return JSON.stringify(this.project, null, 2);
  }

  toObject(): Project {
    return JSON.parse(JSON.stringify(this.project));
  }

  clone(): ProjectModel {
    const cloned = ProjectModel.fromJSON(this.toObject());
    cloned.project.id = uuidv4();
    cloned.project.name = `${this.project.name} (Copy)`;
    cloned.project.createdAt = new Date().toISOString();
    cloned.project.updatedAt = new Date().toISOString();
    cloned.project.version = '1.0.0';
    return cloned;
  }

  // Private helpers
  private createDefaultScene(): Scene {
    return {
      id: uuidv4(),
      name: 'Ground Floor',
      level: 0,
      height: 2.8,
      walls: [],
      rooms: [],
      doors: [],
      windows: [],
      furniture: [],
      measurements: [],
      annotations: [],
      visible: true,
      locked: false,
    };
  }

  private touch(): void {
    this.project.updatedAt = new Date().toISOString();
    this.project.version = String((parseInt(String(this.project.version)) || 0) + 1);
  }
}
