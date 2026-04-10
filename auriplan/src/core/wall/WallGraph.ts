// ============================================
// FILE: src/core/wall/WallGraph.ts
// ============================================
// CORRIGIDO: remove duplicações geométricas, usa vec2 do math/vector
// ============================================

import type { Vec2, Wall } from '@auriplan-types';
import {
  GEOM_TOL,
  EPS,
  ANGLE_TOL,
  OPPOSITE_ANGLE_TOL,
  MAX_MITER_FACTOR,
} from '@core/geometry/geometryConstants';
import { vec2, geometry } from '@core/math/vector';

// ======================== TIPOS DA ENGINE ========================
export interface WallIncident {
  wallIndex: number;
  side: 'start' | 'end';
  dir: Vec2;
  angle: number;
  wall: Wall;
  leftPoint: Vec2;
  rightPoint: Vec2;
  leftLine: [Vec2, Vec2];
  rightLine: [Vec2, Vec2];
}

export interface WallGraphNode {
  position: Vec2;
  incidents: WallIncident[];
}

export interface WallGraph {
  nodes: WallGraphNode[];
  junctions: Map<number, JunctionInfo>;
}

export type JunctionType = 'L' | 'T' | 'X' | 'none';

export interface JunctionInfo {
  nodeIndex: number;
  type: JunctionType;
  incidents: WallIncident[];
}

export function createEmptyWallGraph(): WallGraph {
  return { nodes: [], junctions: new Map() };
}

const computeWallOffsets = (wall: Wall) => {
  const dx = wall.end[0] - wall.start[0];
  const dy = wall.end[1] - wall.start[1];
  const length = Math.hypot(dx, dy);
  if (length < EPS) return null;
  const nx = -dy / length;
  const ny = dx / length;
  const half = wall.thickness / 2;
  return {
    p1: [wall.start[0] + nx * half, wall.start[1] + ny * half] as Vec2,
    p2: [wall.start[0] - nx * half, wall.start[1] - ny * half] as Vec2,
    p3: [wall.end[0] - nx * half, wall.end[1] - ny * half] as Vec2,
    p4: [wall.end[0] + nx * half, wall.end[1] + ny * half] as Vec2,
  };
};

const areOppositeAngles = (a: number, b: number): boolean => {
  let diff = Math.abs(a - b);
  diff = Math.min(diff, 2 * Math.PI - diff);
  return Math.abs(diff - Math.PI) <= OPPOSITE_ANGLE_TOL;
};

