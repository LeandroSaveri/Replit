// ============================================
// SNAP SYSTEM - Sistema de encaixe preciso
// ============================================

import type { Vec2, Wall, Room, Furniture } from '@auriplan-types';
import {
  distance,
  distanceSquared,
  snapVectorToGrid,
  pointOnLine,
  subtractVectors,
  vectorLength,
  normalizeVector,
  scaleVector,
  addVectors,
  angleFromX,
  degToRad,
  radToDeg,
} from '@core/math/vector';

// Tipos de snap
export type SnapType =
  | 'none'
  | 'grid'
  | 'endpoint'
  | 'midpoint'
  | 'intersection'
  | 'edge'
  | 'center'
  | 'perpendicular'
  | 'tangent'
  | 'angle'
  | 'distance';

// Resultado de snap
export interface SnapResult {
  point: Vec2;
  type: SnapType;
  source?: string; // ID do objeto de origem
  distance: number;
  indicator?: {
    position: Vec2;
    type: 'square' | 'triangle' | 'circle' | 'cross' | 'perp' | 'dot' | 'point' | 'line';
    radius?: number;
  };
}

// Configuração de snap
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
    'grid',
    'angle',
    'distance',
  ],
};

// ============================================
// SNAP SYSTEM
// ============================================

export class SnapSystem {
  private config: SnapConfig;
  private walls: Wall[] = [];
  private rooms: Room[] = [];
  private furniture: Furniture[] = [];
  private lastPoint: Vec2 | null = null;

  // Cache de interseções entre paredes
  private cachedIntersections: { point: Vec2; source?: string }[] | null = null;
  private wallsVersion = 0; // simples controle de invalidação

  constructor(config: Partial<SnapConfig> = {}) {
    this.config = { ...DEFAULT_SNAP_CONFIG, ...config };
  }

  // Configuração
  setConfig(config: Partial<SnapConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): SnapConfig {
    return { ...this.config };
  }

  toggleEnabled(): void {
    this.config.enabled = !this.config.enabled;
  }

