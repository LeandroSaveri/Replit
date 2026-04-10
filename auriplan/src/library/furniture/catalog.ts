// ============================================
// FURNITURE CATALOG - Catálogo Completo de Móveis
// 500+ itens organizados por categoria
// ============================================

import type { FurnitureCategory, FurnitureType } from '@auriplan-types';

export interface CatalogItem {
  id: string;
  name: string;
  category: FurnitureCategory | string;
  type: FurnitureType | string;
  dimensions: { width: number; height: number; depth: number };
  defaultColor: string;
  availableColors: string[];
  availableMaterials: string[];
  thumbnail: string;
  isPremium: boolean;
  popularity: number;
  price?: number;
  brand?: string;
  description?: string;
  tags?: string[];
}

// Importar categorias
import { livingRoom } from './categories/livingRoom';
import { bedroom } from './categories/bedroom';
import { kitchen } from './categories/kitchen';
import { bathroom } from './categories/bathroom';
import { dining } from './categories/dining';
import { office } from './categories/office';
import { lighting } from './categories/lighting';
import { decor } from './categories/decor';
import { appliances } from './categories/appliances';
import { outdoor } from './categories/outdoor';
import { garden } from './categories/garden';
import { kids } from './categories/kids';
import { doors } from './categories/doors';
import { windows } from './categories/windows';
import { flooring } from './categories/flooring';
import { wallpaper } from './categories/wallpaper';
import { structural } from './categories/structural';
import { materials } from './categories/materials';
import { plumbing } from './categories/plumbing';
import { electrical } from './categories/electrical';
import { construction } from './categories/construction';

// ============================================
// CATÁLOGO COMPLETO - 2000+ ITENS
// ============================================
export const furnitureCatalog: CatalogItem[] = [
  ...livingRoom,      // 93 itens
  ...bedroom,         // 87 itens
  ...kitchen,         // 51 itens
  ...bathroom,        // 65 itens
  ...dining,          // 60 itens
  ...office,          // 52 itens
  ...lighting,        // 65 itens
  ...decor,           // 66 itens
  ...appliances,      // 46 itens
  ...outdoor,         // 63 itens
  ...garden,          // 49 itens
  ...kids,            // 51 itens
  ...doors,           // 50 itens
  ...windows,         // 50 itens
  ...flooring,        // 75 itens
  ...wallpaper,       // 70 itens
  ...structural,      // 50 itens
  ...materials,       // 100 itens
  ...plumbing,        // 200 itens
  ...electrical,      // 200 itens
  ...construction,    // 150 itens
];

// Estatísticas do catálogo
export const catalogStats = {
  totalItems: furnitureCatalog.length,
  categories: {
    living: livingRoom.length,
    bedroom: bedroom.length,
    kitchen: kitchen.length,
    bathroom: bathroom.length,
    dining: dining.length,
    office: office.length,
    lighting: lighting.length,
    decor: decor.length,
    appliances: appliances.length,
    outdoor: outdoor.length,
    garden: garden.length,
    kids: kids.length,
    doors: doors.length,
    windows: windows.length,
    flooring: flooring.length,
    wallpaper: wallpaper.length,
    structural: structural.length,
    materials: materials.length,
    plumbing: plumbing.length,
    electrical: electrical.length,
    construction: construction.length,
  },
  premiumItems: furnitureCatalog.filter(i => i.isPremium).length,
  freeItems: furnitureCatalog.filter(i => !i.isPremium).length,
};

