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

export interface TopologyOptions {
  aggressive?: boolean;
  preserveShortWalls?: boolean;
}

// ============================================
// FUNÇÃO FALTANTE - normalizeWallDirection
// ============================================

/**
 * Normaliza a direção da parede garantindo que start seja o ponto "inferior/esquerdo"
 * para consistência em comparações.
 */
function normalizeWallDirection(wall: Wall): Wall {
  const start = wall.start;
  const end = wall.end;
  
  // Critério de ordenação: primeiro comparar X, depois Y
  if (start[0] > end[0] || (Math.abs(start[0] - end[0]) < EPS && start[1] > end[1])) {
    return {
      ...wall,
      start: [...end] as Vec2,
      end: [...start] as Vec2,
    };
  }
  return { ...wall };
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function spatialKey(p: Vec2, precision: number = 6): string {
  return `${Math.round(p[0] * precision)}:${Math.round(p[1] * precision)}`;
}

function getUniquePointsWithHash(points: Vec2[], tolerance: number): Vec2[] {
  const unique: Vec2[] = [];
  const hashMap = new Map<string, Vec2>();
  const tolSq = tolerance * tolerance;

  for (const p of points) {
    const key = spatialKey(p, 100);
    let found = false;
    
    for (const existing of unique) {
      const dx = existing[0] - p[0];
      const dy = existing[1] - p[1];
      if (dx * dx + dy * dy <= tolSq) {
        found = true;
        break;
      }
    }
    
    if (!found) {
      unique.push([...p] as Vec2);
    }
  }
  
  return unique;
}

function findMergedPoint(point: Vec2, uniquePoints: Vec2[], tolerance: number): Vec2 {
  const tolSq = tolerance * tolerance;
  
  for (const up of uniquePoints) {
    const dx = up[0] - point[0];
    const dy = up[1] - point[1];
    if (dx * dx + dy * dy <= tolSq) {
      return up;
    }
  }
  
  return [...point] as Vec2;
}

function mergeCloseVertices(walls: Wall[], tolerance: number, preserveShort: boolean = false): Wall[] {
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
  if (walls.length < 2) return walls;
  
  const tolSq = tolerance * tolerance;
  const points: Array<{ point: Vec2; wallIdx: number; isStart: boolean }> = [];
  
  for (let i = 0; i < walls.length; i++) {
    points.push({ point: walls[i].start, wallIdx: i, isStart: true });
    points.push({ point: walls[i].end, wallIdx: i, isStart: false });
  }
  
  const snappedWalls = walls.map(w => ({ ...w, start: [...w.start] as Vec2, end: [...w.end] as Vec2 }));
  
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const dx = points[i].point[0] - points[j].point[0];
      const dy = points[i].point[1] - points[j].point[1];
      if (dx * dx + dy * dy <= tolSq) {
        const targetPoint = points[i].point;
        
        if (points[j].isStart) {
          snappedWalls[points[j].wallIdx].start = [...targetPoint] as Vec2;
        } else {
          snappedWalls[points[j].wallIdx].end = [...targetPoint] as Vec2;
        }
      }
    }
  }
  
  return snappedWalls;
}

function removeDuplicateWalls(walls: Wall[]): Wall[] {
  const unique = new Map<string, Wall>();
  
  for (const wall of walls) {
    const startKey = `${wall.start[0].toFixed(6)},${wall.start[1].toFixed(6)}`;
    const endKey = `${wall.end[0].toFixed(6)},${wall.end[1].toFixed(6)}`;
    const key = `${startKey}|${endKey}`;
    const reverseKey = `${endKey}|${startKey}`;
    
    if (!unique.has(key) && !unique.has(reverseKey)) {
      unique.set(key, wall);
    }
  }
  
  return Array.from(unique.values());
}

function mergeColinearWalls(walls: Wall[]): Wall[] {
  if (walls.length < 2) return walls;
  
  const merged: Wall[] = [];
  const used = new Set<string>();
  
  for (let i = 0; i < walls.length; i++) {
    if (used.has(walls[i].id)) continue;
    
    let current = { ...walls[i] };
    let changed = true;
    
    while (changed) {
      changed = false;
      
      for (let j = 0; j < walls.length; j++) {
        if (used.has(walls[j].id) || walls[j].id === current.id) continue;
        
        const isStartMatch = vec2.distance(current.start, walls[j].start) < EPS ||
                            vec2.distance(current.start, walls[j].end) < EPS;
        const isEndMatch = vec2.distance(current.end, walls[j].start) < EPS ||
                          vec2.distance(current.end, walls[j].end) < EPS;
        
        if (!isStartMatch && !isEndMatch) continue;
        
        const dirCurrent = vec2.normalize(vec2.sub(current.end, current.start));
        const dirOther = vec2.normalize(vec2.sub(walls[j].end, walls[j].start));
        const dot = Math.abs(dirCurrent[0] * dirOther[0] + dirCurrent[1] * dirOther[1]);
        
        if (dot > 0.9999) {
          const allPoints = [current.start, current.end, walls[j].start, walls[j].end];
          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
          for (const p of allPoints) {
            minX = Math.min(minX, p[0]); minY = Math.min(minY, p[1]);
            maxX = Math.max(maxX, p[0]); maxY = Math.max(maxY, p[1]);
          }
          
          const direction = dirCurrent;
          const newStart: Vec2 = [minX, minY];
          const newEnd: Vec2 = [maxX, maxY];
          
          if (Math.abs(direction[0]) > 0.5) {
            if (newStart[0] > newEnd[0]) {
              current = { ...current, start: newEnd, end: newStart };
            } else {
              current = { ...current, start: newStart, end: newEnd };
            }
          } else {
            if (newStart[1] > newEnd[1]) {
              current = { ...current, start: newEnd, end: newStart };
            } else {
              current = { ...current, start: newStart, end: newEnd };
            }
          }
          
          used.add(walls[j].id);
          changed = true;
        }
      }
    }
    
    merged.push(current);
    used.add(current.id);
  }
  
  return merged;
}

// ============================================
// FUNÇÃO PRINCIPAL
// ============================================

export function resolveTopology(walls: Wall[], options: TopologyOptions = {}): TopologyResult {
  const { aggressive = true, preserveShortWalls = false } = options;
  if (walls.length === 0) return { walls: [] };

  let filtered = walls.filter(w => vec2.distance(w.start, w.end) >= MIN_WALL_LENGTH - EPS);
  filtered = filtered.map(normalizeWallDirection);

  const snapTol = aggressive ? SNAP_TOL : SNAP_TOL * 0.5;
  const nodeTol = aggressive ? NODE_TOL : NODE_TOL * 0.5;

  filtered = snapEndpoints(filtered, snapTol);
  filtered = mergeCloseVertices(filtered, nodeTol, preserveShortWalls);
  filtered = removeDuplicateWalls(filtered);
  filtered = mergeColinearWalls(filtered);

  return { walls: filtered };
}