  // Atualização de objetos
  setWalls(walls: Wall[]): void {
    this.walls = walls;
    this.invalidateIntersectionCache();
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

  // Snap principal – mantém compatibilidade com chamadas existentes
  // (Canvas2D chama snap(worldPos, true) – segundo parâmetro é ignorado)
  snap(point: Vec2, _useSnap?: boolean): SnapResult {
    if (!this.config.enabled) {
      return { point, type: 'none', distance: 0 };
    }

    const candidates: SnapResult[] = [];

    // Grid snap
    if (this.config.priorities.includes('grid')) {
      const gridPoint = snapVectorToGrid(point, this.config.gridSize);
      const gridDist = distance(point, gridPoint);
      if (gridDist < this.config.snapDistance) {
        candidates.push({
          point: gridPoint,
          type: 'grid',
          distance: gridDist,
        });
      }
    }

    // Intersection snap (interseção entre paredes)
    if (this.config.priorities.includes('intersection')) {
      const intersections = this.getAllIntersections();
      for (const inter of intersections) {
        const dist = distance(point, inter.point);
        if (dist < this.config.snapDistance) {
          candidates.push({
            point: inter.point,
            type: 'intersection',
            source: inter.source,
            distance: dist,
          });
        }
      }
    }

    // Endpoint snap
    if (this.config.priorities.includes('endpoint')) {
      const endpoints = this.getAllEndpoints();
      for (const endpoint of endpoints) {
        const dist = distance(point, endpoint.point);
        if (dist < this.config.snapDistance) {
          candidates.push({
            point: endpoint.point,
            type: 'endpoint',
            source: endpoint.id,
            distance: dist,
          });
        }
      }
    }

    // Midpoint snap
    if (this.config.priorities.includes('midpoint')) {
      const midpoints = this.getAllMidpoints();
      for (const midpoint of midpoints) {
        const dist = distance(point, midpoint.point);
        if (dist < this.config.snapDistance) {
          candidates.push({
            point: midpoint.point,
            type: 'midpoint',
            source: midpoint.id,
            distance: dist,
          });
        }
      }
    }

    // Edge snap (projeção sobre a parede)
    if (this.config.priorities.includes('edge')) {
      const edges = this.getAllEdges();
      for (const edge of edges) {
        const projected = pointOnLine(point, edge.start, edge.end);
        if (projected) {
          const dist = distance(point, projected);
          if (dist < this.config.snapDistance) {
            candidates.push({
              point: projected,
              type: 'edge',
              source: edge.id,
              distance: dist,
            });
          }
        }
      }
    }

    // Center snap (centro de cômodos ou móveis)
    if (this.config.priorities.includes('center')) {
      const centers = this.getAllCenters();
      for (const center of centers) {
        const dist = distance(point, center.point);
        if (dist < this.config.snapDistance) {
          candidates.push({
            point: center.point,
            type: 'center',
            source: center.id,
            distance: dist,
          });
        }
      }
    }

    // Perpendicular snap (projeção a partir do último ponto)
    if (this.config.priorities.includes('perpendicular') && this.lastPoint) {
      const perpPoints = this.getPerpendicularPoints(this.lastPoint);
      for (const perp of perpPoints) {
        const dist = distance(point, perp.point);
        if (dist < this.config.snapDistance) {
          candidates.push({
            point: perp.point,
            type: 'perpendicular',
            source: perp.id,
            distance: dist,
          });
        }
      }
    }

    // Angle snap (alinhamento a ângulos fixos)
    if (this.config.priorities.includes('angle') && this.lastPoint) {
      const angleSnapped = this.snapToAngle(point, this.lastPoint);
      if (angleSnapped && angleSnapped.distance < this.config.snapDistance) {
        candidates.push(angleSnapped);
      }
    }

    // Seleciona o melhor candidato
    if (candidates.length === 0) {
      return { point, type: 'none', distance: 0 };
    }

    // Ordena por prioridade e, em caso de empate, pela menor distância
    candidates.sort((a, b) => {
      const priorityA = this.config.priorities.indexOf(a.type);
      const priorityB = this.config.priorities.indexOf(b.type);
      
      // Se um dos tipos não estiver na lista, atribui prioridade alta (índice grande)
      const priA = priorityA === -1 ? 999 : priorityA;
      const priB = priorityB === -1 ? 999 : priorityB;
      
      if (priA !== priB) {
        return priA - priB;
      }
      
      return a.distance - b.distance;
    });

    return candidates[0];
  }

  // Snap para ângulos específicos (a partir do centro)
  private snapToAngle(point: Vec2, center: Vec2): SnapResult | null {
    const vector = subtractVectors(point, center);
    const currentAngle = angleFromX(vector);
    const length = vectorLength(vector);
    
    // Converte para graus
    let degrees = radToDeg(currentAngle);
    if (degrees < 0) degrees += 360;
    
    // Encontra o ângulo mais próximo
    const snapAngle = Math.round(degrees / this.config.angleSnap) * this.config.angleSnap;
    const angleDiff = Math.abs(degrees - snapAngle);
    
    if (angleDiff < 5) { // Tolerância de 5 graus
      const snappedAngle = degToRad(snapAngle);
      const snappedPoint: Vec2 = [
        center[0] + Math.cos(snappedAngle) * length,
        center[1] + Math.sin(snappedAngle) * length,
      ];
      
      return {
        point: snappedPoint,
        type: 'angle',
        distance: distance(point, snappedPoint),
      };
    }
    
    return null;
  }

  // Snap para distâncias específicas (método auxiliar público)
  snapToDistance(point: Vec2, startPoint: Vec2, distances: number[]): SnapResult | null {
    const vector = subtractVectors(point, startPoint);
    const currentDistance = vectorLength(vector);
    const direction = normalizeVector(vector);
    
    let bestSnap: SnapResult | null = null;
    let bestDiff = Infinity;
    
    for (const targetDistance of distances) {
      const diff = Math.abs(currentDistance - targetDistance);
      if (diff < this.config.distanceSnap && diff < bestDiff) {
        bestDiff = diff;
        const snappedPoint = addVectors(startPoint, scaleVector(direction, targetDistance));
        bestSnap = {
          point: snappedPoint,
          type: 'distance',
          distance: diff,
        };
      }
    }
    
    return bestSnap;
  }

  // Helpers
  private getAllEndpoints(): { point: Vec2; id: string }[] {
    const endpoints: { point: Vec2; id: string }[] = [];
    
    for (const wall of this.walls) {
      endpoints.push({ point: wall.start, id: wall.id });
      endpoints.push({ point: wall.end, id: wall.id });
    }
    
    return endpoints;
  }

  private getAllMidpoints(): { point: Vec2; id: string }[] {
    const midpoints: { point: Vec2; id: string }[] = [];
    
    for (const wall of this.walls) {
      midpoints.push({
        point: [(wall.start[0] + wall.end[0]) / 2, (wall.start[1] + wall.end[1]) / 2],
        id: wall.id,
      });
    }
    
    return midpoints;
  }

  private getAllEdges(): { start: Vec2; end: Vec2; id: string }[] {
    const edges: { start: Vec2; end: Vec2; id: string }[] = [];
    
    for (const wall of this.walls) {
      edges.push({ start: wall.start, end: wall.end, id: wall.id });
    }
    
    return edges;
  }

  private getAllCenters(): { point: Vec2; id: string }[] {
    const centers: { point: Vec2; id: string }[] = [];
    
    for (const room of this.rooms) {
      if (room.points.length > 0) {
        const sum = room.points.reduce(
          (acc, p) => [acc[0] + p[0], acc[1] + p[1]],
          [0, 0]
        );
        centers.push({
          point: [sum[0] / room.points.length, sum[1] / room.points.length],
          id: room.id,
        });
      }
    }
    
    for (const furniture of this.furniture) {
      // furniture.position pode ser um vetor 3D, usamos [x, z] como plano 2D
      centers.push({
        point: (Array.isArray(furniture.position) ? [furniture.position[0], furniture.position[2]] : [(furniture.position as any).x ?? 0, (furniture.position as any).z ?? 0]) as Vec2,
        id: furniture.id,
      });
    }
    
    return centers;
  }

  private getPerpendicularPoints(fromPoint: Vec2): { point: Vec2; id: string }[] {
    const points: { point: Vec2; id: string }[] = [];
    
    for (const wall of this.walls) {
      const projected = pointOnLine(fromPoint, wall.start, wall.end);
      if (projected) {
        points.push({ point: projected, id: wall.id });
      }
    }
    
    return points;
  }

  // --- Intersection cache ---
  private invalidateIntersectionCache(): void {
    this.cachedIntersections = null;
    this.wallsVersion++;
  }

  private getAllIntersections(): { point: Vec2; source?: string }[] {
    // Se houver cache e as paredes não mudaram, usa cache
    if (this.cachedIntersections !== null) {
      return this.cachedIntersections;
    }

    const intersections: { point: Vec2; source?: string }[] = [];
    const n = this.walls.length;
    const toleranceSq = 1e-12; // tolerância quadrática (1e-6^2)

    for (let i = 0; i < n; i++) {
      const wallA = this.walls[i];
      for (let j = i + 1; j < n; j++) {
        const wallB = this.walls[j];
        const intersection = this.segmentIntersection(
          wallA.start, wallA.end,
          wallB.start, wallB.end
        );
        if (intersection) {
          // Evita duplicatas muito próximas usando comparação quadrática
          let duplicate = false;
          for (const existing of intersections) {
            if (distanceSquared(existing.point, intersection) < toleranceSq) {
              duplicate = true;
              break;
            }
          }
          if (!duplicate) {
            intersections.push({
              point: intersection,
              source: `${wallA.id},${wallB.id}`,
            });
          }
        }
      }
    }

    this.cachedIntersections = intersections;
    return intersections;
  }

  // Retorna o ponto de interseção entre dois segmentos, ou null se não houver
  private segmentIntersection(
    a1: Vec2, a2: Vec2,
    b1: Vec2, b2: Vec2
  ): Vec2 | null {
    const dx1 = a2[0] - a1[0];
    const dy1 = a2[1] - a1[1];
    const dx2 = b2[0] - b1[0];
    const dy2 = b2[1] - b1[1];
    const denom = dx1 * dy2 - dy1 * dx2;

    if (Math.abs(denom) < 1e-9) return null; // paralelas

    const t = ((b1[0] - a1[0]) * dy2 - (b1[1] - a1[1]) * dx2) / denom;
    const u = ((b1[0] - a1[0]) * dy1 - (b1[1] - a1[1]) * dx1) / denom;

    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
      return [
        a1[0] + t * dx1,
        a1[1] + t * dy1,
      ];
    }

    return null;
  }

