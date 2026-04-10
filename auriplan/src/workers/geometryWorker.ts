// Geometry Worker - Handles complex geometric calculations off the main thread

export interface GeometryTask {
  id: string;
  type: 'intersect' | 'union' | 'difference' | 'buffer' | 'simplify' | 'triangulate' | 'extrude' | 'pointInPolygon' | 'polygonArea' | 'findIntersections';
  data: any;
}

export interface GeometryResult {
  id: string;
  success: boolean;
  data?: any;
  error?: string;
  executionTime: number;
}

// Point operations
interface Point { x: number; y: number; }

function distance(p1: Point, p2: Point): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

function pointToLineDistance(point: Point, lineStart: Point, lineEnd: Point): number {
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

  return Math.sqrt(dx * dx + dy * dy);
}

// Line intersection
function lineIntersection(
  p1: Point, p2: Point, 
  p3: Point, p4: Point
): Point | null {
  const x1 = p1.x, y1 = p1.y;
  const x2 = p2.x, y2 = p2.y;
  const x3 = p3.x, y3 = p3.y;
  const x4 = p4.x, y4 = p4.y;

  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

  if (Math.abs(denom) < 1e-10) {
    return null; // Lines are parallel
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

// Polygon operations
function polygonArea(points: Point[]): number {
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area) / 2;
}

function pointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;

    const intersect = ((yi > point.y) !== (yj > point.y)) &&
      (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);

    if (intersect) inside = !inside;
  }
  return inside;
}

// Triangulation (ear clipping algorithm)
function triangulate(polygon: Point[]): number[] {
  const indices: number[] = [];
  const n = polygon.length;
  
  if (n < 3) return indices;

  const V: number[] = [];
  if (polygonArea(polygon) > 0) {
    for (let v = 0; v < n; v++) V[v] = v;
  } else {
    for (let v = 0; v < n; v++) V[v] = (n - 1) - v;
  }

  let nv = n;
  let count = 2 * nv;

  for (let m = 0, v = nv - 1; nv > 2;) {
    if ((count--) <= 0) break;

    let u = v;
    if (nv <= u) u = 0;
    v = u + 1;
    if (nv <= v) v = 0;
    let w = v + 1;
    if (nv <= w) w = 0;

    if (snip(polygon, u, v, w, nv, V)) {
      indices.push(V[u], V[v], V[w]);
      m++;
      for (let s = v, t = v + 1; t < nv; s++, t++) V[s] = V[t];
      nv--;
      count = 2 * nv;
    }
  }

  return indices;
}

function snip(polygon: Point[], u: number, v: number, w: number, n: number, V: number[]): boolean {
  const A = polygon[V[u]];
  const B = polygon[V[v]];
  const C = polygon[V[w]];

  if (1e-10 > (B.x - A.x) * (C.y - A.y) - (B.y - A.y) * (C.x - A.x)) return false;

  for (let p = 0; p < n; p++) {
    if ((p === u) || (p === v) || (p === w)) continue;
    const P = polygon[V[p]];
    if (pointInTriangle(P, A, B, C)) return false;
  }

  return true;
}

function pointInTriangle(p: Point, a: Point, b: Point, c: Point): boolean {
  const ax = c.x - b.x, ay = c.y - b.y;
  const bx = a.x - c.x, by = a.y - c.y;
  const cx = b.x - a.x, cy = b.y - a.y;
  const apx = p.x - a.x, apy = p.y - a.y;
  const bpx = p.x - b.x, bpy = p.y - b.y;
  const cpx = p.x - c.x, cpy = p.y - c.y;

  const aCROSSbp = ax * bpy - ay * bpx;
  const cCROSSap = cx * apy - cy * apx;
  const bCROSScp = bx * cpy - by * cpx;

  return (aCROSSbp >= 0) && (bCROSScp >= 0) && (cCROSSap >= 0);
}

// Buffer operation (offset polygon)
function bufferPolygon(points: Point[], distance: number): Point[] {
  if (points.length < 3) return points;

  const result: Point[] = [];
  const n = points.length;

  for (let i = 0; i < n; i++) {
    const prev = points[(i - 1 + n) % n];
    const curr = points[i];
    const next = points[(i + 1) % n];

    // Calculate normals
    const v1x = curr.x - prev.x;
    const v1y = curr.y - prev.y;
    const v1Len = Math.sqrt(v1x * v1x + v1y * v1y);
    const n1x = -v1y / v1Len;
    const n1y = v1x / v1Len;

    const v2x = next.x - curr.x;
    const v2y = next.y - curr.y;
    const v2Len = Math.sqrt(v2x * v2x + v2y * v2y);
    const n2x = -v2y / v2Len;
    const n2y = v2x / v2Len;

    // Average normal
    const nx = (n1x + n2x) / 2;
    const ny = (n1y + n2y) / 2;
    const nLen = Math.sqrt(nx * nx + ny * ny);

    result.push({
      x: curr.x + (nx / nLen) * distance,
      y: curr.y + (ny / nLen) * distance
    });
  }

  return result;
}

