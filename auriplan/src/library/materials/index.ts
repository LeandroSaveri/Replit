// Materials library exports
export interface MaterialCategory {
  id: string;
  name: string;
  icon: string;
  materials: MaterialItem[];
}

export interface MaterialItem {
  id: string;
  name: string;
  description?: string;
  category: string;
  type: 'standard' | 'physical' | 'glass' | 'metal' | 'wood' | 'fabric' | 'stone' | 'tile' | 'paint' | 'wallpaper' | 'concrete' | 'brick' | string;
  color: string;
  roughness: number;
  metalness: number;
  opacity?: number;
  emissive?: string;
  emissiveIntensity?: number;
  textureUrl?: string;
  normalMapUrl?: string;
  roughnessMapUrl?: string;
  price?: number;
  currency?: string;
  brand?: string;
  tags?: string[];
}

// Material categories
export const MATERIAL_CATEGORIES: MaterialCategory[] = [
  {
    id: 'wood',
    name: 'Wood',
    icon: 'TreeDeciduous',
    materials: [],
  },
  {
    id: 'metal',
    name: 'Metal',
    icon: 'Circle',
    materials: [],
  },
  {
    id: 'fabric',
    name: 'Fabric',
    icon: 'Shirt',
    materials: [],
  },
  {
    id: 'stone',
    name: 'Stone',
    icon: 'Mountain',
    materials: [],
  },
  {
    id: 'tile',
    name: 'Tile',
    icon: 'Grid3X3',
    materials: [],
  },
  {
    id: 'paint',
    name: 'Paint',
    icon: 'Paintbrush',
    materials: [],
  },
  {
    id: 'glass',
    name: 'Glass',
    icon: 'Square',
    materials: [],
  },
  {
    id: 'plastic',
    name: 'Plastic',
    icon: 'Box',
    materials: [],
  },
];

