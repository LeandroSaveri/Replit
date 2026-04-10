// ============================================
// Snap Engine - Precise snapping system for CAD
// ============================================

import type { Vec2, Wall, Room, Furniture, SnapState } from '@auriplan-types';
import { vec2, geometry, numeric } from '@core/math/vector';

export type SnapType =
  | 'none'
  | 'grid'
  | 'endpoint'
  | 'midpoint'
  | 'intersection'
  | 'edge'
  | 'center'
  | 'perpendicular'
  | 'angle'
  | 'distance';

export interface SnapResult {
  point: Vec2;
  originalPoint: Vec2;
  type: SnapType;
  sourceId?: string;
  distance: number;
  indicator?: SnapIndicator;
}

export interface SnapIndicator {
  type: 'point' | 'line' | 'circle' | 'cross';
  position: Vec2;
  radius?: number;
  lineStart?: Vec2;
  lineEnd?: Vec2;
}

export interface SnapConfig {
  enabled: boolean;
  gridSize: number;
  snapDistance: number;
  angleSnap: number;
  distanceSnap: number;
  priorities: SnapType[];
}

export const DEFAULT_SNAP_CONFIG: SnapConfig = {
  enabled: true,
  gridSize: 0.5,
  snapDistance: 0.3,
  angleSnap: 15,
  distanceSnap: 0.5,
  priorities: [
    'intersection',
    'endpoint',
    'midpoint',
    'center',
    'perpendicular',
    'edge',
    'angle',
    'grid',
  ],
};

export class SnapEngine {
  private config: SnapConfig;
  private walls: Wall[] = [];
  private rooms: Room[] = [];
  private furniture: Furniture[] = [];
  private lastPoint: Vec2 | null = null;
  private referencePoint: Vec2 | null = null;

  constructor(config: Partial<SnapConfig> = {}) {
    this.config = { ...DEFAULT_SNAP_CONFIG, ...config };
  }

  // Configuration
  setConfig(config: Partial<SnapConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): SnapConfig {
    return { ...this.config };
  }

  toggleEnabled(): boolean {
    this.config.enabled = !this.config.enabled;
    return this.config.enabled;
  }

  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
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

  setLastPoint(point: Vec2 | null): void {
    this.lastPoint = point;
  }

  setReferencePoint(point: Vec2 | null): void {
    this.referencePoint = point;
  }

  // Main snap function
  snap(point: Vec2): SnapResult {
    if (!this.config.enabled) {
      return {
        point,
        originalPoint: point,
        type: 'none',
        distance: 0,
      };
    }

    const candidates: SnapResult[] = [];

    // Grid snap
    if (this.config.priorities.includes('grid')) {
      const gridResult = this.snapToGrid(point);
      if (gridResult) candidates.push(gridResult);
    }

    // Endpoint snap
    if (this.config.priorities.includes('endpoint')) {
      const endpointResult = this.snapToEndpoint(point);
      if (endpointResult) candidates.push(endpointResult);
    }

    // Midpoint snap
    if (this.config.priorities.includes('midpoint')) {
      const midpointResult = this.snapToMidpoint(point);
      if (midpointResult) candidates.push(midpointResult);
    }

    // Edge snap
    if (this.config.priorities.includes('edge')) {
      const edgeResult = this.snapToEdge(point);
      if (edgeResult) candidates.push(edgeResult);
    }

    // Center snap
    if (this.config.priorities.includes('center')) {
      const centerResult = this.snapToCenter(point);
      if (centerResult) candidates.push(centerResult);
    }

    // Perpendicular snap
    if (this.config.priorities.includes('perpendicular') && this.lastPoint) {
      const perpResult = this.snapToPerpendicular(point);
      if (perpResult) candidates.push(perpResult);
    }

    // Angle snap
    if (this.config.priorities.includes('angle') && this.referencePoint) {
      const angleResult = this.snapToAngle(point);
      if (angleResult) candidates.push(angleResult);
    }

    // Intersection snap
    if (this.config.priorities.includes('intersection')) {
      const intersectionResult = this.snapToIntersection(point);
      if (intersectionResult) candidates.push(intersectionResult);
    }

    // No candidates found
    if (candidates.length === 0) {
      return {
        point,
        originalPoint: point,
        type: 'none',
        distance: 0,
      };
    }

    // Sort by priority and distance
    candidates.sort((a, b) => {
      const priorityA = this.config.priorities.indexOf(a.type);
      const priorityB = this.config.priorities.indexOf(b.type);
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      return a.distance - b.distance;
    });

    return candidates[0];
  }

