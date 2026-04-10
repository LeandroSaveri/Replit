// ============================================
// Collision Engine - Object collision detection
// ============================================

import type { Vec2, Vec3, Wall, Room, Furniture, Bounds2D, Bounds3D } from '@auriplan-types';
import { vec2, vec3, geometry } from '@core/math/vector';

export interface CollisionResult {
  colliding: boolean;
  penetration: Vec2;
  normal: Vec2;
  objects: string[];
}

export interface CollisionConfig {
  enabled: boolean;
  wallCollision: boolean;
  furnitureCollision: boolean;
  roomBounds: boolean;
  tolerance: number;
}

export const DEFAULT_COLLISION_CONFIG: CollisionConfig = {
  enabled: true,
  wallCollision: true,
  furnitureCollision: true,
  roomBounds: true,
  tolerance: 0.01,
};

export class CollisionEngine {
  private config: CollisionConfig;
  private walls: Wall[] = [];
  private rooms: Room[] = [];
  private furniture: Furniture[] = [];

  constructor(config: Partial<CollisionConfig> = {}) {
    this.config = { ...DEFAULT_COLLISION_CONFIG, ...config };
  }

  // Configuration
  setConfig(config: Partial<CollisionConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): CollisionConfig {
    return { ...this.config };
  }

  // Data sources
  setWalls(walls: Wall[]): void {
    this.walls = walls;
  }

  setRooms(rooms: Room[]): void {
    this.rooms = rooms;
  }

  setFurniture(furniture: Furniture[]): void {
    this.furniture = furniture;
  }

  // Check point collision with walls
  checkPointWallCollision(point: Vec2, excludeWallId?: string): CollisionResult {
    if (!this.config.enabled || !this.config.wallCollision) {
      return { colliding: false, penetration: [0, 0], normal: [0, 0], objects: [] };
    }

    for (const wall of this.walls) {
      if (wall.id === excludeWallId) continue;

      const distance = geometry.distanceToLine(point, wall.start, wall.end);
      
      if (distance < wall.thickness / 2 + this.config.tolerance) {
        const projected = geometry.projectPointOnLine(point, wall.start, wall.end);
        const wallDir = vec2.normalize(vec2.sub(wall.end, wall.start));
        const normal = vec2.perpendicular(wallDir);
        
        const penetration: Vec2 = [
          normal[0] * (wall.thickness / 2 + this.config.tolerance - distance),
          normal[1] * (wall.thickness / 2 + this.config.tolerance - distance),
        ];

        return {
          colliding: true,
          penetration,
          normal,
          objects: [wall.id],
        };
      }
    }

    return { colliding: false, penetration: [0, 0], normal: [0, 0], objects: [] };
  }

  // Check furniture collision with walls
  checkFurnitureWallCollision(furniture: Furniture): CollisionResult {
    if (!this.config.enabled || !this.config.wallCollision) {
      return { colliding: false, penetration: [0, 0], normal: [0, 0], objects: [] };
    }

    const furnitureBounds = this.getFurnitureBounds2D(furniture);
    const corners = this.getBoundsCorners(furnitureBounds);

    for (const wall of this.walls) {
      for (const corner of corners) {
        const distance = geometry.distanceToLine(corner, wall.start, wall.end);
        
        if (distance < this.config.tolerance) {
          const projected = geometry.projectPointOnLine(corner, wall.start, wall.end);
          const wallDir = vec2.normalize(vec2.sub(wall.end, wall.start));
          const normal = vec2.perpendicular(wallDir);
          
          return {
            colliding: true,
            penetration: vec2.mul(normal, this.config.tolerance - distance),
            normal,
            objects: [wall.id, furniture.id],
          };
        }
      }
    }

    return { colliding: false, penetration: [0, 0], normal: [0, 0], objects: [] };
  }

  // Check furniture-furniture collision
  checkFurnitureFurnitureCollision(
    furniture1: Furniture,
    excludeId?: string
  ): CollisionResult {
    if (!this.config.enabled || !this.config.furnitureCollision) {
      return { colliding: false, penetration: [0, 0], normal: [0, 0], objects: [] };
    }

    const bounds1 = this.getFurnitureBounds2D(furniture1);

    for (const furniture2 of this.furniture) {
      if (furniture2.id === furniture1.id) continue;
      if (furniture2.id === excludeId) continue;

      const bounds2 = this.getFurnitureBounds2D(furniture2);

      if (this.boundsIntersect(bounds1, bounds2)) {
        const center1: Vec2 = [
          (bounds1.minX + bounds1.maxX) / 2,
          (bounds1.minY + bounds1.maxY) / 2,
        ];
        const center2: Vec2 = [
          (bounds2.minX + bounds2.maxX) / 2,
          (bounds2.minY + bounds2.maxY) / 2,
        ];

        const normal = vec2.normalize(vec2.sub(center1, center2));
        const overlapX = Math.min(bounds1.maxX - bounds2.minX, bounds2.maxX - bounds1.minX);
        const overlapY = Math.min(bounds1.maxY - bounds2.minY, bounds2.maxY - bounds1.minY);
        
        const penetration: Vec2 = overlapX < overlapY
          ? [overlapX * normal[0], 0]
          : [0, overlapY * normal[1]];

        return {
          colliding: true,
          penetration,
          normal,
          objects: [furniture1.id, furniture2.id],
        };
      }
    }

    return { colliding: false, penetration: [0, 0], normal: [0, 0], objects: [] };
  }