// ============================================
// CATEGORIES CONFIGURATION
// ============================================
export const furnitureCategories = [
  { id: 'all', name: 'Todos', icon: 'LayoutGrid' },
  { id: 'living', name: 'Sala de Estar', icon: 'Sofa' },
  { id: 'bedroom', name: 'Quarto', icon: 'Bed' },
  { id: 'kitchen', name: 'Cozinha', icon: 'Utensils' },
  { id: 'bathroom', name: 'Banheiro', icon: 'Bath' },
  { id: 'dining', name: 'Sala de Jantar', icon: 'Table' },
  { id: 'office', name: 'Escritório', icon: 'Briefcase' },
  { id: 'lighting', name: 'Iluminação', icon: 'Lightbulb' },
  { id: 'decor', name: 'Decoração', icon: 'Palette' },
  { id: 'appliances', name: 'Eletrodomésticos', icon: 'Refrigerator' },
  { id: 'outdoor', name: 'Área Externa', icon: 'TreePine' },
  { id: 'kids', name: 'Infantil', icon: 'Baby' },
  { id: 'garden', name: 'Jardim', icon: 'Flower2' },
  { id: 'doors', name: 'Portas', icon: 'DoorOpen' },
  { id: 'windows', name: 'Janelas', icon: 'PanelTop' },
  { id: 'flooring', name: 'Pisos', icon: 'Grid3X3' },
  { id: 'wallpaper', name: 'Papéis de Parede', icon: 'Wallpaper' },
  { id: 'structural', name: 'Estrutural', icon: 'Building2' },
  { id: 'materials', name: 'Materiais', icon: 'Palette' },
  { id: 'plumbing', name: 'Hidráulica', icon: 'Droplets' },
  { id: 'electrical', name: 'Elétrica', icon: 'Zap' },
  { id: 'construction', name: 'Construção', icon: 'Hammer' },
];

// ============================================
// GET FURNITURE BY CATEGORY
// ============================================
export const getFurnitureByCategory = (category: string): CatalogItem[] => {
  if (category === 'all') return furnitureCatalog;
  return furnitureCatalog.filter(item => item.category === category);
};

// ============================================
// SEARCH FURNITURE
// ============================================
export const searchFurniture = (query: string): CatalogItem[] => {
  const lowerQuery = query.toLowerCase();
  return furnitureCatalog.filter(item => 
    item.name.toLowerCase().includes(lowerQuery) ||
    item.description?.toLowerCase().includes(lowerQuery) ||
    (item.tags ?? []).some(tag => tag.toLowerCase().includes(lowerQuery)) ||
    item.brand?.toLowerCase().includes(lowerQuery)
  );
};

// ============================================
// GET POPULAR FURNITURE
// ============================================
export const getPopularFurniture = (limit: number = 20): CatalogItem[] => {
  return [...furnitureCatalog]
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, limit);
};

// ============================================
// GET PREMIUM FURNITURE
// ============================================
export const getPremiumFurniture = (): CatalogItem[] => {
  return furnitureCatalog.filter(item => item.isPremium);
};

// ============================================
// GET FURNITURE BY PRICE RANGE
// ============================================
export const getFurnitureByPriceRange = (min: number, max: number): CatalogItem[] => {
  return furnitureCatalog.filter(item => {
    if (!item.price) return false;
    return item.price >= min && item.price <= max;
  });
};

// ============================================
// GET FURNITURE BY BRAND
// ============================================
export const getFurnitureByBrand = (brand: string): CatalogItem[] => {
  return furnitureCatalog.filter(item => item.brand === brand);
};

// ============================================
// GET ALL BRANDS
// ============================================
export const getAllBrands = (): string[] => {
  const brands = new Set<string>();
  furnitureCatalog.forEach(item => {
    if (item.brand) brands.add(item.brand);
  });
  return Array.from(brands).sort();
};

// ============================================
// GET FURNITURE BY TYPE
// ============================================
export const getFurnitureByType = (type: FurnitureType): CatalogItem[] => {
  return furnitureCatalog.filter(item => item.type === type);
};

// ============================================
// GET FURNITURE BY MATERIAL
// ============================================
export const getFurnitureByMaterial = (material: string): CatalogItem[] => {
  return furnitureCatalog.filter(item => 
    item.availableMaterials.includes(material)
  );
};

// ============================================
// GET RELATED FURNITURE
// ============================================
export const getRelatedFurniture = (itemId: string, limit: number = 6): CatalogItem[] => {
  const item = furnitureCatalog.find(i => i.id === itemId);
  if (!item) return [];
  
  return furnitureCatalog
    .filter(i => i.id !== itemId && i.category === item.category)
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, limit);
};

console.log(`📦 Catálogo de Móveis Carregado: ${catalogStats.totalItems} itens`);
console.log(`   Premium: ${catalogStats.premiumItems} | Gratuitos: ${catalogStats.freeItems}`);
