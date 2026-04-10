/**
 * Texture Loader for AuriPlan
 * Handles loading and management of PBR textures
 */

import * as THREE from 'three';
import { assetService } from './AssetService';

export interface PBRTextureSet {
  albedo?: THREE.Texture;
  normal?: THREE.Texture;
  roughness?: THREE.Texture;
  metallic?: THREE.Texture;
  ao?: THREE.Texture;
  emissive?: THREE.Texture;
  height?: THREE.Texture;
}

export interface TextureLoadOptions {
  wrapS?: THREE.Wrapping;
  wrapT?: THREE.Wrapping;
  repeat?: { x: number; y: number };
  anisotropy?: number;
  encoding?: number;
  flipY?: boolean;
}

class TextureLoader {
  private textureLoader: THREE.TextureLoader;
  private loadedTextures = new Map<string, THREE.Texture>();
  private loadingPromises = new Map<string, Promise<THREE.Texture>>();

  constructor() {
    this.textureLoader = new THREE.TextureLoader();
  }

  /**
   * Load a single texture
   */
  async loadTexture(textureId: string, options: TextureLoadOptions = {}): Promise<THREE.Texture> {
    // Check if already loaded
    if (this.loadedTextures.has(textureId)) {
      return this.loadedTextures.get(textureId)!;
    }

    // Check if already loading
    if (this.loadingPromises.has(textureId)) {
      return this.loadingPromises.get(textureId)!;
    }

    const loadPromise = this.loadTextureInternal(textureId, options);
    this.loadingPromises.set(textureId, loadPromise);

    try {
      const texture = await loadPromise;
      this.loadedTextures.set(textureId, texture);
      return texture;
    } finally {
      this.loadingPromises.delete(textureId);
    }
  }

  private async loadTextureInternal(textureId: string, options: TextureLoadOptions): Promise<THREE.Texture> {
    const {
      wrapS = THREE.RepeatWrapping,
      wrapT = THREE.RepeatWrapping,
      repeat = { x: 1, y: 1 },
      anisotropy = 16,
      flipY = false,
    } = options;

    try {
      // Load texture blob from asset service
      const textureBlob = await assetService.loadTexture(textureId);
      const textureUrl = URL.createObjectURL(textureBlob);

      // Load texture with Three.js
      const texture = await new Promise<THREE.Texture>((resolve, reject) => {
        this.textureLoader.load(
          textureUrl,
          (loadedTexture) => {
            // Configure texture
            loadedTexture.wrapS = wrapS;
            loadedTexture.wrapT = wrapT;
            loadedTexture.repeat.set(repeat.x, repeat.y);
            loadedTexture.anisotropy = anisotropy;
            loadedTexture.flipY = flipY;
            loadedTexture.colorSpace = THREE.SRGBColorSpace;
            
            // Generate mipmaps
            loadedTexture.generateMipmaps = true;
            loadedTexture.minFilter = THREE.LinearMipmapLinearFilter;
            loadedTexture.magFilter = THREE.LinearFilter;

            resolve(loadedTexture);
          },
          undefined,
          (error) => {
            reject(error);
          }
        );
      });

      // Revoke object URL after loading
      URL.revokeObjectURL(textureUrl);

      console.log(`[TextureLoader] Texture ${textureId} loaded successfully`);
      return texture;

    } catch (error) {
      console.error(`[TextureLoader] Error loading texture ${textureId}:`, error);
      throw error;
    }
  }

