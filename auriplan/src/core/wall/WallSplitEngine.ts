// src/core/wall/WallSplitEngine.ts
// ============================================
// WALL SPLIT ENGINE - Divisão de Paredes
// CORREÇÃO: Tolerância aumentada para 10cm ao ignorar interseções próximas a vértices.
// ============================================

import type { Wall, Vec2 } from '@auriplan-types';
import { v4 as uuidv4 } from 'uuid';
import { EPS, GEOM_TOL, MIN_WALL_LENGTH } from '@core/geometry/geometryConstants';

export interface SplitSegment {
  wallId: string;
  start: Vec2;
  end: Vec2;
  tStart: number;
  tEnd: number;
}

export interface SplitResult {
  originalWallId: string;
  updatedWalls: Wall[];
  removedWallIds: string[];
  segments: SplitSegment[];
}

function distance(a: Vec2, b: Vec2): number {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return Math.hypot(dx, dy);
}

function cross(a: Vec2, b: Vec2, c: Vec2): number {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}

function isPointOnSegment(p: Vec2, a: Vec2, b: Vec2): boolean {
  const crossVal = cross(a, b, p);
  if (Math.abs(crossVal) > EPS) return false;

  const dot = (p[0] - a[0]) * (b[0] - a[0]) + (p[1] - a[1]) * (b[1] - a[1]);
  if (dot < -EPS) return false;

  const squaredLen = (b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2;
  if (dot > squaredLen + EPS) return false;

  return true;
}

function segmentIntersection(a1: Vec2, a2: Vec2, b1: Vec2, b2: Vec2): Vec2 | null {
  const d1 = cross(b1, b2, a1);
  const d2 = cross(b1, b2, a2);
  const d3 = cross(a1, a2, b1);
  const d4 = cross(a1, a2, b2);

  const crosses = ((d1 > EPS && d2 < -EPS) || (d1 < -EPS && d2 > EPS)) &&
                  ((d3 > EPS && d4 < -EPS) || (d3 < -EPS && d4 > EPS));

  if (!crosses) return null;

  const t = d1 / (d1 - d2);
  const ix = a1[0] + t * (a2[0] - a1[0]);
  const iy = a1[1] + t * (a2[1] - a1[1]);
  const point: Vec2 = [ix, iy];

  if (!Number.isFinite(ix) || !Number.isFinite(iy)) return null;
  return point;
}

function createWallFromSegment(original: Wall, start: Vec2, end: Vec2): Wall {
  const len = distance(start, end);
  if (len < MIN_WALL_LENGTH) {
    throw new Error(`Cannot create wall with length ${len} < MIN_WALL_LENGTH (${MIN_WALL_LENGTH})`);
  }

  const clonedConnections = original.connections
    ? { start: [...original.connections.start], end: [...original.connections.end] }
    : undefined;

  return {
    ...original,
    id: uuidv4(),
    start: [start[0], start[1]],
    end: [end[0], end[1]],
    connections: clonedConnections,
    roomIds: original.roomIds ? [...original.roomIds] : undefined,
    openingIds: original.openingIds ? [...original.openingIds] : undefined,
    metadata: original.metadata ? { ...original.metadata } : undefined,
  };
}

export function splitWallAtPoint(
  walls: Wall[],
  wallId: string,
  point: Vec2
): SplitResult {
  const wallIndex = walls.findIndex(w => w.id === wallId);
  if (wallIndex === -1) {
    return { originalWallId: wallId, updatedWalls: walls, removedWallIds: [], segments: [] };
  }

  const originalWall = walls[wallIndex];

  if (!isPointOnSegment(point, originalWall.start, originalWall.end)) {
    return { originalWallId: wallId, updatedWalls: walls, removedWallIds: [], segments: [] };
  }

  const distToStart = distance(point, originalWall.start);
  const distToEnd = distance(point, originalWall.end);
  const wallLength = distance(originalWall.start, originalWall.end);

  // Se o ponto está muito próximo de uma extremidade, não divide
  if (distToStart < GEOM_TOL * 10 || distToEnd < GEOM_TOL * 10) {
    return { originalWallId: wallId, updatedWalls: walls, removedWallIds: [], segments: [] };
  }

  if (distToStart < MIN_WALL_LENGTH || distToEnd < MIN_WALL_LENGTH) {
    console.warn(`splitWallAtPoint: resulting segments too short (${distToStart.toFixed(3)}, ${distToEnd.toFixed(3)}), skipping split`);
    return { originalWallId: wallId, updatedWalls: walls, removedWallIds: [], segments: [] };
  }

  try {
    const newWall1 = createWallFromSegment(originalWall, originalWall.start, point);
    const newWall2 = createWallFromSegment(originalWall, point, originalWall.end);

    const tSplit = distToStart / wallLength;
    const segments: SplitSegment[] = [
      {
        wallId: newWall1.id,
        start: [...newWall1.start] as Vec2,
        end: [...newWall1.end] as Vec2,
        tStart: 0,
        tEnd: tSplit,
      },
      {
        wallId: newWall2.id,
        start: [...newWall2.start] as Vec2,
        end: [...newWall2.end] as Vec2,
        tStart: tSplit,
        tEnd: 1,
      },
    ];

    const newWalls = [...walls];
    newWalls.splice(wallIndex, 1, newWall1, newWall2);

    return {
      originalWallId: originalWall.id,
      updatedWalls: newWalls,
      removedWallIds: [originalWall.id],
      segments,
    };
  } catch (err) {
    console.warn(`splitWallAtPoint failed for wall ${wallId}:`, err);
    return { originalWallId: wallId, updatedWalls: walls, removedWallIds: [], segments: [] };
  }
}

export function splitWallsAtIntersections(walls: Wall[]): Wall[] {
  let currentWalls = [...walls];
  let anySplit = true;
  let iterations = 0;
  const MAX_ITERATIONS = 20; // reduzido

  // Tolerância para ignorar interseções muito próximas de vértices (10 cm)
  const VERTEX_PROXIMITY_TOL = 0.10;

  while (anySplit && iterations < MAX_ITERATIONS) {
    anySplit = false;
    iterations++;

    for (let i = 0; i < currentWalls.length; i++) {
      const wallA = currentWalls[i];
      if (!wallA) continue;

      for (let j = i + 1; j < currentWalls.length; j++) {
        const wallB = currentWalls[j];
        if (!wallB) continue;

        const intersection = segmentIntersection(
          wallA.start, wallA.end,
          wallB.start, wallB.end
        );
        if (!intersection) continue;

        const distAStart = distance(intersection, wallA.start);
        const distAEnd   = distance(intersection, wallA.end);
        const distBStart = distance(intersection, wallB.start);
        const distBEnd   = distance(intersection, wallB.end);

        // Ignora se a interseção está muito próxima de qualquer vértice
        if (distAStart < VERTEX_PROXIMITY_TOL || distAEnd < VERTEX_PROXIMITY_TOL ||
            distBStart < VERTEX_PROXIMITY_TOL || distBEnd < VERTEX_PROXIMITY_TOL) {
          continue;
        }

        // Divide wallA
        const splitA = splitWallAtPoint(currentWalls, wallA.id, intersection);
        if (splitA.removedWallIds.length > 0) {
          currentWalls = splitA.updatedWalls;
          anySplit = true;
          break;
        }

        // Divide wallB (usando a lista já atualizada)
        const updatedWallB = currentWalls.find(w => w.id === wallB.id);
        if (!updatedWallB) {
          anySplit = true;
          break;
        }

        const splitB = splitWallAtPoint(currentWalls, updatedWallB.id, intersection);
        if (splitB.removedWallIds.length > 0) {
          currentWalls = splitB.updatedWalls;
          anySplit = true;
          break;
        }
      }
      if (anySplit) break;
    }
  }

  if (iterations >= MAX_ITERATIONS) {
    console.warn('splitWallsAtIntersections: max iterations reached, possible infinite loop');
  }

  return currentWalls;
}

export const WallSplit = {
  splitWallAtPoint,
  splitWallsAtIntersections,
};
