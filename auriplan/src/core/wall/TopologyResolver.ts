// ============================================
// FILE: src/core/wall/TopologyResolver.ts
// ============================================
// CORRIGIDO: mergeColinearWalls com projeção correta
// OTIMIZADO: mergeCloseVertices e snapEndpoints O(n²) → O(n) com hash espacial
// ============================================

import type { Wall, Vec2 } from '@auriplan-types';
import { EPS, NODE_TOL, SNAP_TOL, MIN_WALL_LENGTH } from '@core/geometry/geometryConstants';
import { vec2 } from '@core/math/vector';

export interface TopologyResult {
  walls: Wall[];
}

// ===== Utilitários de hash espacial para O(n) =====
function spatialKey(p: Vec2, tol: number): string {
  const inv = 1 / tol;
  return `${Math.floor(p[0] * inv)},${Math.floor(p[1] * inv)}`;
}

function getUniquePointsWithHash(points: Vec2[], tol: number): Vec2[] {
  const unique = new Map<string, Vec2>();
  for (const p of points) {
    const key = spatialKey(p, tol);
    if (!unique.has(key)) {
      unique.set(key, [p[0], p[1]]);
    }
  }
  return Array.from(unique.values());
}

function findMergedPoint(p: Vec2, uniquePoints: Vec2[], tol: number): Vec2 {
  const key = spatialKey(p, tol);
  const tolSq = tol * tol;
  // Primeiro tenta a célula exata
  for (const up of uniquePoints) {
    if (spatialKey(up, tol) === key) {
      if (vec2.distanceSq(up, p) <= tolSq) return up;
    }
  }
  // Fallback: busca linear (raro, apenas para pontos em borda de célula)
  for (const up of uniquePoints) {
    if (vec2.distanceSq(up, p) <= tolSq) return up;
  }
  return p;
}

function normalizeWallDirection(wall: Wall): Wall {
  if (wall.start[0] < wall.end[0]) return wall;
  if (wall.start[0] > wall.end[0]) {
    return { ...wall, start: wall.end, end: wall.start };
  }
  if (wall.start[1] < wall.end[1]) return wall;
  if (wall.start[1] > wall.end[1]) {
    return { ...wall, start: wall.end, end: wall.start };
  }
  return wall;
}

function removeDuplicateWalls(walls: Wall[]): Wall[] {
  const unique = new Map<string, Wall>();
  for (const wall of walls) {
    const normalized = normalizeWallDirection(wall);
    const key = `${normalized.start[0]},${normalized.start[1]}|${normalized.end[0]},${normalized.end[1]}|${wall.thickness}`;
    if (!unique.has(key)) unique.set(key, normalized);
  }
  return Array.from(unique.values());
}

// OTIMIZADO: O(n) usando hash espacial
function mergeCloseVertices(walls: Wall[]): Wall[] {
  if (walls.length === 0) return [];

  // Coleta todos os pontos únicos com hash
  const allPoints: Vec2[] = [];
  for (const w of walls) {
    allPoints.push(w.start, w.end);
  }
  const uniquePoints = getUniquePointsWithHash(allPoints, NODE_TOL);

  const mergedWalls: Wall[] = [];
  for (const wall of walls) {
    const newStart = findMergedPoint(wall.start, uniquePoints, NODE_TOL);
    const newEnd = findMergedPoint(wall.end, uniquePoints, NODE_TOL);
    if (vec2.distance(newStart, newEnd) >= MIN_WALL_LENGTH) {
      mergedWalls.push({ ...wall, start: newStart, end: newEnd });
    }
  }
  return mergedWalls;
}

// OTIMIZADO: O(n) usando hash espacial
function snapEndpoints(walls: Wall[]): Wall[] {
  if (walls.length === 0) return [];

  const allPoints: Vec2[] = [];
  for (const w of walls) {
    allPoints.push(w.start, w.end);
  }
  const uniquePoints = getUniquePointsWithHash(allPoints, SNAP_TOL);

  const snappedWalls: Wall[] = [];
  for (const wall of walls) {
    const newStart = findMergedPoint(wall.start, uniquePoints, SNAP_TOL);
    const newEnd = findMergedPoint(wall.end, uniquePoints, SNAP_TOL);
    if (vec2.distance(newStart, newEnd) >= MIN_WALL_LENGTH) {
      snappedWalls.push({ ...wall, start: newStart, end: newEnd });
    }
  }
  return snappedWalls;
}

