/**
 * Render3D Engine for AuriPlan
 * Professional 3D rendering engine with optimizations
 */

import * as THREE from 'three';
import { ObjectPoolManager } from './ObjectPoolManager';
import { ScenePartitionManager } from './ScenePartitionManager';

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
  
  private lodManager = new Map<string, THREE.LOD>();
  private instancedMeshes = new Map<string, THREE.InstancedMesh>();
  private frustum = new THREE.Frustum();
  private frustumMatrix = new THREE.Matrix4();
  private occlusionCullingEnabled = true;
  
  private frameCount = 0;
  private lastTime = performance.now();
  public fps = 0;
  
  private options: Render3DOptions;

  // Gerenciadores de performance (uso interno)
  private objectPoolManager: ObjectPoolManager;
  private partitionManager: ScenePartitionManager;

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

    // Inicializa sistemas de otimização
    this.objectPoolManager = new ObjectPoolManager();
    this.partitionManager = new ScenePartitionManager({ cellSize: 5 });
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

    if (this.options.shadows) {
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    return renderer;
  }

  private createScene(): THREE.Scene {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f5);
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
    controls.maxPolarAngle = Math.PI / 2 - 0.1;
    return controls;
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);

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

  createLOD(lodId: string, levels: LODLevel[]): THREE.LOD {
    const lod = new THREE.LOD();
    levels.forEach((level) => {
      const mesh = new THREE.Mesh(level.geometry, level.material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      lod.addLevel(mesh, level.distance);
    });
    this.lodManager.set(lodId, lod);
    return lod;
  }

  createInstancedMesh(meshId: string, data: InstancedMeshData): THREE.InstancedMesh {
    const instancedMesh = new THREE.InstancedMesh(
      data.geometry,
      data.material,
      data.count
    );
    instancedMesh.castShadow = true;
    instancedMesh.receiveShadow = true;

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

  private updateFrustum(): void {
    this.frustumMatrix.multiplyMatrices(
      this.camera.projectionMatrix,
      this.camera.matrixWorldInverse
    );
    this.frustum.setFromProjectionMatrix(this.frustumMatrix);
  }

  isInFrustum(object: THREE.Object3D): boolean {
    const boundingBox = new THREE.Box3().setFromObject(object);
    return this.frustum.intersectsBox(boundingBox);
  }

  setOcclusionCulling(enabled: boolean): void {
    this.occlusionCullingEnabled = enabled;
  }

  addObject(object: THREE.Object3D): void {
    this.scene.add(object);
    this.partitionManager.addObject(object);
  }

  removeObject(object: THREE.Object3D): void {
    this.scene.remove(object);
    this.partitionManager.removeObject(object);
  }

  /**
   * Sincroniza a cena com os dados do editor.
   * Remove todos os objetos de domínio existentes e recria a partir dos dados fornecidos.
   */
  syncScene(data: {
    walls: any[];
    rooms: any[];
    doors: any[];
    windows: any[];
    furniture: any[];
  }): void {
    // Remove objetos de domínio (mantém luzes, câmera, etc.)
    const toRemove: THREE.Object3D[] = [];
    this.scene.traverse(obj => {
      if (obj.userData?.type) {
        toRemove.push(obj);
      }
    });
    toRemove.forEach(obj => this.removeObject(obj));

    // Recria geometrias
    data.walls.forEach(w => this.createWallMesh(w));
    data.rooms.forEach(r => this.createRoomMesh(r));
    data.doors.forEach(d => this.createDoorMesh(d, data.walls));
    data.windows.forEach(w => this.createWindowMesh(w, data.walls));
    data.furniture.forEach(f => this.createFurnitureMesh(f));
  }

  private createWallMesh(wall: any): void {
    const start = new THREE.Vector3(wall.start[0], 0, wall.start[1]);
    const end = new THREE.Vector3(wall.end[0], 0, wall.end[1]);
    const dir = new THREE.Vector3().subVectors(end, start);
    const length = dir.length();
    const angle = Math.atan2(dir.z, dir.x);
    const pos = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    pos.y = (wall.height || 2.8) / 2;

    const geometry = new THREE.BoxGeometry(length, wall.height || 2.8, wall.thickness || 0.15);
    const material = new THREE.MeshStandardMaterial({ color: wall.color || '#cbd5e1' });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(pos);
    mesh.rotation.y = -angle;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { type: 'wall', id: wall.id };
    this.addObject(mesh);
  }

  private createRoomMesh(room: any): void {
    if (room.points.length < 3) return;
    const shape = new THREE.Shape();
    shape.moveTo(room.points[0][0], room.points[0][1]);
    for (let i = 1; i < room.points.length; i++) {
      shape.lineTo(room.points[i][0], room.points[i][1]);
    }
    shape.closePath();

    const geometry = new THREE.ShapeGeometry(shape);
    const floorMat = new THREE.MeshStandardMaterial({ color: room.floorColor || '#e2e8f0', side: THREE.DoubleSide });
    const floor = new THREE.Mesh(geometry, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0.01;
    floor.receiveShadow = true;
    floor.userData = { type: 'roomFloor', id: room.id };
    this.addObject(floor);

    const ceilingMat = new THREE.MeshStandardMaterial({ color: room.ceilingColor || '#f8fafc', side: THREE.DoubleSide });
    const ceiling = new THREE.Mesh(geometry, ceilingMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = room.height || 2.8;
    ceiling.receiveShadow = true;
    ceiling.userData = { type: 'roomCeiling', id: room.id };
    this.addObject(ceiling);
  }

  private createDoorMesh(door: any, walls: any[]): void {
    const wall = walls.find(w => w.id === door.wallId);
    if (!wall) return;
    const start = new THREE.Vector3(wall.start[0], 0, wall.start[1]);
    const end = new THREE.Vector3(wall.end[0], 0, wall.end[1]);
    const dir = new THREE.Vector3().subVectors(end, start);
    const len = dir.length();
    const angle = Math.atan2(dir.z, dir.x);
    const pos = start.clone().add(dir.clone().multiplyScalar(door.position / len));
    pos.y = (door.height || 2.1) / 2;

    const w = door.width || 0.9;
    const h = door.height || 2.1;
    const d = door.depth || 0.05;
    const geometry = new THREE.BoxGeometry(w, h, d);
    const material = new THREE.MeshStandardMaterial({ color: door.panelColor || '#b45309' });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(pos);
    mesh.rotation.y = -angle;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { type: 'door', id: door.id };
    this.addObject(mesh);
  }

  private createWindowMesh(win: any, walls: any[]): void {
    const wall = walls.find(w => w.id === win.wallId);
    if (!wall) return;
    const start = new THREE.Vector3(wall.start[0], 0, wall.start[1]);
    const end = new THREE.Vector3(wall.end[0], 0, wall.end[1]);
    const dir = new THREE.Vector3().subVectors(end, start);
    const len = dir.length();
    const angle = Math.atan2(dir.z, dir.x);
    const pos = start.clone().add(dir.clone().multiplyScalar(win.position / len));
    pos.y = (win.sillHeight || 0.9) + (win.height || 1.2) / 2;

    const w = win.width || 1.2;
    const h = win.height || 1.2;
    const d = 0.1;

    const glassGeo = new THREE.BoxGeometry(w, h, 0.02);
    const glassMat = new THREE.MeshPhysicalMaterial({ color: '#87CEEB', transparent: true, opacity: 0.3 });
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.copy(pos);
    glass.rotation.y = -angle;
    glass.castShadow = true;
    glass.receiveShadow = true;
    glass.userData = { type: 'windowGlass', id: win.id };
    this.addObject(glass);

    const frameGeo = new THREE.BoxGeometry(w + 0.08, h + 0.08, 0.06);
    const frameMat = new THREE.MeshStandardMaterial({ color: win.frameColor || '#475569' });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.copy(pos);
    frame.rotation.y = -angle;
    frame.castShadow = true;
    frame.receiveShadow = true;
    frame.userData = { type: 'windowFrame', id: win.id };
    this.addObject(frame);
  }

  private createFurnitureMesh(item: any): void {
    const pos = Array.isArray(item.position) ? item.position : [item.position.x, item.position.y, item.position.z];
    const rot = Array.isArray(item.rotation) ? item.rotation : [0, item.rotation, 0];
    const scale = item.scale || [1, 1, 1];
    const dims = item.dimensions || { width: 1, depth: 1, height: 1 };
    const geometry = new THREE.BoxGeometry(dims.width * scale[0], dims.height * scale[1], dims.depth * scale[2]);
    const material = new THREE.MeshStandardMaterial({ color: item.color || '#a0aec0' });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(pos[0], pos[1], pos[2]);
    mesh.rotation.set(rot[0], rot[1], rot[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { type: 'furniture', id: item.id };
    this.addObject(mesh);
  }

  render(): void {
    this.controls.update();
    this.updateFrustum();
    this.updateFPS();
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

  startRenderLoop(callback?: () => void): void {
    const animate = () => {
      requestAnimationFrame(animate);
      this.render();
      callback?.();
    };
    animate();
  }

  setCameraPosition(x: number, y: number, z: number): void {
    this.camera.position.set(x, y, z);
  }

  lookAt(x: number, y: number, z: number): void {
    this.camera.lookAt(x, y, z);
  }

  setBackgroundColor(color: number | string): void {
    this.scene.background = new THREE.Color(color);
    if (this.scene.fog) {
      this.scene.fog.color = new THREE.Color(color);
    }
  }

  resize(width: number, height: number): void {
    if (this.renderer) {
      this.renderer.setSize(width, height);
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    }
  }

  takeScreenshot(): string {
    return this.renderer?.domElement.toDataURL('image/png') || '';
  }

  getDrawCalls(): number {
    return this.renderer?.info?.render?.calls ?? 0;
  }

  getTriangleCount(): number {
    return this.renderer?.info?.render?.triangles ?? 0;
  }

  dispose(): void {
    this.renderer.dispose();
    this.controls.dispose();

    this.scene.traverse(obj => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });

    this.lodManager.clear();
    this.instancedMeshes.clear();
    this.objectPoolManager.clearAll();
    this.partitionManager.clear();

    window.removeEventListener('resize', this.handleResize.bind(this));
  }

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
