// src/core/snap/SnapSolver.ts
// Snap Solver Profissional - Nível Magicplan+ / CAD Enterprise
// Sistema de snapping geométrico com cache de bounds via WeakMap (imutável)

import type { Wall, Vec2 } from '@auriplan-types';
import { SNAP_TOL, NODE_TOL, EPS } from '@core/geometry/geometryConstants';

// ============================================
// TIPOS E ENUMERAÇÕES
// ============================================

export type SnapType = 
  | 'vertex' 
  | 'intersection' 
  | 'midpoint' 
  | 'wall' 
  | 'angle' 
  | 'grid';

export interface SnapResult {
  point: Vec2;
  type: SnapType | null;
  sourceWall?: Wall;
  priority: number;
  distance: number;
}

export interface SnapOptions {
  snapTol?: number;
  nodeTol?: number;
  eps?: number;
  gridSize?: number;
  zoom?: number;
  enableVertex?: boolean;
  enableIntersection?: boolean;
  enableMidpoint?: boolean;
  enableWall?: boolean;
  enableAngle?: boolean;
  enableGrid?: boolean;
}

// ============================================
// CONSTANTES DE CONFIGURAÇÃO
// ============================================

const ANGLE_SNAP_STEPS = Math.PI / 4; // 45° em radianos
const MIN_DISTANCE_FOR_ANGLE_SNAP = 1e-4;

// Prioridades hierárquicas (menor número = maior prioridade)
const SNAP_PRIORITIES: Record<SnapType, number> = {
  vertex: 1,
  intersection: 2,
  midpoint: 3,
  wall: 4,
  angle: 5,
  grid: 6,
};

// Cores para indicadores visuais
export const SNAP_COLORS: Record<SnapType, string> = {
  vertex: '#22c55e',
  intersection: '#eab308',
  midpoint: '#3b82f6',
  wall: '#6b7280',
  angle: '#a855f7',
  grid: '#9ca3af',
};

// ============================================
// CACHE DE BOUNDS VIA WEAKMAP (IMUTÁVEL)
// ============================================

export interface WallBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/**
 * Cache global de bounds usando WeakMap.
 * Permite associar dados a objetos Wall SEM modificá-los.
 * Compatível com Zustand/Immer - objetos permanecem imutáveis.
 */
const wallBoundsCache = new WeakMap<Wall, WallBounds>();

/**
 * Calcula bounds de uma parede.
 */
function computeWallBounds(wall: Wall): WallBounds {
  return {
    minX: Math.min(wall.start[0], wall.end[0]),
    maxX: Math.max(wall.start[0], wall.end[0]),
    minY: Math.min(wall.start[1], wall.end[1]),
    maxY: Math.max(wall.start[1], wall.end[1]),
  };
}

/**
 * Garante que a parede tenha bounds calculados.
 * Usa WeakMap para cache - NÃO modifica o objeto Wall.
 */
function ensureBounds(wall: Wall): WallBounds {
  let bounds = wallBoundsCache.get(wall);

  if (!bounds) {
    bounds = computeWallBounds(wall);
    wallBoundsCache.set(wall, bounds);
  }

  return bounds;
}

/**
 * Limpa o cache de bounds (útil quando paredes são modificadas).
 */
export function clearBoundsCache(): void {
  // WeakMap limpa automaticamente quando objetos são garbage collected
}

// ============================================
// FUNÇÕES GEOMÉTRICAS BASE
// ============================================

function distance(a: Vec2, b: Vec2): number {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return Math.hypot(dx, dy);
}

function distanceSq(a: Vec2, b: Vec2): number {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return dx * dx + dy * dy;
}

function midpoint(a: Vec2, b: Vec2): Vec2 {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}

function projectPointOnLine(p: Vec2, a: Vec2, b: Vec2): Vec2 {
  const abx = b[0] - a[0];
  const aby = b[1] - a[1];
  const apx = p[0] - a[0];
  const apy = p[1] - a[1];

  const len2 = abx * abx + aby * aby;
  if (len2 < EPS) return a;

  const t = (apx * abx + apy * aby) / len2;
  return [a[0] + t * abx, a[1] + t * aby];
}

