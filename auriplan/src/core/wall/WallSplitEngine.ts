// src/core/wall/WallSplitEngine.ts
// ============================================
// WALL SPLIT ENGINE - Divisão de Paredes
// CORREÇÃO: split robusto com tolerância geométrica consistente para endpoints.
// ============================================

import type { Wall, Vec2 } from '@auriplan-types';
import { v4 as uuidv4 } from 'uuid';
import { EPS, GEOM_TOL, MIN_WALL_LENGTH } from '@core/geometry/geometryConstants';
import { segmentIntersection, isPointOnSegment } from '@core/math/vector';

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

const VERTEX_PROXIMITY_TOL = Math.max(GEOM_TOL * 2, EPS * 10);

function canSplitWallAtPoint(wall: Wall, point: Vec2): boolean {
  if (!isPointOnSegment(point, wall.start, wall.end, GEOM_TOL)) return false;

  const distToStart = distance(point, wall.start);
  const distToEnd = distance(point, wall.end);

  // Evita splits degenerados em endpoints
  if (distToStart <= VERTEX_PROXIMITY_TOL || distToEnd <= VERTEX_PROXIMITY_TOL) return false;

  // Garante comprimento mínimo em ambos segmentos
  if (distToStart < MIN_WALL_LENGTH || distToEnd < MIN_WALL_LENGTH) return false;

  return true;
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

  if (!isPointOnSegment(point, originalWall.start, originalWall.end, GEOM_TOL)) {
    return { originalWallId: wallId, updatedWalls: walls, removedWallIds: [], segments: [] };
  }

  const distToStart = distance(point, originalWall.start);
  const distToEnd = distance(point, originalWall.end);
  const wallLength = distance(originalWall.start, originalWall.end);

  // Se o ponto está muito próximo de uma extremidade, não divide
  if (distToStart < VERTEX_PROXIMITY_TOL || distToEnd < VERTEX_PROXIMITY_TOL) {
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
          wallB.start, wallB.end,
          GEOM_TOL
        );
        if (!intersection) continue;

        const splitAFirst = canSplitWallAtPoint(wallA, intersection);
        const splitBFirst = canSplitWallAtPoint(wallB, intersection);
        if (!splitAFirst && !splitBFirst) continue;

        if (splitAFirst) {
          const splitA = splitWallAtPoint(currentWalls, wallA.id, intersection);
          if (splitA.removedWallIds.length > 0) {
            currentWalls = splitA.updatedWalls;
            anySplit = true;
          }
        }

        if (splitBFirst) {
          const wallBCurrent = currentWalls.find(w => w.id === wallB.id);
          if (wallBCurrent && canSplitWallAtPoint(wallBCurrent, intersection)) {
            const splitB = splitWallAtPoint(currentWalls, wallBCurrent.id, intersection);
            if (splitB.removedWallIds.length > 0) {
              currentWalls = splitB.updatedWalls;
              anySplit = true;
            }
          }
        }

        if (anySplit) break;
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