  // Check if furniture is inside room
  checkFurnitureInRoom(furniture: Furniture): CollisionResult {
    if (!this.config.enabled || !this.config.roomBounds) {
      return { colliding: false, penetration: [0, 0], normal: [0, 0], objects: [] };
    }

    const pos = furniture.position;
    const posX = Array.isArray(pos) ? pos[0] : (pos as {x:number;y:number;z:number}).x;
    const posZ = Array.isArray(pos) ? pos[2] : (pos as {x:number;y:number;z:number}).z;
    const center: Vec2 = [posX, posZ];

    for (const room of this.rooms) {
      if (geometry.pointInPolygon(center, room.points)) {
        return { colliding: false, penetration: [0, 0], normal: [0, 0], objects: [] };
      }
    }

    // Not in any room - find nearest room
    let nearestRoom: Room | null = null;
    let minDistance = Infinity;

    for (const room of this.rooms) {
      const centroid = geometry.polygonCentroid(room.points);
      const distance = vec2.distance(center, centroid);
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestRoom = room;
      }
    }

    if (nearestRoom) {
      const centroid = geometry.polygonCentroid(nearestRoom.points);
      const normal = vec2.normalize(vec2.sub(centroid, center));
      
      return {
        colliding: true,
        penetration: vec2.mul(normal, minDistance),
        normal,
        objects: [furniture.id, nearestRoom.id],
      };
    }

    return { colliding: false, penetration: [0, 0], normal: [0, 0], objects: [] };
  }

  // Resolve collision by moving object
  resolveCollision(
    position: Vec2,
    collision: CollisionResult
  ): Vec2 {
    if (!collision.colliding) return position;

    return vec2.add(position, collision.penetration);
  }

  // Check all collisions for a furniture item
  checkAllFurnitureCollisions(
    furniture: Furniture,
    excludeId?: string
  ): CollisionResult[] {
    const collisions: CollisionResult[] = [];

    const wallCollision = this.checkFurnitureWallCollision(furniture);
    if (wallCollision.colliding) collisions.push(wallCollision);

    const furnitureCollision = this.checkFurnitureFurnitureCollision(furniture, excludeId);
    if (furnitureCollision.colliding) collisions.push(furnitureCollision);

    const roomCollision = this.checkFurnitureInRoom(furniture);
    if (roomCollision.colliding) collisions.push(roomCollision);

    return collisions;
  }

  // Get furniture 2D bounds
  private getFurnitureBounds2D(furniture: Furniture): Bounds2D {
    const pos = furniture.position;
    const rot = furniture.rotation;
    const sc = furniture.scale ?? [1, 1, 1];
    const posX = Array.isArray(pos) ? pos[0] : (pos as {x:number;y:number;z:number}).x;
    const posZ = Array.isArray(pos) ? pos[2] : (pos as {x:number;y:number;z:number}).z;
    const rotY = typeof rot === 'number' ? rot
      : Array.isArray(rot) ? rot[1]
      : (rot as {x:number;y:number;z:number}).y;
    const dim = furniture.dimensions ?? { width: 1, depth: 1, height: 1 };
    const halfWidth = (dim.width * sc[0]) / 2;
    const halfDepth = (dim.depth * sc[2]) / 2;

    const cos = Math.cos(rotY);
    const sin = Math.sin(rotY);

    // Rotate half dimensions
    const rx = Math.abs(halfWidth * cos) + Math.abs(halfDepth * sin);
    const ry = Math.abs(halfWidth * sin) + Math.abs(halfDepth * cos);

    return {
      minX: posX - rx,
      minY: posZ - ry,
      maxX: posX + rx,
      maxY: posZ + ry,
      width: 2 * rx,
      height: 2 * ry,
    };
  }

  // Get bounds corners
  private getBoundsCorners(bounds: Bounds2D): Vec2[] {
    return [
      [bounds.minX, bounds.minY],
      [bounds.maxX, bounds.minY],
      [bounds.maxX, bounds.maxY],
      [bounds.minX, bounds.maxY],
    ];
  }

  // Check if bounds intersect
  private boundsIntersect(a: Bounds2D, b: Bounds2D): boolean {
    return (
      a.minX < b.maxX &&
      a.maxX > b.minX &&
      a.minY < b.maxY &&
      a.maxY > b.minY
    );
  }

  // Clear all data
  clear(): void {
    this.walls = [];
    this.rooms = [];
    this.furniture = [];
  }
}
