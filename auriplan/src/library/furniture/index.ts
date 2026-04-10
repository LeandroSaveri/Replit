// Furniture library exports
export interface FurnitureCategory {
  id: string;
  name: string;
  icon: string;
  items: FurnitureItem[];
}

export interface FurnitureItem {
  id: string;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  width: number;
  height: number;
  depth: number;
  defaultColor?: string;
  material?: string;
  price?: number;
  currency?: string;
  brand?: string;
  modelUrl?: string;
  thumbnailUrl?: string;
  tags?: string[];
  variants?: FurnitureVariant[];
}

export interface FurnitureVariant {
  id: string;
  name: string;
  color: string;
  material: string;
  price?: number;
}

// Furniture categories
export const FURNITURE_CATEGORIES: FurnitureCategory[] = [
  {
    id: 'living-room',
    name: 'Living Room',
    icon: 'Sofa',
    items: [],
  },
  {
    id: 'bedroom',
    name: 'Bedroom',
    icon: 'Bed',
    items: [],
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    icon: 'ChefHat',
    items: [],
  },
  {
    id: 'bathroom',
    name: 'Bathroom',
    icon: 'Bath',
    items: [],
  },
  {
    id: 'dining',
    name: 'Dining',
    icon: 'Utensils',
    items: [],
  },
  {
    id: 'office',
    name: 'Office',
    icon: 'Briefcase',
    items: [],
  },
  {
    id: 'outdoor',
    name: 'Outdoor',
    icon: 'TreePine',
    items: [],
  },
  {
    id: 'lighting',
    name: 'Lighting',
    icon: 'Lightbulb',
    items: [],
  },
  {
    id: 'decor',
    name: 'Decor',
    icon: 'Palette',
    items: [],
  },
  {
    id: 'storage',
    name: 'Storage',
    icon: 'Archive',
    items: [],
  },
];

// Furniture library class
export class FurnitureLibrary {
  private categories: Map<string, FurnitureCategory> = new Map();
  private items: Map<string, FurnitureItem> = new Map();
  private searchIndex: Map<string, string[]> = new Map();

  constructor() {
    this.initializeCategories();
  }

  private initializeCategories(): void {
    for (const category of FURNITURE_CATEGORIES) {
      this.categories.set(category.id, { ...category, items: [] });
    }
  }

  public addItem(item: FurnitureItem): void {
    this.items.set(item.id, item);

    // Add to category
    const category = this.categories.get(item.category);
    if (category) {
      category.items.push(item);
    }

    // Add to search index
    this.indexItem(item);
  }

  public addItems(items: FurnitureItem[]): void {
    for (const item of items) {
      this.addItem(item);
    }
  }

  private indexItem(item: FurnitureItem): void {
    const searchTerms = [
      item.name.toLowerCase(),
      item.description?.toLowerCase() || '',
      item.category.toLowerCase(),
      item.subcategory?.toLowerCase() || '',
      ...(item.tags?.map(t => t.toLowerCase()) || []),
    ];

    for (const term of searchTerms) {
      if (!this.searchIndex.has(term)) {
        this.searchIndex.set(term, []);
      }
      this.searchIndex.get(term)!.push(item.id);
    }
  }

  public getItem(id: string): FurnitureItem | undefined {
    return this.items.get(id);
  }

  public getCategory(id: string): FurnitureCategory | undefined {
    return this.categories.get(id);
  }

  public getAllCategories(): FurnitureCategory[] {
    return Array.from(this.categories.values());
  }

  public getAllItems(): FurnitureItem[] {
    return Array.from(this.items.values());
  }

  public getItemsByCategory(categoryId: string): FurnitureItem[] {
    const category = this.categories.get(categoryId);
    return category?.items || [];
  }

  public search(query: string): FurnitureItem[] {
    const lowerQuery = query.toLowerCase();
    const results = new Set<string>();

    for (const [term, itemIds] of this.searchIndex) {
      if (term.includes(lowerQuery)) {
        for (const id of itemIds) {
          results.add(id);
        }
      }
    }

    return Array.from(results).map(id => this.items.get(id)!);
  }

  public filter(filters: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    brand?: string;
    tags?: string[];
  }): FurnitureItem[] {
    let items = this.getAllItems();

    if (filters.category) {
      items = items.filter(item => item.category === filters.category);
    }

    if (filters.minPrice !== undefined) {
      items = items.filter(item => (item.price || 0) >= filters.minPrice!);
    }

    if (filters.maxPrice !== undefined) {
      items = items.filter(item => (item.price || Infinity) <= filters.maxPrice!);
    }

    if (filters.brand) {
      items = items.filter(item => item.brand === filters.brand);
    }

    if (filters.tags && filters.tags.length > 0) {
      items = items.filter(item =>
        filters.tags!.some(tag => item.tags?.includes(tag))
      );
    }

    return items;
  }

  public removeItem(id: string): boolean {
    const item = this.items.get(id);
    if (!item) return false;

    // Remove from category
    const category = this.categories.get(item.category);
    if (category) {
      category.items = category.items.filter(i => i.id !== id);
    }

    // Remove from search index
    for (const [term, itemIds] of this.searchIndex) {
      const index = itemIds.indexOf(id);
      if (index > -1) {
        itemIds.splice(index, 1);
        if (itemIds.length === 0) {
          this.searchIndex.delete(term);
        }
      }
    }

    this.items.delete(id);
    return true;
  }

  public clear(): void {
    this.items.clear();
    this.searchIndex.clear();
    this.initializeCategories();
  }

  public getStats(): {
    totalItems: number;
    totalCategories: number;
    itemsByCategory: Record<string, number>;
  } {
    const itemsByCategory: Record<string, number> = {};

    for (const [id, category] of this.categories) {
      itemsByCategory[id] = category.items.length;
    }

    return {
      totalItems: this.items.size,
      totalCategories: this.categories.size,
      itemsByCategory,
    };
  }

  // Export/Import
  public export(): string {
    return JSON.stringify({
      categories: Array.from(this.categories.values()),
      items: Array.from(this.items.values()),
    });
  }

  public import(json: string): void {
    const data = JSON.parse(json);

    this.clear();

    if (data.items) {
      this.addItems(data.items);
    }
  }
}

// Create singleton instance
export const furnitureLibrary = new FurnitureLibrary();
