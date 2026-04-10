// Snap Worker - Handles snapping calculations off the main thread

export interface SnapTask {
  id: string;
  type: 'point' | 'line' | 'grid' | 'angle' | 'object' | 'all';
  data: {
    point: { x: number; y: number };
    walls?: any[];
    furniture?: any[];
    gridSize?: number;
    snapDistance?: number;
    angleSnap?: number;
    excludeId?: string;
  };
}

export interface SnapResult {
  id: string;
  success: boolean;
  snapPoint?: { x: number; y: number };
  snapType?: string;
  snapTarget?: any;
  distance?: number;
  error?: string;
  executionTime: number;
}

// Snap types
interface SnapCandidate {
  point: { x: number; y: number };
  type: string;
  target?: any;
  distance: number;
  priority: number;
}

// Distance calculation
function distance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

// Point to line distance
function pointToLineDistance(
  point: { x: number; y: number },
  lineStart: { x: number; y: number },
  lineEnd: { x: number; y: number }
): { distance: number; closestPoint: { x: number; y: number } } {
  const A = point.x - lineStart.x;
  const B = point.y - lineStart.y;
  const C = lineEnd.x - lineStart.x;
  const D = lineEnd.y - lineStart.y;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  if (lenSq !== 0) {
    param = dot / lenSq;
  }

  let xx, yy;

  if (param < 0) {
    xx = lineStart.x;
    yy = lineStart.y;
  } else if (param > 1) {
    xx = lineEnd.x;
    yy = lineEnd.y;
  } else {
    xx = lineStart.x + param * C;
    yy = lineStart.y + param * D;
  }

  const dx = point.x - xx;
  const dy = point.y - yy;

  return {
    distance: Math.sqrt(dx * dx + dy * dy),
    closestPoint: { x: xx, y: yy }
  };
}

// Grid snap
function snapToGrid(
  point: { x: number; y: number },
  gridSize: number
): { x: number; y: number } {
  return {
    x: Math.round(point.x / gridSize) * gridSize,
    y: Math.round(point.y / gridSize) * gridSize
  };
}

// Angle snap
function snapToAngle(
  startPoint: { x: number; y: number },
  endPoint: { x: number; y: number },
  angleSnap: number
): { x: number; y: number } {
  const dx = endPoint.x - startPoint.x;
  const dy = endPoint.y - startPoint.y;
  const angle = Math.atan2(dy, dx);
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Snap angle to nearest multiple of angleSnap
  const snappedAngle = Math.round(angle / angleSnap) * angleSnap;

  return {
    x: startPoint.x + Math.cos(snappedAngle) * distance,
    y: startPoint.y + Math.sin(snappedAngle) * distance
  };
}

// Snap to wall endpoints
function snapToWallEndpoints(
  point: { x: number; y: number },
  walls: any[],
  snapDistance: number,
  excludeId?: string
): SnapCandidate[] {
  const candidates: SnapCandidate[] = [];

  for (const wall of walls) {
    if (wall.id === excludeId) continue;

    // Check start point
    const startDist = distance(point, wall.start);
    if (startDist <= snapDistance) {
      candidates.push({
        point: wall.start,
        type: 'wall-endpoint',
        target: { wall, point: 'start' },
        distance: startDist,
        priority: 1
      });
    }

    // Check end point
    const endDist = distance(point, wall.end);
    if (endDist <= snapDistance) {
      candidates.push({
        point: wall.end,
        type: 'wall-endpoint',
        target: { wall, point: 'end' },
        distance: endDist,
        priority: 1
      });
    }
  }

  return candidates;
}

// Snap to wall lines
function snapToWallLines(
  point: { x: number; y: number },
  walls: any[],
  snapDistance: number,
  excludeId?: string
): SnapCandidate[] {
  const candidates: SnapCandidate[] = [];

  for (const wall of walls) {
    if (wall.id === excludeId) continue;

    const { distance: dist, closestPoint } = pointToLineDistance(
      point,
      wall.start,
      wall.end
    );

    if (dist <= snapDistance) {
      candidates.push({
        point: closestPoint,
        type: 'wall-line',
        target: wall,
        distance: dist,
        priority: 2
      });
    }
  }

  return candidates;
}