// Preset materials
export const PRESET_MATERIALS: MaterialItem[] = [
  // Wood materials
  {
    id: 'wood-oak-natural',
    name: 'Oak Natural',
    category: 'wood',
    type: 'wood',
    color: '#c4a77d',
    roughness: 0.6,
    metalness: 0.0,
    tags: ['wood', 'oak', 'natural'],
  },
  {
    id: 'wood-oak-dark',
    name: 'Oak Dark',
    category: 'wood',
    type: 'wood',
    color: '#8b6914',
    roughness: 0.6,
    metalness: 0.0,
    tags: ['wood', 'oak', 'dark'],
  },
  {
    id: 'wood-walnut',
    name: 'Walnut',
    category: 'wood',
    type: 'wood',
    color: '#5d4037',
    roughness: 0.5,
    metalness: 0.0,
    tags: ['wood', 'walnut'],
  },
  {
    id: 'wood-cherry',
    name: 'Cherry',
    category: 'wood',
    type: 'wood',
    color: '#a0522d',
    roughness: 0.5,
    metalness: 0.0,
    tags: ['wood', 'cherry'],
  },
  {
    id: 'wood-pine',
    name: 'Pine',
    category: 'wood',
    type: 'wood',
    color: '#f5deb3',
    roughness: 0.7,
    metalness: 0.0,
    tags: ['wood', 'pine'],
  },
  {
    id: 'wood-birch',
    name: 'Birch',
    category: 'wood',
    type: 'wood',
    color: '#f0e68c',
    roughness: 0.6,
    metalness: 0.0,
    tags: ['wood', 'birch'],
  },
  {
    id: 'wood-mahogany',
    name: 'Mahogany',
    category: 'wood',
    type: 'wood',
    color: '#c04000',
    roughness: 0.4,
    metalness: 0.0,
    tags: ['wood', 'mahogany'],
  },
  {
    id: 'wood-ebony',
    name: 'Ebony',
    category: 'wood',
    type: 'wood',
    color: '#3d2b1f',
    roughness: 0.3,
    metalness: 0.0,
    tags: ['wood', 'ebony'],
  },

  // Metal materials
  {
    id: 'metal-steel-brushed',
    name: 'Steel Brushed',
    category: 'metal',
    type: 'metal',
    color: '#a0a0a0',
    roughness: 0.3,
    metalness: 0.9,
    tags: ['metal', 'steel'],
  },
  {
    id: 'metal-steel-polished',
    name: 'Steel Polished',
    category: 'metal',
    type: 'metal',
    color: '#c0c0c0',
    roughness: 0.1,
    metalness: 1.0,
    tags: ['metal', 'steel', 'polished'],
  },
  {
    id: 'metal-gold',
    name: 'Gold',
    category: 'metal',
    type: 'metal',
    color: '#ffd700',
    roughness: 0.2,
    metalness: 1.0,
    tags: ['metal', 'gold'],
  },
  {
    id: 'metal-rose-gold',
    name: 'Rose Gold',
    category: 'metal',
    type: 'metal',
    color: '#b76e79',
    roughness: 0.2,
    metalness: 1.0,
    tags: ['metal', 'gold', 'rose'],
  },
  {
    id: 'metal-copper',
    name: 'Copper',
    category: 'metal',
    type: 'metal',
    color: '#b87333',
    roughness: 0.3,
    metalness: 0.9,
    tags: ['metal', 'copper'],
  },
  {
    id: 'metal-bronze',
    name: 'Bronze',
    category: 'metal',
    type: 'metal',
    color: '#cd7f32',
    roughness: 0.3,
    metalness: 0.9,
    tags: ['metal', 'bronze'],
  },
  {
    id: 'metal-brass',
    name: 'Brass',
    category: 'metal',
    type: 'metal',
    color: '#b5a642',
    roughness: 0.3,
    metalness: 0.9,
    tags: ['metal', 'brass'],
  },
  {
    id: 'metal-chrome',
    name: 'Chrome',
    category: 'metal',
    type: 'metal',
    color: '#e8e8e8',
    roughness: 0.05,
    metalness: 1.0,
    tags: ['metal', 'chrome'],
  },
  {
    id: 'metal-black-matte',
    name: 'Black Matte Metal',
    category: 'metal',
    type: 'metal',
    color: '#1a1a1a',
    roughness: 0.7,
    metalness: 0.8,
    tags: ['metal', 'black', 'matte'],
  },

  // Fabric materials
  {
    id: 'fabric-cotton-white',
    name: 'Cotton White',
    category: 'fabric',
    type: 'fabric',
    color: '#ffffff',
    roughness: 0.9,
    metalness: 0.0,
    tags: ['fabric', 'cotton'],
  },
  {
    id: 'fabric-cotton-beige',
    name: 'Cotton Beige',
    category: 'fabric',
    type: 'fabric',
    color: '#f5f5dc',
    roughness: 0.9,
    metalness: 0.0,
    tags: ['fabric', 'cotton'],
  },
  {
    id: 'fabric-linen',
    name: 'Linen',
    category: 'fabric',
    type: 'fabric',
    color: '#faf0e6',
    roughness: 0.95,
    metalness: 0.0,
    tags: ['fabric', 'linen'],
  },
  {
    id: 'fabric-velvet-red',
    name: 'Velvet Red',
    category: 'fabric',
    type: 'fabric',
    color: '#800020',
    roughness: 0.95,
    metalness: 0.0,
    tags: ['fabric', 'velvet'],
  },
  {
    id: 'fabric-velvet-blue',
    name: 'Velvet Blue',
    category: 'fabric',
    type: 'fabric',
    color: '#191970',
    roughness: 0.95,
    metalness: 0.0,
    tags: ['fabric', 'velvet'],
  },
  {
    id: 'fabric-velvet-green',
    name: 'Velvet Green',
    category: 'fabric',
    type: 'fabric',
    color: '#006400',
    roughness: 0.95,
    metalness: 0.0,
    tags: ['fabric', 'velvet'],
  },
  {
    id: 'fabric-leather-brown',
    name: 'Leather Brown',
    category: 'fabric',
    type: 'fabric',
    color: '#8b4513',
    roughness: 0.6,
    metalness: 0.1,
    tags: ['fabric', 'leather'],
  },
  {
    id: 'fabric-leather-black',
    name: 'Leather Black',
    category: 'fabric',
    type: 'fabric',
    color: '#1a1a1a',
    roughness: 0.6,
    metalness: 0.1,
    tags: ['fabric', 'leather'],
  },
  {
    id: 'fabric-suede',
    name: 'Suede',
    category: 'fabric',
    type: 'fabric',
    color: '#d2b48c',
    roughness: 0.98,
    metalness: 0.0,
    tags: ['fabric', 'suede'],
  },

  // Stone materials
  {
    id: 'stone-marble-white',
    name: 'Marble White',
    category: 'stone',
    type: 'stone',
    color: '#f5f5f5',
    roughness: 0.1,
    metalness: 0.0,
    tags: ['stone', 'marble'],
  },
  {
    id: 'stone-marble-carrara',
    name: 'Marble Carrara',
    category: 'stone',
    type: 'stone',
    color: '#f0f0f0',
    roughness: 0.1,
    metalness: 0.0,
    tags: ['stone', 'marble'],
  },
  {
    id: 'stone-marble-black',
    name: 'Marble Black',
    category: 'stone',
    type: 'stone',
    color: '#1a1a1a',
    roughness: 0.1,
    metalness: 0.0,
    tags: ['stone', 'marble'],
  },
  {
    id: 'stone-granite',
    name: 'Granite',
    category: 'stone',
    type: 'stone',
    color: '#808080',
    roughness: 0.4,
    metalness: 0.0,
    tags: ['stone', 'granite'],
  },
  {
    id: 'stone-quartz',
    name: 'Quartz',
    category: 'stone',
    type: 'stone',
    color: '#e8e8e8',
    roughness: 0.05,
    metalness: 0.0,
    tags: ['stone', 'quartz'],
  },
  {
    id: 'stone-slate',
    name: 'Slate',
    category: 'stone',
    type: 'stone',
    color: '#4a4a4a',
    roughness: 0.7,
    metalness: 0.0,
    tags: ['stone', 'slate'],
  },
  {
    id: 'stone-travertine',
    name: 'Travertine',
    category: 'stone',
    type: 'stone',
    color: '#d4c4a8',
    roughness: 0.5,
    metalness: 0.0,
    tags: ['stone', 'travertine'],
  },
  {
    id: 'stone-concrete',
    name: 'Concrete',
    category: 'stone',
    type: 'stone',
    color: '#a0a0a0',
    roughness: 0.8,
    metalness: 0.0,
    tags: ['stone', 'concrete'],
  },

  // Tile materials
  {
    id: 'tile-ceramic-white',
    name: 'Ceramic White',
    category: 'tile',
    type: 'tile',
    color: '#ffffff',
    roughness: 0.2,
    metalness: 0.0,
    tags: ['tile', 'ceramic'],
  },
  {
    id: 'tile-porcelain',
    name: 'Porcelain',
    category: 'tile',
    type: 'tile',
    color: '#f0f0f0',
    roughness: 0.1,
    metalness: 0.0,
    tags: ['tile', 'porcelain'],
  },
  {
    id: 'tile-mosaic',
    name: 'Mosaic',
    category: 'tile',
    type: 'tile',
    color: '#4a90d9',
    roughness: 0.2,
    metalness: 0.0,
    tags: ['tile', 'mosaic'],
  },
  {
    id: 'tile-subway',
    name: 'Subway Tile',
    category: 'tile',
    type: 'tile',
    color: '#f5f5f5',
    roughness: 0.2,
    metalness: 0.0,
    tags: ['tile', 'subway'],
  },

  // Paint materials
  {
    id: 'paint-white',
    name: 'White',
    category: 'paint',
    type: 'paint',
    color: '#ffffff',
    roughness: 0.9,
    metalness: 0.0,
    tags: ['paint', 'white'],
  },
  {
    id: 'paint-cream',
    name: 'Cream',
    category: 'paint',
    type: 'paint',
    color: '#fffdd0',
    roughness: 0.9,
    metalness: 0.0,
    tags: ['paint', 'cream'],
  },
  {
    id: 'paint-beige',
    name: 'Beige',
    category: 'paint',
    type: 'paint',
    color: '#f5f5dc',
    roughness: 0.9,
    metalness: 0.0,
    tags: ['paint', 'beige'],
  },
  {
    id: 'paint-gray-light',
    name: 'Gray Light',
    category: 'paint',
    type: 'paint',
    color: '#d3d3d3',
    roughness: 0.9,
    metalness: 0.0,
    tags: ['paint', 'gray'],
  },
  {
    id: 'paint-gray-dark',
    name: 'Gray Dark',
    category: 'paint',
    type: 'paint',
    color: '#4a4a4a',
    roughness: 0.9,
    metalness: 0.0,
    tags: ['paint', 'gray'],
  },
  {
    id: 'paint-black',
    name: 'Black',
    category: 'paint',
    type: 'paint',
    color: '#1a1a1a',
    roughness: 0.9,
    metalness: 0.0,
    tags: ['paint', 'black'],
  },
  {
    id: 'paint-navy',
    name: 'Navy',
    category: 'paint',
    type: 'paint',
    color: '#000080',
    roughness: 0.9,
    metalness: 0.0,
    tags: ['paint', 'navy'],
  },
  {
    id: 'paint-sage',
    name: 'Sage',
    category: 'paint',
    type: 'paint',
    color: '#9dc183',
    roughness: 0.9,
    metalness: 0.0,
    tags: ['paint', 'green'],
  },

  // Glass materials
  {
    id: 'glass-clear',
    name: 'Clear Glass',
    category: 'glass',
    type: 'glass',
    color: '#ffffff',
    roughness: 0.0,
    metalness: 0.0,
    opacity: 0.3,
    tags: ['glass', 'clear'],
  },
  {
    id: 'glass-frosted',
    name: 'Frosted Glass',
    category: 'glass',
    type: 'glass',
    color: '#f0f8ff',
    roughness: 0.5,
    metalness: 0.0,
    opacity: 0.5,
    tags: ['glass', 'frosted'],
  },
  {
    id: 'glass-tinted',
    name: 'Tinted Glass',
    category: 'glass',
    type: 'glass',
    color: '#4a4a4a',
    roughness: 0.0,
    metalness: 0.0,
    opacity: 0.5,
    tags: ['glass', 'tinted'],
  },
  {
    id: 'glass-mirror',
    name: 'Mirror',
    category: 'glass',
    type: 'glass',
    color: '#e8e8e8',
    roughness: 0.0,
    metalness: 1.0,
    tags: ['glass', 'mirror'],
  },

  // Plastic materials
  {
    id: 'plastic-white',
    name: 'Plastic White',
    category: 'plastic',
    type: 'plastic',
    color: '#ffffff',
    roughness: 0.3,
    metalness: 0.0,
    tags: ['plastic', 'white'],
  },
  {
    id: 'plastic-black',
    name: 'Plastic Black',
    category: 'plastic',
    type: 'plastic',
    color: '#1a1a1a',
    roughness: 0.3,
    metalness: 0.0,
    tags: ['plastic', 'black'],
  },
  {
    id: 'plastic-acrylic',
    name: 'Acrylic',
    category: 'plastic',
    type: 'plastic',
    color: '#f0f8ff',
    roughness: 0.1,
    metalness: 0.0,
    opacity: 0.8,
    tags: ['plastic', 'acrylic'],
  },
];

