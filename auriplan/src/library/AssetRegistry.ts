/**
 * Asset Registry for AuriPlan
 * Central registry for all 3D assets in the library
 */

export type AssetCategory = 
  | 'furniture' 
  | 'kitchen' 
  | 'bathroom' 
  | 'bedroom' 
  | 'livingroom' 
  | 'dining' 
  | 'office'
  | 'lighting' 
  | 'decor' 
  | 'appliances' 
  | 'outdoor'
  | 'doors'
  | 'windows'
  | 'flooring'
  | 'wall-materials'
  | 'structural'
  | 'plumbing'
  | 'electrical'
  | 'garden'
  | 'kids'
  | 'decor-items';

export type MaterialType = 
  | 'wood' 
  | 'metal' 
  | 'glass' 
  | 'fabric' 
  | 'leather'
  | 'ceramic'
  | 'stone'
  | 'plastic'
  | 'concrete'
  | 'marble'
  | 'granite'
  | 'mirror'
  | 'velvet'
  | 'silk'
  | 'linen'
  | 'rubber'
  | 'cork'
  | 'acrylic'
  | 'mesh'
  | 'foam'
  | 'wicker'
  | 'rattan'
  | 'bamboo'
  | 'canvas'
  | 'organic'
  | 'composite';

export type DesignStyle = 
  | 'modern' 
  | 'classic' 
  | 'minimalist' 
  | 'industrial' 
  | 'scandinavian'
  | 'bohemian'
  | 'contemporary'
  | 'rustic'
  | 'luxury'
  | 'functional'
  | 'traditional'
  | 'statement'
  | 'ergonomic'
  | 'outdoor'
  | 'casual'
  | 'natural'
  | 'abstract'
  | 'art-deco'
  | 'mid-century'
  | 'farmhouse'
  | 'coastal'
  | 'transitional'
  | 'feminine'
  | 'built-in'
  | 'integrated'
  | 'ergonomic'
  | 'outdoor'
  | 'casual'
  | 'natural'
  | 'abstract'
  | 'professional'
  | 'comfortable'
  | 'executive'
  | 'eclectic'
  | 'vintage'
  | 'retro';

export interface AssetDimensions {
  width: number;
  height: number;
  depth: number;
}

export interface AssetMetadata {
  id: string;
  name: string;
  category: AssetCategory;
  subcategory?: string;
  description?: string;
  dimensions: AssetDimensions;
  materials: MaterialType[];
  colors: string[];
  styles: DesignStyle[];
  price?: number;
  currency?: string;
  brand?: string;
  modelUrl: string;
  thumbnailUrl: string;
  isPremium: boolean;
  polyCount: number;
  fileSize: number; // in KB
  tags: string[];
  popularity: number; // 0-100
  dateAdded?: string;
  dateUpdated?: string;
}

export interface AssetRegistryConfig {
  maxCacheSize: number;
  preloadThumbnails: boolean;
  enableSearchIndexing: boolean;
}

class AssetRegistry {
  private assets = new Map<string, AssetMetadata>();
  private categoryIndex = new Map<AssetCategory, Set<string>>();
  private materialIndex = new Map<MaterialType, Set<string>>();
  private styleIndex = new Map<DesignStyle, Set<string>>();
  private tagIndex = new Map<string, Set<string>>();
  private searchIndex = new Map<string, Set<string>>();
  private config: AssetRegistryConfig;

  constructor(config: Partial<AssetRegistryConfig> = {}) {
    this.config = {
      maxCacheSize: 1000,
      preloadThumbnails: true,
      enableSearchIndexing: true,
      ...config,
    };
  }

  /**
   * Register a new asset
   */
  registerAsset(asset: AssetMetadata): void {
    this.assets.set(asset.id, asset);
    this.indexAsset(asset);
  }