export function buildGraph(walls: Wall[]): WallGraph {
  const n = walls.length;
  if (n === 0) return createEmptyWallGraph();

  // Cluster endpoints usando GEOM_TOL (O(n²) aceitável pois número de nós pequeno)
  const nodes: Vec2[] = [];
  const endpointToNodeIdx = new Map<string, number>();

  const findOrCreateNode = (p: Vec2): number => {
    for (let i = 0; i < nodes.length; i++) {
      if (vec2.distance(nodes[i], p) <= GEOM_TOL) return i;
    }
    const idx = nodes.length;
    nodes.push([p[0], p[1]]);
    return idx;
  };

  for (let i = 0; i < n; i++) {
    const w = walls[i];
    const startIdx = findOrCreateNode(w.start);
    const endIdx = findOrCreateNode(w.end);
    endpointToNodeIdx.set(`${i}-s`, startIdx);
    endpointToNodeIdx.set(`${i}-e`, endIdx);
  }

  const offsets = new Array(n);
  for (let i = 0; i < n; i++) {
    offsets[i] = computeWallOffsets(walls[i]);
  }

  const nodeToIncidents = new Map<number, WallIncident[]>();

  for (let i = 0; i < n; i++) {
    const w = walls[i];
    const off = offsets[i];
    if (!off) continue;

    const dirRaw = vec2.normalize(vec2.sub(w.end, w.start));
    if (dirRaw[0] === 0 && dirRaw[1] === 0) continue;

    const startNode = endpointToNodeIdx.get(`${i}-s`)!;
    const startDir: Vec2 = dirRaw;
    const startAngle = Math.atan2(startDir[1], startDir[0]);
    const startIncident: WallIncident = {
      wallIndex: i, side: 'start', dir: startDir, angle: startAngle, wall: w,
      leftPoint: off.p1, rightPoint: off.p2,
      leftLine: [off.p1, off.p4], rightLine: [off.p2, off.p3],
    };
    if (!nodeToIncidents.has(startNode)) nodeToIncidents.set(startNode, []);
    nodeToIncidents.get(startNode)!.push(startIncident);

    const endNode = endpointToNodeIdx.get(`${i}-e`)!;
    const endDir: Vec2 = [-dirRaw[0], -dirRaw[1]];
    const endAngle = Math.atan2(endDir[1], endDir[0]);
    const endIncident: WallIncident = {
      wallIndex: i, side: 'end', dir: endDir, angle: endAngle, wall: w,
      leftPoint: off.p4, rightPoint: off.p3,
      leftLine: [off.p4, off.p1], rightLine: [off.p3, off.p2],
    };
    if (!nodeToIncidents.has(endNode)) nodeToIncidents.set(endNode, []);
    nodeToIncidents.get(endNode)!.push(endIncident);
  }

  const graphNodes: WallGraphNode[] = nodes.map((pos, idx) => ({
    position: pos,
    incidents: nodeToIncidents.get(idx) || [],
  }));

  const junctionInfoMap = new Map<number, JunctionInfo>();

  for (const [nodeIdx, incidents] of nodeToIncidents) {
    const m = incidents.length;
    if (m < 2) continue;

    incidents.sort((a, b) => {
      const diff = a.angle - b.angle;
      if (Math.abs(diff) < ANGLE_TOL) {
        if (a.wallIndex !== b.wallIndex) return a.wallIndex - b.wallIndex;
        return a.side === 'start' ? -1 : 1;
      }
      return diff;
    });

    let type: JunctionType = 'none';

    if (m === 2) {
      type = 'L';
    } else if (m === 3) {
      const angles = incidents.map(i => i.angle);
      let legIdx = -1;
      for (let j = 0; j < m; j++) {
        let oppositeFound = false;
        for (let k = 0; k < m; k++) {
          if (j === k) continue;
          if (areOppositeAngles(angles[j], angles[k])) {
            oppositeFound = true;
            break;
          }
        }
        if (!oppositeFound) { legIdx = j; break; }
      }
      if (legIdx !== -1) type = 'T';
    } else if (m === 4) {
      const angles = incidents.map(i => i.angle);
      const pairs: number[][] = [];
      for (let i = 0; i < 4; i++) {
        for (let j = i + 1; j < 4; j++) {
          if (areOppositeAngles(angles[i], angles[j])) pairs.push([i, j]);
        }
      }
      if (pairs.length === 2 && pairs[0][0] !== pairs[1][0] && pairs[0][0] !== pairs[1][1] &&
          pairs[0][1] !== pairs[1][0] && pairs[0][1] !== pairs[1][1]) {
        type = 'X';
      }
    }

    junctionInfoMap.set(nodeIdx, { nodeIndex: nodeIdx, type, incidents: [...incidents] });
  }

  return { nodes: graphNodes, junctions: junctionInfoMap };
}