function isPointOnSegment(p: Vec2, a: Vec2, b: Vec2, tol: number = EPS): boolean {
  const abx = b[0] - a[0];
  const aby = b[1] - a[1];
  const apx = p[0] - a[0];
  const apy = p[1] - a[1];

  const cross = abx * apy - aby * apx;
  if (Math.abs(cross) > tol) return false;

  const dot = apx * abx + apy * aby;
  if (dot < -tol) return false;

  const len2 = abx * abx + aby * aby;
  if (dot > len2 + tol) return false;

  return true;
}

function segmentIntersection(a1: Vec2, a2: Vec2, b1: Vec2, b2: Vec2): Vec2 | null {
  const dax = a2[0] - a1[0];
  const day = a2[1] - a1[1];
  const dbx = b2[0] - b1[0];
  const dby = b2[1] - b1[1];

  const denom = dax * dby - day * dbx;
  if (Math.abs(denom) < EPS) return null;

  const s = ((a1[1] - b1[1]) * dbx - (a1[0] - b1[0]) * dby) / denom;
  const t = ((a1[1] - b1[1]) * dax - (a1[0] - b1[0]) * day) / denom;

  if (s < -EPS || s > 1 + EPS || t < -EPS || t > 1 + EPS) return null;

  return [a1[0] + s * dax, a1[1] + s * day];
}

function snapToGrid(point: Vec2, gridSize: number): Vec2 {
  return [
    Math.round(point[0] / gridSize) * gridSize,
    Math.round(point[1] / gridSize) * gridSize,
  ];
}

// ============================================
// SPATIAL FILTERING
// ============================================

/**
 * Verifica se bounds da parede intersectam com área de busca.
 * Usa WeakMap cache - NÃO modifica o objeto Wall.
 */
function boundsIntersect(wall: Wall, cx: number, cy: number, radius: number): boolean {
  const b = ensureBounds(wall);
  return (
    b.maxX >= cx - radius &&
    b.minX <= cx + radius &&
    b.maxY >= cy - radius &&
    b.minY <= cy + radius
  );
}

function filterNearbyWalls(walls: Wall[], cursor: Vec2, tolerance: number): Wall[] {
  const cx = cursor[0];
  const cy = cursor[1];
  const radius = tolerance * 2;

  return walls.filter(w => boundsIntersect(w, cx, cy, radius));
}

// ============================================
// COLETORES DE CANDIDATOS
// ============================================

function collectVertexSnaps(cursor: Vec2, walls: Wall[], tolSq: number): SnapResult[] {
  const snaps: SnapResult[] = [];
  const seen = new Set<string>();

  for (const wall of walls) {
    for (const point of [wall.start, wall.end]) {
      const key = `${Math.round(point[0] * 1e6)},${Math.round(point[1] * 1e6)}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const distSq = distanceSq(cursor, point);
      if (distSq <= tolSq) {
        snaps.push({
          point,
          type: 'vertex',
          priority: SNAP_PRIORITIES.vertex,
          distance: Math.sqrt(distSq),
          sourceWall: wall,
        });
      }
    }
  }
  return snaps;
}

function collectIntersectionSnaps(cursor: Vec2, walls: Wall[], tolSq: number): SnapResult[] {
  const snaps: SnapResult[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < walls.length; i++) {
    for (let j = i + 1; j < walls.length; j++) {
      const p = segmentIntersection(walls[i].start, walls[i].end, walls[j].start, walls[j].end);
      if (!p) continue;

      const key = `${Math.round(p[0] * 1e6)},${Math.round(p[1] * 1e6)}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const distSq = distanceSq(cursor, p);
      if (distSq <= tolSq) {
        snaps.push({
          point: p,
          type: 'intersection',
          priority: SNAP_PRIORITIES.intersection,
          distance: Math.sqrt(distSq),
        });
      }
    }
  }
  return snaps;
}

function collectMidpointSnaps(cursor: Vec2, walls: Wall[], tolSq: number): SnapResult[] {
  const snaps: SnapResult[] = [];
  for (const wall of walls) {
    const mid = midpoint(wall.start, wall.end);
    const distSq = distanceSq(cursor, mid);
    if (distSq <= tolSq) {
      snaps.push({
        point: mid,
        type: 'midpoint',
        priority: SNAP_PRIORITIES.midpoint,
        distance: Math.sqrt(distSq),
        sourceWall: wall,
      });
    }
  }
  return snaps;
}

