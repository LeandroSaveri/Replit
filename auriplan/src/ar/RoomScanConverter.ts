/**
 * Room Scan Converter for AuriPlan
 * Converts scan results to floor plan format
 */

import { RoomScanResult, DetectedWall, DetectedCorner } from './RoomScanner';

export interface FloorPlanData {
  id: string;
  name: string;
  width: number;
  height: number;
  walls: WallData[];
  rooms: RoomData[];
  metadata: {
    source: 'scan';
    scanId: string;
    timestamp: number;
    confidence: number;
  };
}

export interface WallData {
  id: string;
  start: { x: number; y: number };
  end: { x: number; y: number };
  thickness: number;
  height: number;
}

export interface RoomData {
  id: string;
  name: string;
  type: string;
  points: { x: number; y: number }[];
  area: number;
  center: { x: number; y: number };
}

export class RoomScanConverter {
  private defaultWallThickness = 0.15; // 15cm
  private defaultWallHeight = 2.7; // 2.7m

  /**
   * Convert scan result to floor plan
   */
  convertToFloorPlan(scanResult: RoomScanResult): FloorPlanData {
    // Normalize wall coordinates
    const normalizedWalls = this.normalizeWalls(scanResult.walls);

    // Create wall data
    const walls = this.createWallData(normalizedWalls);

    // Detect rooms from walls
    const rooms = this.detectRooms(walls);

    // Calculate floor plan dimensions
    const bounds = this.calculateBounds(walls);

    return {
      id: `floorplan-${Date.now()}`,
      name: `Scanned Room ${new Date().toLocaleDateString()}`,
      width: bounds.width,
      height: bounds.height,
      walls,
      rooms,
      metadata: {
        source: 'scan',
        scanId: scanResult.id,
        timestamp: scanResult.timestamp,
        confidence: scanResult.confidence,
      },
    };
  }

  /**
   * Normalize wall coordinates to start from (0, 0)
   */
  private normalizeWalls(walls: DetectedWall[]): DetectedWall[] {
    // Find minimum x and y
    let minX = Infinity;
    let minY = Infinity;

    walls.forEach(wall => {
      minX = Math.min(minX, wall.start.x, wall.end.x);
      minY = Math.min(minY, wall.start.y, wall.end.y);
    });

    // Offset all walls
    return walls.map(wall => ({
      ...wall,
      start: {
        x: wall.start.x - minX,
        y: wall.start.y - minY,
      },
      end: {
        x: wall.end.x - minX,
        y: wall.end.y - minY,
      },
    }));
  }

  /**
   * Create wall data from detected walls
   */
  private createWallData(walls: DetectedWall[]): WallData[] {
    return walls.map((wall, index) => ({
      id: `wall-${index}`,
      start: wall.start,
      end: wall.end,
      thickness: this.defaultWallThickness,
      height: this.defaultWallHeight,
    }));
  }

  /**
   * Detect rooms from wall data
   */
  private detectRooms(walls: WallData[]): RoomData[] {
    // Find closed polygons formed by walls
    const polygons = this.findClosedPolygons(walls);

    return polygons.map((polygon, index) => {
      const area = this.calculatePolygonArea(polygon);
      const center = this.calculatePolygonCenter(polygon);

      // Determine room type based on area
      const roomType = this.determineRoomType(area);

      return {
        id: `room-${index}`,
        name: `${roomType} ${index + 1}`,
        type: roomType,
        points: polygon,
        area,
        center,
      };
    });
  }

  /**
   * Find closed polygons from walls
   */
  private findClosedPolygons(walls: WallData[]): Array<{ x: number; y: number }[]> {
    // Simplified polygon detection
    // In production, use proper computational geometry algorithms

    const polygons: Array<{ x: number; y: number }[]> = [];

    // Build adjacency graph
    const adjacency = this.buildAdjacencyGraph(walls);

    // Find cycles in graph (closed polygons)
    const visited = new Set<string>();
    const points = this.extractUniquePoints(walls);

    for (const startPoint of points) {
      if (visited.has(this.pointKey(startPoint))) continue;

      const polygon = this.tracePolygon(startPoint, adjacency, visited);
      if (polygon && polygon.length >= 3) {
        polygons.push(polygon);
      }
    }

    // If no polygons found, create one from outer walls
    if (polygons.length === 0) {
      const outerPolygon = this.createOuterPolygon(walls);
      if (outerPolygon.length >= 3) {
        polygons.push(outerPolygon);
      }
    }

    return polygons;
  }

  /**
   * Build adjacency graph from walls
   */
  private buildAdjacencyGraph(walls: WallData[]): Map<string, Array<{ x: number; y: number }>> {
    const graph = new Map<string, Array<{ x: number; y: number }>>();

    walls.forEach(wall => {
      const startKey = this.pointKey(wall.start);
      const endKey = this.pointKey(wall.end);

      if (!graph.has(startKey)) {
        graph.set(startKey, []);
      }
      if (!graph.has(endKey)) {
        graph.set(endKey, []);
      }

      graph.get(startKey)!.push(wall.end);
      graph.get(endKey)!.push(wall.start);
    });

    return graph;
  }

  /**
   * Extract unique points from walls
   */
  private extractUniquePoints(walls: WallData[]): Array<{ x: number; y: number }> {
    const points = new Map<string, { x: number; y: number }>();

    walls.forEach(wall => {
      points.set(this.pointKey(wall.start), wall.start);
      points.set(this.pointKey(wall.end), wall.end);
    });

    return Array.from(points.values());
  }

