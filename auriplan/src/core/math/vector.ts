// ============================================
// FILE: src/core/math/vector.ts
// ============================================
// CORRIGIDO: Agora importa EPS de geometryConstants para consistência
// ============================================

import type { Vec2, Vec3, Point2D } from '@auriplan-types';
import { EPS } from '@core/geometry/geometryConstants';

export const vec2 = {
  add: (a: Vec2, b: Vec2): Vec2 => [a[0] + b[0], a[1] + b[1]],
  sub: (a: Vec2, b: Vec2): Vec2 => [a[0] - b[0], a[1] - b[1]],
  mul: (v: Vec2, s: number): Vec2 => [v[0] * s, v[1] * s],
  scale: (v: Vec2, s: number): Vec2 => [v[0] * s, v[1] * s],
  subtract: (a: Vec2, b: Vec2): Vec2 => [a[0] - b[0], a[1] - b[1]],
  div: (v: Vec2, s: number): Vec2 => [v[0] / s, v[1] / s],
  dot: (a: Vec2, b: Vec2): number => a[0] * b[0] + a[1] * b[1],
  cross: (a: Vec2, b: Vec2): number => a[0] * b[1] - a[1] * b[0],
  length: (v: Vec2): number => Math.hypot(v[0], v[1]),
  lengthSq: (v: Vec2): number => v[0] * v[0] + v[1] * v[1],
  normalize: (v: Vec2): Vec2 => {
    const len = Math.hypot(v[0], v[1]);
    return len < EPS ? [0, 0] : [v[0] / len, v[1] / len];
  },
  perpendicular: (v: Vec2): Vec2 => [-v[1], v[0]],
  negate: (v: Vec2): Vec2 => [-v[0], -v[1]],
  lerp: (a: Vec2, b: Vec2, t: number): Vec2 => [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
  ],
  distance: (a: Vec2, b: Vec2): number => Math.hypot(a[0] - b[0], a[1] - b[1]),
  distanceSq: (a: Vec2, b: Vec2): number => {
    const dx = a[0] - b[0], dy = a[1] - b[1];
    return dx * dx + dy * dy;
  },
  midpoint: (a: Vec2, b: Vec2): Vec2 => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2],
  angle: (v: Vec2): number => Math.atan2(v[1], v[0]),
  angleBetween: (a: Vec2, b: Vec2): number => {
    const lenA = Math.hypot(a[0], a[1]);
    const lenB = Math.hypot(b[0], b[1]);
    if (lenA < EPS || lenB < EPS) return 0;
    const dot = a[0] * b[0] + a[1] * b[1];
    const cos = Math.max(-1, Math.min(1, dot / (lenA * lenB)));
    return Math.acos(cos);
  },
  rotate: (v: Vec2, angle: number): Vec2 => {
    const cos = Math.cos(angle), sin = Math.sin(angle);
    return [v[0] * cos - v[1] * sin, v[0] * sin + v[1] * cos];
  },
  fromPoint: (p: Point2D): Vec2 => [p.x, p.y],
  toPoint: (v: Vec2): Point2D => ({ x: v[0], y: v[1] }),
  equals: (a: Vec2, b: Vec2, epsilon = EPS): boolean =>
    Math.abs(a[0] - b[0]) < epsilon && Math.abs(a[1] - b[1]) < epsilon,
  clone: (v: Vec2): Vec2 => [v[0], v[1]],
  zero: (): Vec2 => [0, 0],
};

export const vec3 = {
  add: (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
  sub: (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  mul: (v: Vec3, s: number): Vec3 => [v[0] * s, v[1] * s, v[2] * s],
  div: (v: Vec3, s: number): Vec3 => [v[0] / s, v[1] / s, v[2] / s],
  dot: (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  cross: (a: Vec3, b: Vec3): Vec3 => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ],
  length: (v: Vec3): number => Math.hypot(v[0], v[1], v[2]),
  lengthSq: (v: Vec3): number => v[0] * v[0] + v[1] * v[1] + v[2] * v[2],
  normalize: (v: Vec3): Vec3 => {
    const len = Math.hypot(v[0], v[1], v[2]);
    return len < EPS ? [0, 0, 0] : [v[0] / len, v[1] / len, v[2] / len];
  },
  lerp: (a: Vec3, b: Vec3, t: number): Vec3 => [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ],
  distance: (a: Vec3, b: Vec3): number => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]),
  clone: (v: Vec3): Vec3 => [v[0], v[1], v[2]],
  zero: (): Vec3 => [0, 0, 0],
  up: (): Vec3 => [0, 1, 0],
  forward: (): Vec3 => [0, 0, -1],
  right: (): Vec3 => [1, 0, 0],
};

