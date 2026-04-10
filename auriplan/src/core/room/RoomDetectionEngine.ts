// ============================================
// FILE: src/core/room/RoomDetectionEngine.ts
// ============================================
// OTIMIZADO: detecção de nós com hash espacial já O(n)
// ============================================

import type { Wall, Vec2 } from '@auriplan-types';
import type { WallGraph } from '@core/wall/WallGraph';
import { vec2 } from '@core/math/vector';
import { v4 as uuidv4 } from 'uuid';
import { NODE_TOL, EPS, MIN_ROOM_AREA, MAX_AREA_THRESHOLD } from '@core/geometry/geometryConstants';

export interface Room {
  id: string;
  points: Vec2[];
  area: number;
  center: Vec2;
}

function normalizePolygon(indices: number[]): number[] {
  if (indices.length === 0) return [];
  const minIdx = Math.min(...indices);
  const start = indices.indexOf(minIdx);
  const rotated = [...indices.slice(start), ...indices.slice(0, start)];
  const reversed = [...rotated].reverse();
  for (let i = 0; i < rotated.length; i++) {
    if (rotated[i] !== reversed[i]) {
      return rotated[i] < reversed[i] ? rotated : reversed;
    }
  }
  return rotated;
}

function removeDuplicatePoints(points: Vec2[]): Vec2[] {
  if (points.length < 2) return points;
  const cleaned: Vec2[] = [points[0]];
  const epsSq = EPS * EPS;
  for (let i = 1; i < points.length; i++) {
    const last = cleaned[cleaned.length - 1];
    const dx = points[i][0] - last[0], dy = points[i][1] - last[1];
    if (dx * dx + dy * dy > epsSq) cleaned.push(points[i]);
  }
  if (cleaned.length > 1) {
    const last = cleaned[cleaned.length - 1], first = cleaned[0];
    const dx = last[0] - first[0], dy = last[1] - first[1];
    if (dx * dx + dy * dy < epsSq) cleaned.pop();
  }
  return cleaned;
}

function areColinear(a: Vec2, b: Vec2, c: Vec2): boolean {
  const area = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  return Math.abs(area) < EPS;
}

function removeColinearEdges(points: Vec2[]): Vec2[] {
  if (points.length < 3) return points;
  const result: Vec2[] = [];
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const prev = points[(i - 1 + n) % n];
    const curr = points[i];
    const next = points[(i + 1) % n];
    if (!areColinear(prev, curr, next)) result.push(curr);
  }
  return result;
}

function isValidPolygon(points: Vec2[]): boolean {
  for (const p of points) if (!Number.isFinite(p[0]) || !Number.isFinite(p[1])) return false;
  let cleaned = removeDuplicatePoints(points);
  if (cleaned.length < 3) return false;
  cleaned = removeColinearEdges(cleaned);
  if (cleaned.length < 3) return false;
  const n = cleaned.length;
  const epsSq = EPS * EPS;
  for (let i = 0; i < n; i++) {
    const a = cleaned[i], b = cleaned[(i + 1) % n];
    const dx = b[0] - a[0], dy = b[1] - a[1];
    if (dx * dx + dy * dy < epsSq) return false;
  }
  for (let i = 0; i < n; i++) {
    const a1 = cleaned[i], a2 = cleaned[(i + 1) % n];
    for (let j = i + 2; j < n; j++) {
      const b1 = cleaned[j], b2 = cleaned[(j + 1) % n];
      if (j === i + 1 || (i === 0 && j === n - 1)) continue;
      const d1 = (b2[0] - b1[0]) * (a1[1] - b1[1]) - (b2[1] - b1[1]) * (a1[0] - b1[0]);
      const d2 = (b2[0] - b1[0]) * (a2[1] - b1[1]) - (b2[1] - b1[1]) * (a2[0] - b1[0]);
      const d3 = (a2[0] - a1[0]) * (b1[1] - a1[1]) - (a2[1] - a1[1]) * (b1[0] - a1[0]);
      const d4 = (a2[0] - a1[0]) * (b2[1] - a1[1]) - (a2[1] - a1[1]) * (b2[0] - a1[0]);
      if (d1 * d2 < -EPS && d3 * d4 < -EPS) return false;
    }
  }
  return true;
}

function signedPolygonArea(points: Vec2[]): number {
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i][0] * points[j][1];
    area -= points[j][0] * points[i][1];
  }
  return area / 2;
}

function polygonCentroid(points: Vec2[]): Vec2 | null {
  let signedArea = 0, cx = 0, cy = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    const a = points[i][0] * points[j][1] - points[j][0] * points[i][1];
    signedArea += a;
    cx += (points[i][0] + points[j][0]) * a;
    cy += (points[i][1] + points[j][1]) * a;
  }
  signedArea /= 2;
  if (Math.abs(signedArea) < EPS) return null;
  const factor = 1 / (6 * signedArea);
  return [cx * factor, cy * factor];
}

