import { EventEmitter } from '../utils/EventEmitter';

/**
 * Room Scanner for AuriPlan
 * Scans physical rooms using device camera
 */

export interface ScanPoint {
  x: number;
  y: number;
  z: number;
  confidence: number;
}

export interface DetectedWall {
  id: string;
  start: { x: number; y: number };
  end: { x: number; y: number };
  length: number;
  angle: number;
}

export interface DetectedCorner {
  id: string;
  position: { x: number; y: number };
  angle: number;
}

export interface RoomScanResult {
  id: string;
  timestamp: number;
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  walls: DetectedWall[];
  corners: DetectedCorner[];
  floorArea: number;
  ceilingHeight: number;
  confidence: number;
  rawPoints: ScanPoint[];
}

export interface ScanProgress {
  stage: 'initializing' | 'detecting' | 'processing' | 'complete';
  progress: number; // 0-100
  message: string;
}

export type ScanCallback = (progress: ScanProgress) => void;

export class RoomScanner extends EventEmitter {
  private isScanning = false;
  private scanResult: RoomScanResult | null = null;
  private callbacks: ScanCallback[] = [];
  private videoElement: HTMLVideoElement | null = null;

  constructor() {
      super();
    }

    /**
     * Check if room scanning is supported
     */
  isSupported(): boolean {
    // Check for required APIs
    return !!(
      (navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia) ||
      (window as any).BarcodeDetector ||
      (window as any).FaceDetector
    );
  }

  /**
   * Check for AR support (WebXR)
   */
  hasARSupport(): boolean {
    return 'xr' in navigator && !!(navigator as any).xr;
  }

  /**
   * Start room scanning
   */
  async startScan(onProgress?: ScanCallback): Promise<RoomScanResult> {
    if (this.isScanning) {
      throw new Error('Scan already in progress');
    }

    if (onProgress) {
      this.callbacks.push(onProgress);
    }

    this.isScanning = true;
    this.notifyProgress('initializing', 0, 'Initializing camera...');

    try {
      // Get camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });

      this.notifyProgress('detecting', 20, 'Detecting room features...');

      // Simulate scanning process (in production, use AR/ML APIs)
      const result = await this.performScan(stream);

      this.notifyProgress('processing', 80, 'Processing scan data...');

      // Process and refine results
      this.scanResult = this.processScanResult(result);

      this.notifyProgress('complete', 100, 'Scan complete!');

      // Stop camera
      stream.getTracks().forEach(track => track.stop());

      this.isScanning = false;
      return this.scanResult;

    } catch (error) {
      this.isScanning = false;
      throw error;
    }
  }

  /**
   * Perform the actual scan
   */
  private async performScan(stream: MediaStream): Promise<any> {
    // In production, this would use:
    // - WebXR for AR scanning
    // - TensorFlow.js for object detection
    // - Computer vision algorithms for edge detection

    // Simulate scan delay
    await this.delay(2000);

    // Return simulated scan data
    return {
      points: this.generateSimulatedPoints(),
      timestamp: Date.now(),
    };
  }

  /**
   * Generate simulated scan points
   */
  private generateSimulatedPoints(): ScanPoint[] {
    const points: ScanPoint[] = [];
    
    // Simulate a rectangular room (4m x 5m)
    const roomWidth = 4;
    const roomDepth = 5;
    const ceilingHeight = 2.7;

    // Generate floor points
    for (let i = 0; i < 50; i++) {
      points.push({
        x: Math.random() * roomWidth,
        y: 0,
        z: Math.random() * roomDepth,
        confidence: 0.8 + Math.random() * 0.2,
      });
    }

    // Generate wall points
    for (let i = 0; i < 100; i++) {
      const wall = Math.floor(Math.random() * 4);
      const height = Math.random() * ceilingHeight;
      
      switch (wall) {
        case 0: // Front wall
          points.push({
            x: Math.random() * roomWidth,
            y: height,
            z: 0,
            confidence: 0.7 + Math.random() * 0.3,
          });
          break;
        case 1: // Right wall
          points.push({
            x: roomWidth,
            y: height,
            z: Math.random() * roomDepth,
            confidence: 0.7 + Math.random() * 0.3,
          });
          break;
        case 2: // Back wall
          points.push({
            x: Math.random() * roomWidth,
            y: height,
            z: roomDepth,
            confidence: 0.7 + Math.random() * 0.3,
          });
          break;
        case 3: // Left wall
          points.push({
            x: 0,
            y: height,
            z: Math.random() * roomDepth,
            confidence: 0.7 + Math.random() * 0.3,
          });
          break;
      }
    }

    return points;
  }

  /**
   * Process raw scan data
   */
  private processScanResult(rawData: any): RoomScanResult {
    const points = rawData.points as ScanPoint[];

    // Detect walls from points
    const walls = this.detectWalls(points);
    const corners = this.detectCorners(walls);

    // Calculate dimensions
    const bounds = this.calculateBounds(points);
    const floorArea = bounds.width * bounds.depth;

    return {
      id: `scan-${Date.now()}`,
      timestamp: Date.now(),
      dimensions: {
        width: bounds.width,
        height: bounds.height,
        depth: bounds.depth,
      },
      walls,
      corners,
      floorArea,
      ceilingHeight: bounds.height,
      confidence: this.calculateConfidence(points),
      rawPoints: points,
    };
  }