// Simplify polygon (Douglas-Peucker algorithm)
function simplifyPolygon(points: Point[], tolerance: number): Point[] {
  if (points.length <= 2) return points;

  // Find the point with maximum distance
  let dmax = 0;
  let index = 0;
  const end = points.length - 1;

  for (let i = 1; i < end; i++) {
    const d = pointToLineDistance(points[i], points[0], points[end]);
    if (d > dmax) {
      index = i;
      dmax = d;
    }
  }

  // If max distance is greater than tolerance, recursively simplify
  if (dmax > tolerance) {
    const left = simplifyPolygon(points.slice(0, index + 1), tolerance);
    const right = simplifyPolygon(points.slice(index), tolerance);
    return left.slice(0, -1).concat(right);
  } else {
    return [points[0], points[end]];
  }
}

// Extrude 2D shape to 3D
function extrudeShape(shape: Point[], depth: number): { vertices: number[]; indices: number[] } {
  const vertices: number[] = [];
  const indices: number[] = [];
  const n = shape.length;

  // Top face vertices
  for (const p of shape) {
    vertices.push(p.x, depth, p.y);
  }

  // Bottom face vertices
  for (const p of shape) {
    vertices.push(p.x, 0, p.y);
  }

  // Top face indices
  const topIndices = triangulate(shape);
  indices.push(...topIndices);

  // Bottom face indices (reversed winding)
  for (let i = 0; i < topIndices.length; i += 3) {
    indices.push(
      topIndices[i] + n,
      topIndices[i + 2] + n,
      topIndices[i + 1] + n
    );
  }

  // Side faces
  for (let i = 0; i < n; i++) {
    const next = (i + 1) % n;
    const base = vertices.length / 3;

    // Side quad vertices
    vertices.push(
      shape[i].x, depth, shape[i].y,
      shape[next].x, depth, shape[next].y,
      shape[next].x, 0, shape[next].y,
      shape[i].x, 0, shape[i].y
    );

    // Side quad indices
    indices.push(
      base, base + 1, base + 2,
      base, base + 2, base + 3
    );
  }

  return { vertices, indices };
}

// Find all intersections between line segments
function findAllIntersections(segments: { start: Point; end: Point }[]): Point[] {
  const intersections: Point[] = [];

  for (let i = 0; i < segments.length; i++) {
    for (let j = i + 1; j < segments.length; j++) {
      const intersection = lineIntersection(
        segments[i].start, segments[i].end,
        segments[j].start, segments[j].end
      );
      if (intersection) {
        intersections.push(intersection);
      }
    }
  }

  return intersections;
}

// Main message handler
self.onmessage = (event: MessageEvent<GeometryTask>) => {
  const startTime = performance.now();
  const { id, type, data } = event.data;

  try {
    let result: any;

    switch (type) {
      case 'intersect':
        result = lineIntersection(data.p1, data.p2, data.p3, data.p4);
        break;

      case 'triangulate':
        result = triangulate(data.polygon);
        break;

      case 'buffer':
        result = bufferPolygon(data.polygon, data.distance);
        break;

      case 'simplify':
        result = simplifyPolygon(data.polygon, data.tolerance);
        break;

      case 'extrude':
        result = extrudeShape(data.shape, data.depth);
        break;

      case 'pointInPolygon':
        result = pointInPolygon(data.point, data.polygon);
        break;

      case 'polygonArea':
        result = polygonArea(data.polygon);
        break;

      case 'findIntersections':
        result = findAllIntersections(data.segments);
        break;

      default:
        throw new Error(`Unknown geometry task type: ${type}`);
    }

    const executionTime = performance.now() - startTime;

    const response: GeometryResult = {
      id,
      success: true,
      data: result,
      executionTime
    };

    self.postMessage(response);

  } catch (error) {
    const executionTime = performance.now() - startTime;

    const response: GeometryResult = {
      id,
      success: false,
      error: error instanceof Error ? error.message : String(error),
      executionTime
    };

    self.postMessage(response);
  }
};

export {};
