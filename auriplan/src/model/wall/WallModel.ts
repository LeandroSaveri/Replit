import { v4 as uuidv4 } from 'uuid';
import type { Wall, Vec2, Room } from '@auriplan-types';
import { 
  distance, 
  pointOnLine, 
  linesIntersect, 
  normalizeVector,
  subtractVectors,
  addVectors,
  scaleVector,
  perpendicularVector
} from '@core/math/vector';

// ============================================
// WALL MODEL - Gerenciamento de Paredes (Opcional)
// ============================================

export interface WallCreateOptions {
  start: Vec2;
  end: Vec2;
  height?: number;
  thickness?: number;
  color?: string;
  material?: string;
}

export interface WallSplitResult {
  original: Wall;
  segments: Wall[];
}

export class WallModel {
  private wall: Wall;

  constructor(options: WallCreateOptions) {
    this.wall = {
      id: uuidv4(),
      start: [...options.start],
      end: [...options.end],
      height: options.height ?? 2.8,
      thickness: options.thickness ?? 0.15,
      color: options.color ?? '#f5f5f5',
      material: options.material ?? 'paint-white',
      startConnected: false,
      endConnected: false,
      connectedWalls: {
        start: [],
        end: [],
      },
      roomIds: [],
      openingIds: [],
      visible: true,
      locked: false,
    };
  }

  static fromData(data: Wall): WallModel {
    const model = new WallModel({
      start: data.start,
      end: data.end,
      height: data.height,
      thickness: data.thickness,
      color: data.color,
      material: data.material,
    });
    model.wall = { ...data };
    return model;
  }

  // Getters
  getId(): string {
    return this.wall.id;
  }

  getWall(): Wall {
    return this.wall;
  }

  getStart(): Vec2 {
    return [...this.wall.start];
  }

  getEnd(): Vec2 {
    return [...this.wall.end];
  }

  getLength(): number {
    return distance(this.wall.start, this.wall.end);
  }

  getCenter(): Vec2 {
    return [
      (this.wall.start[0] + this.wall.end[0]) / 2,
      (this.wall.start[1] + this.wall.end[1]) / 2,
    ];
  }

  getDirection(): Vec2 {
    return normalizeVector(subtractVectors(this.wall.end, this.wall.start));
  }

  getNormal(): Vec2 {
    return perpendicularVector(this.getDirection());
  }

  getAngle(): number {
    const dx = this.wall.end[0] - this.wall.start[0];
    const dy = this.wall.end[1] - this.wall.start[1];
    return Math.atan2(dy, dx);
  }

  // Setters
  setStart(start: Vec2): void {
    this.wall.start = [...start];
    this.updateConnections();
  }

  setEnd(end: Vec2): void {
    this.wall.end = [...end];
    this.updateConnections();
  }

  setHeight(height: number): void {
    this.wall.height = Math.max(0.1, height);
  }

  setThickness(thickness: number): void {
    this.wall.thickness = Math.max(0.05, thickness);
  }

  setColor(color: string): void {
    this.wall.color = color;
  }

  setMaterial(material: string): void {
    this.wall.material = material;
  }

  // Geometry operations
  move(delta: Vec2): void {
    this.wall.start = addVectors(this.wall.start, delta);
    this.wall.end = addVectors(this.wall.end, delta);
    this.updateConnections();
  }

  moveStart(delta: Vec2): void {
    this.wall.start = addVectors(this.wall.start, delta);
    this.updateConnections();
  }

  moveEnd(delta: Vec2): void {
    this.wall.end = addVectors(this.wall.end, delta);
    this.updateConnections();
  }

  extend(amount: number): void {
    const direction = this.getDirection();
    this.wall.start = subtractVectors(this.wall.start, scaleVector(direction, amount));
    this.wall.end = addVectors(this.wall.end, scaleVector(direction, amount));
    this.updateConnections();
  }