function collectWallSnaps(cursor: Vec2, walls: Wall[], tolSq: number): SnapResult[] {
  const snaps: SnapResult[] = [];
  for (const wall of walls) {
    const proj = projectPointOnLine(cursor, wall.start, wall.end);
    if (!isPointOnSegment(proj, wall.start, wall.end, EPS)) continue;

    const distSq = distanceSq(cursor, proj);
    if (distSq <= tolSq) {
      snaps.push({
        point: proj,
        type: 'wall',
        priority: SNAP_PRIORITIES.wall,
        distance: Math.sqrt(distSq),
        sourceWall: wall,
      });
    }
  }
  return snaps;
}

function calculateAngleSnap(startPoint: Vec2, cursor: Vec2, snapTol: number): SnapResult | null {
  const dx = cursor[0] - startPoint[0];
  const dy = cursor[1] - startPoint[1];
  const dist = Math.hypot(dx, dy);

  if (dist < MIN_DISTANCE_FOR_ANGLE_SNAP) return null;

  const angle = Math.atan2(dy, dx);
  const snappedAngle = Math.round(angle / ANGLE_SNAP_STEPS) * ANGLE_SNAP_STEPS;

  if (Math.abs(angle - snappedAngle) < 0.01) return null;

  const snappedPoint: Vec2 = [
    startPoint[0] + Math.cos(snappedAngle) * dist,
    startPoint[1] + Math.sin(snappedAngle) * dist,
  ];

  const snapDist = distance(cursor, snappedPoint);
  if (snapDist > snapTol) return null;

  return {
    point: snappedPoint,
    type: 'angle',
    priority: SNAP_PRIORITIES.angle,
    distance: snapDist,
  };
}

function calculateGridSnap(cursor: Vec2, gridSize: number, tolSq: number): SnapResult | null {
  const gridPoint = snapToGrid(cursor, gridSize);
  const distSq = distanceSq(cursor, gridPoint);
  if (distSq <= tolSq) {
    return {
      point: gridPoint,
      type: 'grid',
      priority: SNAP_PRIORITIES.grid,
      distance: Math.sqrt(distSq),
    };
  }
  return null;
}

// ============================================
// FUNÇÃO PRINCIPAL
// ============================================

/**
 * Calcula o melhor ponto de snap para o cursor.
 * 
 * OTIMIZAÇÃO: Usa WeakMap para cache de bounds.
 * Objetos Wall permanecem IMUTÁVEIS - compatível com Zustand/Immer.
 */
export function computeSnap(
  cursor: Vec2,
  walls: Wall[],
  startPoint?: Vec2,
  options: SnapOptions = {}
): SnapResult {
  const baseTol = options.snapTol ?? SNAP_TOL;
  const zoom = options.zoom ?? 1;
  const snapTol = baseTol / zoom;
  const gridSize = options.gridSize ?? 0.1;
  const tolSq = snapTol * snapTol;

  const enableVertex = options.enableVertex ?? true;
  const enableIntersection = options.enableIntersection ?? true;
  const enableMidpoint = options.enableMidpoint ?? true;
  const enableWall = options.enableWall ?? true;
  const enableAngle = options.enableAngle ?? true;
  const enableGrid = options.enableGrid ?? true;

  // Spatial filtering com WeakMap cache - NÃO modifica paredes
  const nearbyWalls = filterNearbyWalls(walls, cursor, snapTol);

  const candidates: SnapResult[] = [];

  if (enableVertex) candidates.push(...collectVertexSnaps(cursor, nearbyWalls, tolSq));
  if (enableIntersection) candidates.push(...collectIntersectionSnaps(cursor, nearbyWalls, tolSq));
  if (enableMidpoint) candidates.push(...collectMidpointSnaps(cursor, nearbyWalls, tolSq));
  if (enableWall) candidates.push(...collectWallSnaps(cursor, nearbyWalls, tolSq));

  if (candidates.length > 0) {
    candidates.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.distance - b.distance;
    });
    return candidates[0];
  }

  if (enableAngle && startPoint) {
    const angleSnap = calculateAngleSnap(startPoint, cursor, snapTol);
    if (angleSnap) return angleSnap;
  }

  if (enableGrid) {
    const gridSnap = calculateGridSnap(cursor, gridSize, tolSq);
    if (gridSnap) return gridSnap;
  }

  return { point: cursor, type: null, priority: Infinity, distance: 0 };
}

// ============================================
// EXPORTS
// ============================================

export const SnapSolver = {
  computeSnap,
  SNAP_PRIORITIES,
  SNAP_COLORS,
  computeWallBounds,
  clearBoundsCache,
};

export { distance, midpoint, projectPointOnLine, snapToGrid };
