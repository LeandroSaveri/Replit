/**
 * AuriPlan 2D Renderer
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
    
    // Enable high DPI rendering
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.scale(dpr, dpr);
  }

  render(deltaTime: number): void {
    if (!this.isDirty) return;
    
    this.drawCalls = 0;
    this.clear();
    
    this.ctx.save();
    this.applyViewport();
    
    this.emit('render', { ctx: this.ctx, deltaTime });
    
    this.ctx.restore();
    this.isDirty = false;
  }

  private clear(): void {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  private applyViewport(): void {
    this.ctx.translate(this.width / 2, this.height / 2);
    this.ctx.scale(this.viewport.zoom, this.viewport.zoom);
    this.ctx.rotate(this.viewport.rotation);
    this.ctx.translate(-this.viewport.x, -this.viewport.y);
  }

  // Drawing primitives
  drawLine(x1: number, y1: number, x2: number, y2: number, options: DrawOptions = {}): void {
    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
    this.stroke(options);
    this.drawCalls++;
  }

  drawRect(x: number, y: number, width: number, height: number, options: DrawOptions = {}): void {
    this.ctx.beginPath();
    this.ctx.rect(x, y, width, height);
    this.fill(options);
    this.stroke(options);
    this.drawCalls++;
  }

  drawCircle(x: number, y: number, radius: number, options: DrawOptions = {}): void {
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.fill(options);
    this.stroke(options);
    this.drawCalls++;
  }

  drawPolygon(points: { x: number; y: number }[], options: DrawOptions = {}): void {
    if (points.length < 3) return;
    
    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      this.ctx.lineTo(points[i].x, points[i].y);
    }
    this.ctx.closePath();
    this.fill(options);
    this.stroke(options);
    this.drawCalls++;
  }

  drawText(text: string, x: number, y: number, options: {
    font?: string;
    size?: number;
    color?: string;
    align?: CanvasTextAlign;
    baseline?: CanvasTextBaseline;
  } = {}): void {
    const { font = 'Arial', size = 12, color = '#000', align = 'left', baseline = 'alphabetic' } = options;
    
    this.ctx.font = `${size}px ${font}`;
    this.ctx.fillStyle = color;
    this.ctx.textAlign = align;
    this.ctx.textBaseline = baseline;
    this.ctx.fillText(text, x, y);
    this.drawCalls++;
  }

  drawGrid(spacing: number = 1, options: DrawOptions = {}): void {
    const { stroke = '#e0e0e0', lineWidth = 0.5 } = options;
    const bounds = this.getVisibleBounds();
    
    this.ctx.beginPath();
    
    // Vertical lines
    for (let x = Math.floor(bounds.minX / spacing) * spacing; x <= bounds.maxX; x += spacing) {
      this.ctx.moveTo(x, bounds.minY);
      this.ctx.lineTo(x, bounds.maxY);
    }
    
    // Horizontal lines
    for (let y = Math.floor(bounds.minY / spacing) * spacing; y <= bounds.maxY; y += spacing) {
      this.ctx.moveTo(bounds.minX, y);
      this.ctx.lineTo(bounds.maxX, y);
    }
    
    this.ctx.strokeStyle = stroke;
    this.ctx.lineWidth = lineWidth;
    this.ctx.stroke();
    this.drawCalls++;
  }

  drawWall(x1: number, y1: number, x2: number, y2: number, thickness: number = 0.15, options: DrawOptions = {}): void {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const dx = Math.sin(angle) * thickness / 2;
    const dy = -Math.cos(angle) * thickness / 2;
    
    const points = [
      { x: x1 + dx, y: y1 + dy },
      { x: x2 + dx, y: y2 + dy },
      { x: x2 - dx, y: y2 - dy },
      { x: x1 - dx, y: y1 - dy },
    ];
    
    this.drawPolygon(points, options);
  }

  drawRoom(points: { x: number; y: number }[], options: DrawOptions = {}): void {
    this.drawPolygon(points, { ...options, fill: options.fill || 'rgba(200, 200, 200, 0.3)' });
    
    // Draw area label
    if (points.length >= 3) {
      const center = this.calculatePolygonCenter(points);
      const area = this.calculatePolygonArea(points);
      this.drawText(`${area.toFixed(2)} m²`, center.x, center.y, {
        size: 10,
        color: '#666',
        align: 'center',
      });
    }
  }

  drawDimensionLine(x1: number, y1: number, x2: number, y2: number, offset: number = 0.3): void {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const dx = Math.sin(angle) * offset;
    const dy = -Math.cos(angle) * offset;
    
    const startX = x1 + dx;
    const startY = y1 + dy;
    const endX = x2 + dx;
    const endY = y2 + dy;
    
    // Dimension line
    this.drawLine(startX, startY, endX, endY, { stroke: '#333', lineWidth: 1 });
    
    // Extension lines
    this.drawLine(x1, y1, startX, startY, { stroke: '#333', lineWidth: 0.5, lineDash: [2, 2] });
    this.drawLine(x2, y2, endX, endY, { stroke: '#333', lineWidth: 0.5, lineDash: [2, 2] });
    
    // End marks
    const markSize = 0.1;
    this.drawLine(startX, startY - markSize, startX, startY + markSize, { stroke: '#333', lineWidth: 1 });
    this.drawLine(endX, endY - markSize, endX, endY + markSize, { stroke: '#333', lineWidth: 1 });
    
    // Dimension text
    const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    this.drawText(`${length.toFixed(2)} m`, midX, midY - 0.1, {
      size: 10,
      color: '#333',
      align: 'center',
    });
  }

  // Viewport control
  setViewport(viewport: Partial<Viewport2D>): void {
    this.viewport = { ...this.viewport, ...viewport };
    this.isDirty = true;
  }

  getViewport(): Viewport2D {
    return { ...this.viewport };
  }

  pan(dx: number, dy: number): void {
    this.viewport.x -= dx / this.viewport.zoom;
    this.viewport.y -= dy / this.viewport.zoom;
    this.isDirty = true;
  }

  zoom(factor: number, centerX?: number, centerY?: number): void {
    const oldZoom = this.viewport.zoom;
    this.viewport.zoom = Math.max(0.1, Math.min(50, this.viewport.zoom * factor));
    
    if (centerX !== undefined && centerY !== undefined) {
      const zoomRatio = this.viewport.zoom / oldZoom;
      this.viewport.x = centerX - (centerX - this.viewport.x) * zoomRatio;
      this.viewport.y = centerY - (centerY - this.viewport.y) * zoomRatio;
    }
    
    this.isDirty = true;
  }

  rotate(angle: number): void {
    this.viewport.rotation += angle;
    this.isDirty = true;
  }

  resetViewport(): void {
    this.viewport = { x: 0, y: 0, zoom: 1, rotation: 0 };
    this.isDirty = true;
  }

  // Coordinate conversion
  screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    const cos = Math.cos(-this.viewport.rotation);
    const sin = Math.sin(-this.viewport.rotation);
    
    const dx = (screenX - this.width / 2) / this.viewport.zoom;
    const dy = (screenY - this.height / 2) / this.viewport.zoom;
    
    return {
      x: this.viewport.x + dx * cos - dy * sin,
      y: this.viewport.y + dx * sin + dy * cos,
    };
  }

  worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    const cos = Math.cos(this.viewport.rotation);
    const sin = Math.sin(this.viewport.rotation);
    
    const dx = worldX - this.viewport.x;
    const dy = worldY - this.viewport.y;
    
    return {
      x: this.width / 2 + (dx * cos - dy * sin) * this.viewport.zoom,
      y: this.height / 2 + (dx * sin + dy * cos) * this.viewport.zoom,
    };
  }

  // Helpers
  private stroke(options: DrawOptions): void {
    if (options.stroke) {
      this.ctx.strokeStyle = options.stroke;
      this.ctx.lineWidth = options.lineWidth ?? 1;
      if (options.lineDash) {
        this.ctx.setLineDash(options.lineDash);
      }
      this.ctx.stroke();
      this.ctx.setLineDash([]);
    }
  }

  private fill(options: DrawOptions): void {
    if (options.fill) {
      this.ctx.fillStyle = options.fill;
      if (options.opacity !== undefined) {
        this.ctx.globalAlpha = options.opacity;
      }
      this.ctx.fill();
      this.ctx.globalAlpha = 1;
    }
  }

  private getVisibleBounds(): { minX: number; minY: number; maxX: number; maxY: number } {
    const topLeft = this.screenToWorld(0, 0);
    const bottomRight = this.screenToWorld(this.width, this.height);
    
    return {
      minX: Math.min(topLeft.x, bottomRight.x),
      minY: Math.min(topLeft.y, bottomRight.y),
      maxX: Math.max(topLeft.x, bottomRight.x),
      maxY: Math.max(topLeft.y, bottomRight.y),
    };
  }

  private calculatePolygonCenter(points: { x: number; y: number }[]): { x: number; y: number } {
    let sumX = 0, sumY = 0;
    for (const p of points) {
      sumX += p.x;
      sumY += p.y;
    }
    return { x: sumX / points.length, y: sumY / points.length };
  }

  private calculatePolygonArea(points: { x: number; y: number }[]): number {
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }
    return Math.abs(area) / 2;
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.setupCanvas();
    this.isDirty = true;
  }

  getDrawCalls(): number {
    return this.drawCalls;
  }

  markDirty(): void {
    this.isDirty = true;
  }

  dispose(): void {
    this.removeAllListeners();
  }
}
