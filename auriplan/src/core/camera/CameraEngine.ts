// ============================================
// Camera Engine - Camera control and management
// ============================================

import type { Vec2, Vec3, CameraState } from '@auriplan-types';
import { vec2, vec3, numeric } from '@core/math/vector';

export interface CameraConfig {
  minZoom: number;
  maxZoom: number;
  zoomStep: number;
  panSpeed: number;
  rotateSpeed: number;
  fov: number;
  near: number;
  far: number;
}

export const DEFAULT_CAMERA_CONFIG: CameraConfig = {
  minZoom: 0.1,
  maxZoom: 10,
  zoomStep: 1.2,
  panSpeed: 1,
  rotateSpeed: 0.01,
  fov: 50,
  near: 0.1,
  far: 1000,
};

export class CameraEngine {
  private state: CameraState;
  private config: CameraConfig;
  private isOrtho: boolean = false;
  private orthoZoom: number = 10;

  constructor(config: Partial<CameraConfig> = {}) {
    this.config = { ...DEFAULT_CAMERA_CONFIG, ...config };
    this.state = {
      position: [10, 10, 10],
      target: [0, 0, 0],
      zoom: 1,
      fov: this.config.fov,
      near: this.config.near,
      far: this.config.far,
    };
  }

  // Get current state
  getState(): CameraState {
    return { ...this.state };
  }

  // Set state
  setState(state: Partial<CameraState>): void {
    this.state = { ...this.state, ...state };
  }

  // Reset to default
  reset(): void {
    this.state = {
      position: [10, 10, 10],
      target: [0, 0, 0],
      zoom: 1,
      fov: this.config.fov,
      near: this.config.near,
      far: this.config.far,
    };
  }

  // Zoom in
  zoomIn(): void {
    this.state.zoom = Math.min(
      this.state.zoom * this.config.zoomStep,
      this.config.maxZoom
    );
  }

  // Zoom out
  zoomOut(): void {
    this.state.zoom = Math.max(
      this.state.zoom / this.config.zoomStep,
      this.config.minZoom
    );
  }

  // Set zoom level
  setZoom(zoom: number): void {
    this.state.zoom = numeric.clamp(zoom, this.config.minZoom, this.config.maxZoom);
  }

  // Pan camera
  pan(delta: Vec2): void {
    const right = this.getRightVector();
    const up = this.getUpVector();

    const panX = vec3.mul(right, -delta[0] * this.config.panSpeed / this.state.zoom);
    const panY = vec3.mul(up, delta[1] * this.config.panSpeed / this.state.zoom);

    this.state.position = vec3.add(vec3.add(this.state.position, panX), panY);
    this.state.target = vec3.add(vec3.add(this.state.target, panX), panY);
  }

  // Pan to specific point
  panTo(point: Vec3): void {
    const offset = vec3.sub(this.state.position, this.state.target);
    this.state.target = [...point];
    this.state.position = vec3.add(point, offset);
  }

