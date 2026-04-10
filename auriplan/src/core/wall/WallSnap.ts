// src/core/wall/WallSnap.ts

import type { Vec2, Wall } from '@auriplan-types';
import {
  SNAP_TOL,
  ANGLE_TOL,
  GRID_SNAP_TOL,
  GEOM_TOL,
} from '@core/geometry/geometryConstants';
import { vec2 } from '@core/math/vector';

export type SnapType = 'vertex' | 'wall' | 'grid' | 'angle' | 'none';

export interface SnapResult {
  point: Vec2;
  type: SnapType;
}

/**
 * Projeta o ponto P sobre o segmento AB.
 * Retorna o ponto projetado (pode estar fora do segmento).
 */
function projectPointOnSegment(p: Vec2, a: Vec2, b: Vec2): Vec2 {
  const ab = vec2.subtract(b, a);
  const t = vec2.dot(vec2.subtract(p, a), ab) / vec2.dot(ab, ab);
  if (t < 0) return a;
  if (t > 1) return b;
  return [a[0] + t * ab[0], a[1] + t * ab[1]];
}

/**
 * Verifica se o ponto projetado está dentro da tolerância SNAP_TOL do ponto original.
 */
function isWithinSnapTolerance(p: Vec2, projected: Vec2): boolean {
  return vec2.distance(p, projected) <= SNAP_TOL;
}

/**
 * Snap para ângulos especiais (0°, 45°, 90°, 135°, etc.) a partir de uma base (último ponto).
 * Retorna o ponto ajustado e o tipo 'angle' se aplicável.
 */
function snapAngle(point: Vec2, basePoint: Vec2 | null): Vec2 | null {
  if (!basePoint) return null;
  const dx = point[0] - basePoint[0];
  const dy = point[1] - basePoint[1];
  const len = Math.hypot(dx, dy);
  if (len < GEOM_TOL) return null;

  const angle = Math.atan2(dy, dx);
  // Ângulos especiais em radianos: 0, 45, 90, 135, 180, 225, 270, 315 graus
  const specialAngles = [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4, Math.PI, (5 * Math.PI) / 4, (3 * Math.PI) / 2, (7 * Math.PI) / 4];
  let bestAngle = angle;
  let minDiff = ANGLE_TOL;

  for (const sa of specialAngles) {
    let diff = Math.abs(angle - sa);
    diff = Math.min(diff, 2 * Math.PI - diff);
    if (diff < minDiff) {
      minDiff = diff;
      bestAngle = sa;
    }
  }

  if (minDiff < ANGLE_TOL) {
    const newDx = Math.cos(bestAngle) * len;
    const newDy = Math.sin(bestAngle) * len;
    return [basePoint[0] + newDx, basePoint[1] + newDy];
  }
  return null;
}

/**
 * Snap para grid (tamanho GRID_SNAP_TOL).
 */
function snapGrid(point: Vec2): Vec2 {
  const grid = GRID_SNAP_TOL;
  const x = Math.round(point[0] / grid) * grid;
  const y = Math.round(point[1] / grid) * grid;
  return [x, y];
}

/**
 * Snaps a point to the nearest wall endpoint, wall edge, grid, or angle.
 * Priority: vertex > wall > angle > grid.
 *
 * @param point Ponto original (ex: mouse position)
 * @param walls Lista de paredes existentes
 * @param lastPoint Último ponto adicionado (para snap angular) – opcional
 * @returns Resultado com ponto ajustado e tipo de snap
 */
export function snapPoint(point: Vec2, walls: Wall[], lastPoint?: Vec2): SnapResult {
  // 1. Vertex snap (extremidades das paredes)
  let bestDist = SNAP_TOL;
  let bestPoint: Vec2 | null = null;
  let bestType: SnapType = 'none';

  for (const wall of walls) {
    const distStart = vec2.distance(point, wall.start);
    const distEnd = vec2.distance(point, wall.end);
    if (distStart < bestDist) {
      bestDist = distStart;
      bestPoint = wall.start;
      bestType = 'vertex';
    }
    if (distEnd < bestDist) {
      bestDist = distEnd;
      bestPoint = wall.end;
      bestType = 'vertex';
    }
  }

  // 2. Wall snap (projeção no segmento)
  if (!bestPoint) {
    for (const wall of walls) {
      const projected = projectPointOnSegment(point, wall.start, wall.end);
      if (isWithinSnapTolerance(point, projected)) {
        const dist = vec2.distance(point, projected);
        if (dist < bestDist) {
          bestDist = dist;
          bestPoint = projected;
          bestType = 'wall';
        }
      }
    }
  }

  // 3. Angle snap (se tivermos um último ponto)
  if (!bestPoint && lastPoint) {
    const angleSnapped = snapAngle(point, lastPoint);
    if (angleSnapped) {
      bestPoint = angleSnapped;
      bestType = 'angle';
    }
  }

  // 4. Grid snap (sempre disponível como fallback)
  if (!bestPoint) {
    const gridPoint = snapGrid(point);
    if (vec2.distance(point, gridPoint) <= GRID_SNAP_TOL) {
      bestPoint = gridPoint;
      bestType = 'grid';
    }
  }

  if (bestPoint) {
    return { point: bestPoint, type: bestType };
  }

  return { point, type: 'none' };
}

/**
 * Snaps a point to the nearest wall endpoint only (compatibilidade com código antigo).
 * @deprecated Use snapPoint() para snapping completo.
 */
export function snapWallEndpoint(point: Vec2, walls: Wall[]): Vec2 {
  const result = snapPoint(point, walls);
  return result.point;
}