// Snap to furniture
function snapToFurniture(
  point: { x: number; y: number },
  furniture: any[],
  snapDistance: number,
  excludeId?: string
): SnapCandidate[] {
  const candidates: SnapCandidate[] = [];

  for (const item of furniture) {
    if (item.id === excludeId) continue;

    // Snap to furniture center
    const centerDist = distance(point, item.position);
    if (centerDist <= snapDistance) {
      candidates.push({
        point: item.position,
        type: 'furniture-center',
        target: item,
        distance: centerDist,
        priority: 3
      });
    }

    // Snap to furniture corners
    const halfWidth = item.width / 2;
    const halfDepth = item.depth / 2;
    const cos = Math.cos(item.rotation);
    const sin = Math.sin(item.rotation);

    const corners = [
      { x: -halfWidth, y: -halfDepth },
      { x: halfWidth, y: -halfDepth },
      { x: halfWidth, y: halfDepth },
      { x: -halfWidth, y: halfDepth }
    ];

    for (const corner of corners) {
      const rotatedCorner = {
        x: item.position.x + corner.x * cos - corner.y * sin,
        y: item.position.y + corner.x * sin + corner.y * cos
      };

      const cornerDist = distance(point, rotatedCorner);
      if (cornerDist <= snapDistance) {
        candidates.push({
          point: rotatedCorner,
          type: 'furniture-corner',
          target: item,
          distance: cornerDist,
          priority: 2
        });
      }
    }
  }

  return candidates;
}

// Snap to intersection points
function snapToIntersections(
  point: { x: number; y: number },
  walls: any[],
  snapDistance: number
): SnapCandidate[] {
  const candidates: SnapCandidate[] = [];
  const intersections: { x: number; y: number }[] = [];

  // Find all wall intersections
  for (let i = 0; i < walls.length; i++) {
    for (let j = i + 1; j < walls.length; j++) {
      const intersection = lineIntersection(
        walls[i].start,
        walls[i].end,
        walls[j].start,
        walls[j].end
      );

      if (intersection) {
        intersections.push(intersection);
      }
    }
  }

  // Check distance to intersections
  for (const intersection of intersections) {
    const dist = distance(point, intersection);
    if (dist <= snapDistance) {
      candidates.push({
        point: intersection,
        type: 'intersection',
        distance: dist,
        priority: 1
      });
    }
  }

  return candidates;
}

// Line intersection
function lineIntersection(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
  p4: { x: number; y: number }
): { x: number; y: number } | null {
  const x1 = p1.x, y1 = p1.y;
  const x2 = p2.x, y2 = p2.y;
  const x3 = p3.x, y3 = p3.y;
  const x4 = p4.x, y4 = p4.y;

  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

  if (Math.abs(denom) < 1e-10) {
    return null;
  }

  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return {
      x: x1 + t * (x2 - x1),
      y: y1 + t * (y2 - y1)
    };
  }

  return null;
}

// Perpendicular snap
function snapPerpendicular(
  point: { x: number; y: number },
  walls: any[],
  snapDistance: number
): SnapCandidate[] {
  const candidates: SnapCandidate[] = [];

  for (const wall of walls) {
    const { distance: dist, closestPoint } = pointToLineDistance(
      point,
      wall.start,
      wall.end
    );

    if (dist <= snapDistance) {
      // Check if the snap point is actually on the wall segment
      const wallLength = distance(wall.start, wall.end);
      const distToStart = distance(closestPoint, wall.start);
      const distToEnd = distance(closestPoint, wall.end);

      if (distToStart <= wallLength && distToEnd <= wallLength) {
        candidates.push({
          point: closestPoint,
          type: 'perpendicular',
          target: wall,
          distance: dist,
          priority: 2
        });
      }
    }
  }

  return candidates;
}

