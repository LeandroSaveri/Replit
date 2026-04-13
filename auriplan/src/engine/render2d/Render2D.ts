/**
 * @deprecated Use Render2DEngine from './Render2DEngine' instead.
 * This file is kept only for backward compatibility and will be removed.
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
 * @deprecated This class is deprecated. Please use Render2DEngine.
 */
export class Render2D extends EventEmitter {
  constructor(config: Render2DConfig) {
    super();
    console.warn('Render2D is deprecated. Use Render2DEngine instead.');
  }

  render(deltaTime: number): void {}
  drawLine(x1: number, y1: number, x2: number, y2: number, options?: DrawOptions): void {}
  drawRect(x: number, y: number, w: number, h: number, options?: DrawOptions): void {}
  drawCircle(x: number, y: number, r: number, options?: DrawOptions): void {}
  drawPolygon(points: {x:number;y:number}[], options?: DrawOptions): void {}
  drawText(text: string, x: number, y: number, options?: any): void {}
  drawGrid(spacing?: number, options?: DrawOptions): void {}
  drawWall(x1: number, y1: number, x2: number, y2: number, thickness?: number, options?: DrawOptions): void {}
  drawRoom(points: {x:number;y:number}[], options?: DrawOptions): void {}
  drawDimensionLine(x1: number, y1: number, x2: number, y2: number, offset?: number): void {}
  setViewport(viewport: Partial<Viewport2D>): void {}
  getViewport(): Viewport2D { return { x:0, y:0, zoom:1, rotation:0 }; }
  pan(dx: number, dy: number): void {}
  zoom(factor: number, cx?: number, cy?: number): void {}
  rotate(angle: number): void {}
  resetViewport(): void {}
  screenToWorld(sx: number, sy: number): { x: number; y: number } { return { x:0, y:0 }; }
  worldToScreen(wx: number, wy: number): { x: number; y: number } { return { x:0, y:0 }; }
  resize(width: number, height: number): void {}
  getDrawCalls(): number { return 0; }
  markDirty(): void {}
  dispose(): void {}
}
