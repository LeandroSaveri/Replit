/**
 * @deprecated Use Render2DEngine instead. This class is kept for backward compatibility
 * and will be removed in a future version.
 * 
 * AuriPlan 2D Renderer (Legacy)
 * Handles all 2D rendering operations for floor plans and blueprints
 */

import { EventEmitter } from '@/utils/EventEmitter';

export interface Render2DConfig {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}

export interface Viewport2D {
  x: number;
  y: number;
  zoom: number;
  rotation: number;
}

export interface DrawOptions {
  stroke?: string;
  fill?: string;
  lineWidth?: number;
  lineDash?: number[];
  opacity?: number;
}

/**
 * @deprecated This class is deprecated. Please use Render2DEngine from './Render2DEngine'.
 */
export class Render2D extends EventEmitter {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  
  private viewport: Viewport2D = {
    x: 0,
    y: 0,
    zoom: 1,
    rotation: 0,
  };
  
  private drawCalls = 0;
  private isDirty = true;

  constructor(config: Render2DConfig) {
    super();
    console.warn('Render2D is deprecated. Use Render2DEngine instead.');
    this.canvas = config.canvas;
    this.width = config.width;
    this.height = config.height;
    
    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context');
    }
    this.ctx = ctx;
    
    this.setupCanvas();
  }

  private setupCanvas(): void {
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.scale(dpr, dpr);
  }

  render(deltaTime: number): void {
    // Stub - no longer functional
  }

  private clear(): void {}
  private applyViewport(): void {}

  drawLine(x1: number, y1: number, x2: number, y2: number, options: DrawOptions = {}): void {}
  drawRect(x: number, y: number, width: number, height: number, options: DrawOptions = {}): void {}
  drawCircle(x: number, y: number, radius: number, options: DrawOptions = {}): void {}
  drawPolygon(points: { x: number; y: number }[], options: DrawOptions = {}): void {}
  drawText(text: string, x: number, y: number, options: any = {}): void {}
  drawGrid(spacing: number = 1, options: DrawOptions = {}): void {}
  drawWall(x1: number, y1: number, x2: number, y2: number, thickness: number = 0.15, options: DrawOptions = {}): void {}
  drawRoom(points: { x: number; y: number }[], options: DrawOptions = {}): void {}
  drawDimensionLine(x1: number, y1: number, x2: number, y2: number, offset: number = 0.3): void {}

  setViewport(viewport: Partial<Viewport2D>): void {}
  getViewport(): Viewport2D { return { ...this.viewport }; }
  pan(dx: number, dy: number): void {}
  zoom(factor: number, centerX?: number, centerY?: number): void {}
  rotate(angle: number): void {}
  resetViewport(): void {}
  screenToWorld(screenX: number, screenY: number): { x: number; y: number } { return { x: 0, y: 0 }; }
  worldToScreen(worldX: number, worldY: number): { x: number; y: number } { return { x: 0, y: 0 }; }

  private stroke(options: DrawOptions): void {}
  private fill(options: DrawOptions): void {}
  private getVisibleBounds(): { minX: number; minY: number; maxX: number; maxY: number } {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }
  private calculatePolygonCenter(points: { x: number; y: number }[]): { x: number; y: number } {
    return { x: 0, y: 0 };
  }
  private calculatePolygonArea(points: { x: number; y: number }[]): number { return 0; }

  resize(width: number, height: number): void {}
  getDrawCalls(): number { return 0; }
  markDirty(): void {}
  dispose(): void {}
}