// Materials library class
export class MaterialsLibrary {
  private categories: Map<string, MaterialCategory> = new Map();
  private materials: Map<string, MaterialItem> = new Map();

  constructor() {
    this.initializeCategories();
    this.loadPresetMaterials();
  }

  private initializeCategories(): void {
    for (const category of MATERIAL_CATEGORIES) {
      this.categories.set(category.id, { ...category, materials: [] });
    }
  }

  private loadPresetMaterials(): void {
    for (const material of PRESET_MATERIALS) {
      this.addMaterial(material);
    }
  }

  public addMaterial(material: MaterialItem): void {
    this.materials.set(material.id, material);

    const category = this.categories.get(material.category);
    if (category) {
      category.materials.push(material);
    }
  }

  public getMaterial(id: string): MaterialItem | undefined {
    return this.materials.get(id);
  }

  public getCategory(id: string): MaterialCategory | undefined {
    return this.categories.get(id);
  }

  public getAllCategories(): MaterialCategory[] {
    return Array.from(this.categories.values());
  }

  public getAllMaterials(): MaterialItem[] {
    return Array.from(this.materials.values());
  }

  public getMaterialsByCategory(categoryId: string): MaterialItem[] {
    const category = this.categories.get(categoryId);
    return category?.materials || [];
  }

  public search(query: string): MaterialItem[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllMaterials().filter(material =>
      material.name.toLowerCase().includes(lowerQuery) ||
      material.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  public filter(filters: {
    category?: string;
    type?: string;
    color?: string;
  }): MaterialItem[] {
    let materials = this.getAllMaterials();

    if (filters.category) {
      materials = materials.filter(m => m.category === filters.category);
    }

    if (filters.type) {
      materials = materials.filter(m => m.type === filters.type);
    }

    if (filters.color) {
      materials = materials.filter(m =>
        m.color.toLowerCase() === filters.color?.toLowerCase()
      );
    }

    return materials;
  }

  public getStats(): {
    totalMaterials: number;
    totalCategories: number;
    materialsByCategory: Record<string, number>;
  } {
    const materialsByCategory: Record<string, number> = {};

    for (const [id, category] of this.categories) {
      materialsByCategory[id] = category.materials.length;
    }

    return {
      totalMaterials: this.materials.size,
      totalCategories: this.categories.size,
      materialsByCategory,
    };
  }
}

// Create singleton instance
export const materialsLibrary = new MaterialsLibrary();
