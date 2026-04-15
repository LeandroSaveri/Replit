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
  preserveShortWalls?: boolean; // Nova opção
}

// ... (funções auxiliares mantidas: spatialKey, getUniquePointsWithHash, findMergedPoint, etc.)

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
    if (preserveShort || length >= MIN_WALL_LENGTH) {
      mergedWalls.push({ ...wall, start: newStart, end: newEnd });
    }
  }
  return mergedWalls;
}

function snapEndpoints(walls: Wall[], tolerance: number): Wall[] {
  // inalterada
}

function mergeColinearWalls(walls: Wall[]): Wall[] {
  // inalterada
}

export function resolveTopology(walls: Wall[], options: TopologyOptions = {}): TopologyResult {
  const { aggressive = true, preserveShortWalls = false } = options;
  if (walls.length === 0) return { walls: [] };

  let filtered = walls.filter(w => vec2.distance(w.start, w.end) >= MIN_WALL_LENGTH);
  filtered = filtered.map(normalizeWallDirection);

  const snapTol = aggressive ? SNAP_TOL : SNAP_TOL * 0.5;
  const nodeTol = aggressive ? NODE_TOL : NODE_TOL * 0.5;

  filtered = snapEndpoints(filtered, snapTol);
  filtered = mergeCloseVertices(filtered, nodeTol, preserveShortWalls);
  filtered = removeDuplicateWalls(filtered);
  filtered = mergeColinearWalls(filtered);

  return { walls: filtered };
}
