// Textures library exports
export interface TextureCategory {
  id: string;
  name: string;
  icon: string;
  textures: TextureItem[];
}

export interface TextureItem {
  id: string;
  name: string;
  description?: string;
  category: string;
  url: string;
  thumbnailUrl?: string;
  width: number;
  height: number;
  seamless: boolean;
  repeat: { x: number; y: number };
  tags?: string[];
}

// Texture categories
export const TEXTURE_CATEGORIES: TextureCategory[] = [
  {
    id: 'wood',
    name: 'Wood',
    icon: 'TreeDeciduous',
    textures: [],
  },
  {
    id: 'brick',
    name: 'Brick',
    icon: 'Square',
    textures: [],
  },
  {
    id: 'concrete',
    name: 'Concrete',
    icon: 'Mountain',
    textures: [],
  },
  {
    id: 'fabric',
    name: 'Fabric',
    icon: 'Shirt',
    textures: [],
  },
  {
    id: 'metal',
    name: 'Metal',
    icon: 'Circle',
    textures: [],
  },
  {
    id: 'stone',
    name: 'Stone',
    icon: 'Gem',
    textures: [],
  },
  {
    id: 'tile',
    name: 'Tile',
    icon: 'Grid3X3',
    textures: [],
  },
  {
    id: 'floor',
    name: 'Floor',
    icon: 'PanelTop',
    textures: [],
  },
  {
    id: 'wallpaper',
    name: 'Wallpaper',
    icon: 'Scroll',
    textures: [],
  },
  {
    id: 'nature',
    name: 'Nature',
    icon: 'Leaf',
    textures: [],
  },
];

// Textures library class
export class TexturesLibrary {
  private categories: Map<string, TextureCategory> = new Map();
  private textures: Map<string, TextureItem> = new Map();

  constructor() {
    this.initializeCategories();
  }

  private initializeCategories(): void {
    for (const category of TEXTURE_CATEGORIES) {
      this.categories.set(category.id, { ...category, textures: [] });
    }
  }

  public addTexture(texture: TextureItem): void {
    this.textures.set(texture.id, texture);

    const category = this.categories.get(texture.category);
    if (category) {
      category.textures.push(texture);
    }
  }

  public addTextures(textures: TextureItem[]): void {
    for (const texture of textures) {
      this.addTexture(texture);
    }
  }

  public getTexture(id: string): TextureItem | undefined {
    return this.textures.get(id);
  }

  public getCategory(id: string): TextureCategory | undefined {
    return this.categories.get(id);
  }

  public getAllCategories(): TextureCategory[] {
    return Array.from(this.categories.values());
  }

  public getAllTextures(): TextureItem[] {
    return Array.from(this.textures.values());
  }

  public getTexturesByCategory(categoryId: string): TextureItem[] {
    const category = this.categories.get(categoryId);
    return category?.textures || [];
  }

  public search(query: string): TextureItem[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllTextures().filter(texture =>
      texture.name.toLowerCase().includes(lowerQuery) ||
      texture.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  public filter(filters: {
    category?: string;
    seamless?: boolean;
  }): TextureItem[] {
    let textures = this.getAllTextures();

    if (filters.category) {
      textures = textures.filter(t => t.category === filters.category);
    }

    if (filters.seamless !== undefined) {
      textures = textures.filter(t => t.seamless === filters.seamless);
    }

    return textures;
  }

  public removeTexture(id: string): boolean {
    const texture = this.textures.get(id);
    if (!texture) return false;

    const category = this.categories.get(texture.category);
    if (category) {
      category.textures = category.textures.filter(t => t.id !== id);
    }

    this.textures.delete(id);
    return true;
  }

  public clear(): void {
    this.textures.clear();
    this.initializeCategories();
  }

  public getStats(): {
    totalTextures: number;
    totalCategories: number;
    texturesByCategory: Record<string, number>;
  } {
    const texturesByCategory: Record<string, number> = {};

    for (const [id, category] of this.categories) {
      texturesByCategory[id] = category.textures.length;
    }

    return {
      totalTextures: this.textures.size,
      totalCategories: this.categories.size,
      texturesByCategory,
    };
  }
}

// Create singleton instance
export const texturesLibrary = new TexturesLibrary();