  // Split wall at a point (mantido para compatibilidade, mas o sistema usa WallSplitEngine)
  splitAt(point: Vec2): WallSplitResult | null {
    const projected = this.projectPoint(point);
    if (!projected) return null;

    const t = this.getParameterAtPoint(projected);
    if (t <= 0.01 || t >= 0.99) return null;

    const wall1 = new WallModel({
      start: this.wall.start,
      end: projected,
      height: this.wall.height,
      thickness: this.wall.thickness,
      color: this.wall.color,
      material: this.wall.material,
    });

    const wall2 = new WallModel({
      start: projected,
      end: this.wall.end,
      height: this.wall.height,
      thickness: this.wall.thickness,
      color: this.wall.color,
      material: this.wall.material,
    });

    if (!wall1.wall.connectedWalls) wall1.wall.connectedWalls = { start: [], end: [] };
    if (!wall2.wall.connectedWalls) wall2.wall.connectedWalls = { start: [], end: [] };
    wall1.wall.connectedWalls.start = [...(this.wall.connectedWalls?.start ?? [])];
    wall2.wall.connectedWalls.end = [...(this.wall.connectedWalls?.end ?? [])];

    wall1.wall.connectedWalls.end.push(wall2.getId());
    wall2.wall.connectedWalls.start.push(wall1.getId());

    return {
      original: this.wall,
      segments: [wall1.getWall(), wall2.getWall()],
    };
  }

  // Connection management
  connectAtStart(wallId: string): void {
    if (!this.wall.connectedWalls) this.wall.connectedWalls = { start: [], end: [] };
    if (!this.wall.connectedWalls.start.includes(wallId)) {
      this.wall.connectedWalls.start.push(wallId);
      this.wall.startConnected = true;
    }
  }

  connectAtEnd(wallId: string): void {
    if (!this.wall.connectedWalls) this.wall.connectedWalls = { start: [], end: [] };
    if (!this.wall.connectedWalls.end.includes(wallId)) {
      this.wall.connectedWalls.end.push(wallId);
      this.wall.endConnected = true;
    }
  }

  disconnect(wallId: string): void {
    if (!this.wall.connectedWalls) return;
    this.wall.connectedWalls.start = this.wall.connectedWalls.start.filter(id => id !== wallId);
    this.wall.connectedWalls.end = this.wall.connectedWalls.end.filter(id => id !== wallId);
    
    this.wall.startConnected = this.wall.connectedWalls.start.length > 0;
    this.wall.endConnected = this.wall.connectedWalls.end.length > 0;
  }

  // Room management
  addRoom(roomId: string): void {
    if (!(this.wall.roomIds ?? []).includes(roomId)) {
      (this.wall.roomIds ?? []).push(roomId);
    }
  }

  removeRoom(roomId: string): void {
    this.wall.roomIds = (this.wall.roomIds ?? []).filter(id => id !== roomId);
  }

  // Point operations
  containsPoint(point: Vec2, tolerance: number = 0.1): boolean {
    const projected = this.projectPoint(point);
    if (!projected) return false;
    
    const distanceToLine = distance(point, projected);
    return distanceToLine <= tolerance;
  }

  projectPoint(point: Vec2): Vec2 | null {
    return pointOnLine(point, this.wall.start, this.wall.end);
  }

  getParameterAtPoint(point: Vec2): number {
    const dx = this.wall.end[0] - this.wall.start[0];
    const dy = this.wall.end[1] - this.wall.start[1];
    
    if (Math.abs(dx) > Math.abs(dy)) {
      return (point[0] - this.wall.start[0]) / dx;
    } else {
      return (point[1] - this.wall.start[1]) / dy;
    }
  }

  getPointAtParameter(t: number): Vec2 {
    return [
      this.wall.start[0] + t * (this.wall.end[0] - this.wall.start[0]),
      this.wall.start[1] + t * (this.wall.end[1] - this.wall.start[1]),
    ];
  }

  // Intersection
  intersects(other: Wall): Vec2 | null {
    const result = linesIntersect(
      this.wall.start,
      this.wall.end,
      other.start,
      other.end
    );
    return result ? result.point : null;
  }

  // Visibility
  setVisible(visible: boolean): void {
    this.wall.visible = visible;
  }

  setLocked(locked: boolean): void {
    this.wall.locked = locked;
  }

  // Serialization
  toObject(): Wall {
    return { ...this.wall };
  }

  private updateConnections(): void {
    // Notify connected walls about position change
    // This would be handled by the WallManager
  }
}