export const geometry = {
  projectPointOnLine: (point: Vec2, lineStart: Vec2, lineEnd: Vec2): Vec2 => {
    const lineVec = vec2.sub(lineEnd, lineStart);
    const lineLenSq = vec2.lengthSq(lineVec);
    if (lineLenSq < EPS) return lineStart;
    const pointVec = vec2.sub(point, lineStart);
    const t = Math.max(0, Math.min(1, vec2.dot(pointVec, lineVec) / lineLenSq));
    return vec2.add(lineStart, vec2.mul(lineVec, t));
  },
  distanceToLine: (point: Vec2, lineStart: Vec2, lineEnd: Vec2): number => {
    const projected = geometry.projectPointOnLine(point, lineStart, lineEnd);
    return vec2.distance(point, projected);
  },
  lineIntersection: (a1: Vec2, a2: Vec2, b1: Vec2, b2: Vec2): Vec2 | null => {
    const d1 = vec2.sub(a2, a1);
    const d2 = vec2.sub(b2, b1);
    const det = d1[0] * d2[1] - d1[1] * d2[0];
    if (Math.abs(det) < EPS) return null;
    const diff = vec2.sub(b1, a1);
    const t = (diff[0] * d2[1] - diff[1] * d2[0]) / det;
    const u = (diff[0] * d1[1] - diff[1] * d1[0]) / det;
    if (t < 0 || t > 1 || u < 0 || u > 1) return null;
    return vec2.add(a1, vec2.mul(d1, t));
  },
  pointInPolygon: (point: Vec2, polygon: Vec2[]): boolean => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][0], yi = polygon[i][1];
      const xj = polygon[j][0], yj = polygon[j][1];
      const intersect = ((yi > point[1]) !== (yj > point[1])) &&
        (point[0] < (xj - xi) * (point[1] - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  },
  polygonArea: (polygon: Vec2[]): number => {
    let area = 0;
    for (let i = 0; i < polygon.length; i++) {
      const j = (i + 1) % polygon.length;
      area += polygon[i][0] * polygon[j][1];
      area -= polygon[j][0] * polygon[i][1];
    }
    return Math.abs(area) / 2;
  },
  polygonPerimeter: (polygon: Vec2[]): number => {
    let perimeter = 0;
    for (let i = 0; i < polygon.length; i++) {
      const j = (i + 1) % polygon.length;
      perimeter += vec2.distance(polygon[i], polygon[j]);
    }
    return perimeter;
  },
  polygonCentroid: (polygon: Vec2[]): Vec2 => {
    let cx = 0, cy = 0, area = 0;
    for (let i = 0; i < polygon.length; i++) {
      const j = (i + 1) % polygon.length;
      const factor = polygon[i][0] * polygon[j][1] - polygon[j][0] * polygon[i][1];
      cx += (polygon[i][0] + polygon[j][0]) * factor;
      cy += (polygon[i][1] + polygon[j][1]) * factor;
      area += factor;
    }
    const signedArea = area / 2;
    if (Math.abs(signedArea) < EPS) return polygon[0] ?? [0, 0];
    const denom = area * 3;
    return [cx / denom, cy / denom];
  },
  isConvex: (polygon: Vec2[]): boolean => {
    if (polygon.length < 3) return false;
    let sign = 0;
    for (let i = 0; i < polygon.length; i++) {
      const j = (i + 1) % polygon.length;
      const k = (i + 2) % polygon.length;
      const cross = vec2.cross(
        vec2.sub(polygon[j], polygon[i]),
        vec2.sub(polygon[k], polygon[j])
      );
      if (Math.abs(cross) > EPS) {
        const currentSign = cross > 0 ? 1 : -1;
        if (sign === 0) sign = currentSign;
        else if (sign !== currentSign) return false;
      }
    }
    return true;
  },
  boundingBox: (points: Vec2[]): { min: Vec2; max: Vec2 } => {
    if (points.length === 0) return { min: [0, 0], max: [0, 0] };
    let minX = points[0][0], minY = points[0][1];
    let maxX = minX, maxY = minY;
    for (const p of points) {
      minX = Math.min(minX, p[0]);
      minY = Math.min(minY, p[1]);
      maxX = Math.max(maxX, p[0]);
      maxY = Math.max(maxY, p[1]);
    }
    return { min: [minX, minY], max: [maxX, maxY] };
  },
  expandBoundingBox: (box: { min: Vec2; max: Vec2 }, amount: number) => ({
    min: [box.min[0] - amount, box.min[1] - amount],
    max: [box.max[0] + amount, box.max[1] + amount],
  }),
  boundingBoxesIntersect: (a: { min: Vec2; max: Vec2 }, b: { min: Vec2; max: Vec2 }): boolean =>
    a.min[0] <= b.max[0] && a.max[0] >= b.min[0] &&
    a.min[1] <= b.max[1] && a.max[1] >= b.min[1],
};

