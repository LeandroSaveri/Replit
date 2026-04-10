/**
 * AuriPlan Engine Core
 * Core engine that orchestrates 2D/3D rendering, materials, lighting and camera
 */

import { Render2D } from '../render2d/Render2D';
import Render3DEngine from '../render3d/Render3DEngine';
import { MaterialSystem } from '../materials/MaterialSystem';
import { LightingSystem } from '../lighting/LightingSystem';
import { CameraSystem } from '../camera/CameraSystem';
import { EventEmitter } from '@/utils/EventEmitter';

export interface EngineConfig {
  canvas2D: HTMLCanvasElement;
  canvas3D: HTMLCanvasElement;
  width: number;
  height: number;
  antialias?: boolean;
  shadows?: boolean;
  maxLights?: number;
}

export interface EngineStats {
  fps: number;
  frameTime: number;
  drawCalls: number;
  triangles: number;
  memory: number;
}

export class AuriaEngine extends EventEmitter {
  private config: EngineConfig;
  private render2D!: Render2D;
  private render3D!: Render3DEngine;
  private materialSystem!: MaterialSystem;
  private lightingSystem!: LightingSystem;
  private cameraSystem!: CameraSystem;
  
  private isRunning = false;
  private lastFrameTime = 0;
  private frameCount = 0;
  private fpsUpdateTime = 0;
  private currentFps = 0;
  
  private animationFrameId: number | null = null;
  private stats: EngineStats = {
    fps: 0,
    frameTime: 0,
    drawCalls: 0,
    triangles: 0,
    memory: 0,
  };

  constructor(config: EngineConfig) {
    super();
    this.config = {
      antialias: true,
      shadows: true,
      maxLights: 8,
      ...config,
    };

    this.initialize();
  }

  private initialize(): void {
    // Initialize material system first (used by both renderers)
    this.materialSystem = new MaterialSystem();
    
    // Initialize lighting system
    this.lightingSystem = new LightingSystem({
      maxLights: this.config.maxLights,
      shadows: this.config.shadows,
    });
    
    // Initialize camera system
    this.cameraSystem = new CameraSystem({
      width: this.config.width,
      height: this.config.height,
    });
    
    // Initialize 2D renderer
    this.render2D = new Render2D({
      canvas: this.config.canvas2D,
      width: this.config.width,
      height: this.config.height,
    });
    
    // Initialize 3D renderer
    this.render3D = new Render3DEngine({
      canvas: this.config.canvas3D,
      width: this.config.width,
      height: this.config.height,
      antialias: this.config.antialias,
    });

    this.emit('initialized');
  }

  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.renderLoop();
    
    this.emit('started');
  }

  stop(): void {
    this.isRunning = false;
    
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    this.emit('stopped');
  }

  private renderLoop = (): void => {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;

    this.frameCount++;
    if (currentTime - this.fpsUpdateTime >= 1000) {
      this.currentFps = this.frameCount;
      this.frameCount = 0;
      this.fpsUpdateTime = currentTime;
    }

    this.stats.fps = this.currentFps;
    this.stats.frameTime = deltaTime;

    (this.cameraSystem as any).update(deltaTime);
    (this.lightingSystem as any).update(deltaTime);

    (this.render3D as any).render(deltaTime);
    this.render2D.render(deltaTime);

    this.stats.drawCalls = this.render3D.getDrawCalls() + this.render2D.getDrawCalls();
    this.stats.triangles = this.render3D.getTriangleCount();

    this.emit('render', this.stats);

    this.animationFrameId = requestAnimationFrame(this.renderLoop);
  };

  resize(width: number, height: number): void {
    this.config.width = width;
    this.config.height = height;
    
    this.cameraSystem.resize(width, height);
    this.render2D.resize(width, height);
    this.render3D.resize(width, height);
    
    this.emit('resize', { width, height });
  }

  getRender2D(): Render2D { return this.render2D; }
  getRender3D(): Render3DEngine { return this.render3D; }
  getMaterialSystem(): MaterialSystem { return this.materialSystem; }
  getLightingSystem(): LightingSystem { return this.lightingSystem; }
  getCameraSystem(): CameraSystem { return this.cameraSystem; }
  getStats(): EngineStats { return { ...this.stats }; }
  getIsRunning(): boolean { return this.isRunning; }

  takeScreenshot(): string {
    return this.render3D.takeScreenshot();
  }

  dispose(): void {
    this.stop();
    this.render2D.dispose();
    this.render3D.dispose();
    this.materialSystem.dispose();
    this.lightingSystem.dispose();
    this.cameraSystem.dispose();
    this.emit('disposed');
    this.removeAllListeners();
  }
}

let engineInstance: AuriaEngine | null = null;

export function getEngine(): AuriaEngine | null {
  return engineInstance;
}

export function createEngine(config: EngineConfig): AuriaEngine {
  if (engineInstance) {
    engineInstance.dispose();
  }
  engineInstance = new AuriaEngine(config);
  return engineInstance;
}

export function destroyEngine(): void {
  if (engineInstance) {
    engineInstance.dispose();
    engineInstance = null;
  }
}