  // Visualização de snap
  getSnapIndicator(result: SnapResult): { position: Vec2; type: string; radius: number } | null {
    switch (result.type) {
      case 'endpoint':
        return { position: result.point, type: 'square', radius: 0.15 };
      case 'midpoint':
        return { position: result.point, type: 'triangle', radius: 0.15 };
      case 'center':
        return { position: result.point, type: 'circle', radius: 0.2 };
      case 'intersection':
        return { position: result.point, type: 'cross', radius: 0.2 };
      case 'perpendicular':
        return { position: result.point, type: 'perp', radius: 0.15 };
      case 'grid':
        return { position: result.point, type: 'dot', radius: 0.1 };
      default:
        return null;
    }
  }
}

// Snap Manager - Gerencia múltiplos contextos de snap
export class SnapManager {
  private systems: Map<string, SnapSystem> = new Map();
  private activeSystem: string = 'default';

  createSystem(id: string, config?: Partial<SnapConfig>): SnapSystem {
    const system = new SnapSystem(config);
    this.systems.set(id, system);
    return system;
  }

  getSystem(id: string): SnapSystem | undefined {
    return this.systems.get(id);
  }

  setActiveSystem(id: string): boolean {
    if (this.systems.has(id)) {
      this.activeSystem = id;
      return true;
    }
    return false;
  }

  getActiveSystem(): SnapSystem {
    let system = this.systems.get(this.activeSystem);
    if (!system) {
      system = new SnapSystem();
      this.systems.set('default', system);
    }
    return system;
  }

  snap(point: Vec2): SnapResult {
    return this.getActiveSystem().snap(point);
  }
}
