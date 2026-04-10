/**
 * Asset Category Manager for AuriPlan
 * Manages asset categories and their hierarchical structure
 */

import { AssetCategory, AssetMetadata, assetRegistry } from './AssetRegistry';

export interface CategoryInfo {
  id: AssetCategory;
  name: string;
  description: string;
  icon: string;
  parent?: AssetCategory;
  children: AssetCategory[];
  count: number;
  featured: boolean;
}

export interface SubcategoryInfo {
  id: string;
  name: string;
  category: AssetCategory;
  description: string;
  count: number;
}

class AssetCategoryManager {
  private categories = new Map<AssetCategory, CategoryInfo>();
  private subcategories = new Map<string, SubcategoryInfo>();

  constructor() {
    this.initializeCategories();
  }

  /**
   * Initialize default categories
   */
  private initializeCategories(): void {
    const categoryData: Omit<CategoryInfo, 'count'>[] = [
      {
        id: 'furniture',
        name: 'Furniture',
        description: 'Sofas, chairs, tables, and storage furniture',
        icon: 'Sofa',
        children: ['livingroom', 'bedroom', 'dining', 'office'],
        featured: true,
      },
      {
        id: 'livingroom',
        name: 'Living Room',
        description: 'Sofas, coffee tables, TV stands, and entertainment units',
        icon: 'Tv',
        parent: 'furniture',
        children: [],
        featured: true,
      },
      {
        id: 'bedroom',
        name: 'Bedroom',
        description: 'Beds, nightstands, wardrobes, and dressers',
        icon: 'Bed',
        parent: 'furniture',
        children: [],
        featured: true,
      },
      {
        id: 'dining',
        name: 'Dining',
        description: 'Dining tables, chairs, and sideboards',
        icon: 'Utensils',
        parent: 'furniture',
        children: [],
        featured: true,
      },
      {
        id: 'office',
        name: 'Office',
        description: 'Desks, office chairs, and storage',
        icon: 'Briefcase',
        parent: 'furniture',
        children: [],
        featured: false,
      },
      {
        id: 'kitchen',
        name: 'Kitchen',
        description: 'Cabinets, countertops, sinks, and kitchen islands',
        icon: 'ChefHat',
        children: [],
        featured: true,
      },
      {
        id: 'bathroom',
        name: 'Bathroom',
        description: 'Vanities, toilets, showers, and bathtubs',
        icon: 'Bath',
        children: [],
        featured: true,
      },
      {
        id: 'lighting',
        name: 'Lighting',
        description: 'Ceiling lights, lamps, and outdoor lighting',
        icon: 'Lightbulb',
        children: [],
        featured: true,
      },
      {
        id: 'decor',
        name: 'Decor',
        description: 'Vases, paintings, mirrors, and decorative items',
        icon: 'Palette',
        children: [],
        featured: true,
      },
      {
        id: 'appliances',
        name: 'Appliances',
        description: 'Refrigerators, ovens, washing machines, and more',
        icon: 'Refrigerator',
        children: [],
        featured: false,
      },
      {
        id: 'outdoor',
        name: 'Outdoor',
        description: 'Garden furniture, planters, and outdoor decor',
        icon: 'Trees',
        children: [],
        featured: false,
      },
      {
        id: 'doors',
        name: 'Doors',
        description: 'Interior and exterior doors',
        icon: 'DoorOpen',
        children: [],
        featured: false,
      },
      {
        id: 'windows',
        name: 'Windows',
        description: 'Various window styles and sizes',
        icon: 'Square',
        children: [],
        featured: false,
      },
      {
        id: 'flooring',
        name: 'Flooring',
        description: 'Hardwood, tile, carpet, and laminate flooring',
        icon: 'Grid3X3',
        children: [],
        featured: false,
      },
      {
        id: 'wall-materials',
        name: 'Wall Materials',
        description: 'Paint, wallpaper, and wall panels',
        icon: 'Paintbrush',
        children: [],
        featured: false,
      },
      {
        id: 'structural',
        name: 'Structural',
        description: 'Stairs, columns, and beams',
        icon: 'Building2',
        children: [],
        featured: false,
      },
    ];

    categoryData.forEach(cat => {
      this.categories.set(cat.id, { ...cat, count: 0 });
    });

    this.initializeSubcategories();
  }