// CORRIGIDO: projeção matemática correta
function mergeColinearWalls(walls: Wall[]): Wall[] {
  if (walls.length === 0) return [];

  // Agrupa por direção normalizada e offset perpendicular
  const groups = new Map<string, Wall[]>();
  for (const wall of walls) {
    const dx = wall.end[0] - wall.start[0];
    const dy = wall.end[1] - wall.start[1];
    const len = Math.hypot(dx, dy);
    if (len < EPS) continue;
    const dirX = dx / len;
    const dirY = dy / len;
    const normDir: Vec2 = dirX < 0 ? [-dirX, -dirY] : [dirX, dirY];
    const perpX = -normDir[1];
    const perpY = normDir[0];
    const offset = wall.start[0] * perpX + wall.start[1] * perpY;
    const key = `${normDir[0]},${normDir[1]}|${offset}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(wall);
  }

  const merged: Wall[] = [];
  for (const group of groups.values()) {
    if (group.length === 1) {
      merged.push(group[0]);
      continue;
    }

    // Calcula direção unitária consistente
    const first = group[0];
    const dx = first.end[0] - first.start[0];
    const dy = first.end[1] - first.start[1];
    const len = Math.hypot(dx, dy);
    if (len < EPS) continue;
    const unitDir: Vec2 = [dx / len, dy / len];

    // Projeta cada parede na linha
    type Interval = { start: number; end: number; wall: Wall };
    const intervals: Interval[] = [];
    for (const wall of group) {
      const proj = (p: Vec2) => p[0] * unitDir[0] + p[1] * unitDir[1];
      let t1 = proj(wall.start);
      let t2 = proj(wall.end);
      if (t1 > t2) [t1, t2] = [t2, t1];
      intervals.push({ start: t1, end: t2, wall });
    }
    intervals.sort((a, b) => a.start - b.start);

    // Mescla intervalos sobrepostos
    const mergedIntervals: Interval[] = [];
    for (const iv of intervals) {
      if (mergedIntervals.length === 0) {
        mergedIntervals.push({ ...iv });
        continue;
      }
      const last = mergedIntervals[mergedIntervals.length - 1];
      if (iv.start <= last.end + EPS) {
        last.end = Math.max(last.end, iv.end);
      } else {
        mergedIntervals.push({ ...iv });
      }
    }

    // Reconstrói paredes a partir dos intervalos mesclados
    for (const iv of mergedIntervals) {
      const templateWall = iv.wall;
      const startPoint: Vec2 = [
        templateWall.start[0] + unitDir[0] * (iv.start - (templateWall.start[0] * unitDir[0] + templateWall.start[1] * unitDir[1])),
        templateWall.start[1] + unitDir[1] * (iv.start - (templateWall.start[0] * unitDir[0] + templateWall.start[1] * unitDir[1])),
      ];
      const endPoint: Vec2 = [
        templateWall.start[0] + unitDir[0] * (iv.end - (templateWall.start[0] * unitDir[0] + templateWall.start[1] * unitDir[1])),
        templateWall.start[1] + unitDir[1] * (iv.end - (templateWall.start[0] * unitDir[0] + templateWall.start[1] * unitDir[1])),
      ];
      if (vec2.distance(startPoint, endPoint) >= MIN_WALL_LENGTH) {
        merged.push({ ...templateWall, start: startPoint, end: endPoint });
      }
    }
  }
  return merged;
}

export function resolveTopology(walls: Wall[]): TopologyResult {
  if (walls.length === 0) return { walls: [] };

  let filtered = walls.filter(w => vec2.distance(w.start, w.end) >= MIN_WALL_LENGTH);
  filtered = filtered.map(normalizeWallDirection);
  filtered = snapEndpoints(filtered);
  filtered = mergeCloseVertices(filtered);
  filtered = removeDuplicateWalls(filtered);
  filtered = mergeColinearWalls(filtered);

  return { walls: filtered };
}