export function computeCornerAdjustments(
  graph: WallGraph,
  walls: Wall[]
): Map<number, { start?: { left?: Vec2; right?: Vec2 }; end?: { left?: Vec2; right?: Vec2 } }> {
  const adjustments = new Map();
  for (const [nodeIdx, info] of graph.junctions) {
    const incidents = info.incidents;
    const m = incidents.length;
    if (m < 2) continue;

    for (let i = 0; i < m; i++) {
      const curr = incidents[i];
      const maxDist = curr.wall.thickness * MAX_MITER_FACTOR;

      let finalLeft = curr.leftPoint;
      let finalRight = curr.rightPoint;

      if (info.type === 'L') {
        const prev = incidents[(i - 1 + m) % m];
        const next = incidents[(i + 1) % m];

        const leftInt = geometry.lineIntersection(curr.leftLine[0], curr.leftLine[1], prev.leftLine[0], prev.leftLine[1]);
        if (leftInt && vec2.distance(leftInt, curr.leftPoint) < maxDist) finalLeft = leftInt;
        const rightInt = geometry.lineIntersection(curr.rightLine[0], curr.rightLine[1], next.rightLine[0], next.rightLine[1]);
        if (rightInt && vec2.distance(rightInt, curr.rightPoint) < maxDist) finalRight = rightInt;
      } else if (info.type === 'T') {
        const angles = incidents.map(inc => inc.angle);
        let legIdx = -1;
        for (let j = 0; j < m; j++) {
          let oppositeFound = false;
          for (let k = 0; k < m; k++) {
            if (j === k) continue;
            if (areOppositeAngles(angles[j], angles[k])) { oppositeFound = true; break; }
          }
          if (!oppositeFound) { legIdx = j; break; }
        }
        if (legIdx === -1) continue;

        if (i === legIdx) {
          const barWalls = incidents.filter((_, idx) => idx !== legIdx);
          const leftCandidates: Vec2[] = [];
          for (const bar of barWalls) {
            const int = geometry.lineIntersection(curr.leftLine[0], curr.leftLine[1], bar.leftLine[0], bar.leftLine[1]);
            if (int) leftCandidates.push(int);
          }
          if (leftCandidates.length) {
            let best = leftCandidates[0], bestDist = vec2.distance(best, curr.leftPoint);
            for (const cand of leftCandidates) {
              const d = vec2.distance(cand, curr.leftPoint);
              if (d < bestDist) { bestDist = d; best = cand; }
            }
            if (bestDist < maxDist) finalLeft = best;
          }
          const rightCandidates: Vec2[] = [];
          for (const bar of barWalls) {
            const int = geometry.lineIntersection(curr.rightLine[0], curr.rightLine[1], bar.rightLine[0], bar.rightLine[1]);
            if (int) rightCandidates.push(int);
          }
          if (rightCandidates.length) {
            let best = rightCandidates[0], bestDist = vec2.distance(best, curr.rightPoint);
            for (const cand of rightCandidates) {
              const d = vec2.distance(cand, curr.rightPoint);
              if (d < bestDist) { bestDist = d; best = cand; }
            }
            if (bestDist < maxDist) finalRight = best;
          }
        } else {
          const leg = incidents[legIdx];
          const leftInt = geometry.lineIntersection(curr.leftLine[0], curr.leftLine[1], leg.leftLine[0], leg.leftLine[1]);
          if (leftInt && vec2.distance(leftInt, curr.leftPoint) < maxDist) finalLeft = leftInt;
          const rightInt = geometry.lineIntersection(curr.rightLine[0], curr.rightLine[1], leg.rightLine[0], leg.rightLine[1]);
          if (rightInt && vec2.distance(rightInt, curr.rightPoint) < maxDist) finalRight = rightInt;
        }
      } else if (info.type === 'X') {
        let oppositeIdx = -1;
        for (let idx = 0; idx < m; idx++) {
          if (idx === i) continue;
          if (areOppositeAngles(curr.angle, incidents[idx].angle)) { oppositeIdx = idx; break; }
        }
        if (oppositeIdx !== -1) {
          const opp = incidents[oppositeIdx];
          const leftInt = geometry.lineIntersection(curr.leftLine[0], curr.leftLine[1], opp.leftLine[0], opp.leftLine[1]);
          if (leftInt && vec2.distance(leftInt, curr.leftPoint) < maxDist) finalLeft = leftInt;
          const rightInt = geometry.lineIntersection(curr.rightLine[0], curr.rightLine[1], opp.rightLine[0], opp.rightLine[1]);
          if (rightInt && vec2.distance(rightInt, curr.rightPoint) < maxDist) finalRight = rightInt;
        }
      }

      if (!Number.isFinite(finalLeft[0]) || !Number.isFinite(finalLeft[1])) finalLeft = curr.leftPoint;
      if (!Number.isFinite(finalRight[0]) || !Number.isFinite(finalRight[1])) finalRight = curr.rightPoint;

      let wallAdj = adjustments.get(curr.wallIndex);
      if (!wallAdj) { wallAdj = {}; adjustments.set(curr.wallIndex, wallAdj); }
      const sideKey = curr.side;
      if (!wallAdj[sideKey]) wallAdj[sideKey] = {};
      wallAdj[sideKey]!.left = finalLeft;
      wallAdj[sideKey]!.right = finalRight;
    }
  }
  return adjustments;
}
