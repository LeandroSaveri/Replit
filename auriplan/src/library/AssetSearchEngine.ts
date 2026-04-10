/**
 * Asset Search Engine for AuriPlan
 * Advanced search functionality with filters and suggestions
 */

import { AssetMetadata, AssetCategory, MaterialType, DesignStyle, assetRegistry } from './AssetRegistry';

export interface SearchSuggestion {
  type: 'asset' | 'category' | 'material' | 'style' | 'tag';
  value: string;
  display: string;
  count: number;
}

export interface SearchFilters {
  categories?: AssetCategory[];
  materials?: MaterialType[];
  styles?: DesignStyle[];
  minPrice?: number;
  maxPrice?: number;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  minDepth?: number;
  maxDepth?: number;
  isPremium?: boolean;
  brands?: string[];
  colors?: string[];
}

export interface SearchResult {
  assets: AssetMetadata[];
  totalCount: number;
  filters: {
    categories: Array<{ id: AssetCategory; count: number }>;
    materials: Array<{ id: MaterialType; count: number }>;
    styles: Array<{ id: DesignStyle; count: number }>;
    priceRange: { min: number; max: number };
    brands: Array<{ name: string; count: number }>;
  };
  suggestions: SearchSuggestion[];
}

export interface SearchHistoryItem {
  query: string;
  filters: SearchFilters;
  timestamp: number;
  resultCount: number;
}

class AssetSearchEngine {
  private searchHistory: SearchHistoryItem[] = [];
  private maxHistoryItems = 20;
  private commonTerms = new Set<string>();

  constructor() {
    this.initializeCommonTerms();
  }

  /**
   * Initialize common search terms
   */
  private initializeCommonTerms(): void {
    const terms = [
      'sofa', 'chair', 'table', 'bed', 'desk', 'cabinet', 'wardrobe',
      'lamp', 'light', 'mirror', 'vase', 'plant', 'rug', 'curtain',
      'modern', 'classic', 'minimalist', 'wood', 'metal', 'glass',
      'kitchen', 'bedroom', 'living room', 'bathroom', 'office',
      'white', 'black', 'brown', 'gray', 'blue', 'green',
    ];
    terms.forEach(term => this.commonTerms.add(term.toLowerCase()));
  }

  /**
   * Search assets with query and filters
   */
  search(query: string, filters: SearchFilters = {}, options: {
    limit?: number;
    offset?: number;
    sortBy?: 'relevance' | 'popularity' | 'price' | 'name' | 'newest';
    sortOrder?: 'asc' | 'desc';
  } = {}): SearchResult {
    const normalizedQuery = query.toLowerCase().trim();
    
    // Get base results from registry
    let assets = assetRegistry.advancedSearch({
      query: normalizedQuery,
      categories: filters.categories,
      materials: filters.materials,
      styles: filters.styles,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      isPremium: filters.isPremium,
      sortBy: options.sortBy === 'newest' ? 'dateAdded' : 
              options.sortBy === 'relevance' ? 'popularity' : 
              options.sortBy || 'popularity',
      sortOrder: options.sortOrder || 'desc',
    });

    // Apply dimension filters
    if (filters.minWidth !== undefined) {
      assets = assets.filter(a => a.dimensions.width >= filters.minWidth!);
    }
    if (filters.maxWidth !== undefined) {
      assets = assets.filter(a => a.dimensions.width <= filters.maxWidth!);
    }
    if (filters.minHeight !== undefined) {
      assets = assets.filter(a => a.dimensions.height >= filters.minHeight!);
    }
    if (filters.maxHeight !== undefined) {
      assets = assets.filter(a => a.dimensions.height <= filters.maxHeight!);
    }
    if (filters.minDepth !== undefined) {
      assets = assets.filter(a => a.dimensions.depth >= filters.minDepth!);
    }
    if (filters.maxDepth !== undefined) {
      assets = assets.filter(a => a.dimensions.depth <= filters.maxDepth!);
    }

    // Apply brand filter
    if (filters.brands && filters.brands.length > 0) {
      assets = assets.filter(a => filters.brands!.includes(a.brand || ''));
    }

    // Apply color filter
    if (filters.colors && filters.colors.length > 0) {
      assets = assets.filter(a => 
        filters.colors!.some(c => a.colors.includes(c.toLowerCase()))
      );
    }

    const totalCount = assets.length;

    // Apply pagination
    const offset = options.offset || 0;
    const limit = options.limit || 20;
    assets = assets.slice(offset, offset + limit);

    // Build available filters from results
    const availableFilters = this.buildAvailableFilters(assets);

    // Generate suggestions
    const suggestions = this.generateSuggestions(normalizedQuery, assets);

    // Save to history
    this.addToHistory(query, filters, totalCount);

    return {
      assets,
      totalCount,
      filters: availableFilters,
      suggestions,
    };
  }

