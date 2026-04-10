// Models library exports
export interface ModelCategory {
  id: string;
  name: string;
  icon: string;
  models: ModelItem[];
}

export interface ModelItem {
  id: string;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  url: string;
  format: 'obj' | 'fbx' | 'gltf' | 'glb' | 'dae' | '3ds';
  thumbnailUrl?: string;
  width: number;
  height: number;
  depth: number;
  polygons?: number;
  vertices?: number;
  materials?: string[];
  animations?: string[];
  price?: number;
  currency?: string;
  brand?: string;
  designer?: string;
  tags?: string[];
  variants?: ModelVariant[];
}

export interface ModelVariant {
  id: string;
  name: string;
  materialOverrides?: Record<string, string>;
  price?: number;
}

// Model categories
export const MODEL_CATEGORIES: ModelCategory[] = [
  {
    id: 'furniture',
    name: 'Furniture',
    icon: 'Sofa',
    models: [],
  },
  {
    id: 'lighting',
    name: 'Lighting',
    icon: 'Lightbulb',
    models: [],
  },
  {
    id: 'decor',
    name: 'Decor',
    icon: 'Palette',
    models: [],
  },
  {
    id: 'appliances',
    name: 'Appliances',
    icon: 'Refrigerator',
    models: [],
  },
  {
    id: 'plants',
    name: 'Plants',
    icon: 'Flower2',
    models: [],
  },
  {
    id: 'architecture',
    name: 'Architecture',
    icon: 'Building2',
    models: [],
  },
  {
    id: 'vehicles',
    name: 'Vehicles',
    icon: 'Car',
    models: [],
  },
  {
    id: 'electronics',
    name: 'Electronics',
    icon: 'Monitor',
    models: [],
  },
];

// Models library class
export class ModelsLibrary {
  private categories: Map<string, ModelCategory> = new Map();
  private models: Map<string, ModelItem> = new Map();

  constructor() {
    this.initializeCategories();
  }

  private initializeCategories(): void {
    for (const category of MODEL_CATEGORIES) {
      this.categories.set(category.id, { ...category, models: [] });
    }
  }

  public addModel(model: ModelItem): void {
    this.models.set(model.id, model);

    const category = this.categories.get(model.category);
    if (category) {
      category.models.push(model);
    }
  }

  public addModels(models: ModelItem[]): void {
    for (const model of models) {
      this.addModel(model);
    }
  }

  public getModel(id: string): ModelItem | undefined {
    return this.models.get(id);
  }

  public getCategory(id: string): ModelCategory | undefined {
    return this.categories.get(id);
  }

  public getAllCategories(): ModelCategory[] {
    return Array.from(this.categories.values());
  }

  public getAllModels(): ModelItem[] {
    return Array.from(this.models.values());
  }

  public getModelsByCategory(categoryId: string): ModelItem[] {
    const category = this.categories.get(categoryId);
    return category?.models || [];
  }

  public search(query: string): ModelItem[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllModels().filter(model =>
      model.name.toLowerCase().includes(lowerQuery) ||
      model.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  public filter(filters: {
    category?: string;
    format?: string;
    maxPolygons?: number;
    animated?: boolean;
  }): ModelItem[] {
    let models = this.getAllModels();

    if (filters.category) {
      models = models.filter(m => m.category === filters.category);
    }

    if (filters.format) {
      models = models.filter(m => m.format === filters.format);
    }

    if (filters.maxPolygons !== undefined) {
      models = models.filter(m => (m.polygons || Infinity) <= filters.maxPolygons!);
    }

    if (filters.animated !== undefined) {
      models = filters.animated
        ? models.filter(m => m.animations && m.animations.length > 0)
        : models.filter(m => !m.animations || m.animations.length === 0);
    }

    return models;
  }

  public removeModel(id: string): boolean {
    const model = this.models.get(id);
    if (!model) return false;

    const category = this.categories.get(model.category);
    if (category) {
      category.models = category.models.filter(m => m.id !== id);
    }

    this.models.delete(id);
    return true;
  }

  public clear(): void {
    this.models.clear();
    this.initializeCategories();
  }

  public getStats(): {
    totalModels: number;
    totalCategories: number;
    modelsByCategory: Record<string, number>;
    formats: Record<string, number>;
  } {
    const modelsByCategory: Record<string, number> = {};
    const formats: Record<string, number> = {};

    for (const [id, category] of this.categories) {
      modelsByCategory[id] = category.models.length;
    }

    for (const model of this.models.values()) {
      formats[model.format] = (formats[model.format] || 0) + 1;
    }

    return {
      totalModels: this.models.size,
      totalCategories: this.categories.size,
      modelsByCategory,
      formats,
    };
  }

  // Export/Import
  public export(): string {
    return JSON.stringify({
      categories: Array.from(this.categories.values()),
      models: Array.from(this.models.values()),
    });
  }

  public import(json: string): void {
    const data = JSON.parse(json);

    this.clear();

    if (data.models) {
      this.addModels(data.models);
    }
  }
}

// Create singleton instance
export const modelsLibrary = new ModelsLibrary();
