/**
 * CameraSystem - minimal camera system stub
 */
import * as THREE from 'three';

export class CameraSystem {
  private camera: THREE.PerspectiveCamera;

  constructor(config?: { fov?: number; aspect?: number; near?: number; far?: number; width?: number; height?: number }) {
    const aspect = config?.width && config?.height ? config.width / config.height : (config?.aspect ?? 1);
    this.camera = new THREE.PerspectiveCamera(
      config?.fov ?? 60,
      aspect,
      config?.near ?? 0.1,
      config?.far ?? 1000
    );
  }

  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  setAspect(aspect: number): void {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  resize(width: number, height: number): void {
    this.setAspect(width / height);
  }

  update(_delta: number): void {}

  dispose(): void {}
}
