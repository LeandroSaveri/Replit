/**
 * Model Loader for AuriPlan
 * Handles loading and parsing of 3D models with Three.js
 */

import * as THREE from 'three';
// three.js loaders - accessed via dynamic import for type safety
type GLTFLoaderType = any;
type DRACOLoaderType = any;
type KTX2LoaderType = any;
import { assetService } from './AssetService';
import { getCDNConfig } from '../../config/cdn.config';

export interface ModelLoadOptions {
  dracoCompressed?: boolean;
  ktx2Compressed?: boolean;
  addToScene?: boolean;
  castShadow?: boolean;
  receiveShadow?: boolean;
  scale?: number;
  position?: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number };
}

export interface LoadedModel {
  scene: THREE.Group;
  animations: THREE.AnimationClip[];
  materials: THREE.Material[];
  geometries: THREE.BufferGeometry[];
  boundingBox: THREE.Box3;
  center: THREE.Vector3;
}

class ModelLoader {
  private gltfLoader: GLTFLoaderType;
  private dracoLoader: DRACOLoaderType;
  private ktx2Loader: KTX2LoaderType;
  private loadingManager: THREE.LoadingManager;
  private config = getCDNConfig();

  constructor() {
    this.loadingManager = new THREE.LoadingManager();
    this.gltfLoader = new (THREE as any).GLTFLoader(this.loadingManager);
    
    // Setup Draco loader for compressed models
    this.dracoLoader = new (THREE as any).DRACOLoader();
    this.dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
    this.gltfLoader.setDRACOLoader(this.dracoLoader);

    // Setup KTX2 loader for compressed textures
    this.ktx2Loader = new (THREE as any).KTX2Loader();
    this.ktx2Loader.setTranscoderPath('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/basis/');
  }

  /**
   * Load a 3D model by ID
   */
  async loadModel(modelId: string, options: ModelLoadOptions = {}): Promise<LoadedModel> {
    const {
      addToScene = false,
      castShadow = true,
      receiveShadow = true,
      scale = 1,
      position = { x: 0, y: 0, z: 0 },
      rotation = { x: 0, y: 0, z: 0 },
    } = options;

    try {
      // Load model data from asset service
      const modelData = await assetService.loadModel(modelId);
      
      // Parse the GLB/GLTF data
      const gltf = await this.parseGLB(modelData);
      
      // Process the loaded model
      const scene = gltf.scene;
      
      // Apply transformations
      scene.scale.setScalar(scale);
      scene.position.set(position.x, position.y, position.z);
      scene.rotation.set(rotation.x, rotation.y, rotation.z);

      // Configure shadows and materials
      const materials: THREE.Material[] = [];
      const geometries: THREE.BufferGeometry[] = [];

      scene.traverse((child: THREE.Object3D) => {
        if (child instanceof THREE.Mesh) {
          // Enable shadows
          child.castShadow = castShadow;
          child.receiveShadow = receiveShadow;

          // Collect materials and geometries
          if (child.material) {
            if (Array.isArray(child.material)) {
              materials.push(...child.material);
            } else {
              materials.push(child.material);
            }
          }
          if (child.geometry) {
            geometries.push(child.geometry);
          }

          // Optimize geometry
          this.optimizeGeometry(child.geometry);
        }
      });

      // Calculate bounding box
      const boundingBox = new THREE.Box3().setFromObject(scene);
      const center = new THREE.Vector3();
      boundingBox.getCenter(center);

      const loadedModel: LoadedModel = {
        scene,
        animations: gltf.animations || [],
        materials,
        geometries,
        boundingBox,
        center,
      };

      console.log(`[ModelLoader] Model ${modelId} loaded successfully`);
      return loadedModel;

    } catch (error) {
      console.error(`[ModelLoader] Error loading model ${modelId}:`, error);
      throw error;
    }
  }

  /**
   * Parse GLB/GLTF data
   */
  private parseGLB(data: ArrayBuffer): Promise<any> {
    return new Promise((resolve, reject) => {
      this.gltfLoader.parse(data, '', (gltf: any) => {
        resolve(gltf);
      }, (error: any) => {
        reject(error);
      });
    });
  }

  /**
   * Optimize geometry for better performance
   */
  private optimizeGeometry(geometry: THREE.BufferGeometry): void {
    if (!geometry) return;

    // Compute tangents for normal mapping
    if (geometry.attributes.uv && !geometry.attributes.tangent) {
      try {
        geometry.computeTangents();
      } catch (e) {
        // Tangents may fail for some geometries
      }
    }

    // Compute vertex normals if missing
    if (!geometry.attributes.normal) {
      geometry.computeVertexNormals();
    }

    // Compute bounding box and sphere
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
  }

  /**
   * Create a low-poly LOD version of a model
   */
  createLODModel(originalModel: LoadedModel, reductionFactor: number = 0.5): THREE.Group {
    const lodGroup = new THREE.Group();
    
    originalModel.scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry) {
        // Clone the mesh
        const simplifiedMesh = child.clone();
        
        // Simplify geometry (basic implementation)
        // In production, use a proper mesh simplification algorithm
        const geometry = child.geometry.clone();
        
        // Reduce vertex count
        const positions = geometry.attributes.position.array;
        const newVertexCount = Math.floor(positions.length / 3 * reductionFactor);
        
        // Create simplified geometry
        const simplifiedGeometry = new THREE.BufferGeometry();
        simplifiedGeometry.setAttribute(
          'position',
          new THREE.BufferAttribute(new Float32Array(positions.slice(0, newVertexCount * 3)), 3)
        );
        
        simplifiedMesh.geometry = simplifiedGeometry;
        lodGroup.add(simplifiedMesh);
      }
    });

    return lodGroup;
  }

  /**
   * Preload models for faster access
   */
  async preloadModels(modelIds: string[]): Promise<void> {
    const preloadAssets = modelIds.map(id => ({ type: 'model' as const, id }));
    await assetService.preloadAssets(preloadAssets);
  }

  /**
   * Dispose of loaded model resources
   */
  disposeModel(model: LoadedModel): void {
    // Dispose geometries
    model.geometries.forEach(geometry => {
      geometry.dispose();
    });

    // Dispose materials
    model.materials.forEach(material => {
      material.dispose();
      
      // Dispose textures
      const textures: THREE.Texture[] = [];
      material as any;
      
      // Check for common texture properties
      const mat = material as any;
      if (mat.map) textures.push(mat.map);
      if (mat.normalMap) textures.push(mat.normalMap);
      if (mat.roughnessMap) textures.push(mat.roughnessMap);
      if (mat.metalnessMap) textures.push(mat.metalnessMap);
      if (mat.aoMap) textures.push(mat.aoMap);
      if (mat.emissiveMap) textures.push(mat.emissiveMap);
      if (mat.alphaMap) textures.push(mat.alphaMap);
      if (mat.bumpMap) textures.push(mat.bumpMap);
      if (mat.displacementMap) textures.push(mat.displacementMap);

      textures.forEach(texture => {
        texture.dispose();
      });
    });

    console.log('[ModelLoader] Model resources disposed');
  }
}

// Singleton instance
export const modelLoader = new ModelLoader();
export default modelLoader;
