/**
 * PBR Material Factory for AuriPlan
 * Creates physically-based rendering materials
 */

import * as THREE from 'three';
import { textureLoader } from '../../services/assets/TextureLoader';

export type MaterialType = 
  | 'wood' 
  | 'marble' 
  | 'metal' 
  | 'fabric' 
  | 'glass' 
  | 'ceramic' 
  | 'concrete' 
  | 'plastic';

export interface PBRMaterialConfig {
  type: MaterialType;
  color?: string;
  roughness?: number;
  metalness?: number;
  normalScale?: number;
  aoIntensity?: number;
  emissive?: string;
  emissiveIntensity?: number;
  transparent?: boolean;
  opacity?: number;
  textureSet?: string;
}

export class PBRMaterialFactory {
  private materialCache = new Map<string, THREE.Material>();
  private loadingPromises = new Map<string, Promise<THREE.Material>>();

  /**
   * Create a PBR material from configuration
   */
  async createMaterial(config: PBRMaterialConfig): Promise<THREE.Material> {
    const cacheKey = this.getCacheKey(config);

    // Check cache
    if (this.materialCache.has(cacheKey)) {
      return this.materialCache.get(cacheKey)!;
    }

    // Check if already loading
    if (this.loadingPromises.has(cacheKey)) {
      return this.loadingPromises.get(cacheKey)!;
    }

    // Create material
    const promise = this.createMaterialInternal(config);
    this.loadingPromises.set(cacheKey, promise);

    try {
      const material = await promise;
      this.materialCache.set(cacheKey, material);
      return material;
    } finally {
      this.loadingPromises.delete(cacheKey);
    }
  }

  /**
   * Generate cache key from config
   */
  private getCacheKey(config: PBRMaterialConfig): string {
    return `${config.type}-${config.color || 'default'}-${config.roughness || 0.5}-${config.metalness || 0}`;
  }

  /**
   * Create material based on type
   */
  private async createMaterialInternal(config: PBRMaterialConfig): Promise<THREE.Material> {
    switch (config.type) {
      case 'wood':
        return this.createWoodMaterial(config);
      case 'marble':
        return this.createMarbleMaterial(config);
      case 'metal':
        return this.createMetalMaterial(config);
      case 'fabric':
        return this.createFabricMaterial(config);
      case 'glass':
        return this.createGlassMaterial(config);
      case 'ceramic':
        return this.createCeramicMaterial(config);
      case 'concrete':
        return this.createConcreteMaterial(config);
      case 'plastic':
        return this.createPlasticMaterial(config);
      default:
        return this.createDefaultMaterial(config);
    }
  }

  /**
   * Create wood material
   */
  private async createWoodMaterial(config: PBRMaterialConfig): Promise<THREE.MeshStandardMaterial> {
    const material = new THREE.MeshStandardMaterial({
      color: config.color ? new THREE.Color(config.color) : new THREE.Color(0x8B4513),
      roughness: config.roughness ?? 0.7,
      metalness: config.metalness ?? 0.0,
    });

    // Load texture set if specified
    if (config.textureSet) {
      try {
        const textures = await textureLoader.loadPBRTextureSet(config.textureSet);
        if (textures.albedo) material.map = textures.albedo;
        if (textures.normal) material.normalMap = textures.normal;
        if (textures.roughness) material.roughnessMap = textures.roughness;
        if (textures.ao) material.aoMap = textures.ao;
      } catch (e) {
        console.warn(`Failed to load texture set ${config.textureSet}`);
      }
    }

    return material;
  }

  /**
   * Create marble material
   */
  private async createMarbleMaterial(config: PBRMaterialConfig): Promise<THREE.MeshStandardMaterial> {
    const material = new THREE.MeshStandardMaterial({
      color: config.color ? new THREE.Color(config.color) : new THREE.Color(0xF5F5F5),
      roughness: config.roughness ?? 0.1,
      metalness: config.metalness ?? 0.0,
    });

    if (config.textureSet) {
      try {
        const textures = await textureLoader.loadPBRTextureSet(config.textureSet);
        if (textures.albedo) material.map = textures.albedo;
        if (textures.normal) material.normalMap = textures.normal;
        if (textures.roughness) material.roughnessMap = textures.roughness;
      } catch (e) {
        console.warn(`Failed to load texture set ${config.textureSet}`);
      }
    }

    return material;
  }