  /**
   * Initialize subcategories
   */
  private initializeSubcategories(): void {
    const subcategoryData: SubcategoryInfo[] = [
      // Living Room
      { id: 'sofas', name: 'Sofas', category: 'livingroom', description: 'Sectionals, loveseats, and sofas', count: 0 },
      { id: 'coffee-tables', name: 'Coffee Tables', category: 'livingroom', description: 'Coffee and side tables', count: 0 },
      { id: 'tv-stands', name: 'TV Stands', category: 'livingroom', description: 'Entertainment centers and TV units', count: 0 },
      { id: 'bookshelves', name: 'Bookshelves', category: 'livingroom', description: 'Bookcases and shelving units', count: 0 },
      { id: 'armchairs', name: 'Armchairs', category: 'livingroom', description: 'Accent chairs and recliners', count: 0 },

      // Bedroom
      { id: 'beds', name: 'Beds', category: 'bedroom', description: 'Platform, canopy, and storage beds', count: 0 },
      { id: 'nightstands', name: 'Nightstands', category: 'bedroom', description: 'Bedside tables', count: 0 },
      { id: 'wardrobes', name: 'Wardrobes', category: 'bedroom', description: 'Closets and armoires', count: 0 },
      { id: 'dressers', name: 'Dressers', category: 'bedroom', description: 'Chests of drawers', count: 0 },
      { id: 'vanities', name: 'Vanities', category: 'bedroom', description: 'Dressing tables and vanities', count: 0 },

      // Kitchen
      { id: 'cabinets', name: 'Cabinets', category: 'kitchen', description: 'Base and wall cabinets', count: 0 },
      { id: 'countertops', name: 'Countertops', category: 'kitchen', description: 'Kitchen work surfaces', count: 0 },
      { id: 'sinks', name: 'Sinks', category: 'kitchen', description: 'Kitchen sinks and faucets', count: 0 },
      { id: 'islands', name: 'Kitchen Islands', category: 'kitchen', description: 'Freestanding kitchen islands', count: 0 },
      { id: 'backsplashes', name: 'Backsplashes', category: 'kitchen', description: 'Kitchen backsplash tiles', count: 0 },

      // Bathroom
      { id: 'toilets', name: 'Toilets', category: 'bathroom', description: 'Modern and traditional toilets', count: 0 },
      { id: 'vanities-bath', name: 'Vanities', category: 'bathroom', description: 'Bathroom vanities and sinks', count: 0 },
      { id: 'showers', name: 'Showers', category: 'bathroom', description: 'Shower enclosures and fixtures', count: 0 },
      { id: 'bathtubs', name: 'Bathtubs', category: 'bathroom', description: 'Freestanding and built-in tubs', count: 0 },
      { id: 'bathroom-storage', name: 'Storage', category: 'bathroom', description: 'Bathroom cabinets and shelves', count: 0 },

      // Lighting
      { id: 'ceiling-lights', name: 'Ceiling Lights', category: 'lighting', description: 'Chandeliers and pendants', count: 0 },
      { id: 'wall-lights', name: 'Wall Lights', category: 'lighting', description: 'Sconces and wall lamps', count: 0 },
      { id: 'table-lamps', name: 'Table Lamps', category: 'lighting', description: 'Desk and table lamps', count: 0 },
      { id: 'floor-lamps', name: 'Floor Lamps', category: 'lighting', description: 'Standing lamps', count: 0 },
      { id: 'outdoor-lights', name: 'Outdoor Lights', category: 'lighting', description: 'Exterior lighting', count: 0 },

      // Decor
      { id: 'vases', name: 'Vases', category: 'decor', description: 'Decorative vases and bowls', count: 0 },
      { id: 'paintings', name: 'Paintings', category: 'decor', description: 'Wall art and paintings', count: 0 },
      { id: 'mirrors', name: 'Mirrors', category: 'decor', description: 'Decorative mirrors', count: 0 },
      { id: 'plants', name: 'Plants', category: 'decor', description: 'Indoor plants and planters', count: 0 },
      { id: 'rugs', name: 'Rugs', category: 'decor', description: 'Area rugs and carpets', count: 0 },

      // Appliances
      { id: 'refrigerators', name: 'Refrigerators', category: 'appliances', description: 'Fridges and freezers', count: 0 },
      { id: 'ovens', name: 'Ovens', category: 'appliances', description: 'Built-in and freestanding ovens', count: 0 },
      { id: 'dishwashers', name: 'Dishwashers', category: 'appliances', description: 'Dishwashing machines', count: 0 },
      { id: 'washers', name: 'Washers', category: 'appliances', description: 'Washing machines and dryers', count: 0 },
      { id: 'microwaves', name: 'Microwaves', category: 'appliances', description: 'Microwave ovens', count: 0 },

      // Outdoor
      { id: 'patio-furniture', name: 'Patio Furniture', category: 'outdoor', description: 'Outdoor seating and tables', count: 0 },
      { id: 'planters', name: 'Planters', category: 'outdoor', description: 'Garden planters and pots', count: 0 },
      { id: 'grills', name: 'Grills', category: 'outdoor', description: 'BBQ grills and outdoor kitchens', count: 0 },
      { id: 'umbrellas', name: 'Umbrellas', category: 'outdoor', description: 'Outdoor umbrellas and shades', count: 0 },
    ];

    subcategoryData.forEach(sub => {
      this.subcategories.set(sub.id, sub);
    });
  }

