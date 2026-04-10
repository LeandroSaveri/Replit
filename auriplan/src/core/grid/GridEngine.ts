// ============================================
// Grid Engine - Grid rendering and snapping
// ============================================

import type { Vec2, GridState } from '@auriplan-types';
import { numeric } from '@core/math/vector';

export interface GridConfig {
  visible: boolean;
  size: number;
  subdivisions: number;
  majorColor: string;
  minorColor: string;
  axisColor: string;
  opacity: number;
  showAxes: boolean;
  infinite: boolean;
}

export const DEFAULT_GRID_CONFIG: GridConfig = {
  visible: true,
  size: 1,
  subdivisions: 10,
  majorColor: '#475569',
  minorColor: '#334155',
  axisColor: '#3b82f6',
  opacity: 0.5,
  showAxes: true,
  infinite: true,
};

export class GridEngine {
  private config: GridConfig;

  constructor(config: Partial<GridConfig> = {}) {
    this.config = { ...DEFAULT_GRID_CONFIG, ...config };
  }

  // Configuration
  setConfig(config: Partial<GridConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): GridConfig {
    return { ...this.config };
  }

  toggleVisible(): boolean {
    this.config.visible = !this.config.visible;
    return this.config.visible;
  }

  setVisible(visible: boolean): void {
    this.config.visible = visible;
  }

  setSize(size: number): void {
    this.config.size = Math.max(0.1, size);
  }

  // Snap point to grid
  snap(point: Vec2): Vec2 {
    if (!this.config.visible) return point;
    
    return [
      numeric.snapToGrid(point[0], this.config.size),
      numeric.snapToGrid(point[1], this.config.size),
    ];
  }

  // Get grid lines for rendering
  getLines(
    viewBounds: { min: Vec2; max: Vec2 },
    scale: number
  ): { major: GridLine[]; minor: GridLine[]; axes: GridLine[] } {
    const major: GridLine[] = [];
    const minor: GridLine[] = [];
    const axes: GridLine[] = [];

    if (!this.config.visible) return { major, minor, axes };

    const minorSize = this.config.size / this.config.subdivisions;
    
    // Calculate visible range
    const startX = Math.floor(viewBounds.min[0] / minorSize) * minorSize;
    const endX = Math.ceil(viewBounds.max[0] / minorSize) * minorSize;
    const startY = Math.floor(viewBounds.min[1] / minorSize) * minorSize;
    const endY = Math.ceil(viewBounds.max[1] / minorSize) * minorSize;

    // Generate vertical lines
    for (let x = startX; x <= endX; x += minorSize) {
      const isMajor = Math.abs(x % this.config.size) < 0.001;
      const isAxis = Math.abs(x) < 0.001;
      
      const line: GridLine = {
        start: [x, viewBounds.min[1]],
        end: [x, viewBounds.max[1]],
      };

      if (isAxis && this.config.showAxes) {
        axes.push(line);
      } else if (isMajor) {
        major.push(line);
      } else {
        minor.push(line);
      }
    }

    // Generate horizontal lines
    for (let y = startY; y <= endY; y += minorSize) {
      const isMajor = Math.abs(y % this.config.size) < 0.001;
      const isAxis = Math.abs(y) < 0.001;
      
      const line: GridLine = {
        start: [viewBounds.min[0], y],
        end: [viewBounds.max[0], y],
      };

      if (isAxis && this.config.showAxes) {
        axes.push(line);
      } else if (isMajor) {
        major.push(line);
      } else {
        minor.push(line);
      }
    }

    return { major, minor, axes };
  }

  // Render grid to canvas
  render(
    ctx: CanvasRenderingContext2D,
    viewBounds: { min: Vec2; max: Vec2 },
    scale: number,
    offset: Vec2
  ): void {
    if (!this.config.visible) return;

    const { major, minor, axes } = this.getLines(viewBounds, scale);

    ctx.save();
    ctx.globalAlpha = this.config.opacity;

    // Draw minor lines
    ctx.strokeStyle = this.config.minorColor;
    ctx.lineWidth = 1 / scale;
    ctx.beginPath();
    for (const line of minor) {
      ctx.moveTo(line.start[0], line.start[1]);
      ctx.lineTo(line.end[0], line.end[1]);
    }
    ctx.stroke();

    // Draw major lines
    ctx.strokeStyle = this.config.majorColor;
    ctx.lineWidth = 1.5 / scale;
    ctx.beginPath();
    for (const line of major) {
      ctx.moveTo(line.start[0], line.start[1]);
      ctx.lineTo(line.end[0], line.end[1]);
    }
    ctx.stroke();

    // Draw axes
    if (this.config.showAxes) {
      ctx.strokeStyle = this.config.axisColor;
      ctx.lineWidth = 2 / scale;
      ctx.beginPath();
      for (const line of axes) {
        ctx.moveTo(line.start[0], line.start[1]);
        ctx.lineTo(line.end[0], line.end[1]);
      }
      ctx.stroke();
    }

    ctx.restore();
  }

  // Convert grid state to/from config
  static fromState(state: GridState): GridEngine {
    return new GridEngine({
      visible: state.visible,
      size: state.size,
      subdivisions: state.subdivisions,
      majorColor: state.color,
      opacity: state.opacity,
    });
  }

  toState(): GridState {
    return {
      visible: this.config.visible,
      size: this.config.size,
      subdivisions: this.config.subdivisions,
      color: this.config.majorColor,
      opacity: this.config.opacity,
    };
  }
}

interface GridLine {
  start: Vec2;
  end: Vec2;
}