  // Snap to grid
  private snapToGrid(point: Vec2): SnapResult | null {
    const snappedPoint: Vec2 = [
      numeric.snapToGrid(point[0], this.config.gridSize),
      numeric.snapToGrid(point[1], this.config.gridSize),
    ];

    const distance = vec2.distance(point, snappedPoint);

    if (distance < this.config.snapDistance) {
      return {
        point: snappedPoint,
        originalPoint: point,
        type: 'grid',
        distance,
        indicator: {
          type: 'point',
          position: snappedPoint,
          radius: 0.1,
        },
      };
    }

    return null;
  }

  // Snap to wall endpoints
  private snapToEndpoint(point: Vec2): SnapResult | null {
    let bestResult: SnapResult | null = null;
    let bestDistance = this.config.snapDistance;

    for (const wall of this.walls) {
      const endpoints: { point: Vec2; id: string }[] = [
        { point: wall.start, id: wall.id },
        { point: wall.end, id: wall.id },
      ];

      for (const endpoint of endpoints) {
        const distance = vec2.distance(point, endpoint.point);

        if (distance < bestDistance) {
          bestDistance = distance;
          bestResult = {
            point: endpoint.point,
            originalPoint: point,
            type: 'endpoint',
            sourceId: endpoint.id,
            distance,
            indicator: {
              type: 'circle',
              position: endpoint.point,
              radius: 0.15,
            },
          };
        }
      }
    }

    return bestResult;
  }

  // Snap to wall midpoints
  private snapToMidpoint(point: Vec2): SnapResult | null {
    let bestResult: SnapResult | null = null;
    let bestDistance = this.config.snapDistance;

    for (const wall of this.walls) {
      const midpoint = vec2.midpoint(wall.start, wall.end);
      const distance = vec2.distance(point, midpoint);

      if (distance < bestDistance) {
        bestDistance = distance;
        bestResult = {
          point: midpoint,
          originalPoint: point,
          type: 'midpoint',
          sourceId: wall.id,
          distance,
          indicator: {
            type: 'point',
            position: midpoint,
            radius: 0.15,
          },
        };
      }
    }

    return bestResult;
  }

  // Snap to wall edges
  private snapToEdge(point: Vec2): SnapResult | null {
    let bestResult: SnapResult | null = null;
    let bestDistance = this.config.snapDistance;

    for (const wall of this.walls) {
      const projected = geometry.projectPointOnLine(point, wall.start, wall.end);
      const distance = vec2.distance(point, projected);

      if (distance < bestDistance) {
        bestDistance = distance;
        bestResult = {
          point: projected,
          originalPoint: point,
          type: 'edge',
          sourceId: wall.id,
          distance,
          indicator: {
            type: 'line',
            position: projected,
            lineStart: wall.start,
            lineEnd: wall.end,
          },
        };
      }
    }

    return bestResult;
  }

  // Snap to room/furniture centers
  private snapToCenter(point: Vec2): SnapResult | null {
    let bestResult: SnapResult | null = null;
    let bestDistance = this.config.snapDistance;

    // Room centers
    for (const room of this.rooms) {
      if (room.points.length === 0) continue;
      
      const center = geometry.polygonCentroid(room.points);
      const distance = vec2.distance(point, center);

      if (distance < bestDistance) {
        bestDistance = distance;
        bestResult = {
          point: center,
          originalPoint: point,
          type: 'center',
          sourceId: room.id,
          distance,
          indicator: {
            type: 'circle',
            position: center,
            radius: 0.2,
          },
        };
      }
    }

    // Furniture centers
    for (const item of this.furniture) {
      const _p = item.position;
      const center: Vec2 = Array.isArray(_p) ? [_p[0], _p[2]] : [(_p as any).x ?? 0, (_p as any).z ?? 0];
      const distance = vec2.distance(point, center);

      if (distance < bestDistance) {
        bestDistance = distance;
        bestResult = {
          point: center,
          originalPoint: point,
          type: 'center',
          sourceId: item.id,
          distance,
          indicator: {
            type: 'circle',
            position: center,
            radius: 0.2,
          },
        };
      }
    }

    return bestResult;
  }

