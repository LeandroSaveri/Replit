// ============================================
// FURNITURE CATALOG - Catálogo de Móveis Premium
// ============================================

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useEditorStore } from '@store/editorStore';
import { 
  Search, 
  Sofa, 
  Bed, 
  Utensils, 
  Bath, 
  Lightbulb, 
  Palette, 
  Briefcase,
  Monitor,
  TreePine,
  Star,
  Grid3X3,
  List,
  Heart,
  Info
} from 'lucide-react';
import type { FurnitureCategory, FurnitureType, Dimensions } from '@auriplan-types';

interface CatalogItem {
  id: string;
  name: string;
  category: FurnitureCategory;
  type: FurnitureType;
  dimensions: Dimensions;
  defaultColor: string;
  availableColors: string[];
  thumbnail: string;
  isPremium: boolean;
  popularity: number;
  price?: number;
  brand?: string;
  description?: string;
}

const categories = [
  { id: 'all', name: 'Todos', icon: Grid3X3 },
  { id: 'living', name: 'Sala', icon: Sofa },
  { id: 'bedroom', name: 'Quarto', icon: Bed },
  { id: 'kitchen', name: 'Cozinha', icon: Utensils },
  { id: 'bathroom', name: 'Banheiro', icon: Bath },
  { id: 'lighting', name: 'Iluminação', icon: Lightbulb },
  { id: 'decor', name: 'Decoração', icon: Palette },
  { id: 'office', name: 'Escritório', icon: Briefcase },
  { id: 'appliances', name: 'Eletrodomésticos', icon: Monitor },
  { id: 'outdoor', name: 'Área Externa', icon: TreePine },
];