function buildNodePositionMap(nodes: { position: Vec2 }[]): Map<string, number> {
  const map = new Map<string, number>();
  const invTol = 1 / NODE_TOL;
  for (let i = 0; i < nodes.length; i++) {
    const p = nodes[i].position;
    const key = `${Math.round(p[0] * invTol)},${Math.round(p[1] * invTol)}`;
    map.set(key, i);
  }
  return map;
}

function findNodeIndex(position: Vec2, nodeMap: Map<string, number>, nodes: { position: Vec2 }[]): number {
  const invTol = 1 / NODE_TOL;
  const key = `${Math.round(position[0] * invTol)},${Math.round(position[1] * invTol)}`;
  const idx = nodeMap.get(key);
  if (idx !== undefined) return idx;
  const tolSq = NODE_TOL * NODE_TOL;
  for (let i = 0; i < nodes.length; i++) {
    if (vec2.distanceSq(nodes[i].position, position) < tolSq) return i;
  }
  return -1;
}

export const RoomDetection = {
  detectRooms(graph: WallGraph, walls: Wall[]): Room[] {
    try {
      if (walls.length === 0) return [];
      const nodes = graph.nodes;
      if (nodes.length === 0) return [];

      const nodePositionMap = buildNodePositionMap(nodes);
      const adj: { to: number; angle: number; wallIdx: number }[][] = Array.from({ length: nodes.length }, () => []);
      const wallToNodes = new Map<number, { start: number; end: number }>();

      for (let i = 0; i < walls.length; i++) {
        const wall = walls[i];
        const startNode = findNodeIndex(wall.start, nodePositionMap, nodes);
        const endNode = findNodeIndex(wall.end, nodePositionMap, nodes);
        if (startNode !== -1 && endNode !== -1) {
          wallToNodes.set(i, { start: startNode, end: endNode });
        }
      }

      for (const [wallIdx, { start, end }] of wallToNodes) {
        const dir = vec2.sub(walls[wallIdx].end, walls[wallIdx].start);
        const angleStart = Math.atan2(dir[1], dir[0]);
        const angleEnd = Math.atan2(-dir[1], -dir[0]);
        adj[start].push({ to: end, angle: angleStart, wallIdx });
        adj[end].push({ to: start, angle: angleEnd, wallIdx });
      }

      for (let i = 0; i < nodes.length; i++) adj[i].sort((a, b) => a.angle - b.angle);

      const findNext = (u: number, v: number): { nextNode: number; nextWallIdx: number } | null => {
        const edges = adj[v];
        if (!edges || edges.length < 2) return null;
        const idx = edges.findIndex(e => e.to === u);
        if (idx === -1) return null;
        const nextIdx = (idx - 1 + edges.length) % edges.length;
        return { nextNode: edges[nextIdx].to, nextWallIdx: edges[nextIdx].wallIdx };
      };

      const visited = new Set<string>();
      const rooms: Room[] = [];
      const faceSignatures = new Set<string>();
      const MAX_STEPS = 2000;

      for (let u = 0; u < nodes.length; u++) {
        for (const edge of adj[u]) {
          const v = edge.to;
          const startKey = `${u},${v}`;
          if (visited.has(startKey)) continue;

          const faceNodesRaw: Vec2[] = [];
          const faceEdges: { u: number; v: number }[] = [];
          let currentU = u, currentV = v;
          let isValid = true;
          let steps = 0;

          while (steps < MAX_STEPS) {
            const key = `${currentU},${currentV}`;
            if (visited.has(key)) { isValid = false; break; }
            visited.add(key);
            faceEdges.push({ u: currentU, v: currentV });
            if (faceNodesRaw.length === 0) faceNodesRaw.push(nodes[currentU].position);
            faceNodesRaw.push(nodes[currentV].position);

            const next = findNext(currentU, currentV);
            if (!next) { isValid = false; break; }
            const nextU = currentV, nextV = next.nextNode;
            if (nextU === u && nextV === v) break;
            currentU = nextU; currentV = nextV;
            steps++;
          }

          if (steps >= MAX_STEPS) isValid = false;

          if (isValid && faceNodesRaw.length >= 3) {
            const cleaned = removeColinearEdges(removeDuplicatePoints(faceNodesRaw));
            if (isValidPolygon(cleaned)) {
              const signedArea = signedPolygonArea(cleaned);
              const area = Math.abs(signedArea);
              if (area > MIN_ROOM_AREA && area < MAX_AREA_THRESHOLD && signedArea > 0) {
                const nodeIndices = faceEdges.map(e => e.u);
                const canonical = normalizePolygon(nodeIndices);
                const sig = canonical.join(',');
                if (!faceSignatures.has(sig)) {
                  faceSignatures.add(sig);
                  let center = polygonCentroid(cleaned);
                  if (!center) {
                    let sumX = 0, sumY = 0;
                    for (const p of cleaned) { sumX += p[0]; sumY += p[1]; }
                    center = [sumX / cleaned.length, sumY / cleaned.length];
                  }
                  rooms.push({ id: uuidv4(), points: cleaned, area, center });
                }
              }
            }
          }
        }
      }
      return rooms;
    } catch (err) {
      console.warn('Room detection error:', err);
      return [];
    }
  },
};