  // Snap perpendicular to walls
  private snapToPerpendicular(point: Vec2): SnapResult | null {
    if (!this.lastPoint) return null;

    let bestResult: SnapResult | null = null;
    let bestDistance = this.config.snapDistance;

    for (const wall of this.walls) {
      const projected = geometry.projectPointOnLine(this.lastPoint, wall.start, wall.end);
      const distance = vec2.distance(point, projected);

      if (distance < bestDistance) {
        bestDistance = distance;
        bestResult = {
          point: projected,
          originalPoint: point,
          type: 'perpendicular',
          sourceId: wall.id,
          distance,
          indicator: {
            type: 'cross',
            position: projected,
            radius: 0.15,
          },
        };
      }
    }

    return bestResult;
  }

  // Snap to angle increments
  private snapToAngle(point: Vec2): SnapResult | null {
    if (!this.referencePoint) return null;

    const vector = vec2.sub(point, this.referencePoint);
    const currentAngle = vec2.angle(vector);
    const length = vec2.length(vector);

    const snapAngleRad = numeric.degToRad(this.config.angleSnap);
    const snappedAngle = Math.round(currentAngle / snapAngleRad) * snapAngleRad;
    const angleDiff = Math.abs(currentAngle - snappedAngle);

    if (angleDiff < numeric.degToRad(5)) {
      const snappedPoint: Vec2 = [
        this.referencePoint[0] + Math.cos(snappedAngle) * length,
        this.referencePoint[1] + Math.sin(snappedAngle) * length,
      ];

      return {
        point: snappedPoint,
        originalPoint: point,
        type: 'angle',
        distance: vec2.distance(point, snappedPoint),
        indicator: {
          type: 'line',
          position: snappedPoint,
          lineStart: this.referencePoint,
          lineEnd: snappedPoint,
        },
      };
    }

    return null;
  }

  // Snap to line intersections
  private snapToIntersection(point: Vec2): SnapResult | null {
    let bestResult: SnapResult | null = null;
    let bestDistance = this.config.snapDistance;

    for (let i = 0; i < this.walls.length; i++) {
      for (let j = i + 1; j < this.walls.length; j++) {
        const intersection = geometry.lineIntersection(
          this.walls[i].start,
          this.walls[i].end,
          this.walls[j].start,
          this.walls[j].end
        );

        if (intersection) {
          const distance = vec2.distance(point, intersection);

          if (distance < bestDistance) {
            bestDistance = distance;
            bestResult = {
              point: intersection,
              originalPoint: point,
              type: 'intersection',
              distance,
              indicator: {
                type: 'cross',
                position: intersection,
                radius: 0.2,
              },
            };
          }
        }
      }
    }

    return bestResult;
  }

  // Snap to specific distances from reference
  snapToDistance(point: Vec2, distances: number[]): SnapResult | null {
    if (!this.referencePoint) return null;

    const vector = vec2.sub(point, this.referencePoint);
    const currentDistance = vec2.length(vector);
    const direction = vec2.normalize(vector);

    let bestResult: SnapResult | null = null;
    let bestDiff = Infinity;

    for (const targetDistance of distances) {
      const diff = Math.abs(currentDistance - targetDistance);
      
      if (diff < this.config.distanceSnap && diff < bestDiff) {
        bestDiff = diff;
        const snappedPoint = vec2.add(
          this.referencePoint,
          vec2.mul(direction, targetDistance)
        );
        
        bestResult = {
          point: snappedPoint,
          originalPoint: point,
          type: 'distance',
          distance: diff,
          indicator: {
            type: 'circle',
            position: snappedPoint,
            radius: 0.15,
          },
        };
      }
    }

    return bestResult;
  }

  // Clear all data
  clear(): void {
    this.walls = [];
    this.rooms = [];
    this.furniture = [];
    this.lastPoint = null;
    this.referencePoint = null;
  }
}

// Singleton instance
let globalSnapEngine: SnapEngine | null = null;

export function getSnapEngine(): SnapEngine {
  if (!globalSnapEngine) {
    globalSnapEngine = new SnapEngine();
  }
  return globalSnapEngine;
}

export function createSnapEngine(config?: Partial<SnapConfig>): SnapEngine {
  return new SnapEngine(config);
}