  /**
   * Index asset for fast searching
   */
  private indexAsset(asset: AssetMetadata): void {
    // Index by category
    if (!this.categoryIndex.has(asset.category)) {
      this.categoryIndex.set(asset.category, new Set());
    }
    this.categoryIndex.get(asset.category)!.add(asset.id);

    // Index by materials
    asset.materials.forEach(material => {
      if (!this.materialIndex.has(material)) {
        this.materialIndex.set(material, new Set());
      }
      this.materialIndex.get(material)!.add(asset.id);
    });

    // Index by styles
    asset.styles.forEach(style => {
      if (!this.styleIndex.has(style)) {
        this.styleIndex.set(style, new Set());
      }
      this.styleIndex.get(style)!.add(asset.id);
    });

    // Index by tags
    asset.tags.forEach(tag => {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(asset.id);
    });

    // Build search index
    if (this.config.enableSearchIndexing) {
      this.buildSearchIndex(asset);
    }
  }

  /**
   * Build search index for an asset
   */
  private buildSearchIndex(asset: AssetMetadata): void {
    const searchTerms = [
      asset.name.toLowerCase(),
      (asset.description ?? '').toLowerCase(),
      asset.category.toLowerCase(),
      asset.subcategory?.toLowerCase() || '',
      asset.brand?.toLowerCase() || '',
      ...asset.tags.map(t => t.toLowerCase()),
      ...asset.materials.map(m => m.toLowerCase()),
      ...asset.styles.map(s => s.toLowerCase()),
    ];

    searchTerms.forEach(term => {
      if (term) {
        if (!this.searchIndex.has(term)) {
          this.searchIndex.set(term, new Set());
        }
        this.searchIndex.get(term)!.add(asset.id);

        // Index partial matches
        for (let i = 3; i <= term.length; i++) {
          const partial = term.substring(0, i);
          if (!this.searchIndex.has(partial)) {
            this.searchIndex.set(partial, new Set());
          }
          this.searchIndex.get(partial)!.add(asset.id);
        }
      }
    });
  }

  /**
   * Get asset by ID
   */
  getAsset(id: string): AssetMetadata | undefined {
    return this.assets.get(id);
  }

  /**
   * Get all assets in a category
   */
  getAssetsByCategory(category: AssetCategory): AssetMetadata[] {
    const ids = this.categoryIndex.get(category);
    if (!ids) return [];
    return Array.from(ids).map(id => this.assets.get(id)!).filter(Boolean);
  }

  /**
   * Get assets by material
   */
  getAssetsByMaterial(material: MaterialType): AssetMetadata[] {
    const ids = this.materialIndex.get(material);
    if (!ids) return [];
    return Array.from(ids).map(id => this.assets.get(id)!).filter(Boolean);
  }

  /**
   * Get assets by style
   */
  getAssetsByStyle(style: DesignStyle): AssetMetadata[] {
    const ids = this.styleIndex.get(style);
    if (!ids) return [];
    return Array.from(ids).map(id => this.assets.get(id)!).filter(Boolean);
  }

  /**
   * Search assets by query
   */
  searchAssets(query: string): AssetMetadata[] {
    const normalizedQuery = query.toLowerCase().trim();
    if (!normalizedQuery) return [];

    const ids = this.searchIndex.get(normalizedQuery);
    if (!ids) return [];

    return Array.from(ids)
      .map(id => this.assets.get(id)!)
      .filter(Boolean)
      .sort((a, b) => b.popularity - a.popularity);
  }