  /**
   * Trace polygon from starting point
   */
  private tracePolygon(
    start: { x: number; y: number },
    adjacency: Map<string, Array<{ x: number; y: number }>>,
    visited: Set<string>
  ): Array<{ x: number; y: number }> | null {
    const polygon: Array<{ x: number; y: number }> = [start];
    const startKey = this.pointKey(start);
    let current = start;
    let currentKey = startKey;

    visited.add(startKey);

    for (let i = 0; i < 100; i++) { // Max iterations
      const neighbors = adjacency.get(currentKey) || [];
      const unvisitedNeighbors = neighbors.filter(n => !visited.has(this.pointKey(n)));

      if (unvisitedNeighbors.length === 0) {
        // Check if we can close the polygon
        if (neighbors.some(n => this.pointKey(n) === startKey)) {
          return polygon;
        }
        break;
      }

      // Choose neighbor with smallest angle change
      const next = unvisitedNeighbors[0];
      polygon.push(next);
      current = next;
      currentKey = this.pointKey(next);
      visited.add(currentKey);
    }

    return null;
  }

  /**
   * Create outer polygon from walls
   */
  private createOuterPolygon(walls: WallData[]): Array<{ x: number; y: number }> {
    // Find convex hull of all wall endpoints
    const points = this.extractUniquePoints(walls);
    return this.convexHull(points);
  }

  /**
   * Calculate convex hull (Graham scan)
   */
  private convexHull(points: Array<{ x: number; y: number }>): Array<{ x: number; y: number }> {
    if (points.length < 3) return points;

    // Find lowest point
    let lowest = 0;
    for (let i = 1; i < points.length; i++) {
      if (points[i].y < points[lowest].y ||
          (points[i].y === points[lowest].y && points[i].x < points[lowest].x)) {
        lowest = i;
      }
    }

    // Swap lowest to front
    [points[0], points[lowest]] = [points[lowest], points[0]];
    const pivot = points[0];

    // Sort by polar angle
    const sorted = points.slice(1).sort((a, b) => {
      const angleA = Math.atan2(a.y - pivot.y, a.x - pivot.x);
      const angleB = Math.atan2(b.y - pivot.y, b.x - pivot.x);
      return angleA - angleB;
    });

    // Build hull
    const hull = [pivot, sorted[0]];
    for (let i = 1; i < sorted.length; i++) {
      while (hull.length > 1 && this.crossProduct(
        hull[hull.length - 2],
        hull[hull.length - 1],
        sorted[i]
      ) <= 0) {
        hull.pop();
      }
      hull.push(sorted[i]);
    }

    return hull;
  }

  /**
   * Calculate cross product
   */
  private crossProduct(
    o: { x: number; y: number },
    a: { x: number; y: number },
    b: { x: number; y: number }
  ): number {
    return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  }

  /**
   * Calculate polygon area
   */
  private calculatePolygonArea(points: Array<{ x: number; y: number }>): number {
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }
    return Math.abs(area) / 2;
  }

  /**
   * Calculate polygon center
   */
  private calculatePolygonCenter(points: Array<{ x: number; y: number }>): { x: number; y: number } {
    let x = 0;
    let y = 0;
    points.forEach(p => {
      x += p.x;
      y += p.y;
    });
    return {
      x: x / points.length,
      y: y / points.length,
    };
  }

  /**
   * Determine room type based on area
   */
  private determineRoomType(area: number): string {
    if (area < 5) return 'bathroom';
    if (area < 10) return 'bedroom';
    if (area < 15) return 'kitchen';
    if (area < 25) return 'living_room';
    return 'open_space';
  }

  /**
   * Calculate bounds of walls
   */
  private calculateBounds(walls: WallData[]): { width: number; height: number } {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    walls.forEach(wall => {
      minX = Math.min(minX, wall.start.x, wall.end.x);
      maxX = Math.max(maxX, wall.start.x, wall.end.x);
      minY = Math.min(minY, wall.start.y, wall.end.y);
      maxY = Math.max(maxY, wall.start.y, wall.end.y);
    });

    return {
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  /**
   * Create point key for map
   */
  private pointKey(point: { x: number; y: number }): string {
    return `${point.x.toFixed(3)},${point.y.toFixed(3)}`;
  }

  /**
   * Export floor plan to JSON
   */
  exportToJSON(floorPlan: FloorPlanData): string {
    return JSON.stringify(floorPlan, null, 2);
  }

  /**
   * Validate floor plan
   */
  validateFloorPlan(floorPlan: FloorPlanData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (floorPlan.walls.length === 0) {
      errors.push('No walls detected');
    }

    if (floorPlan.rooms.length === 0) {
      errors.push('No rooms detected');
    }

    if (floorPlan.metadata.confidence < 0.5) {
      errors.push('Low confidence scan - results may be inaccurate');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Alias for convertToFloorPlan (used by ARSessionManager)
   */
  async convertScanToFloorPlan(scanResult: RoomScanResult): Promise<FloorPlanData> {
    return this.convertToFloorPlan(scanResult);
  }
}

// Singleton instance
export const roomScanConverter = new RoomScanConverter();
export default roomScanConverter;

export interface ConversionOptions {
  scale?: number;
  minWallLength?: number;
  snapAngle?: number;
  mergeWalls?: boolean;

}
