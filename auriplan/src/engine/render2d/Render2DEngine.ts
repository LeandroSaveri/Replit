// ============================================
// Render2D Engine - 2D Canvas rendering (POLYGON-BASED WALLS)
// ============================================

import type { Vec2, Wall, Room, Door, Window, Furniture, Measurement } from '@auriplan-types';
import { vec2, geometry } from '@core/math/vector';

export interface Render2DConfig {
  antialias: boolean;
  showGrid: boolean;
  showAxes: boolean;
  showDimensions: boolean;
  selectionColor: string;
  hoverColor: string;
  wallColor: string;
  roomFillOpacity: number;
  defaultWallThickness: number; // espessura padrão para preview
}

export const DEFAULT_RENDER2D_CONFIG: Render2DConfig = {
  antialias: true,
  showGrid: true,
  showAxes: true,
  showDimensions: true,
  selectionColor: '#3b82f6',
  hoverColor: '#60a5fa',
  wallColor: '#cbd5e1',     // cinza mais suave para paredes
  roomFillOpacity: 0.2,
  defaultWallThickness: 0.15, // 15cm padrão
};

export interface ViewTransform {
  scale: number;
  offset: Vec2;
  rotation: number;
}

export class Render2DEngine {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private config: Render2DConfig;
  private transform: ViewTransform;

  constructor(config: Partial<Render2DConfig> = {}) {
    this.config = { ...DEFAULT_RENDER2D_CONFIG, ...config };
    this.transform = {
      scale: 20,
      offset: [0, 0],
      rotation: 0,
    };
  }