const furnitureLibrary: CatalogItem[] = [
  // Living Room
  { id: 'sofa-modern-3', name: 'Sofá Moderno 3L', category: 'living', type: 'sofa', dimensions: { width: 2.2, height: 0.85, depth: 0.95 }, defaultColor: '#808080', availableColors: ['#808080', '#4a5568', '#2d3748', '#744210'], thumbnail: 'sofa', isPremium: false, popularity: 95, price: 2499, brand: 'ComfortLine', description: 'Sofá moderno de 3 lugares com estofado premium' },
  { id: 'sofa-sectional', name: 'Sofá Seccional', category: 'living', type: 'sectional', dimensions: { width: 3.0, height: 0.85, depth: 2.0 }, defaultColor: '#4a5568', availableColors: ['#4a5568', '#2d3748', '#744210', '#975a16'], thumbnail: 'sectional', isPremium: true, popularity: 88, price: 4599, brand: 'LuxHome', description: 'Sofá seccional em L para grandes salas' },
  { id: 'armchair-leather', name: 'Poltrona Couro', category: 'living', type: 'armchair', dimensions: { width: 0.9, height: 1.0, depth: 0.9 }, defaultColor: '#744210', availableColors: ['#744210', '#4a5568', '#2d3748', '#975a16'], thumbnail: 'armchair', isPremium: true, popularity: 82, price: 1899, brand: 'LeatherCraft', description: 'Poltrona de couro legítimo com design clássico' },
  { id: 'coffee-table-wood', name: 'Mesa de Centro Madeira', category: 'living', type: 'coffee-table', dimensions: { width: 1.2, height: 0.45, depth: 0.6 }, defaultColor: '#8B4513', availableColors: ['#8B4513', '#A0522D', '#CD853F', '#D2691E'], thumbnail: 'coffee-table', isPremium: false, popularity: 90, price: 899, brand: 'WoodCraft', description: 'Mesa de centro em madeira maciça' },
  { id: 'tv-stand-modern', name: 'Rack TV Moderno', category: 'living', type: 'tv-stand', dimensions: { width: 1.8, height: 0.5, depth: 0.45 }, defaultColor: '#2d3748', availableColors: ['#2d3748', '#4a5568', '#744210', '#ffffff'], thumbnail: 'tv-stand', isPremium: false, popularity: 85, price: 1299, brand: 'ModernLiving', description: 'Rack para TV até 65 polegadas' },
  { id: 'bookshelf-tall', name: 'Estante Alta', category: 'living', type: 'bookshelf', dimensions: { width: 0.8, height: 2.0, depth: 0.3 }, defaultColor: '#8B4513', availableColors: ['#8B4513', '#ffffff', '#2d3748'], thumbnail: 'bookshelf', isPremium: false, popularity: 78, price: 699, brand: 'StoragePlus', description: 'Estante com 5 prateleiras ajustáveis' },
  
  // Bedroom
  { id: 'bed-queen', name: 'Cama Queen', category: 'bedroom', type: 'bed', dimensions: { width: 1.6, height: 1.1, depth: 2.0 }, defaultColor: '#5D4E37', availableColors: ['#5D4E37', '#8B4513', '#ffffff', '#2d3748'], thumbnail: 'bed', isPremium: false, popularity: 96, price: 2499, brand: 'SleepWell', description: 'Cama queen size com cabeceira estofada' },
  { id: 'bed-king', name: 'Cama King', category: 'bedroom', type: 'bed', dimensions: { width: 1.9, height: 1.15, depth: 2.1 }, defaultColor: '#ffffff', availableColors: ['#ffffff', '#5D4E37', '#2d3748'], thumbnail: 'bed-king', isPremium: true, popularity: 91, price: 3499, brand: 'LuxSleep', description: 'Cama king size premium com design elegante' },
  { id: 'nightstand-modern', name: 'Criado-Mudo Moderno', category: 'bedroom', type: 'nightstand', dimensions: { width: 0.5, height: 0.6, depth: 0.4 }, defaultColor: '#ffffff', availableColors: ['#ffffff', '#8B4513', '#2d3748'], thumbnail: 'nightstand', isPremium: false, popularity: 87, price: 399, brand: 'BedroomStyle', description: 'Criado-mudo com 2 gavetas' },
  { id: 'dresser-6', name: 'Cômoda 6 Gavetas', category: 'bedroom', type: 'dresser', dimensions: { width: 1.4, height: 0.8, depth: 0.5 }, defaultColor: '#8B4513', availableColors: ['#8B4513', '#ffffff', '#2d3748'], thumbnail: 'dresser', isPremium: false, popularity: 84, price: 1199, brand: 'StoragePlus', description: 'Cômoda espaçosa com 6 gavetas' },
  { id: 'wardrobe-3d', name: 'Guarda-Roupa 3P', category: 'bedroom', type: 'wardrobe', dimensions: { width: 1.8, height: 2.2, depth: 0.6 }, defaultColor: '#ffffff', availableColors: ['#ffffff', '#8B4513', '#2d3748'], thumbnail: 'wardrobe', isPremium: true, popularity: 89, price: 2299, brand: 'ClosetPro', description: 'Guarda-roupa com 3 portas e espelho' },
  
  // Kitchen
  { id: 'dining-table-6', name: 'Mesa Jantar 6L', category: 'kitchen', type: 'dining-table', dimensions: { width: 1.8, height: 0.75, depth: 0.9 }, defaultColor: '#8B4513', availableColors: ['#8B4513', '#ffffff', '#2d3748', '#C0C0C0'], thumbnail: 'dining-table', isPremium: false, popularity: 92, price: 1899, brand: 'DineWell', description: 'Mesa de jantar para 6 pessoas' },
  { id: 'dining-chair', name: 'Cadeira Jantar', category: 'kitchen', type: 'dining-chair', dimensions: { width: 0.45, height: 0.95, depth: 0.5 }, defaultColor: '#8B4513', availableColors: ['#8B4513', '#ffffff', '#2d3748', '#744210'], thumbnail: 'dining-chair', isPremium: false, popularity: 88, price: 299, brand: 'DineWell', description: 'Cadeira de jantar estofada' },
  { id: 'kitchen-island', name: 'Ilha Cozinha', category: 'kitchen', type: 'kitchen-island', dimensions: { width: 1.5, height: 0.9, depth: 0.8 }, defaultColor: '#ffffff', availableColors: ['#ffffff', '#2d3748', '#8B4513'], thumbnail: 'island', isPremium: true, popularity: 85, price: 3499, brand: 'KitchenPro', description: 'Ilha de cozinha com bancada em granito' },
  { id: 'bar-stool', name: 'Banqueta Bar', category: 'kitchen', type: 'bar-stool', dimensions: { width: 0.4, height: 1.05, depth: 0.4 }, defaultColor: '#2d3748', availableColors: ['#2d3748', '#8B4513', '#ffffff'], thumbnail: 'bar-stool', isPremium: false, popularity: 79, price: 349, brand: 'BarStyle', description: 'Banqueta ajustável para bancadas' },
  
  // Bathroom
  { id: 'vanity-unit', name: 'Gabinete Banheiro', category: 'bathroom', type: 'vanity-unit', dimensions: { width: 0.8, height: 0.85, depth: 0.5 }, defaultColor: '#ffffff', availableColors: ['#ffffff', '#2d3748', '#8B4513'], thumbnail: 'vanity', isPremium: false, popularity: 83, price: 899, brand: 'BathStyle', description: 'Gabinete com pia e espelho' },
  { id: 'bathtub-freestanding', name: 'Banheira Livre', category: 'bathroom', type: 'bathtub', dimensions: { width: 0.75, height: 0.6, depth: 1.7 }, defaultColor: '#ffffff', availableColors: ['#ffffff', '#2d3748'], thumbnail: 'bathtub', isPremium: true, popularity: 76, price: 4599, brand: 'LuxBath', description: 'Banheira de imersão design moderno' },
  
  // Lighting
  { id: 'chandelier-modern', name: 'Lustre Moderno', category: 'lighting', type: 'chandelier', dimensions: { width: 0.8, height: 1.0, depth: 0.8 }, defaultColor: '#C0C0C0', availableColors: ['#C0C0C0', '#FFD700', '#2d3748'], thumbnail: 'chandelier', isPremium: true, popularity: 81, price: 2499, brand: 'LightDesign', description: 'Lustre moderno com 6 lâmpadas' },
  { id: 'floor-lamp', name: 'Luminária Piso', category: 'lighting', type: 'floor-lamp', dimensions: { width: 0.3, height: 1.6, depth: 0.3 }, defaultColor: '#2d3748', availableColors: ['#2d3748', '#C0C0C0', '#8B4513'], thumbnail: 'floor-lamp', isPremium: false, popularity: 74, price: 499, brand: 'LightDesign', description: 'Luminária de piso ajustável' },
  { id: 'table-lamp', name: 'Abajur Mesa', category: 'lighting', type: 'table-lamp', dimensions: { width: 0.25, height: 0.5, depth: 0.25 }, defaultColor: '#ffffff', availableColors: ['#ffffff', '#2d3748', '#8B4513'], thumbnail: 'table-lamp', isPremium: false, popularity: 77, price: 199, brand: 'LightDesign', description: 'Abajur de mesa com cúpula' },
  
  // Decor
  { id: 'plant-large', name: 'Planta Grande', category: 'decor', type: 'plant', dimensions: { width: 0.6, height: 1.2, depth: 0.6 }, defaultColor: '#228B22', availableColors: ['#228B22'], thumbnail: 'plant', isPremium: false, popularity: 86, price: 299, brand: 'GreenHome', description: 'Planta decorativa em vaso' },
  { id: 'rug-large', name: 'Tapete Grande', category: 'decor', type: 'rug', dimensions: { width: 2.0, height: 0.02, depth: 3.0 }, defaultColor: '#8B4513', availableColors: ['#8B4513', '#2d3748', '#744210', '#ffffff'], thumbnail: 'rug', isPremium: false, popularity: 80, price: 899, brand: 'RugStyle', description: 'Tapete persa grande' },
  { id: 'mirror-round', name: 'Espelho Redondo', category: 'decor', type: 'mirror', dimensions: { width: 0.8, height: 0.8, depth: 0.03 }, defaultColor: '#C0C0C0', availableColors: ['#C0C0C0', '#FFD700', '#2d3748'], thumbnail: 'mirror', isPremium: false, popularity: 73, price: 399, brand: 'MirrorCraft', description: 'Espelho redondo com moldura' },
  { id: 'artwork-large', name: 'Quadro Decorativo', category: 'decor', type: 'artwork', dimensions: { width: 1.0, height: 1.2, depth: 0.03 }, defaultColor: '#2d3748', availableColors: ['#2d3748', '#8B4513', '#744210'], thumbnail: 'artwork', isPremium: false, popularity: 71, price: 599, brand: 'ArtHome', description: 'Quadro decorativo abstrato' },
  
  // Office
  { id: 'desk-modern', name: 'Escrivaninha Moderna', category: 'office', type: 'desk', dimensions: { width: 1.4, height: 0.75, depth: 0.7 }, defaultColor: '#ffffff', availableColors: ['#ffffff', '#8B4513', '#2d3748'], thumbnail: 'desk', isPremium: false, popularity: 84, price: 799, brand: 'OfficePro', description: 'Escrivaninha moderna com gavetas' },
  { id: 'office-chair-ergo', name: 'Cadeira Escritório', category: 'office', type: 'office-chair', dimensions: { width: 0.65, height: 1.1, depth: 0.65 }, defaultColor: '#2d3748', availableColors: ['#2d3748', '#4a5568', '#744210'], thumbnail: 'office-chair', isPremium: true, popularity: 90, price: 1299, brand: 'ErgoChair', description: 'Cadeira ergonômica com apoio lombar' },
  { id: 'bookshelf-office', name: 'Estante Office', category: 'office', type: 'bookshelf-office', dimensions: { width: 0.9, height: 1.8, depth: 0.35 }, defaultColor: '#8B4513', availableColors: ['#8B4513', '#ffffff', '#2d3748'], thumbnail: 'bookshelf-office', isPremium: false, popularity: 75, price: 599, brand: 'OfficePro', description: 'Estante para escritório' },
  
  // Appliances
  { id: 'fridge-french', name: 'Geladeira French', category: 'appliances', type: 'fridge', dimensions: { width: 0.9, height: 1.8, depth: 0.7 }, defaultColor: '#C0C0C0', availableColors: ['#C0C0C0', '#ffffff', '#2d3748'], thumbnail: 'fridge', isPremium: true, popularity: 87, price: 8999, brand: 'CoolTech', description: 'Geladeira french door inox' },
  { id: 'stove-gas', name: 'Fogão 5B', category: 'appliances', type: 'stove', dimensions: { width: 0.75, height: 0.95, depth: 0.6 }, defaultColor: '#C0C0C0', availableColors: ['#C0C0C0', '#2d3748', '#ffffff'], thumbnail: 'stove', isPremium: false, popularity: 82, price: 2499, brand: 'CookPro', description: 'Fogão 5 bocas inox' },
  { id: 'oven-built', name: 'Forno Embutir', category: 'appliances', type: 'oven', dimensions: { width: 0.6, height: 0.6, depth: 0.55 }, defaultColor: '#C0C0C0', availableColors: ['#C0C0C0', '#2d3748', '#ffffff'], thumbnail: 'oven', isPremium: true, popularity: 78, price: 3499, brand: 'CookPro', description: 'Forno elétrico de embutir' },
  { id: 'dishwasher', name: 'Lava-Louças', category: 'appliances', type: 'dishwasher', dimensions: { width: 0.6, height: 0.85, depth: 0.6 }, defaultColor: '#C0C0C0', availableColors: ['#C0C0C0', '#2d3748', '#ffffff'], thumbnail: 'dishwasher', isPremium: true, popularity: 72, price: 4299, brand: 'CleanTech', description: 'Lava-louças 14 serviços' },
  { id: 'washer', name: 'Máquina Lavar', category: 'appliances', type: 'washer', dimensions: { width: 0.6, height: 0.85, depth: 0.6 }, defaultColor: '#ffffff', availableColors: ['#ffffff', '#C0C0C0', '#2d3748'], thumbnail: 'washer', isPremium: false, popularity: 79, price: 2999, brand: 'CleanTech', description: 'Máquina de lavar 12kg' },
  
  // Outdoor
  { id: 'patio-set', name: 'Conjunto Área', category: 'outdoor', type: 'patio-set', dimensions: { width: 2.0, height: 0.75, depth: 2.0 }, defaultColor: '#8B4513', availableColors: ['#8B4513', '#2d3748', '#ffffff'], thumbnail: 'patio', isPremium: false, popularity: 68, price: 1899, brand: 'OutdoorLife', description: 'Conjunto de área externa' },
  { id: 'grill-bbq', name: 'Churrasqueira', category: 'outdoor', type: 'grill', dimensions: { width: 1.2, height: 1.1, depth: 0.6 }, defaultColor: '#2d3748', availableColors: ['#2d3748', '#C0C0C0'], thumbnail: 'grill', isPremium: true, popularity: 70, price: 2499, brand: 'BBQMaster', description: 'Churrasqueira a carvão' },
];