  /**
   * Get category info
   */
  getCategory(id: AssetCategory): CategoryInfo | undefined {
    const category = this.categories.get(id);
    if (category) {
      return { ...category, count: assetRegistry.getCategoryCount(id) };
    }
    return undefined;
  }

  /**
   * Get all categories
   */
  getAllCategories(): CategoryInfo[] {
    return Array.from(this.categories.values()).map(cat => ({
      ...cat,
      count: assetRegistry.getCategoryCount(cat.id),
    }));
  }

  /**
   * Get featured categories
   */
  getFeaturedCategories(): CategoryInfo[] {
    return this.getAllCategories().filter(cat => cat.featured);
  }

  /**
   * Get root categories (no parent)
   */
  getRootCategories(): CategoryInfo[] {
    return this.getAllCategories().filter(cat => !cat.parent);
  }

  /**
   * Get child categories
   */
  getChildCategories(parentId: AssetCategory): CategoryInfo[] {
    const parent = this.categories.get(parentId);
    if (!parent) return [];
    
    return parent.children
      .map(id => this.getCategory(id))
      .filter(Boolean) as CategoryInfo[];
  }

  /**
   * Get subcategories for a category
   */
  getSubcategories(categoryId: AssetCategory): SubcategoryInfo[] {
    return Array.from(this.subcategories.values())
      .filter(sub => sub.category === categoryId)
      .map(sub => ({
        ...sub,
        count: this.getSubcategoryAssetCount(sub.id),
      }));
  }

  /**
   * Get subcategory by ID
   */
  getSubcategory(id: string): SubcategoryInfo | undefined {
    const sub = this.subcategories.get(id);
    if (sub) {
      return { ...sub, count: this.getSubcategoryAssetCount(id) };
    }
    return undefined;
  }

  /**
   * Get asset count for subcategory
   */
  private getSubcategoryAssetCount(subcategoryId: string): number {
    const sub = this.subcategories.get(subcategoryId);
    if (!sub) return 0;

    return assetRegistry.getAssetsByCategory(sub.category)
      .filter(asset => asset.subcategory === subcategoryId)
      .length;
  }

  /**
   * Get breadcrumb path for category
   */
  getBreadcrumb(categoryId: AssetCategory): CategoryInfo[] {
    const breadcrumb: CategoryInfo[] = [];
    let current = this.categories.get(categoryId);

    while (current) {
      breadcrumb.unshift({ ...current, count: assetRegistry.getCategoryCount(current.id) });
      if (current.parent) {
        current = this.categories.get(current.parent);
      } else {
        break;
      }
    }

    return breadcrumb;
  }

  /**
   * Search categories by name
   */
  searchCategories(query: string): CategoryInfo[] {
    const normalizedQuery = query.toLowerCase();
    return this.getAllCategories().filter(cat =>
      cat.name.toLowerCase().includes(normalizedQuery) ||
      cat.description.toLowerCase().includes(normalizedQuery)
    );
  }

  /**
   * Get category tree structure
   */
  getCategoryTree(): Array<CategoryInfo & { children: CategoryInfo[] }> {
    const rootCategories = this.getRootCategories();
    
    return rootCategories.map(root => ({
      ...root,
      children: this.getChildCategories(root.id),
    })) as (CategoryInfo & { children: CategoryInfo[] })[];
  }

  /**
   * Get total category count
   */
  getTotalCategories(): number {
    return this.categories.size;
  }

  /**
   * Get total subcategory count
   */
  getTotalSubcategories(): number {
    return this.subcategories.size;
  }
}

// Singleton instance
export const assetCategoryManager = new AssetCategoryManager();
export default assetCategoryManager;