  /**
   * Detect walls from point cloud
   */
  private detectWalls(points: ScanPoint[]): DetectedWall[] {
    // Simplified wall detection
    // In production, use RANSAC or similar algorithms

    const walls: DetectedWall[] = [];
    
    // Group points by approximate wall planes
    const wallGroups = this.groupPointsByPlanes(points);

    wallGroups.forEach((group, index) => {
      if (group.length < 10) return;

      // Fit line to wall points
      const line = this.fitLineToPoints(group);
      
      walls.push({
        id: `wall-${index}`,
        start: line.start,
        end: line.end,
        length: Math.sqrt(
          Math.pow(line.end.x - line.start.x, 2) +
          Math.pow(line.end.y - line.start.y, 2)
        ),
        angle: Math.atan2(line.end.y - line.start.y, line.end.x - line.start.x),
      });
    });

    return walls;
  }

  /**
   * Group points by wall planes
   */
  private groupPointsByPlanes(points: ScanPoint[]): ScanPoint[][] {
    // Simplified grouping - in production use proper plane detection
    const groups: ScanPoint[][] = [[], [], [], []];

    points.forEach(point => {
      if (point.y < 0.1) return; // Skip floor points

      // Determine which wall the point belongs to
      const centerX = 2; // Approximate center
      const centerZ = 2.5;

      if (point.z < 0.5) groups[0].push(point); // Front
      else if (point.x > 3.5) groups[1].push(point); // Right
      else if (point.z > 4.5) groups[2].push(point); // Back
      else if (point.x < 0.5) groups[3].push(point); // Left
    });

    return groups;
  }

  /**
   * Fit line to points
   */
  private fitLineToPoints(points: ScanPoint[]): { start: { x: number; y: number }; end: { x: number; y: number } } {
    // Simple line fitting - use least squares in production
    const xValues = points.map(p => p.x);
    const zValues = points.map(p => p.z);

    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    const minZ = Math.min(...zValues);
    const maxZ = Math.max(...zValues);

    // Determine if wall is more horizontal or vertical
    const xRange = maxX - minX;
    const zRange = maxZ - minZ;

    if (xRange > zRange) {
      return {
        start: { x: minX, y: minZ },
        end: { x: maxX, y: maxZ },
      };
    } else {
      return {
        start: { x: minX, y: minZ },
        end: { x: maxX, y: maxZ },
      };
    }
  }

  /**
   * Detect corners from walls
   */
  private detectCorners(walls: DetectedWall[]): DetectedCorner[] {
    const corners: DetectedCorner[] = [];

    // Find intersections between walls
    for (let i = 0; i < walls.length; i++) {
      for (let j = i + 1; j < walls.length; j++) {
        const intersection = this.findWallIntersection(walls[i], walls[j]);
        if (intersection) {
          corners.push({
            id: `corner-${corners.length}`,
            position: intersection,
            angle: Math.abs(walls[i].angle - walls[j].angle),
          });
        }
      }
    }

    return corners;
  }

  /**
   * Find intersection between two walls
   */
  private findWallIntersection(wall1: DetectedWall, wall2: DetectedWall): { x: number; y: number } | null {
    // Line intersection calculation
    const x1 = wall1.start.x;
    const y1 = wall1.start.y;
    const x2 = wall1.end.x;
    const y2 = wall1.end.y;
    const x3 = wall2.start.x;
    const y3 = wall2.start.y;
    const x4 = wall2.end.x;
    const y4 = wall2.end.y;

    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (Math.abs(denom) < 0.001) return null; // Parallel lines

    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
      return {
        x: x1 + t * (x2 - x1),
        y: y1 + t * (y2 - y1),
      };
    }

    return null;
  }

  /**
   * Calculate bounds from points
   */
  private calculateBounds(points: ScanPoint[]): { width: number; height: number; depth: number } {
    const xValues = points.map(p => p.x);
    const yValues = points.map(p => p.y);
    const zValues = points.map(p => p.z);

    return {
      width: Math.max(...xValues) - Math.min(...xValues),
      height: Math.max(...yValues) - Math.min(...yValues),
      depth: Math.max(...zValues) - Math.min(...zValues),
    };
  }

  /**
   * Calculate overall confidence
   */
  private calculateConfidence(points: ScanPoint[]): number {
    if (points.length === 0) return 0;
    const avgConfidence = points.reduce((sum, p) => sum + p.confidence, 0) / points.length;
    return Math.round(avgConfidence * 100) / 100;
  }

  /**
   * Notify progress callbacks
   */
  private notifyProgress(stage: ScanProgress['stage'], progress: number, message: string): void {
    const progressData: ScanProgress = { stage, progress, message };
      this.callbacks.forEach(cb => cb(progressData));
      this.emit('progress', progressData);
      if (stage === 'complete') {
        this.emit('scanComplete', this.scanResult);
      }
  }

  /**
   * Get last scan result
   */
  getLastScan(): RoomScanResult | null {
    return this.scanResult;
  }

  /**
   * Stop scanning
   */
  stopScan(): void {
    this.isScanning = false;
    this.callbacks = [];
  }


    /**
     * Initialize scanner with a video element (for fallback/camera mode)
     */
    async initialize(videoElement?: HTMLVideoElement): Promise<void> {
      this.videoElement = videoElement ?? null;
      // Initialization complete – scanner is ready
    }

    /**
     * Alias for startScan (used by ARSessionManager)
     */
    async startScanning(onProgress?: ScanCallback): Promise<RoomScanResult> {
      return this.startScan(onProgress);
    }

    /**
     * Alias for stopScan (used by ARSessionManager)
     * Returns the last scan result after stopping
     */
    async stopScanning(): Promise<RoomScanResult | null> {
      this.stopScan();
      return this.scanResult;
    }

    /**
     * Cleanup resources
     */
    dispose(): void {
      this.isScanning = false;
      this.callbacks = [];
      this.videoElement = null;
      this.removeAllListeners();
    }

    /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const roomScanner = new RoomScanner();
export default roomScanner;
