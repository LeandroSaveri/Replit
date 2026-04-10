/**
 * Asset Service for AuriPlan
 * Manages loading, caching, and retrieval of 3D assets
 */

import { getCDNConfig, getModelUrl, getTextureUrl, getMaterialUrl, getThumbnailUrl } from '../../config/cdn.config';

export interface AssetCache {
  init?(): Promise<void>;
  get(key: string): Promise<ArrayBuffer | Blob | null>;
  set(key: string, data: ArrayBuffer | Blob, ttl?: number): Promise<void>;
  clear(): Promise<void>;
  delete(key: string): Promise<void>;
}

// IndexedDB-based cache implementation
class IndexedDBCache implements AssetCache {
  private dbName = 'AuriPlanAssets';
  private storeName = 'assets';
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    if (this.db) return;
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'key' });
          store.createIndex('expires', 'expires', { unique: false });
        }
      };
    });
  }

  async get(key: string): Promise<ArrayBuffer | Blob | null> {
    await this.init();
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        if (!result) {
          resolve(null);
          return;
        }

        // Check expiration
        if (result.expires && result.expires < Date.now()) {
          this.delete(key);
          resolve(null);
          return;
        }

        resolve(result.data);
      };
    });
  }

  async set(key: string, data: ArrayBuffer | Blob, ttlHours: number = 24): Promise<void> {
    await this.init();
    if (!this.db) return;

    const expires = Date.now() + (ttlHours * 60 * 60 * 1000);

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put({ key, data, expires });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clear(): Promise<void> {
    await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async delete(key: string): Promise<void> {
    await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

// Main Asset Service
class AssetService {
  private cache: AssetCache;
  private config = getCDNConfig();
  private loadingPromises = new Map<string, Promise<any>>();

  constructor() {
    this.cache = new IndexedDBCache();
  }

  /**
   * Initialize the asset service
   */
  async init(): Promise<void> {
    await this.cache.init?.();
    console.log('[AssetService] Initialized');
  }

  /**
   * Load a 3D model from CDN or cache
   */
  async loadModel(modelId: string): Promise<ArrayBuffer> {
    const cacheKey = `model:${modelId}`;
    
    // Check if already loading
    if (this.loadingPromises.has(cacheKey)) {
      return this.loadingPromises.get(cacheKey) as Promise<ArrayBuffer>;
    }

    const loadPromise = this.loadModelInternal(modelId, cacheKey);
    this.loadingPromises.set(cacheKey, loadPromise);

    try {
      const result = await loadPromise;
      return result;
    } finally {
      this.loadingPromises.delete(cacheKey);
    }
  }

  private async loadModelInternal(modelId: string, cacheKey: string): Promise<ArrayBuffer> {
    // Try cache first
    if (this.config.cacheEnabled) {
      const cached = await this.cache.get(cacheKey);
      if (cached instanceof ArrayBuffer) {
        console.log(`[AssetService] Model ${modelId} loaded from cache`);
        return cached;
      }
    }

    // Fetch from CDN
    const url = getModelUrl(modelId);
    console.log(`[AssetService] Fetching model ${modelId} from ${url}`);

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load model ${modelId}: ${response.statusText}`);
      }

      const data = await response.arrayBuffer();

      // Cache the result
      if (this.config.cacheEnabled) {
        await this.cache.set(cacheKey, data, this.config.cacheDuration);
      }

      return data;
    } catch (error) {
      console.error(`[AssetService] Error loading model ${modelId}:`, error);
      throw error;
    }
  }

  /**
   * Load a texture from CDN or cache
   */
  async loadTexture(textureId: string): Promise<Blob> {
    const cacheKey = `texture:${textureId}`;

    if (this.loadingPromises.has(cacheKey)) {
      return this.loadingPromises.get(cacheKey) as Promise<Blob>;
    }

    const loadPromise = this.loadTextureInternal(textureId, cacheKey);
    this.loadingPromises.set(cacheKey, loadPromise);

    try {
      return await loadPromise;
    } finally {
      this.loadingPromises.delete(cacheKey);
    }
  }

  private async loadTextureInternal(textureId: string, cacheKey: string): Promise<Blob> {
    // Try cache first
    if (this.config.cacheEnabled) {
      const cached = await this.cache.get(cacheKey);
      if (cached instanceof Blob) {
        console.log(`[AssetService] Texture ${textureId} loaded from cache`);
        return cached;
      }
    }

    // Fetch from CDN
    const url = getTextureUrl(textureId);
    console.log(`[AssetService] Fetching texture ${textureId} from ${url}`);

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load texture ${textureId}: ${response.statusText}`);
      }

      const data = await response.blob();

      // Cache the result
      if (this.config.cacheEnabled) {
        await this.cache.set(cacheKey, data, this.config.cacheDuration);
      }

      return data;
    } catch (error) {
      console.error(`[AssetService] Error loading texture ${textureId}:`, error);
      throw error;
    }
  }

  /**
   * Load material definition from CDN
   */
  async loadMaterial(materialId: string): Promise<any> {
    const cacheKey = `material:${materialId}`;

    // Try cache first
    if (this.config.cacheEnabled) {
      const cached = await this.cache.get(cacheKey);
      if (cached instanceof Blob) {
        const text = await cached.text();
        return JSON.parse(text);
      }
    }

    // Fetch from CDN
    const url = getMaterialUrl(materialId);
    console.log(`[AssetService] Fetching material ${materialId} from ${url}`);

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load material ${materialId}: ${response.statusText}`);
      }

      const data = await response.json();

      // Cache the result
      if (this.config.cacheEnabled) {
        const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
        await this.cache.set(cacheKey, blob, this.config.cacheDuration);
      }

      return data;
    } catch (error) {
      console.error(`[AssetService] Error loading material ${materialId}:`, error);
      throw error;
    }
  }

  /**
   * Load thumbnail image
   */
  async loadThumbnail(thumbnailId: string): Promise<string> {
    const url = getThumbnailUrl(thumbnailId);
    return url; // Return URL directly for images
  }

  /**
   * Preload multiple assets
   */
  async preloadAssets(assets: { type: 'model' | 'texture' | 'material'; id: string }[]): Promise<void> {
    const promises = assets.map(asset => {
      switch (asset.type) {
        case 'model':
          return this.loadModel(asset.id).catch(() => null);
        case 'texture':
          return this.loadTexture(asset.id).catch(() => null);
        case 'material':
          return this.loadMaterial(asset.id).catch(() => null);
      }
    });

    await Promise.all(promises);
  }

  /**
   * Clear all cached assets
   */
  async clearCache(): Promise<void> {
    await this.cache.clear();
    console.log('[AssetService] Cache cleared');
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{ size: number; itemCount: number }> {
    // This would need to be implemented based on the cache backend
    return { size: 0, itemCount: 0 };
  }
}

// Singleton instance
export const assetService = new AssetService();
export default assetService;