  /**
   * Advanced search with filters
   */
  advancedSearch(options: {
    query?: string;
    categories?: AssetCategory[];
    materials?: MaterialType[];
    styles?: DesignStyle[];
    minPrice?: number;
    maxPrice?: number;
    isPremium?: boolean;
    sortBy?: 'popularity' | 'price' | 'name' | 'dateAdded';
    sortOrder?: 'asc' | 'desc';
  }): AssetMetadata[] {
    let results = Array.from(this.assets.values());

    // Filter by query
    if (options.query) {
      const queryIds = this.searchIndex.get(options.query.toLowerCase().trim());
      if (queryIds) {
        results = results.filter(asset => queryIds.has(asset.id));
      } else {
        return [];
      }
    }

    // Filter by categories
    if (options.categories && options.categories.length > 0) {
      results = results.filter(asset => options.categories!.includes(asset.category));
    }

    // Filter by materials
    if (options.materials && options.materials.length > 0) {
      results = results.filter(asset => 
        options.materials!.some(m => asset.materials.includes(m))
      );
    }

    // Filter by styles
    if (options.styles && options.styles.length > 0) {
      results = results.filter(asset => 
        options.styles!.some(s => asset.styles.includes(s))
      );
    }

    // Filter by price
    if (options.minPrice !== undefined) {
      results = results.filter(asset => (asset.price || 0) >= options.minPrice!);
    }
    if (options.maxPrice !== undefined) {
      results = results.filter(asset => (asset.price || Infinity) <= options.maxPrice!);
    }

    // Filter by premium status
    if (options.isPremium !== undefined) {
      results = results.filter(asset => asset.isPremium === options.isPremium);
    }

    // Sort results
    const sortBy = options.sortBy || 'popularity';
    const sortOrder = options.sortOrder || 'desc';

    results.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'popularity':
          comparison = a.popularity - b.popularity;
          break;
        case 'price':
          comparison = (a.price || 0) - (b.price || 0);
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'dateAdded':
          comparison = new Date(a.dateAdded as string).getTime() - new Date(b.dateAdded as string).getTime();
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return results;
  }

  /**
   * Get all categories
   */
  getCategories(): AssetCategory[] {
    return Array.from(this.categoryIndex.keys());
  }

  /**
   * Get asset count by category
   */
  getCategoryCount(category: AssetCategory): number {
    return this.categoryIndex.get(category)?.size || 0;
  }

  /**
   * Get total asset count
   */
  getTotalCount(): number {
    return this.assets.size;
  }

  /**
   * Get popular assets
   */
  getPopularAssets(limit: number = 10): AssetMetadata[] {
    return Array.from(this.assets.values())
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, limit);
  }

  /**
   * Get recently added assets
   */
  getRecentAssets(limit: number = 10): AssetMetadata[] {
    return Array.from(this.assets.values())
      .sort((a, b) => new Date(b.dateAdded as string).getTime() - new Date(a.dateAdded as string).getTime())
      .slice(0, limit);
  }

  /**
   * Remove asset from registry
   */
  removeAsset(id: string): boolean {
    const asset = this.assets.get(id);
    if (!asset) return false;

    this.assets.delete(id);
    this.removeFromIndexes(id, asset);
    return true;
  }

  /**
   * Remove asset from all indexes
   */
  private removeFromIndexes(id: string, asset: AssetMetadata): void {
    this.categoryIndex.get(asset.category)?.delete(id);
    asset.materials.forEach(m => this.materialIndex.get(m)?.delete(id));
    asset.styles.forEach(s => this.styleIndex.get(s)?.delete(id));
    asset.tags.forEach(t => this.tagIndex.get(t)?.delete(id));
  }

  /**
   * Clear all assets
   */
  clear(): void {
    this.assets.clear();
    this.categoryIndex.clear();
    this.materialIndex.clear();
    this.styleIndex.clear();
    this.tagIndex.clear();
    this.searchIndex.clear();
  }

  /**
   * Get registry statistics
   */
  getStats(): {
    totalAssets: number;
    categories: number;
    materials: number;
    styles: number;
    totalTags: number;
    searchTerms: number;
  } {
    return {
      totalAssets: this.assets.size,
      categories: this.categoryIndex.size,
      materials: this.materialIndex.size,
      styles: this.styleIndex.size,
      totalTags: this.tagIndex.size,
      searchTerms: this.searchIndex.size,
    };
  }
}

// Singleton instance
export const assetRegistry = new AssetRegistry();
export default assetRegistry;