// Função que retorna o ícone correto baseado na categoria
function getCategoryIcon(category: string, className: string) {
  const iconProps = { className };
  switch (category) {
    case 'living': return <Sofa {...iconProps} />;
    case 'bedroom': return <Bed {...iconProps} />;
    case 'kitchen': return <Utensils {...iconProps} />;
    case 'bathroom': return <Bath {...iconProps} />;
    case 'lighting': return <Lightbulb {...iconProps} />;
    case 'decor': return <Palette {...iconProps} />;
    case 'office': return <Briefcase {...iconProps} />;
    case 'appliances': return <Monitor {...iconProps} />;
    case 'outdoor': return <TreePine {...iconProps} />;
    default: return <Sofa {...iconProps} />;
  }
}

export function FurnitureCatalog() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);
  
  const { addFurniture } = useEditorStore();

  const filteredItems = useMemo(() => {
    return furnitureLibrary.filter(item => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    }).sort((a, b) => b.popularity - a.popularity);
  }, [selectedCategory, searchQuery]);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(id)) {
        newFavorites.delete(id);
      } else {
        newFavorites.add(id);
      }
      return newFavorites;
    });
  };

  const handleAddFurniture = (item: CatalogItem) => {
    addFurniture({
      catalogId: item.id,
      name: item.name,
      category: item.category,
      type: item.type,
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      dimensions: item.dimensions,
      color: item.defaultColor,
      material: item.availableColors[0] || '',
      visible: true,
      locked: false,
      castShadow: true,
      receiveShadow: true,
      metadata: {
        brand: item.brand,
        price: item.price,
        description: item.description,
      },
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar móveis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        
        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map(cat => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Items Grid */}
      <div className="flex-1 overflow-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-slate-500">
            {filteredItems.length} itens encontrados
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-slate-700 text-white' : 'text-slate-500'}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-slate-700 text-white' : 'text-slate-500'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-3' : 'space-y-2'}>
          {filteredItems.map(item => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`group relative bg-slate-800 border border-slate-700 rounded-xl overflow-hidden hover:border-blue-500/50 transition-all cursor-pointer ${
                viewMode === 'list' ? 'flex items-center gap-4 p-3' : ''
              }`}
              onClick={() => handleAddFurniture(item)}
            >
              {/* Thumbnail */}
              <div className={`bg-slate-700 flex items-center justify-center relative ${
                viewMode === 'grid' ? 'aspect-square' : 'w-16 h-16 rounded-lg'
              }`}>
                <img
                  src={`/assets/thumbnails/furniture/${item.thumbnail}.webp`}
                  alt={item.name}
                  className="w-full h-full object-contain p-2"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                {getCategoryIcon(item.category, "w-8 h-8 text-slate-500 absolute pointer-events-none")}
              </div>

              {/* Info */}
              <div className={viewMode === 'grid' ? 'p-3' : 'flex-1'}>
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-medium text-white line-clamp-1">{item.name}</h4>
                  {item.isPremium && (
                    <Star className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {item.dimensions.width.toFixed(1)} × {item.dimensions.depth.toFixed(1)} m
                </p>
                {item.price && (
                  <p className="text-xs text-green-400 mt-1">
                    R$ {item.price.toLocaleString()}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className={`flex gap-1 ${viewMode === 'grid' ? 'absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity' : ''}`}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(item.id);
                  }}
                  className={`p-1.5 rounded-lg transition-colors ${
                    favorites.has(item.id) ? 'text-red-500 bg-red-500/10' : 'text-slate-500 hover:text-slate-300 bg-slate-800'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${favorites.has(item.id) ? 'fill-current' : ''}`} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedItem(item);
                  }}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 bg-slate-800"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Item Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">{selectedItem.name}</h3>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-slate-500 hover:text-white"
              >
                ×
              </button>
            </div>
            
            <div className="bg-slate-800 rounded-xl aspect-video flex items-center justify-center mb-4 relative">
              <img
                src={`/assets/thumbnails/furniture/${selectedItem.thumbnail}.webp`}
                alt={selectedItem.name}
                className="w-full h-full object-contain p-4"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              {getCategoryIcon(selectedItem.category, "w-16 h-16 text-slate-500 absolute pointer-events-none")}
            </div>
            
            <p className="text-slate-400 text-sm mb-4">{selectedItem.description}</p>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <span className="text-xs text-slate-500">Dimensões</span>
                <p className="text-sm text-white">
                  {selectedItem.dimensions.width.toFixed(2)} × {selectedItem.dimensions.depth.toFixed(2)} × {selectedItem.dimensions.height.toFixed(2)} m
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-500">Marca</span>
                <p className="text-sm text-white">{selectedItem.brand || 'N/A'}</p>
              </div>
            </div>
            
            {selectedItem.price && (
              <div className="mb-4">
                <span className="text-xs text-slate-500">Preço</span>
                <p className="text-lg font-semibold text-green-400">
                  R$ {selectedItem.price.toLocaleString()}
                </p>
              </div>
            )}
            
            <button
              onClick={() => {
                handleAddFurniture(selectedItem);
                setSelectedItem(null);
              }}
              className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-colors"
            >
              Adicionar ao Projeto
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
