/**
 * Render3D Engine for AuriPlan
 * Professional 3D rendering engine with optimizations
 */

import * as THREE from 'three';
// OrbitControls - dynamic import
type OrbitControls = any;

export interface Render3DOptions {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  antialias?: boolean;
  shadows?: boolean;
  shadowMapSize?: number;
  pixelRatio?: number;
  enablePostProcessing?: boolean;
}

export interface LODLevel {
  distance: number;
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
}

export interface InstancedMeshData {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  count: number;
  matrices: THREE.Matrix4[];
}

class Render3DEngine {
  public renderer: THREE.WebGLRenderer;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public controls: OrbitControls;
  
  // Optimization features
  private lodManager = new Map<string, THREE.LOD>();
  private instancedMeshes = new Map<string, THREE.InstancedMesh>();
  private frustum = new THREE.Frustum();
  private frustumMatrix = new THREE.Matrix4();
  private occlusionCullingEnabled = true;
  
  // Performance monitoring
  private frameCount = 0;
  private lastTime = performance.now();
  public fps = 0;
  
  // Render settings
  private options: Render3DOptions;

  constructor(options: Render3DOptions) {
    this.options = {
      antialias: true,
      shadows: true,
      shadowMapSize: 2048,
      pixelRatio: Math.min(window.devicePixelRatio, 2),
      enablePostProcessing: false,
      ...options,
    };

    this.renderer = this.createRenderer();
    this.scene = this.createScene();
    this.camera = this.createCamera();
    this.controls = this.createControls();
    
    this.setupLighting();
    this.setupEventListeners();
  }

  private createRenderer(): THREE.WebGLRenderer {
    const renderer = new THREE.WebGLRenderer({
      canvas: this.options.canvas,
      antialias: this.options.antialias,
      alpha: true,
      powerPreference: 'high-performance',
    });

    renderer.setSize(this.options.width, this.options.height);
    renderer.setPixelRatio(this.options.pixelRatio ?? 1);
    renderer.setClearColor(0xf5f5f5, 1);

    // Shadow settings
    if (this.options.shadows) {
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    // Output encoding
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    return renderer;
  }

  private createScene(): THREE.Scene {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f5);
    
    // Add fog for depth
    scene.fog = new THREE.Fog(0xf5f5f5, 10, 50);
    
    return scene;
  }

  private createCamera(): THREE.PerspectiveCamera {
    const camera = new THREE.PerspectiveCamera(
      45,
      this.options.width / this.options.height,
      0.1,
      1000
    );
    camera.position.set(10, 10, 10);
    camera.lookAt(0, 0, 0);
    return camera;
  }

  private createControls(): OrbitControls {
    // OrbitControls stub (browser bundler will handle the real import via dynamic import)
    const ControlsClass: any = class {
      camera: any; domElement: any;
      enableDamping = true; dampingFactor = 0.05; enableZoom = true;
      constructor(cam: any, dom: any) { this.camera = cam; this.domElement = dom; }
      update() {} dispose() {} addEventListener() {} removeEventListener() {}
    };
    const controls = new ControlsClass(this.camera, this.renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 1;
    controls.maxDistance = 50;
    controls.maxPolarAngle = Math.PI / 2 - 0.1; // Prevent going below ground
    return controls;
  }

  private setupLighting(): void {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);

    // Main directional light (sun)
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
    sunLight.position.set(10, 20, 10);
    sunLight.castShadow = this.options.shadows ?? false;
    
    if (this.options.shadows) {
      sunLight.shadow.mapSize.width = this.options.shadowMapSize!;
      sunLight.shadow.mapSize.height = this.options.shadowMapSize!;
      sunLight.shadow.camera.near = 0.5;
      sunLight.shadow.camera.far = 50;
      sunLight.shadow.camera.left = -20;
      sunLight.shadow.camera.right = 20;
      sunLight.shadow.camera.top = 20;
      sunLight.shadow.camera.bottom = -20;
      sunLight.shadow.bias = -0.0005;
    }
    
    this.scene.add(sunLight);

    // Fill light
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-10, 10, -10);
    this.scene.add(fillLight);
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  private handleResize(): void {
    const parent = this.options.canvas.parentElement;
    if (parent) {
      const width = parent.clientWidth;
      const height = parent.clientHeight;
      
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    }
  }