  // Orbit around target
  orbit(deltaX: number, deltaY: number): void {
    const offset = vec3.sub(this.state.position, this.state.target);
    const radius = vec3.length(offset);

    // Calculate spherical coordinates
    let theta = Math.atan2(offset[0], offset[2]);
    let phi = Math.acos(numeric.clamp(offset[1] / radius, -1, 1));

    // Update angles
    theta += deltaX * this.config.rotateSpeed;
    phi = numeric.clamp(
      phi - deltaY * this.config.rotateSpeed,
      0.1,
      Math.PI - 0.1
    );

    // Convert back to Cartesian
    const newOffset: Vec3 = [
      radius * Math.sin(phi) * Math.sin(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.cos(theta),
    ];

    this.state.position = vec3.add(this.state.target, newOffset);
  }

  // Look at specific point
  lookAt(point: Vec3): void {
    this.state.target = [...point];
    
    // Maintain distance
    const offset = vec3.sub(this.state.position, this.state.target);
    const distance = vec3.length(offset);
    const direction = vec3.normalize(offset);
    
    this.state.position = vec3.add(this.state.target, vec3.mul(direction, distance));
  }

  // Fit view to bounds
  fitToBounds(bounds: { min: Vec3; max: Vec3 }): void {
    const center: Vec3 = [
      (bounds.min[0] + bounds.max[0]) / 2,
      (bounds.min[1] + bounds.max[1]) / 2,
      (bounds.min[2] + bounds.max[2]) / 2,
    ];

    const size: Vec3 = [
      bounds.max[0] - bounds.min[0],
      bounds.max[1] - bounds.min[1],
      bounds.max[2] - bounds.min[2],
    ];

    const maxSize = Math.max(size[0], size[1], size[2]);
    const fov = this.state.fov ?? this.config.fov;
    const distance = maxSize / (2 * Math.tan(numeric.degToRad(fov / 2)));

    this.state.target = center;
    this.state.position = [center[0], center[1] + distance, center[2] + distance];
    this.state.zoom = 1;
  }

  // Get view direction
  getViewDirection(): Vec3 {
    return vec3.normalize(vec3.sub(this.state.target, this.state.position));
  }

  // Get right vector
  getRightVector(): Vec3 {
    const forward = this.getViewDirection();
    const up: Vec3 = [0, 1, 0];
    return vec3.normalize(vec3.cross(forward, up));
  }

  // Get up vector
  getUpVector(): Vec3 {
    const forward = this.getViewDirection();
    const right = this.getRightVector();
    return vec3.normalize(vec3.cross(right, forward));
  }

  // Convert screen to world coordinates (for raycasting)
  screenToWorld(
    screenX: number,
    screenY: number,
    viewportWidth: number,
    viewportHeight: number
  ): { origin: Vec3; direction: Vec3 } {
    // Normalized device coordinates
    const ndcX = (screenX / viewportWidth) * 2 - 1;
    const ndcY = -(screenY / viewportHeight) * 2 + 1;

    // Calculate ray direction
    const forward = this.getViewDirection();
    const right = this.getRightVector();
    const up = this.getUpVector();

    const aspect = viewportWidth / viewportHeight;
    const tanFov = Math.tan(numeric.degToRad((this.state.fov ?? this.config.fov) / 2));

    const rayDir = vec3.normalize([
      forward[0] + right[0] * ndcX * tanFov * aspect + up[0] * ndcY * tanFov,
      forward[1] + right[1] * ndcX * tanFov * aspect + up[1] * ndcY * tanFov,
      forward[2] + right[2] * ndcX * tanFov * aspect + up[2] * ndcY * tanFov,
    ]);

    return {
      origin: [...this.state.position],
      direction: rayDir,
    };
  }

  // World to screen coordinates
  worldToScreen(
    point: Vec3,
    viewportWidth: number,
    viewportHeight: number
  ): Vec2 | null {
    const viewMatrix = this.getViewMatrix();
    const projectionMatrix = this.getProjectionMatrix(viewportWidth, viewportHeight);

    // Transform point
    const viewPoint = this.transformPoint(point, viewMatrix);
    
    if (viewPoint[2] > 0) return null; // Behind camera

    const clipPoint = this.transformPoint(viewPoint, projectionMatrix);

    return [
      (clipPoint[0] + 1) * 0.5 * viewportWidth,
      (1 - clipPoint[1]) * 0.5 * viewportHeight,
    ];
  }

  // Get view matrix
  private getViewMatrix(): number[] {
    const forward = this.getViewDirection();
    const right = this.getRightVector();
    const up = this.getUpVector();

    // Simplified view matrix (column-major)
    return [
      right[0], up[0], -forward[0], 0,
      right[1], up[1], -forward[1], 0,
      right[2], up[2], -forward[2], 0,
      -vec3.dot(right, this.state.position),
      -vec3.dot(up, this.state.position),
      vec3.dot(forward, this.state.position),
      1,
    ];
  }

  // Get projection matrix
  private getProjectionMatrix(width: number, height: number): number[] {
    const aspect = width / height;
    const fovRad = numeric.degToRad(this.state.fov ?? this.config.fov);
    const f = 1 / Math.tan(fovRad / 2);
    const near = this.state.near ?? this.config.near;
    const far = this.state.far ?? this.config.far;
    const nf = 1 / (near - far);

    return [
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (far + near) * nf, -1,
      0, 0, 2 * far * near * nf, 0,
    ];
  }

  // Transform point by matrix
  private transformPoint(point: Vec3, matrix: number[]): Vec3 {
    const x = point[0];
    const y = point[1];
    const z = point[2];

    return [
      x * matrix[0] + y * matrix[4] + z * matrix[8] + matrix[12],
      x * matrix[1] + y * matrix[5] + z * matrix[9] + matrix[13],
      x * matrix[2] + y * matrix[6] + z * matrix[10] + matrix[14],
    ];
  }

  // Toggle orthographic/perspective
  toggleProjection(): void {
    this.isOrtho = !this.isOrtho;
  }

  // Check if orthographic
  isOrthographic(): boolean {
    return this.isOrtho;
  }

  // Serialize state
  serialize(): string {
    return JSON.stringify({
      state: this.state,
      isOrtho: this.isOrtho,
      orthoZoom: this.orthoZoom,
    });
  }

  // Deserialize state
  deserialize(serialized: string): void {
    const data = JSON.parse(serialized);
    this.state = data.state;
    this.isOrtho = data.isOrtho;
    this.orthoZoom = data.orthoZoom;
  }
}