  // Initialize canvas
  initialize(canvas: HTMLCanvasElement): boolean {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d', {
      alpha: false,
      antialias: this.config.antialias,
    });

    if (!ctx) return false;

    this.ctx = ctx as CanvasRenderingContext2D;
    this.resize(canvas.width, canvas.height);
    return true;
  }

  // Resize canvas - resets context transform
  resize(width: number, height: number): void {
    if (!this.canvas) return;
    
    this.canvas.width = width;
    this.canvas.height = height;
    
    if (this.ctx) {
      this.ctx.imageSmoothingEnabled = this.config.antialias;
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
  }

  // Set view transform
  setTransform(transform: Partial<ViewTransform>): void {
    this.transform = { ...this.transform, ...transform };
  }

  // Get view transform
  getTransform(): ViewTransform {
    return { ...this.transform };
  }

  // Clear canvas with professional CAD-like background
  clear(color: string = '#f8fafc'): void {
    if (!this.ctx || !this.canvas) return;
    
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  // Main render method (with per-layer try/catch protection)
  render(params: {
    walls: Wall[];
    rooms: Room[];
    doors: Door[];
    windows: Window[];
    furniture: Furniture[];
    measurements: Measurement[];
    selectedIds: string[];
    hoveredId: string | null;
    previewLine?: { start: Vec2; end: Vec2; thickness?: number } | null;
  }): void {
    if (!this.ctx || !this.canvas) return;

    // Reset transform before starting
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);

    this.clear();
    this.ctx.save();

    // Apply view transform
    this.applyTransform();

    // Set miter limit for clean corners (when stroking, but fill doesn't need)
    this.ctx.lineJoin = 'miter';
    this.ctx.lineCap = 'butt';
    this.ctx.miterLimit = 2;

    // Render grid (behind everything)
    if (this.config.showGrid) {
      try {
        this.renderGrid();
      } catch (e) {
        console.error("RenderGrid error", e);
      }
    }

    // Render layers (back to front) with individual protection
    try {
      this.renderRooms(params.rooms, params.selectedIds, params.hoveredId);
    } catch (e) {
      console.error("RenderRooms error", e);
    }

    try {
      this.renderWalls(params.walls, params.selectedIds, params.hoveredId);
    } catch (e) {
      console.error("RenderWalls error", e);
    }

    try {
      this.renderDoors(params.doors, params.walls);
    } catch (e) {
      console.error("RenderDoors error", e);
    }

    try {
      this.renderWindows(params.windows, params.walls);
    } catch (e) {
      console.error("RenderWindows error", e);
    }

    try {
      this.renderFurniture(params.furniture, params.selectedIds, params.hoveredId);
    } catch (e) {
      console.error("RenderFurniture error", e);
    }

    try {
      this.renderMeasurements(params.measurements);
    } catch (e) {
      console.error("RenderMeasurements error", e);
    }

    try {
      this.renderPreviewLine(params.previewLine);
    } catch (e) {
      console.error("RenderPreviewLine error", e);
    }

    try {
      this.renderSelectionHandles(params.walls, params.rooms, params.furniture, params.selectedIds);
    } catch (e) {
      console.error("RenderHandles error", e);
    }

    this.ctx.restore();
  }

  // Apply view transformation
  private applyTransform(): void {
    if (!this.ctx || !this.canvas) return;

    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    this.ctx.translate(centerX + this.transform.offset[0], centerY + this.transform.offset[1]);
    this.ctx.scale(this.transform.scale, -this.transform.scale);
    this.ctx.rotate(this.transform.rotation);
  }

  // ==================== PROFESSIONAL GRID ====================
  private renderGrid(): void {
    if (!this.ctx) return;

    const viewRect = this.getViewBounds();
    const stepMajor = 1.0;      // 1 meter major grid
    const stepMinor = 0.5;      // 0.5 meter minor grid

    // Calculate start and end in world coordinates
    const startX = Math.floor(viewRect.minX / stepMajor) * stepMajor;
    const startY = Math.floor(viewRect.minY / stepMajor) * stepMajor;
    const endX = viewRect.maxX;
    const endY = viewRect.maxY;

    // Draw minor grid (lighter)
    this.ctx.beginPath();
    this.ctx.strokeStyle = '#e2e8f0';
    this.ctx.lineWidth = 0.008;
    
    for (let x = startX; x <= endX; x += stepMinor) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, viewRect.minY);
      this.ctx.lineTo(x, viewRect.maxY);
      this.ctx.stroke();
    }
    
    for (let y = startY; y <= endY; y += stepMinor) {
      this.ctx.beginPath();
      this.ctx.moveTo(viewRect.minX, y);
      this.ctx.lineTo(viewRect.maxX, y);
      this.ctx.stroke();
    }

    // Draw major grid (darker)
    this.ctx.beginPath();
    this.ctx.strokeStyle = '#cbd5e1';
    this.ctx.lineWidth = 0.015;
    
    for (let x = startX; x <= endX; x += stepMajor) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, viewRect.minY);
      this.ctx.lineTo(x, viewRect.maxY);
      this.ctx.stroke();
    }
    
    for (let y = startY; y <= endY; y += stepMajor) {
      this.ctx.beginPath();
      this.ctx.moveTo(viewRect.minX, y);
      this.ctx.lineTo(viewRect.maxX, y);
      this.ctx.stroke();
    }

    // Draw axes if enabled
    if (this.config.showAxes) {
      this.ctx.beginPath();
      this.ctx.strokeStyle = '#94a3b8';
      this.ctx.lineWidth = 0.02;
      this.ctx.moveTo(0, viewRect.minY);
      this.ctx.lineTo(0, viewRect.maxY);
      this.ctx.moveTo(viewRect.minX, 0);
      this.ctx.lineTo(viewRect.maxX, 0);
      this.ctx.stroke();
    }
  }

  // Helper: get visible world bounds
  private getViewBounds(): { minX: number; minY: number; maxX: number; maxY: number } {
    if (!this.canvas) return { minX: -10, minY: -10, maxX: 10, maxY: 10 };
    
    const topLeft = this.screenToWorld(0, 0);
    const bottomRight = this.screenToWorld(this.canvas.width, this.canvas.height);
    
    return {
      minX: Math.min(topLeft[0], bottomRight[0]),
      minY: Math.min(topLeft[1], bottomRight[1]),
      maxX: Math.max(topLeft[0], bottomRight[0]),
      maxY: Math.max(topLeft[1], bottomRight[1]),
    };
  }

  // ==================== POLYGON CENTROID ====================
  private polygonCentroid(points: Vec2[]): Vec2 {
    if (points.length === 0) return [0, 0];

    let twiceArea = 0;
    let cx = 0;
    let cy = 0;

    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const p1 = points[j];
      const p2 = points[i];

      const f = p1[0] * p2[1] - p2[0] * p1[1];
      twiceArea += f;
      cx += (p1[0] + p2[0]) * f;
      cy += (p1[1] + p2[1]) * f;
    }

    if (Math.abs(twiceArea) < 1e-9) {
      const sum = points.reduce(
        (acc, p) => [acc[0] + p[0], acc[1] + p[1]] as Vec2,
        [0, 0] as Vec2
      );
      return [sum[0] / points.length, sum[1] / points.length];
    }

    const factor = 1 / (3 * twiceArea);
    return [cx * factor, cy * factor];
  }

  // ==================== WALL RENDERING (POLYGON-BASED) ====================
  private renderWalls(
    walls: Wall[],
    selectedIds: string[],
    hoveredId: string | null
  ): void {
    if (!this.ctx) return;

    for (const wall of walls) {
      if (!wall.visible) continue;

      const isSelected = selectedIds.includes(wall.id);
      const isHovered = hoveredId === wall.id;

      // Compute wall rectangle polygon
      const polygon = this.getWallPolygon(wall.start, wall.end, wall.thickness);
      if (!polygon) continue;

      // Fill wall body
      this.ctx.beginPath();
      this.ctx.moveTo(polygon[0][0], polygon[0][1]);
      for (let i = 1; i < polygon.length; i++) {
        this.ctx.lineTo(polygon[i][0], polygon[i][1]);
      }
      this.ctx.closePath();

      this.ctx.fillStyle = wall.color ?? this.config.wallColor;
      this.ctx.fill();

      // Outline for selection/hover
      if (isSelected || isHovered) {
        this.ctx.strokeStyle = isSelected ? this.config.selectionColor : this.config.hoverColor;
        this.ctx.lineWidth = 0.02;
        this.ctx.setLineDash([0.05, 0.05]);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
      }

      // Endpoint dots (small, always visible for reference)
      this.renderPoint(wall.start, 0.04, isSelected ? this.config.selectionColor : '#94a3b8');
      this.renderPoint(wall.end, 0.04, isSelected ? this.config.selectionColor : '#94a3b8');

      // Wall length label (when zoomed in enough)
      if (this.config.showDimensions && this.transform.scale > 15) {
        const length = Math.hypot(wall.end[0] - wall.start[0], wall.end[1] - wall.start[1]);
        if (length >= 0.2) {
          const mid: Vec2 = [(wall.start[0] + wall.end[0]) / 2, (wall.start[1] + wall.end[1]) / 2];
          // Offset label perpendicular to wall direction
          const wdx = wall.end[0] - wall.start[0];
          const wdy = wall.end[1] - wall.start[1];
          const len = Math.hypot(wdx, wdy) || 1;
          const perp: Vec2 = [-wdy / len * 0.18, wdx / len * 0.18];
          const labelPos: Vec2 = [mid[0] + perp[0], mid[1] + perp[1]];
          this.renderDimensionLabel(labelPos, length, isSelected ? '#1d4ed8' : '#475569');
        }
      }
    }
  }

  // Helper: compute 4 vertices of a wall as a polygon
  private getWallPolygon(start: Vec2, end: Vec2, thickness: number): Vec2[] | null {
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const len = Math.hypot(dx, dy);
    if (len < 1e-6) return null;

    // Unit direction and perpendicular normal
    const dirX = dx / len;
    const dirY = dy / len;
    const perpX = -dirY;
    const perpY = dirX;

    const offset = thickness / 2;
    const offX = perpX * offset;
    const offY = perpY * offset;

    // Four corners
    const p1: Vec2 = [start[0] + offX, start[1] + offY];
    const p2: Vec2 = [end[0] + offX, end[1] + offY];
    const p3: Vec2 = [end[0] - offX, end[1] - offY];
    const p4: Vec2 = [start[0] - offX, start[1] - offY];

    return [p1, p2, p3, p4];
  }

  // ==================== PREVIEW WALL (POLYGON-BASED) ====================
  private renderPreviewLine(line: { start: Vec2; end: Vec2; thickness?: number } | null | undefined): void {
    if (!this.ctx || !line) return;

    const thickness = line.thickness ?? this.config.defaultWallThickness;
    const polygon = this.getWallPolygon(line.start, line.end, thickness);
    if (!polygon) return;

    // Fill preview with semi-transparent blue
    this.ctx.beginPath();
    this.ctx.moveTo(polygon[0][0], polygon[0][1]);
    for (let i = 1; i < polygon.length; i++) {
      this.ctx.lineTo(polygon[i][0], polygon[i][1]);
    }
    this.ctx.closePath();

    this.ctx.fillStyle = 'rgba(59, 130, 246, 0.4)'; // #3b82f6 with opacity
    this.ctx.fill();

    // Optional dashed outline
    this.ctx.strokeStyle = '#3b82f6';
    this.ctx.lineWidth = 0.015;
    this.ctx.setLineDash([0.08, 0.06]);
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    // Length label
    const length = vec2.distance(line.start, line.end);
    const mid = vec2.midpoint(line.start, line.end);
    this.renderText(`${length.toFixed(2)}m`, mid, {
      color: '#3b82f6',
      fontSize: 0.25,
      align: 'center',
      background: '#f8fafc',
    });
  }

  // ==================== ROOMS ====================
  private renderRooms(
    rooms: Room[],
    selectedIds: string[],
    hoveredId: string | null
  ): void {
    if (!this.ctx) return;

    for (const room of rooms) {
      if (room.visible === false || room.points.length < 3) continue;

      const isSelected = selectedIds.includes(room.id);
      const isHovered = hoveredId === room.id;

      this.ctx.beginPath();
      this.ctx.moveTo(room.points[0][0], room.points[0][1]);
      
      for (let i = 1; i < room.points.length; i++) {
        this.ctx.lineTo(room.points[i][0], room.points[i][1]);
      }
      
      this.ctx.closePath();

      // Fill — use a stronger opacity for visual clarity
      this.ctx.fillStyle = this.hexToRgba(room.floorColor, isSelected ? 0.45 : 0.35);
      this.ctx.fill();

      // Stroke
      this.ctx.strokeStyle = isSelected ? this.config.selectionColor : 
                            isHovered ? this.config.hoverColor : (room.wallColor ?? '#334155');
      this.ctx.lineWidth = isSelected ? 0.06 : 0.04;
      this.ctx.stroke();

      // ── Room label (name + area) ──────────────────────────────
      const centroid = this.polygonCentroid(room.points);
      const area = this.polygonArea(room.points);

      // Only show label if room is large enough (> 0.2 m²)
      if (area > 0.2) {
        this.ctx.save();
        // Scale-invariant label rendering in world space
        // We use ctx.scale(-1) trick below so we need to flip text
        const scale = this.transform.scale;
        const fontSize = Math.max(0.15, Math.min(0.4, 1.4 / scale));
        const smallFontSize = fontSize * 0.75;

        // Name
        this.ctx.font = `600 ${fontSize}px system-ui, -apple-system, sans-serif`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = '#1e293b';
        // Canvas Y is flipped, so text also needs scale(-1) on Y
        this.ctx.save();
        this.ctx.translate(centroid[0], centroid[1]);
        this.ctx.scale(1, -1);
        this.ctx.fillText(room.name || 'Cômodo', 0, -smallFontSize * 0.6);

        // Area label
        this.ctx.font = `${smallFontSize}px system-ui, -apple-system, sans-serif`;
        this.ctx.fillStyle = '#64748b';
        this.ctx.fillText(`${area.toFixed(1)} m²`, 0, fontSize * 0.6);
        this.ctx.restore();
        this.ctx.restore();
      }

      // ── Edge dimension labels (always visible when scale is big enough) ──
      if (this.config.showDimensions && this.transform.scale > 12) {
        for (let i = 0; i < room.points.length; i++) {
          const a = room.points[i];
          const b = room.points[(i + 1) % room.points.length];
          const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
          if (len < 0.25) continue;
          const mid: Vec2 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
          this.renderDimensionLabel(mid, len, isSelected ? '#1d4ed8' : '#475569');
        }
      }
    }
  }

  private polygonArea(points: Vec2[]): number {
    let a = 0;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      a += (points[j][0] + points[i][0]) * (points[j][1] - points[i][1]);
    }
    return Math.abs(a / 2);
  }

  private renderDimensionLabel(center: Vec2, length: number, color = '#475569'): void {
    if (!this.ctx) return;
    const scale = this.transform.scale;
    const fontSize = Math.max(0.1, Math.min(0.25, 0.8 / scale));
    this.ctx.save();
    this.ctx.translate(center[0], center[1]);
    this.ctx.scale(1, -1);
    this.ctx.font = `600 ${fontSize}px system-ui, sans-serif`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    const text = `${length.toFixed(2)}m`;
    const tw = this.ctx.measureText(text).width;
    const pad = fontSize * 0.35;
    this.ctx.fillStyle = 'rgba(255,255,255,0.92)';
    this.ctx.beginPath();
    const rx = -tw / 2 - pad, ry = -fontSize / 2 - pad * 0.5;
    const rw = tw + pad * 2, rh = fontSize + pad;
    const rr = fontSize * 0.35;
    if ((this.ctx as any).roundRect) {
      (this.ctx as any).roundRect(rx, ry, rw, rh, rr);
    } else {
      this.ctx.rect(rx, ry, rw, rh);
    }
    this.ctx.fill();
    this.ctx.fillStyle = color;
    this.ctx.fillText(text, 0, 0);
    this.ctx.restore();
  }

  // ==================== DOORS (unchanged logic, but render over walls) ====================
  private renderDoors(doors: Door[], walls: Wall[]): void {
    if (!this.ctx) return;

    for (const door of doors) {
      if (!door.visible) continue;

      const wall = walls.find(w => w.id === door.wallId);
      if (!wall) continue;

      const wallDir = vec2.normalize(vec2.sub(wall.end, wall.start));
      const wallNormal = vec2.perpendicular(wallDir);
      const doorCenter = vec2.lerp(wall.start, wall.end, door.position);

      // Door frame
      const halfWidth = door.width / 2;
      const p1 = vec2.add(doorCenter, vec2.mul(wallDir, -halfWidth));
      const p2 = vec2.add(doorCenter, vec2.mul(wallDir, halfWidth));

      this.ctx.beginPath();
      this.ctx.moveTo(p1[0], p1[1]);
      this.ctx.lineTo(p2[0], p2[1]);
      this.ctx.strokeStyle = door.frameColor ?? '#92400e';
      this.ctx.lineWidth = door.depth ?? 0.05;
      this.ctx.stroke();

      // Door swing arc
      const swingCenter = door.swing === 'left' ? p1 : p2;
      const swingRadius = door.width;
      const startAngle = Math.atan2(wallDir[1], wallDir[0]);
      const endAngle = startAngle + (door.swing === 'left' ? -Math.PI / 2 : Math.PI / 2);

      this.ctx.beginPath();
      this.ctx.arc(swingCenter[0], swingCenter[1], swingRadius, startAngle, endAngle, door.swing === 'left');
      this.ctx.strokeStyle = door.panelColor ?? '#b45309';
      this.ctx.lineWidth = 0.02;
      this.ctx.setLineDash([0.05, 0.05]);
      this.ctx.stroke();
      this.ctx.setLineDash([]);
    }
  }

  // ==================== WINDOWS (unchanged) ====================
  private renderWindows(windows: Window[], walls: Wall[]): void {
    if (!this.ctx) return;

    for (const window of windows) {
      if (!window.visible) continue;

      const wall = walls.find(w => w.id === window.wallId);
      if (!wall) continue;

      const wallDir = vec2.normalize(vec2.sub(wall.end, wall.start));
      const windowCenter = vec2.lerp(wall.start, wall.end, window.position);

      const halfWidth = window.width / 2;
      const p1 = vec2.add(windowCenter, vec2.mul(wallDir, -halfWidth));
      const p2 = vec2.add(windowCenter, vec2.mul(wallDir, halfWidth));

      // Window frame
      this.ctx.beginPath();
      this.ctx.moveTo(p1[0], p1[1]);
      this.ctx.lineTo(p2[0], p2[1]);
      this.ctx.strokeStyle = window.frameColor ?? '#475569';
      this.ctx.lineWidth = 0.08;
      this.ctx.stroke();

      // Glass
      this.ctx.beginPath();
      this.ctx.moveTo(p1[0], p1[1]);
      this.ctx.lineTo(p2[0], p2[1]);
      this.ctx.strokeStyle = '#93c5fd';
      this.ctx.lineWidth = 0.04;
      this.ctx.stroke();

      // Sash lines
      const mid = vec2.midpoint(p1, p2);
      const normal = vec2.perpendicular(wallDir);
      const sashStart = vec2.add(mid, vec2.mul(normal, -0.05));
      const sashEnd = vec2.add(mid, vec2.mul(normal, 0.05));

      this.ctx.beginPath();
      this.ctx.moveTo(sashStart[0], sashStart[1]);
      this.ctx.lineTo(sashEnd[0], sashEnd[1]);
      this.ctx.strokeStyle = window.frameColor ?? '#475569';
      this.ctx.lineWidth = 0.02;
      this.ctx.stroke();
    }
  }

  // ==================== FURNITURE (unchanged) ====================
  private renderFurniture(
    furniture: Furniture[],
    selectedIds: string[],
    hoveredId: string | null
  ): void {
    if (!this.ctx) return;

    for (const item of furniture) {
      if (!item.visible) continue;

      const isSelected = selectedIds.includes(item.id);
      const isHovered = hoveredId === item.id;

      const _ipos = item.position;
      const _irot = item.rotation;
      const _idim = item.dimensions ?? { width: 1, depth: 1, height: 1 };
      const _isc = item.scale ?? [1, 1, 1];
      const _ipx = Array.isArray(_ipos) ? _ipos[0] : (_ipos as any).x ?? 0;
      const _ipz = Array.isArray(_ipos) ? _ipos[2] : (_ipos as any).z ?? 0;
      const _iry = typeof _irot === 'number' ? _irot : Array.isArray(_irot) ? _irot[1] : (_irot as any).y ?? 0;
      const halfW = (_idim.width * _isc[0]) / 2;
      const halfD = (_idim.depth * _isc[2]) / 2;

      this.ctx.save();
      this.ctx.translate(_ipx, _ipz);
      this.ctx.rotate(-_iry);

      // Furniture body
      this.ctx.fillStyle = item.color;
      this.ctx.fillRect(-halfW, -halfD, halfW * 2, halfD * 2);

      // Border
      this.ctx.strokeStyle = isSelected ? this.config.selectionColor : 
                            isHovered ? this.config.hoverColor : '#475569';
      this.ctx.lineWidth = isSelected ? 0.03 : 0.02;
      this.ctx.strokeRect(-halfW, -halfD, halfW * 2, halfD * 2);

      // Selection highlight
      if (isSelected) {
        this.ctx.strokeStyle = this.config.selectionColor;
        this.ctx.lineWidth = 0.02;
        this.ctx.setLineDash([0.05, 0.05]);
        this.ctx.strokeRect(-halfW - 0.1, -halfD - 0.1, halfW * 2 + 0.2, halfD * 2 + 0.2);
        this.ctx.setLineDash([]);
      }

      // Direction indicator
      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.moveTo(0, -halfD + 0.1);
      this.ctx.lineTo(-0.1, -halfD + 0.25);
      this.ctx.lineTo(0.1, -halfD + 0.25);
      this.ctx.closePath();
      this.ctx.fill();

      this.ctx.restore();
    }
  }

  // ==================== MEASUREMENTS (improved) ====================
  private renderMeasurements(measurements: Measurement[]): void {
    if (!this.ctx || !this.config.showDimensions) return;

    for (const measurement of measurements) {
      if (!measurement.visible) continue;

      const mid = vec2.midpoint(measurement.start, measurement.end);
      const angle = Math.atan2(
        measurement.end[1] - measurement.start[1],
        measurement.end[0] - measurement.start[0]
      );

      // Measurement line
      this.ctx.beginPath();
      this.ctx.moveTo(measurement.start[0], measurement.start[1]);
      this.ctx.lineTo(measurement.end[0], measurement.end[1]);
      this.ctx.strokeStyle = '#3b82f6';
      this.ctx.lineWidth = 0.02;
      this.ctx.stroke();

      // Extension lines
      const normal = vec2.normalize([-Math.sin(angle), Math.cos(angle)]);
      const extLength = 0.2;

      this.ctx.beginPath();
      this.ctx.moveTo(
        measurement.start[0] + normal[0] * extLength,
        measurement.start[1] + normal[1] * extLength
      );
      this.ctx.lineTo(
        measurement.start[0] - normal[0] * extLength,
        measurement.start[1] - normal[1] * extLength
      );
      this.ctx.stroke();

      this.ctx.beginPath();
      this.ctx.moveTo(
        measurement.end[0] + normal[0] * extLength,
        measurement.end[1] + normal[1] * extLength
      );
      this.ctx.lineTo(
        measurement.end[0] - normal[0] * extLength,
        measurement.end[1] - normal[1] * extLength
      );
      this.ctx.stroke();

      const displayValue = (measurement.value ?? vec2.distance(measurement.start, measurement.end)).toFixed(2);
      
      // Label with background for readability
      this.renderText(`${displayValue} ${measurement.unit}`, mid, {
        color: '#1e40af',
        fontSize: 0.25,
        align: 'center',
        background: '#f8fafc',
      });
    }
  }

  // ==================== UTILITIES ====================
  private renderPoint(position: Vec2, radius: number, color: string): void {
    if (!this.ctx) return;

    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(position[0], position[1], radius, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private renderText(
    text: string,
    position: Vec2,
    options: {
      color?: string;
      fontSize?: number;
      align?: 'left' | 'center' | 'right';
      background?: string;
    } = {}
  ): void {
    if (!this.ctx) return;

    const { color = '#1e293b', fontSize = 0.2, align = 'center', background } = options;

    this.ctx.save();
    this.ctx.scale(1, -1);
    this.ctx.font = `${fontSize * 10}px Inter, system-ui, sans-serif`;
    this.ctx.fillStyle = color;
    this.ctx.textAlign = align;
    this.ctx.textBaseline = 'middle';

    const y = -position[1];

    if (background) {
      const metrics = this.ctx.measureText(text);
      const padding = fontSize * 0.2;
      
      this.ctx.fillStyle = background;
      this.ctx.fillRect(
        position[0] - metrics.width / 2 - padding,
        y - fontSize / 2 - padding,
        metrics.width + padding * 2,
        fontSize + padding * 2
      );
      
      this.ctx.fillStyle = color;
    }

    this.ctx.fillText(text, position[0], y);
    this.ctx.restore();
  }

  // Screen to world coordinate conversion
  screenToWorld(screenX: number, screenY: number): Vec2 {
    if (!this.canvas) return [0, 0];

    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    return [
      (screenX - centerX - this.transform.offset[0]) / this.transform.scale,
      -(screenY - centerY - this.transform.offset[1]) / this.transform.scale,
    ];
  }

  // World to screen coordinate conversion
  worldToScreen(worldX: number, worldY: number): Vec2 {
    if (!this.canvas) return [0, 0];

    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    return [
      worldX * this.transform.scale + centerX + this.transform.offset[0],
      -worldY * this.transform.scale + centerY + this.transform.offset[1],
    ];
  }

  private hexToRgba(hex: string | undefined | null, alpha: number): string {
    const h = (hex && hex.startsWith('#') && hex.length >= 7) ? hex : '#8899aa';
    const r = parseInt(h.slice(1, 3), 16);
    const g = parseInt(h.slice(3, 5), 16);
    const b = parseInt(h.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  // ==================== SELECTION HANDLES (MagicPlan-style) ====================
  private renderSelectionHandles(
    walls: Wall[],
    rooms: Room[],
    furniture: Furniture[],
    selectedIds: string[],
  ): void {
    if (!this.ctx || selectedIds.length === 0) return;
    const s = this.transform.scale;
    if (s < 6) return; // don't render handles when too zoomed out

    // Handle sizes scale with zoom (stay visually consistent)
    const vr = Math.max(0.06, Math.min(0.14, 5 / s));   // vertex radius
    const dm = Math.max(0.07, Math.min(0.16, 6 / s));   // diamond size

    // ── Selected wall handles ──────────────────────────────
    for (const wall of walls) {
      if (!selectedIds.includes(wall.id)) continue;

      // Vertex handles at start and end
      this.renderHandle(wall.start, 'circle', '#ffffff', '#3b82f6', vr);
      this.renderHandle(wall.end, 'circle', '#ffffff', '#3b82f6', vr);

      // Midpoint push handle (diamond)
      const mid: Vec2 = [(wall.start[0] + wall.end[0]) / 2, (wall.start[1] + wall.end[1]) / 2];
      this.renderHandle(mid, 'diamond', '#3b82f6', '#1d4ed8', dm);
    }

    // ── Selected room handles ──────────────────────────────
    for (const room of rooms) {
      if (!selectedIds.includes(room.id)) continue;

      for (let i = 0; i < room.points.length; i++) {
        // Vertex handles at each corner
        this.renderHandle(room.points[i], 'circle', '#ffffff', '#3b82f6', vr);

        // Edge midpoint push handles (diamonds)
        const a = room.points[i];
        const b = room.points[(i + 1) % room.points.length];
        const edgeLen = Math.hypot(b[0] - a[0], b[1] - a[1]);
        if (edgeLen >= 0.15) {
          const mid: Vec2 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
          this.renderHandle(mid, 'diamond', '#60a5fa', '#3b82f6', dm * 0.85);
        }
      }
    }

    // ── Selected furniture handles ─────────────────────────
    for (const furn of furniture) {
      if (!selectedIds.includes(furn.id)) continue;
      const _fpos = furn.position;
      const _fdim = furn.dimensions ?? { width: 1, depth: 1, height: 1 };
      const _fsc = furn.scale ?? [1, 1, 1];
      const _fpx = Array.isArray(_fpos) ? _fpos[0] : (_fpos as any).x ?? 0;
      const _fpz = Array.isArray(_fpos) ? _fpos[2] : (_fpos as any).z ?? 0;
      const hw = (_fdim.width * _fsc[0]) / 2;
      const hd = (_fdim.depth * _fsc[2]) / 2;
      const corners: Vec2[] = [
        [_fpx - hw, _fpz - hd],
        [_fpx + hw, _fpz - hd],
        [_fpx + hw, _fpz + hd],
        [_fpx - hw, _fpz + hd],
      ];
      for (const c of corners) {
        this.renderHandle(c, 'circle', '#ffffff', '#f59e0b', vr * 0.85);
      }
      // Rotation handle (above center)
      const rotHandle: Vec2 = [_fpx, _fpz - hd - vr * 3];
      this.renderHandle(rotHandle, 'circle', '#f59e0b', '#d97706', vr);
    }
  }

  private renderHandle(
    pos: Vec2,
    shape: 'circle' | 'diamond',
    fill: string,
    stroke: string,
    size: number,
  ): void {
    if (!this.ctx) return;
    const s = this.transform.scale;
    const lw = Math.max(0.006, 1.5 / s);

    this.ctx.save();
    this.ctx.fillStyle = fill;
    this.ctx.strokeStyle = stroke;
    this.ctx.lineWidth = lw;

    if (shape === 'circle') {
      this.ctx.beginPath();
      this.ctx.arc(pos[0], pos[1], size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();
    } else {
      // Diamond shape
      this.ctx.beginPath();
      this.ctx.moveTo(pos[0], pos[1] + size);
      this.ctx.lineTo(pos[0] + size, pos[1]);
      this.ctx.lineTo(pos[0], pos[1] - size);
      this.ctx.lineTo(pos[0] - size, pos[1]);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();
    }
    this.ctx.restore();
  }

  // Export canvas as image
  toDataURL(type: string = 'image/png', quality?: number): string {
    return this.canvas?.toDataURL(type, quality) || '';
  }

  // Dispose
  dispose(): void {
    this.canvas = null;
    this.ctx = null;
  }
}