  /**
   * Create metal material
   */
  private async createMetalMaterial(config: PBRMaterialConfig): Promise<THREE.MeshStandardMaterial> {
    const material = new THREE.MeshStandardMaterial({
      color: config.color ? new THREE.Color(config.color) : new THREE.Color(0xC0C0C0),
      roughness: config.roughness ?? 0.3,
      metalness: config.metalness ?? 1.0,
    });

    if (config.textureSet) {
      try {
        const textures = await textureLoader.loadPBRTextureSet(config.textureSet);
        if (textures.albedo) material.map = textures.albedo;
        if (textures.normal) material.normalMap = textures.normal;
        if (textures.roughness) material.roughnessMap = textures.roughness;
        if (textures.metallic) material.metalnessMap = textures.metallic;
      } catch (e) {
        console.warn(`Failed to load texture set ${config.textureSet}`);
      }
    }

    return material;
  }

  /**
   * Create fabric material
   */
  private async createFabricMaterial(config: PBRMaterialConfig): Promise<THREE.MeshStandardMaterial> {
    const material = new THREE.MeshStandardMaterial({
      color: config.color ? new THREE.Color(config.color) : new THREE.Color(0x808080),
      roughness: config.roughness ?? 0.9,
      metalness: config.metalness ?? 0.0,
    });

    if (config.textureSet) {
      try {
        const textures = await textureLoader.loadPBRTextureSet(config.textureSet);
        if (textures.albedo) material.map = textures.albedo;
        if (textures.normal) material.normalMap = textures.normal;
        if (textures.ao) material.aoMap = textures.ao;
      } catch (e) {
        console.warn(`Failed to load texture set ${config.textureSet}`);
      }
    }

    return material;
  }

  /**
   * Create glass material
   */
  private createGlassMaterial(config: PBRMaterialConfig): THREE.MeshPhysicalMaterial {
    return new THREE.MeshPhysicalMaterial({
      color: config.color ? new THREE.Color(config.color) : new THREE.Color(0xffffff),
      metalness: config.metalness ?? 0.0,
      roughness: config.roughness ?? 0.05,
      transmission: 0.95,
      thickness: 0.5,
      transparent: true,
      opacity: config.opacity ?? 0.3,
      envMapIntensity: 1.0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.0,
    });
  }

  /**
   * Create ceramic material
   */
  private async createCeramicMaterial(config: PBRMaterialConfig): Promise<THREE.MeshStandardMaterial> {
    const material = new THREE.MeshStandardMaterial({
      color: config.color ? new THREE.Color(config.color) : new THREE.Color(0xFFFFFF),
      roughness: config.roughness ?? 0.2,
      metalness: config.metalness ?? 0.0,
    });

    if (config.textureSet) {
      try {
        const textures = await textureLoader.loadPBRTextureSet(config.textureSet);
        if (textures.albedo) material.map = textures.albedo;
        if (textures.normal) material.normalMap = textures.normal;
      } catch (e) {
        console.warn(`Failed to load texture set ${config.textureSet}`);
      }
    }

    return material;
  }

  /**
   * Create concrete material
   */
  private async createConcreteMaterial(config: PBRMaterialConfig): Promise<THREE.MeshStandardMaterial> {
    const material = new THREE.MeshStandardMaterial({
      color: config.color ? new THREE.Color(config.color) : new THREE.Color(0x808080),
      roughness: config.roughness ?? 0.9,
      metalness: config.metalness ?? 0.0,
    });

    if (config.textureSet) {
      try {
        const textures = await textureLoader.loadPBRTextureSet(config.textureSet);
        if (textures.albedo) material.map = textures.albedo;
        if (textures.normal) material.normalMap = textures.normal;
        if (textures.roughness) material.roughnessMap = textures.roughness;
        if (textures.ao) material.aoMap = textures.ao;
      } catch (e) {
        console.warn(`Failed to load texture set ${config.textureSet}`);
      }
    }

    return material;
  }

  /**
   * Create plastic material
   */
  private createPlasticMaterial(config: PBRMaterialConfig): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: config.color ? new THREE.Color(config.color) : new THREE.Color(0xFFFFFF),
      roughness: config.roughness ?? 0.4,
      metalness: config.metalness ?? 0.0,
    });
  }

  /**
   * Create default material
   */
  private createDefaultMaterial(config: PBRMaterialConfig): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: config.color ? new THREE.Color(config.color) : new THREE.Color(0xCCCCCC),
      roughness: config.roughness ?? 0.5,
      metalness: config.metalness ?? 0.0,
    });
  }

  /**
   * Get cached material
   */
  getCachedMaterial(cacheKey: string): THREE.Material | undefined {
    return this.materialCache.get(cacheKey);
  }

  /**
   * Clear material cache
   */
  clearCache(): void {
    this.materialCache.forEach(material => material.dispose());
    this.materialCache.clear();
    this.materialCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.materialCache.size,
      keys: Array.from(this.materialCache.keys()),
    };
  }
}

// Singleton instance
export const pbrMaterialFactory = new PBRMaterialFactory();
export default pbrMaterialFactory;