  /**
   * Build available filters from search results
   */
  private buildAvailableFilters(assets: AssetMetadata[]): SearchResult['filters'] {
    const categoryCounts = new Map<AssetCategory, number>();
    const materialCounts = new Map<MaterialType, number>();
    const styleCounts = new Map<DesignStyle, number>();
    const brandCounts = new Map<string, number>();
    let minPrice = Infinity;
    let maxPrice = 0;

    assets.forEach(asset => {
      // Count categories
      categoryCounts.set(asset.category, (categoryCounts.get(asset.category) || 0) + 1);

      // Count materials
      asset.materials.forEach(m => {
        materialCounts.set(m, (materialCounts.get(m) || 0) + 1);
      });

      // Count styles
      asset.styles.forEach(s => {
        styleCounts.set(s, (styleCounts.get(s) || 0) + 1);
      });

      // Count brands
      if (asset.brand) {
        brandCounts.set(asset.brand, (brandCounts.get(asset.brand) || 0) + 1);
      }

      // Track price range
      if (asset.price !== undefined) {
        minPrice = Math.min(minPrice, asset.price);
        maxPrice = Math.max(maxPrice, asset.price);
      }
    });

    return {
      categories: Array.from(categoryCounts.entries())
        .map(([id, count]) => ({ id, count }))
        .sort((a, b) => b.count - a.count),
      materials: Array.from(materialCounts.entries())
        .map(([id, count]) => ({ id, count }))
        .sort((a, b) => b.count - a.count),
      styles: Array.from(styleCounts.entries())
        .map(([id, count]) => ({ id, count }))
        .sort((a, b) => b.count - a.count),
      priceRange: {
        min: minPrice === Infinity ? 0 : minPrice,
        max: maxPrice === 0 ? 10000 : maxPrice,
      },
      brands: Array.from(brandCounts.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
    };
  }

  /**
   * Generate search suggestions
   */
  private generateSuggestions(query: string, results: AssetMetadata[]): SearchSuggestion[] {
    const suggestions: SearchSuggestion[] = [];
    const added = new Set<string>();

    // Add category suggestions
    const categoryCounts = new Map<string, number>();
    results.forEach(r => {
      categoryCounts.set(r.category, (categoryCounts.get(r.category) || 0) + 1);
    });
    categoryCounts.forEach((count, category) => {
      if (!added.has(category)) {
        suggestions.push({
          type: 'category',
          value: category,
          display: this.capitalizeFirst(category),
          count,
        });
        added.add(category);
      }
    });

    // Add material suggestions
    const materialCounts = new Map<string, number>();
    results.forEach(r => {
      r.materials.forEach(m => {
        materialCounts.set(m, (materialCounts.get(m) || 0) + 1);
      });
    });
    materialCounts.forEach((count, material) => {
      if (!added.has(material)) {
        suggestions.push({
          type: 'material',
          value: material,
          display: this.capitalizeFirst(material),
          count,
        });
        added.add(material);
      }
    });

    // Add style suggestions
    const styleCounts = new Map<string, number>();
    results.forEach(r => {
      r.styles.forEach(s => {
        styleCounts.set(s, (styleCounts.get(s) || 0) + 1);
      });
    });
    styleCounts.forEach((count, style) => {
      if (!added.has(style)) {
        suggestions.push({
          type: 'style',
          value: style,
          display: this.capitalizeFirst(style),
          count,
        });
        added.add(style);
      }
    });

    // Add popular tags
    const tagCounts = new Map<string, number>();
    results.forEach(r => {
      r.tags.forEach(t => {
        tagCounts.set(t, (tagCounts.get(t) || 0) + 1);
      });
    });
    Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([tag, count]) => {
        if (!added.has(tag)) {
          suggestions.push({
            type: 'tag',
            value: tag,
            display: this.capitalizeFirst(tag),
            count,
          });
          added.add(tag);
        }
      });

    return suggestions.slice(0, 10);
  }