// Main snap function
function findBestSnap(
  point: { x: number; y: number },
  data: SnapTask['data']
): { snapPoint: { x: number; y: number }; snapType: string; snapTarget?: any; distance: number } | null {
  const candidates: SnapCandidate[] = [];
  const snapDistance = data.snapDistance || 0.5;

  // Grid snap (always considered)
  if (data.gridSize && data.gridSize > 0) {
    const gridPoint = snapToGrid(point, data.gridSize);
    const gridDist = distance(point, gridPoint);
    if (gridDist <= snapDistance) {
      candidates.push({
        point: gridPoint,
        type: 'grid',
        distance: gridDist,
        priority: 5
      });
    }
  }

  // Wall snaps
  if (data.walls && data.walls.length > 0) {
    candidates.push(...snapToWallEndpoints(point, data.walls, snapDistance, data.excludeId));
    candidates.push(...snapToWallLines(point, data.walls, snapDistance, data.excludeId));
    candidates.push(...snapToIntersections(point, data.walls, snapDistance));
    candidates.push(...snapPerpendicular(point, data.walls, snapDistance));
  }

  // Furniture snaps
  if (data.furniture && data.furniture.length > 0) {
    candidates.push(...snapToFurniture(point, data.furniture, snapDistance, data.excludeId));
  }

  // Sort by priority and distance
  candidates.sort((a, b) => {
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    return a.distance - b.distance;
  });

  // Return the best candidate
  if (candidates.length > 0) {
    const best = candidates[0];
    return {
      snapPoint: best.point,
      snapType: best.type,
      snapTarget: best.target,
      distance: best.distance
    };
  }

  return null;
}

// Main message handler
self.onmessage = (event: MessageEvent<SnapTask>) => {
  const startTime = performance.now();
  const { id, type, data } = event.data;

  try {
    let result: { snapPoint: { x: number; y: number }; snapType: string; snapTarget?: any; distance: number } | null = null;

    switch (type) {
      case 'point':
        result = findBestSnap(data.point, data);
        break;

      case 'grid':
        if (data.gridSize) {
          const gridPoint = snapToGrid(data.point, data.gridSize);
          result = {
            snapPoint: gridPoint,
            snapType: 'grid',
            distance: distance(data.point, gridPoint)
          };
        }
        break;

      case 'line':
        if (data.walls) {
          const lineSnaps = snapToWallLines(data.point, data.walls, data.snapDistance || 0.5, data.excludeId);
          if (lineSnaps.length > 0) {
            const best = lineSnaps[0];
            result = {
              snapPoint: best.point,
              snapType: best.type,
              snapTarget: best.target,
              distance: best.distance
            };
          }
        }
        break;

      case 'angle':
        if (data.walls && data.walls.length > 0) {
          const lastWall = data.walls[data.walls.length - 1];
          const angleSnap = data.angleSnap || (Math.PI / 4); // 45 degrees
          const snappedPoint = snapToAngle(lastWall.end, data.point, angleSnap);
          result = {
            snapPoint: snappedPoint,
            snapType: 'angle',
            distance: distance(data.point, snappedPoint)
          };
        }
        break;

      case 'object':
        if (data.walls) {
          const endpointSnaps = snapToWallEndpoints(data.point, data.walls, data.snapDistance || 0.5, data.excludeId);
          if (endpointSnaps.length > 0) {
            const best = endpointSnaps[0];
            result = {
              snapPoint: best.point,
              snapType: best.type,
              snapTarget: best.target,
              distance: best.distance
            };
          }
        }
        break;

      case 'all':
        result = findBestSnap(data.point, data);
        break;

      default:
        throw new Error(`Unknown snap task type: ${type}`);
    }

    const executionTime = performance.now() - startTime;

    if (result) {
      const response: SnapResult = {
        id,
        success: true,
        snapPoint: result.snapPoint,
        snapType: result.snapType,
        snapTarget: result.snapTarget,
        distance: result.distance,
        executionTime
      };
      self.postMessage(response);
    } else {
      const response: SnapResult = {
        id,
        success: true,
        executionTime
      };
      self.postMessage(response);
    }

  } catch (error) {
    const executionTime = performance.now() - startTime;

    const response: SnapResult = {
      id,
      success: false,
      error: error instanceof Error ? error.message : String(error),
      executionTime
    };

    self.postMessage(response);
  }
};

export {};