export const numeric = {
  snapToGrid: (value: number, gridSize: number): number => Math.round(value / gridSize) * gridSize,
  roundToPrecision: (value: number, precision: number): number => {
    const factor = 10 ** precision;
    return Math.round(value * factor) / factor;
  },
  clamp: (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value)),
  degToRad: (degrees: number): number => degrees * (Math.PI / 180),
  radToDeg: (radians: number): number => radians * (180 / Math.PI),
  lerp: (a: number, b: number, t: number): number => a + (b - a) * t,
  smoothstep: (edge0: number, edge1: number, x: number): number => {
    const t = numeric.clamp((x - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
  },
  isZero: (value: number, epsilon = EPS): boolean => Math.abs(value) < epsilon,
  equals: (a: number, b: number, epsilon = EPS): boolean => Math.abs(a - b) < epsilon,
};

// Standalone helpers
export function distance(a: Vec2, b: Vec2): number { return vec2.distance(a, b); }
export function distanceSquared(a: Vec2, b: Vec2): number { return vec2.distanceSq(a, b); }
export function snapVectorToGrid(v: Vec2, gridSize: number): Vec2 {
  return [numeric.snapToGrid(v[0], gridSize), numeric.snapToGrid(v[1], gridSize)];
}
export function pointOnLine(point: Vec2, lineStart: Vec2, lineEnd: Vec2): Vec2 {
  return geometry.projectPointOnLine(point, lineStart, lineEnd);
}
export function subtractVectors(a: Vec2, b: Vec2): Vec2 { return vec2.sub(a, b); }
export function vectorLength(v: Vec2): number { return vec2.length(v); }
export function normalizeVector(v: Vec2): Vec2 { return vec2.normalize(v); }
export function scaleVector(v: Vec2, s: number): Vec2 { return vec2.mul(v, s); }
export function addVectors(a: Vec2, b: Vec2): Vec2 { return vec2.add(a, b); }
export function dotProduct(a: Vec2, b: Vec2): number { return vec2.dot(a, b); }
export function angleFromX(v: Vec2): number { return vec2.angle(v); }
export function degToRad(degrees: number): number { return numeric.degToRad(degrees); }
export function radToDeg(radians: number): number { return numeric.radToDeg(radians); }

/** Check if two line segments intersect */
export function linesIntersect(
  a1: Vec2, a2: Vec2,
  b1: Vec2, b2: Vec2
): { point: Vec2; t: number; u: number } | null {
  const dx1 = a2[0] - a1[0];
  const dy1 = a2[1] - a1[1];
  const dx2 = b2[0] - b1[0];
  const dy2 = b2[1] - b1[1];
  const denom = dx1 * dy2 - dy1 * dx2;
  if (Math.abs(denom) < 1e-10) return null;
  const dx3 = b1[0] - a1[0];
  const dy3 = b1[1] - a1[1];
  const t = (dx3 * dy2 - dy3 * dx2) / denom;
  const u = (dx3 * dy1 - dy3 * dx1) / denom;
  if (t < 0 || t > 1 || u < 0 || u > 1) return null;
  return {
    point: [a1[0] + t * dx1, a1[1] + t * dy1],
    t,
    u,
  };
}

/** Get a vector perpendicular to the given vector */
export function perpendicularVector(v: Vec2): Vec2 {
  return vec2.perpendicular(v);
}
