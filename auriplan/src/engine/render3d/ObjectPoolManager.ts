/**
 * Object Pool Manager for AuriPlan
 * Manages object pooling for better memory performance
 */

import * as THREE from 'three';

export interface PoolConfig {
  initialSize: number;
  maxSize: number;
  growFactor: number;
}

export interface PooledObject<T> {
  object: T;
  inUse: boolean;
  lastUsed: number;
}

export class ObjectPool<T> {
  private pool: PooledObject<T>[] = [];
  private config: PoolConfig;
  private factory: () => T;
  private reset: (obj: T) => void;

  constructor(
    factory: () => T,
    reset: (obj: T) => void,
    config: Partial<PoolConfig> = {}
  ) {
    this.factory = factory;
    this.reset = reset;
    this.config = {
      initialSize: 10,
      maxSize: 1000,
      growFactor: 2,
      ...config,
    };

    // Initialize pool
    this.grow(this.config.initialSize);
  }

  /**
   * Grow the pool by specified amount
   */
  private grow(amount: number): void {
    for (let i = 0; i < amount; i++) {
      if (this.pool.length >= this.config.maxSize) break;
      
      this.pool.push({
        object: this.factory(),
        inUse: false,
        lastUsed: 0,
      });
    }
  }

  /**
   * Acquire an object from the pool
   */
  acquire(): T | null {
    // Find available object
    for (const item of this.pool) {
      if (!item.inUse) {
        item.inUse = true;
        item.lastUsed = Date.now();
        return item.object;
      }
    }

    // Try to grow pool
    const currentSize = this.pool.length;
    const growAmount = Math.min(
      Math.floor(currentSize * (this.config.growFactor - 1)),
      this.config.maxSize - currentSize
    );

    if (growAmount > 0) {
      this.grow(growAmount);
      return this.acquire();
    }

    // Pool is at max capacity
    return null;
  }

  /**
   * Release an object back to the pool
   */
  release(obj: T): void {
    for (const item of this.pool) {
      if (item.object === obj) {
        this.reset(obj);
        item.inUse = false;
        item.lastUsed = Date.now();
        return;
      }
    }
  }

  /**
   * Get pool statistics
   */
  getStats(): {
    total: number;
    inUse: number;
    available: number;
    utilizationRate: number;
  } {
    const inUse = this.pool.filter(item => item.inUse).length;
    const total = this.pool.length;

    return {
      total,
      inUse,
      available: total - inUse,
      utilizationRate: total > 0 ? inUse / total : 0,
    };
  }

  /**
   * Clear all objects from pool
   */
  clear(): void {
    this.pool = [];
  }
}

/**
 * Mesh Pool for Three.js meshes
 */
export class MeshPool extends ObjectPool<THREE.Mesh> {
  constructor(geometry: THREE.BufferGeometry, material: THREE.Material, config?: Partial<PoolConfig>) {
    super(
      () => new THREE.Mesh(geometry, material),
      (mesh) => {
        mesh.position.set(0, 0, 0);
        mesh.rotation.set(0, 0, 0);
        mesh.scale.set(1, 1, 1);
        mesh.visible = true;
      },
      config
    );
  }
}

/**
 * Material Pool for Three.js materials
 */
export class MaterialPool extends ObjectPool<THREE.Material> {
  constructor(materialFactory: () => THREE.Material, config?: Partial<PoolConfig>) {
    super(
      materialFactory,
      (material) => {
        // Reset material properties
        if (material instanceof THREE.MeshStandardMaterial) {
          material.color.setHex(0xffffff);
          material.roughness = 0.5;
          material.metalness = 0;
        }
      },
      config
    );
  }
}

/**
 * Object Pool Manager - manages multiple pools
 */
export class ObjectPoolManager {
  private pools = new Map<string, ObjectPool<any>>();

  /**
   * Register a new pool
   */
  registerPool<T>(name: string, pool: ObjectPool<T>): void {
    this.pools.set(name, pool);
  }

  /**
   * Get a pool by name
   */
  getPool<T>(name: string): ObjectPool<T> | undefined {
    return this.pools.get(name);
  }

  /**
   * Acquire object from named pool
   */
  acquire<T>(name: string): T | null {
    const pool = this.pools.get(name);
    return pool ? pool.acquire() : null;
  }

  /**
   * Release object to named pool
   */
  release<T>(name: string, obj: T): void {
    const pool = this.pools.get(name);
    pool?.release(obj);
  }

  /**
   * Get statistics for all pools
   */
  getAllStats(): Map<string, ReturnType<ObjectPool<any>['getStats']>> {
    const stats = new Map<string, ReturnType<ObjectPool<any>['getStats']>>();
    
    for (const [name, pool] of this.pools) {
      stats.set(name, pool.getStats());
    }

    return stats;
  }

  /**
   * Clear all pools
   */
  clearAll(): void {
    for (const pool of this.pools.values()) {
      pool.clear();
    }
    this.pools.clear();
  }
}

export default ObjectPoolManager;