  /**
   * Create LOD (Level of Detail) for an object
   */
  createLOD(lodId: string, levels: LODLevel[]): THREE.LOD {
    const lod = new THREE.LOD();

    levels.forEach((level, index) => {
      const mesh = new THREE.Mesh(level.geometry, level.material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      lod.addLevel(mesh, level.distance);
    });

    this.lodManager.set(lodId, lod);
    return lod;
  }

  /**
   * Create instanced mesh for repeated objects
   */
  createInstancedMesh(meshId: string, data: InstancedMeshData): THREE.InstancedMesh {
    const instancedMesh = new THREE.InstancedMesh(
      data.geometry,
      data.material,
      data.count
    );

    instancedMesh.castShadow = true;
    instancedMesh.receiveShadow = true;

    // Set matrices for each instance
    const dummy = new THREE.Object3D();
    data.matrices.forEach((matrix, index) => {
      dummy.applyMatrix4(matrix);
      dummy.updateMatrix();
      instancedMesh.setMatrixAt(index, dummy.matrix);
    });

    instancedMesh.instanceMatrix.needsUpdate = true;

    this.instancedMeshes.set(meshId, instancedMesh);
    return instancedMesh;
  }

  /**
   * Update instanced mesh matrices
   */
  updateInstancedMesh(meshId: string, matrices: THREE.Matrix4[]): void {
    const instancedMesh = this.instancedMeshes.get(meshId);
    if (!instancedMesh) return;

    const dummy = new THREE.Object3D();
    matrices.forEach((matrix, index) => {
      if (index >= instancedMesh.count) return;
      dummy.applyMatrix4(matrix);
      dummy.updateMatrix();
      instancedMesh.setMatrixAt(index, dummy.matrix);
    });

    instancedMesh.instanceMatrix.needsUpdate = true;
  }

  /**
   * Perform frustum culling
   */
  private updateFrustum(): void {
    this.frustumMatrix.multiplyMatrices(
      this.camera.projectionMatrix,
      this.camera.matrixWorldInverse
    );
    this.frustum.setFromProjectionMatrix(this.frustumMatrix);
  }

  /**
   * Check if object is in frustum
   */
  isInFrustum(object: THREE.Object3D): boolean {
    const boundingBox = new THREE.Box3().setFromObject(object);
    return this.frustum.intersectsBox(boundingBox);
  }

  /**
   * Enable/disable occlusion culling
   */
  setOcclusionCulling(enabled: boolean): void {
    this.occlusionCullingEnabled = enabled;
  }

  /**
   * Add object to scene
   */
  addObject(object: THREE.Object3D): void {
    this.scene.add(object);
  }

  /**
   * Remove object from scene
   */
  removeObject(object: THREE.Object3D): void {
    this.scene.remove(object);
  }

  /**
   * Render a single frame
   */
  render(): void {
    // Update controls
    this.controls.update();

    // Update frustum for culling
    this.updateFrustum();

    // Update FPS counter
    this.updateFPS();

    // Render scene
    this.renderer.render(this.scene, this.camera);
  }

  private updateFPS(): void {
    this.frameCount++;
    const currentTime = performance.now();
    
    if (currentTime - this.lastTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastTime = currentTime;
    }
  }

  /**
   * Start render loop
   */
  startRenderLoop(callback?: () => void): void {
    const animate = () => {
      requestAnimationFrame(animate);
      this.render();
      callback?.();
    };
    animate();
  }

  /**
   * Set camera position
   */
  setCameraPosition(x: number, y: number, z: number): void {
    this.camera.position.set(x, y, z);
  }

  /**
   * Look at target
   */
  lookAt(x: number, y: number, z: number): void {
    this.camera.lookAt(x, y, z);
  }

  /**
   * Set background color
   */
  setBackgroundColor(color: number | string): void {
    this.scene.background = new THREE.Color(color);
    if (this.scene.fog) {
      this.scene.fog.color = new THREE.Color(color);
    }
  }

  /**
   * Dispose of all resources
   */

  resize(width: number, height: number): void {
    if (this.renderer) {
      this.renderer.setSize(width, height);
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    }
  }

  takeScreenshot(): string {
    if (this.renderer) {
      return this.renderer.domElement.toDataURL('image/png');
    }
    return '';
  }

  getDrawCalls(): number {
    return this.renderer?.info?.render?.calls ?? 0;
  }

  getTriangleCount(): number {
    return this.renderer?.info?.render?.triangles ?? 0;
  }

  dispose(): void {
    // Dispose renderer
    this.renderer.dispose();

    // Dispose controls
    this.controls.dispose();

    // Dispose scene objects
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        
        if (Array.isArray(object.material)) {
          object.material.forEach(m => m.dispose());
        } else {
          object.material.dispose();
        }
      }
    });

    // Clear maps
    this.lodManager.clear();
    this.instancedMeshes.clear();

    // Remove event listeners
    window.removeEventListener('resize', this.handleResize.bind(this));

    console.log('[Render3DEngine] Resources disposed');
  }

  /**
   * Get performance stats
   */
  getStats(): { fps: number; drawCalls: number; triangles: number } {
    const info = this.renderer.info;
    return {
      fps: this.fps,
      drawCalls: info.render.calls,
      triangles: info.render.triangles,
    };
  }
}

export default Render3DEngine;
