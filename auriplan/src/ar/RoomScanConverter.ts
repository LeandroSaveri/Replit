/**
 * Room Scan Converter for AuriPlan
 * Converts scan results to EditorAction[] compatible with editorStore and GeometryPipeline
 */

import { RoomScanResult, DetectedWall, DetectedCorner } from './RoomScanner';
import type { EditorAction } from '../ai/contracts/EditorActionContract';

export interface ConversionOptions {
  /** Scale factor to apply to coordinates (default: 1.0) */
  scale?: number;
  /** Minimum wall length to consider (meters) */
  minWallLength?: number;
  /** Snap angle tolerance in degrees (default: 5) */
  snapAngle?: number;
  /** Whether to merge nearly collinear walls */
  mergeWalls?: boolean;
}

// Internal representation (kept private, not exposed)
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
  private defaultOptions: ConversionOptions = {
    scale: 1.0,
    minWallLength: 0.3,
    snapAngle: 5,
    mergeWalls: true,
  };

  /**
   * Convert scan result to EditorAction array
   * This is the main entry point for Phase 6 compliance.
   */
  convertScanToEditorActions(
    scanResult: RoomScanResult,
    options?: ConversionOptions
  ): EditorAction[] {
    const opts = { ...this.defaultOptions, ...options };
    
    // Validate scale and unit consistency
    this.validateScale(scanResult, opts.scale!);

    // Process scan into internal floor plan data (temporary)
    const floorPlan = this.buildFloorPlanData(scanResult, opts);
    
    // Generate EditorActions from the floor plan
    const actions: EditorAction[] = [];
    
    // 1. Action to load/clear floor plan (optional, depending on editor contract)
    // Assuming there is a 'loadFloorPlan' or 'reset' action. We'll create individual wall/room actions.
    // If a bulk load action exists, we could use it; otherwise create per-entity actions.
    
    // 2. Create walls
    for (const wall of floorPlan.walls) {
      // Convert wall data to EditorAction of type 'createWall'
      actions.push({
        type: 'createWall',
        payload: {
          id: wall.id,
          start: { x: wall.start.x, y: wall.start.y },
          end: { x: wall.end.x, y: wall.end.y },
          thickness: wall.thickness,
          height: wall.height,
        },
      });
    }
    
    // 3. Create rooms (if editor supports room creation via actions)
    for (const room of floorPlan.rooms) {
      actions.push({
        type: 'createRoom',
        payload: {
          id: room.id,
          name: room.name,
          type: room.type,
          points: room.points,
        },
      });
    }
    
    // Optionally, add a metadata action for the scan source
    actions.push({
      type: 'setMetadata',
      payload: {
        source: 'ar-scan',
        scanId: scanResult.id,
        confidence: scanResult.confidence,
      },
    });
    
    return actions;
  }

  /**
   * Validate that the scan data is within expected scale/unit (meters)
   */
  private validateScale(scanResult: RoomScanResult, scale: number): void {
    const { dimensions } = scanResult;
    // Typical room dimensions: width/depth between 1m and 30m
    if (dimensions.width < 0.5 || dimensions.width > 50) {
      console.warn(`Suspicious room width: ${dimensions.width}m. Check unit/scale.`);
    }
    if (dimensions.depth < 0.5 || dimensions.depth > 50) {
      console.warn(`Suspicious room depth: ${dimensions.depth}m. Check unit/scale.`);
    }
    // Apply scale if needed (here we assume scan is in meters, but could be adjusted)
    // Actually scaling is applied to coordinates during normalization.
  }

  /**
   * Build internal FloorPlanData from scan (used as intermediate step)
   */
  private buildFloorPlanData(scanResult: RoomScanResult, options: ConversionOptions): FloorPlanData {
    // Normalize and scale wall coordinates
    const normalizedWalls = this.normalizeWalls(scanResult.walls, options.scale!);
    
    // Filter and merge walls if requested
    let processedWalls = this.filterShortWalls(normalizedWalls, options.minWallLength!);
    if (options.mergeWalls) {
      processedWalls = this.mergeCollinearWalls(processedWalls, options.snapAngle!);
    }
    
    // Snap angles to common increments (0°, 90°, etc.)
    processedWalls = this.snapWallAngles(processedWalls, options.snapAngle!);
    
    // Create wall data
    const walls = this.createWallData(processedWalls);
    
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
   * Normalize wall coordinates to start from (0,0) and apply scale
   */
  private normalizeWalls(walls: DetectedWall[], scale: number): DetectedWall[] {
    if (walls.length === 0) return [];
    
    let minX = Infinity;
    let minY = Infinity;
    
    walls.forEach(wall => {
      minX = Math.min(minX, wall.start.x, wall.end.x);
      minY = Math.min(minY, wall.start.y, wall.end.y);
    });
    
    return walls.map(wall => ({
      ...wall,
      start: {
        x: (wall.start.x - minX) * scale,
        y: (wall.start.y - minY) * scale,
      },
      end: {
        x: (wall.end.x - minX) * scale,
        y: (wall.end.y - minY) * scale,
      },
    }));
  }

  /**
   * Filter out walls that are too short
   */
  private filterShortWalls(walls: DetectedWall[], minLength: number): DetectedWall[] {
    return walls.filter(wall => {
      const dx = wall.end.x - wall.start.x;
      const dy = wall.end.y - wall.start.y;
      const length = Math.sqrt(dx*dx + dy*dy);
      return length >= minLength;
    });
  }

  /**
   * Merge nearly collinear walls
   */
  private mergeCollinearWalls(walls: DetectedWall[], angleToleranceDeg: number): DetectedWall[] {
    // Simplified: In production, implement proper merging based on distance and angle.
    // For now, return as-is to avoid complexity.
    return walls;
  }

  /**
   * Snap wall angles to nearest orthogonal or 45-degree increment
   */
  private snapWallAngles(walls: DetectedWall[], toleranceDeg: number): DetectedWall[] {
    const toleranceRad = (toleranceDeg * Math.PI) / 180;
    const snapAngles = [0, Math.PI/2, Math.PI, 3*Math.PI/2, Math.PI/4, 3*Math.PI/4, 5*Math.PI/4, 7*Math.PI/4];
    
    return walls.map(wall => {
      const dx = wall.end.x - wall.start.x;
      const dy = wall.end.y - wall.start.y;
      const length = Math.sqrt(dx*dx + dy*dy);
      if (length < 0.001) return wall;
      
      let angle = Math.atan2(dy, dx);
      // Find nearest snap angle
      let bestAngle = angle;
      let minDiff = Infinity;
      for (const snap of snapAngles) {
        let diff = Math.abs(angle - snap);
        // Handle wrap-around
        diff = Math.min(diff, Math.abs(angle - (snap + 2*Math.PI)));
        diff = Math.min(diff, Math.abs(angle - (snap - 2*Math.PI)));
        if (diff < minDiff) {
          minDiff = diff;
          bestAngle = snap;
        }
      }
      
      if (minDiff <= toleranceRad) {
        // Adjust end point to snap angle while preserving length
        const newDx = Math.cos(bestAngle) * length;
        const newDy = Math.sin(bestAngle) * length;
        return {
          ...wall,
          end: {
            x: wall.start.x + newDx,
            y: wall.start.y + newDy,
          },
          angle: bestAngle,
        };
      }
      return wall;
    });
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
    const polygons = this.findClosedPolygons(walls);
    
    return polygons.map((polygon, index) => {
      const area = this.calculatePolygonArea(polygon);
      const center = this.calculatePolygonCenter(polygon);
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
    const polygons: Array<{ x: number; y: number }[]> = [];
    const adjacency = this.buildAdjacencyGraph(walls);
    const visited = new Set<string>();
    const points = this.extractUniquePoints(walls);
    
    for (const startPoint of points) {
      if (visited.has(this.pointKey(startPoint))) continue;
      const polygon = this.tracePolygon(startPoint, adjacency, visited);
      if (polygon && polygon.length >= 3) {
        polygons.push(polygon);
      }
    }
    
    if (polygons.length === 0) {
      const outerPolygon = this.createOuterPolygon(walls);
      if (outerPolygon.length >= 3) {
        polygons.push(outerPolygon);
      }
    }
    
    return polygons;
  }

  private buildAdjacencyGraph(walls: WallData[]): Map<string, Array<{ x: number; y: number }>> {
    const graph = new Map<string, Array<{ x: number; y: number }>>();
    walls.forEach(wall => {
      const startKey = this.pointKey(wall.start);
      const endKey = this.pointKey(wall.end);
      if (!graph.has(startKey)) graph.set(startKey, []);
      if (!graph.has(endKey)) graph.set(endKey, []);
      graph.get(startKey)!.push(wall.end);
      graph.get(endKey)!.push(wall.start);
    });
    return graph;
  }

  private extractUniquePoints(walls: WallData[]): Array<{ x: number; y: number }> {
    const points = new Map<string, { x: number; y: number }>();
    walls.forEach(wall => {
      points.set(this.pointKey(wall.start), wall.start);
      points.set(this.pointKey(wall.end), wall.end);
    });
    return Array.from(points.values());
  }

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
    
    for (let i = 0; i < 100; i++) {
      const neighbors = adjacency.get(currentKey) || [];
      const unvisitedNeighbors = neighbors.filter(n => !visited.has(this.pointKey(n)));
      if (unvisitedNeighbors.length === 0) {
        if (neighbors.some(n => this.pointKey(n) === startKey)) {
          return polygon;
        }
        break;
      }
      const next = unvisitedNeighbors[0];
      polygon.push(next);
      current = next;
      currentKey = this.pointKey(next);
      visited.add(currentKey);
    }
    return null;
  }

  private createOuterPolygon(walls: WallData[]): Array<{ x: number; y: number }> {
    const points = this.extractUniquePoints(walls);
    return this.convexHull(points);
  }

  private convexHull(points: Array<{ x: number; y: number }>): Array<{ x: number; y: number }> {
    if (points.length < 3) return points;
    let lowest = 0;
    for (let i = 1; i < points.length; i++) {
      if (points[i].y < points[lowest].y ||
          (points[i].y === points[lowest].y && points[i].x < points[lowest].x)) {
        lowest = i;
      }
    }
    [points[0], points[lowest]] = [points[lowest], points[0]];
    const pivot = points[0];
    const sorted = points.slice(1).sort((a, b) => {
      const angleA = Math.atan2(a.y - pivot.y, a.x - pivot.x);
      const angleB = Math.atan2(b.y - pivot.y, b.x - pivot.x);
      return angleA - angleB;
    });
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

  private crossProduct(o: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }): number {
    return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  }

  private calculatePolygonArea(points: Array<{ x: number; y: number }>): number {
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }
    return Math.abs(area) / 2;
  }

  private calculatePolygonCenter(points: Array<{ x: number; y: number }>): { x: number; y: number } {
    let x = 0, y = 0;
    points.forEach(p => { x += p.x; y += p.y; });
    return { x: x / points.length, y: y / points.length };
  }

  private determineRoomType(area: number): string {
    if (area < 5) return 'bathroom';
    if (area < 10) return 'bedroom';
    if (area < 15) return 'kitchen';
    if (area < 25) return 'living_room';
    return 'open_space';
  }

  private calculateBounds(walls: WallData[]): { width: number; height: number } {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    walls.forEach(wall => {
      minX = Math.min(minX, wall.start.x, wall.end.x);
      maxX = Math.max(maxX, wall.start.x, wall.end.x);
      minY = Math.min(minY, wall.start.y, wall.end.y);
      maxY = Math.max(maxY, wall.start.y, wall.end.y);
    });
    return { width: maxX - minX, height: maxY - minY };
  }

  private pointKey(point: { x: number; y: number }): string {
    return `${point.x.toFixed(3)},${point.y.toFixed(3)}`;
  }
}

// Singleton instance
export const roomScanConverter = new RoomScanConverter();
export default roomScanConverter;