  /**
   * Get autocomplete suggestions
   */
  getAutocompleteSuggestions(partial: string): SearchSuggestion[] {
    const normalized = partial.toLowerCase().trim();
    if (normalized.length < 2) return [];

    const suggestions: SearchSuggestion[] = [];
    const allAssets: any[] = (() => {
      try {
        // Try getAllAssets first (added for compatibility)
        if (typeof (assetRegistry as any).getAllAssets === 'function') {
          return Array.from((assetRegistry as any).getAllAssets());
        }
        // Fallback: collect from known categories
        const cats = ['furniture','kitchen','bathroom','bedroom','livingroom','dining','office','lighting','decor','appliances'];
        return cats.flatMap(c => (assetRegistry as any).getAssetsByCategory?.(c) || []);
      } catch { return []; }
    })();

    // Search in asset names
    allAssets
      .filter(a => a.name.toLowerCase().includes(normalized))
      .slice(0, 5)
      .forEach(a => {
        suggestions.push({
          type: 'asset',
          value: a.name,
          display: a.name,
          count: 1,
        });
      });

    // Search in common terms
    Array.from(this.commonTerms)
      .filter(term => term.includes(normalized) && term !== normalized)
      .slice(0, 5)
      .forEach(term => {
        const count = allAssets.filter(a => 
          a.name.toLowerCase().includes(term) ||
          (a.tags ?? []).some((t: string) => t.toLowerCase().includes(term))
        ).length;
        
        if (count > 0) {
          suggestions.push({
            type: 'tag',
            value: term,
            display: this.capitalizeFirst(term),
            count,
          });
        }
      });

    return suggestions.slice(0, 8);
  }

  /**
   * Get quick filters based on current results
   */
  getQuickFilters(query: string): Array<{ label: string; filter: Partial<SearchFilters> }> {
    const normalized = query.toLowerCase();
    const quickFilters: Array<{ label: string; filter: Partial<SearchFilters> }> = [];

    // Price filters
    quickFilters.push(
      { label: 'Under $500', filter: { maxPrice: 500 } },
      { label: '$500 - $1000', filter: { minPrice: 500, maxPrice: 1000 } },
      { label: '$1000 - $2000', filter: { minPrice: 1000, maxPrice: 2000 } },
      { label: 'Over $2000', filter: { minPrice: 2000 } },
    );

    // Style filters based on query
    if (normalized.includes('modern') || normalized.includes('contemporary')) {
      quickFilters.push({ label: 'Modern Style', filter: { styles: ['modern'] } });
    }
    if (normalized.includes('classic') || normalized.includes('traditional')) {
      quickFilters.push({ label: 'Classic Style', filter: { styles: ['classic'] } });
    }

    return quickFilters;
  }

  /**
   * Add search to history
   */
  private addToHistory(query: string, filters: SearchFilters, resultCount: number): void {
    this.searchHistory.unshift({
      query,
      filters,
      timestamp: Date.now(),
      resultCount,
    });

    // Keep only recent items
    if (this.searchHistory.length > this.maxHistoryItems) {
      this.searchHistory = this.searchHistory.slice(0, this.maxHistoryItems);
    }
  }

  /**
   * Get search history
   */
  getSearchHistory(): SearchHistoryItem[] {
    return [...this.searchHistory];
  }

  /**
   * Clear search history
   */
  clearHistory(): void {
    this.searchHistory = [];
  }

  /**
   * Get popular searches
   */
  getPopularSearches(): string[] {
    const searchCounts = new Map<string, number>();
    
    this.searchHistory.forEach(item => {
      searchCounts.set(item.query, (searchCounts.get(item.query) || 0) + 1);
    });

    return Array.from(searchCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([query]) => query);
  }

  /**
   * Capitalize first letter
   */
  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

// Singleton instance
export const assetSearchEngine = new AssetSearchEngine();
export default assetSearchEngine;
