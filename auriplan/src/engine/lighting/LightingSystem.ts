/**
 * LightingSystem - wrapper for engine lighting
 */
import * as THREE from 'three';

export class LightingSystem {
  private scene: THREE.Scene;
  private lights: THREE.Light[] = [];
  private options: { maxLights?: number; shadows?: boolean };

  constructor(options?: { maxLights?: number; shadows?: boolean }) {
    this.options = options ?? {};
    this.scene = new THREE.Scene();
    this.setupDefaultLights();
  }

  private setupDefaultLights(): void {
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambient);
    this.lights.push(ambient);

    const directional = new THREE.DirectionalLight(0xffffff, 0.8);
    directional.position.set(10, 20, 10);
    if (this.options.shadows) {
      directional.castShadow = true;
    }
    this.scene.add(directional);
    this.lights.push(directional);
  }

  addToScene(scene: THREE.Scene): void {
    this.lights.forEach(light => scene.add(light));
  }

  update(_delta: number): void {}

  dispose(): void {
    this.lights.forEach(light => {
      this.scene.remove(light);
    });
    this.lights = [];
  }
}
