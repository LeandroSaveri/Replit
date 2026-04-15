// ============================================
// FILE: src/core/wall/TopologyResolver.ts
// Fase 4.1: Opção preserveShortWalls para construção incremental
// ============================================

import type { Wall, Vec2 } from '@auriplan-types';
import { EPS, NODE_TOL, SNAP_TOL, MIN_WALL_LENGTH } from '@core/geometry/geometryConstants';
import { vec2 } from '@core/math/vector';

export interface TopologyResult {
  walls: Wall[];
}

// ============================================
// FUNÇÃO FALTANTE: normalizeWallDirection
// ============================================

/**
 * Normaliza a direção da parede garantindo que start e end estejam
 * em uma ordem consistente (por exemplo, start sempre à esquerda/baixo).
 * Isso evita duplicatas e inconsistências na topologia.
 */
function normalizeWallDirection(wall: Wall): Wall {
  const start = wall.start;
  const end = wall.end;
  
  // Ordena por x primeiro, depois y para consistência
  if (start[0] > end[0] || (Math.abs(start[0] - end[0]) < EPS && start[1] > end[1])) {
    return {
      ...wall,
      start: [...end] as Vec2,
      end: [...start] as Vec2,
    };
  }
  
  return wall;
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function spatialKey(p: Vec2, precision: number = 1e-6): string {
  return `${Math.round(p[0] / precision)},${Math.round(p[1] / precision)}`;
}

function getUniquePointsWithHash(points: Vec2[], tolerance: number): Map<string, Vec2> {
  const unique = new Map<string, Vec2>();
  const tolSq = tolerance * tolerance;
  
  for (const p of points) {
    let found = false;
    for (const [key, existing] of unique) {
      const dx = existing[0] - p[0];
      const dy = existing[1] - p[1];
      if (dx * dx + dy * dy <= tolSq) {
        found = true;
        break;
      }
    }
    if (!found) {
      unique.set(spatialKey(p, tolerance * 0.5), [p[0], p[1]]);
    }
  }
  return unique;
}

function findMergedPoint(point: Vec2, uniquePoints: Map<string, Vec2>, tolerance: number): Vec2 {
  const tolSq = tolerance * tolerance;
  
  for (const existing of uniquePoints.values()) {
    const dx = existing[0] - point[0];
    const dy = existing[1] - point[1];
    if (dx * dx + dy * dy <= tolSq) {
      return [existing[0], existing[1]];
    }
  }
  return [point[0], point[1]];
}

function mergeCloseVertices(walls: Wall[], tolerance: number, preserveShort: boolean): Wall[] {
  if (walls.length === 0) return [];

  const allPoints: Vec2[] = [];
  for (const w of walls) {
    allPoints.push(w.start, w.end);
  }
  const uniquePoints = getUniquePointsWithHash(allPoints, tolerance);

  const mergedWalls: Wall[] = [];
  for (const wall of walls) {
    const newStart = findMergedPoint(wall.start, uniquePoints, tolerance);
    const newEnd = findMergedPoint(wall.end, uniquePoints, tolerance);
    const length = vec2.distance(newStart, newEnd);
    if (preserveShort || length >= MIN_WALL_LENGTH - EPS) {
      mergedWalls.push({ ...wall, start: newStart, end: newEnd });
    }
  }
  return mergedWalls;
}

function snapEndpoints(walls: Wall[], tolerance: number): Wall[] {
  if (walls.length === 0) return [];
  
  const points: Vec2[] = [];
  for (const w of walls) {
    points.push(w.start, w.end);
  }
  
  const uniquePoints = getUniquePointsWithHash(points, tolerance);
  
  return walls.map(wall => ({
    ...wall,
    start: findMergedPoint(wall.start, uniquePoints, tolerance),
    end: findMergedPoint(wall.end, uniquePoints, tolerance),
  }));
}

function removeDuplicateWalls(walls: Wall[]): Wall[] {
  const seen = new Set<string>();
  const result: Wall[] = [];
  
  for (const wall of walls) {
    const key = `${wall.start[0].toFixed(6)},${wall.start[1].toFixed(6)}-${wall.end[0].toFixed(6)},${wall.end[1].toFixed(6)}`;
    const reverseKey = `${wall.end[0].toFixed(6)},${wall.end[1].toFixed(6)}-${wall.start[0].toFixed(6)},${wall.start[1].toFixed(6)}`;
    
    if (!seen.has(key) && !seen.has(reverseKey)) {
      seen.add(key);
      result.push(wall);
    }
  }
  return result;
}

function mergeColinearWalls(walls: Wall[]): Wall[] {
  // Simplificação: por enquanto, apenas retorna as paredes originais
  // Implementação completa pode ser adicionada posteriormente
  return walls;
}

// ============================================
// FUNÇÃO PRINCIPAL
// ============================================

export function resolveTopology(walls: Wall[], options?: { aggressive?: boolean }): TopologyResult {
  const aggressive = options?.aggressive ?? true;
  
  if (walls.length === 0) return { walls: [] };

  // Filtra paredes muito curtas apenas se modo agressivo
  let filtered = walls.filter(w => {
    const len = vec2.distance(w.start, w.end);
    return aggressive ? len >= MIN_WALL_LENGTH - EPS : true;
  });
  
  filtered = filtered.map(normalizeWallDirection);

  const snapTol = aggressive ? SNAP_TOL : SNAP_TOL * 0.5;
  const nodeTol = aggressive ? NODE_TOL : NODE_TOL * 0.5;

  filtered = snapEndpoints(filtered, snapTol);
  // Preserva paredes curtas se não agressivo (modo incremental)
  filtered = mergeCloseVertices(filtered, nodeTol, !aggressive);
  filtered = removeDuplicateWalls(filtered);
  
  // Merge colinear apenas em modo agressivo
  if (aggressive) {
    filtered = mergeColinearWalls(filtered);
  }

  return { walls: filtered };
}