  /**
   * Load a complete PBR texture set
   */
  async loadPBRTextureSet(
    baseName: string,
    variants: { albedo?: string | false; normal?: string | false; roughness?: string | false; metallic?: string | false; ao?: string | false; emissive?: string | false; height?: string | false } = {}
  ): Promise<PBRTextureSet> {
    const textureSet: PBRTextureSet = {};

    const loadPromises: Promise<void>[] = [];

    if (variants.albedo !== false) {
      const albedoId = variants.albedo || `${baseName}_albedo`;
      loadPromises.push(
        this.loadTexture(albedoId).then(tex => { textureSet.albedo = tex; }).catch(() => {})
      );
    }

    if (variants.normal !== false) {
      const normalId = variants.normal || `${baseName}_normal`;
      loadPromises.push(
        this.loadTexture(normalId).then(tex => { textureSet.normal = tex; }).catch(() => {})
      );
    }

    if (variants.roughness !== false) {
      const roughnessId = variants.roughness || `${baseName}_roughness`;
      loadPromises.push(
        this.loadTexture(roughnessId, { anisotropy: 4 }).then(tex => { textureSet.roughness = tex; }).catch(() => {})
      );
    }

    if (variants.metallic !== false) {
      const metallicId = variants.metallic || `${baseName}_metallic`;
      loadPromises.push(
        this.loadTexture(metallicId, { anisotropy: 4 }).then(tex => { textureSet.metallic = tex; }).catch(() => {})
      );
    }

    if (variants.ao !== false) {
      const aoId = variants.ao || `${baseName}_ao`;
      loadPromises.push(
        this.loadTexture(aoId, { anisotropy: 4 }).then(tex => { textureSet.ao = tex; }).catch(() => {})
      );
    }

    if (variants.emissive !== false) {
      const emissiveId = variants.emissive || `${baseName}_emissive`;
      loadPromises.push(
        this.loadTexture(emissiveId).then(tex => { textureSet.emissive = tex; }).catch(() => {})
      );
    }

    if (variants.height !== false) {
      const heightId = variants.height || `${baseName}_height`;
      loadPromises.push(
        this.loadTexture(heightId, { anisotropy: 4 }).then(tex => { textureSet.height = tex; }).catch(() => {})
      );
    }

    await Promise.all(loadPromises);

    console.log(`[TextureLoader] PBR texture set ${baseName} loaded`);
    return textureSet;
  }

  /**
   * Create a material from PBR texture set
   */
  createPBRMaterial(textureSet: PBRTextureSet, materialParams: Partial<THREE.MeshStandardMaterialParameters> = {}): THREE.MeshStandardMaterial {
    const material = new THREE.MeshStandardMaterial({
      map: textureSet.albedo,
      normalMap: textureSet.normal,
      roughnessMap: textureSet.roughness,
      metalnessMap: textureSet.metallic,
      aoMap: textureSet.ao,
      emissiveMap: textureSet.emissive,
      displacementMap: textureSet.height,
      ...materialParams,
    });

    // Set default values if maps are not present
    if (!textureSet.roughness) {
      material.roughness = 0.5;
    }
    if (!textureSet.metallic) {
      material.metalness = 0.0;
    }
    if (textureSet.emissive) {
      material.emissive = new THREE.Color(0xffffff);
      material.emissiveIntensity = 1.0;
    }

    return material;
  }

  /**
   * Preload textures
   */
  async preloadTextures(textureIds: string[]): Promise<void> {
    const preloadAssets = textureIds.map(id => ({ type: 'texture' as const, id }));
    await assetService.preloadAssets(preloadAssets);
  }

  /**
   * Get a cached texture
   */
  getCachedTexture(textureId: string): THREE.Texture | undefined {
    return this.loadedTextures.get(textureId);
  }

  /**
   * Dispose of a texture
   */
  disposeTexture(textureId: string): void {
    const texture = this.loadedTextures.get(textureId);
    if (texture) {
      texture.dispose();
      this.loadedTextures.delete(textureId);
      console.log(`[TextureLoader] Texture ${textureId} disposed`);
    }
  }

  /**
   * Dispose of all loaded textures
   */
  disposeAll(): void {
    this.loadedTextures.forEach((texture, id) => {
      texture.dispose();
      console.log(`[TextureLoader] Texture ${id} disposed`);
    });
    this.loadedTextures.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { loadedCount: number; loadingCount: number } {
    return {
      loadedCount: this.loadedTextures.size,
      loadingCount: this.loadingPromises.size,
    };
  }
}

// Singleton instance
export const textureLoader = new TextureLoader();
export default textureLoader;
