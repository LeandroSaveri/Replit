// ============================================
// TEMPLATE GALLERY - Galeria de Templates Profissionais
// ============================================

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Building2, 
  Store, 
  Hotel,
  Warehouse,
  Trees,
  Search,
  Filter,
  Star,
  Download,
  Eye,
  Check,
  X,
  Grid3X3,
  List,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { useEditorStore } from '@store/editorStore';

// ============================================
// TYPES
// ============================================
export interface Template {
  id: string;
  name: string;
  description: string;
  category: 'residential' | 'commercial' | 'outdoor' | 'specialty';
  subcategory: string;
  thumbnail: string;
  images: string[];
  rating: number;
  downloads: number;
  isPremium: boolean;
  isNew: boolean;
  tags: string[];
  rooms: number;
  area: number;
  style: string;
  author: {
    name: string;
    avatar: string;
    isVerified: boolean;
  };
  data: any;
}

// ============================================
// MOCK TEMPLATES
// ============================================
const mockTemplates: Template[] = [
  {
    id: 'template-1',
    name: 'Apartamento Moderno 2Q',
    description: 'Apartamento contemporâneo com 2 quartos, sala integrada e cozinha americana.',
    category: 'residential',
    subcategory: 'apartment',
    thumbnail: '/templates/apartment-modern-2q.jpg',
    images: ['/templates/apartment-modern-2q-1.jpg', '/templates/apartment-modern-2q-2.jpg'],
    rating: 4.8,
    downloads: 12543,
    isPremium: false,
    isNew: false,
    tags: ['moderno', 'apartamento', '2 quartos', 'compacto'],
    rooms: 5,
    area: 75,
    style: 'Contemporâneo',
    author: { name: 'AuriPlan Studio', avatar: '/avatars/studio.jpg', isVerified: true },
    data: {}
  },
  {
    id: 'template-2',
    name: 'Casa de Luxo 4 Suítes',
    description: 'Residência de alto padrão com 4 suítes, piscina e área de lazer completa.',
    category: 'residential',
    subcategory: 'house',
    thumbnail: '/templates/luxury-house-4s.jpg',
    images: ['/templates/luxury-house-4s-1.jpg', '/templates/luxury-house-4s-2.jpg'],
    rating: 4.9,
    downloads: 8932,
    isPremium: true,
    isNew: true,
    tags: ['luxo', 'casa', '4 suítes', 'piscina'],
    rooms: 12,
    area: 450,
    style: 'Neoclássico',
    author: { name: 'Elite Designs', avatar: '/avatars/elite.jpg', isVerified: true },
    data: {}
  },
  {
    id: 'template-3',
    name: 'Escritório Corporativo',
    description: 'Layout profissional para escritório com 20 estações de trabalho.',
    category: 'commercial',
    subcategory: 'office',
    thumbnail: '/templates/corporate-office.jpg',
    images: ['/templates/corporate-office-1.jpg'],
    rating: 4.7,
    downloads: 6789,
    isPremium: false,
    isNew: false,
    tags: ['escritório', 'corporativo', 'open space'],
    rooms: 8,
    area: 300,
    style: 'Minimalista',
    author: { name: 'WorkSpace Pro', avatar: '/avatars/workspace.jpg', isVerified: true },
    data: {}
  },
  {
    id: 'template-4',
    name: 'Restaurante Fine Dining',
    description: 'Restaurante sofisticado com área de jantar, bar e cozinha profissional.',
    category: 'commercial',
    subcategory: 'restaurant',
    thumbnail: '/templates/fine-dining.jpg',
    images: ['/templates/fine-dining-1.jpg', '/templates/fine-dining-2.jpg'],
    rating: 4.6,
    downloads: 4521,
    isPremium: true,
    isNew: false,
    tags: ['restaurante', 'gourmet', 'luxo'],
    rooms: 4,
    area: 280,
    style: 'Industrial Chic',
    author: { name: 'GastroDesign', avatar: '/avatars/gastro.jpg', isVerified: false },
    data: {}
  },
  {
    id: 'template-5',
    name: 'Loja de Roupas Premium',
    description: 'Layout de loja com vitrine, provadores e área de estoque.',
    category: 'commercial',
    subcategory: 'retail',
    thumbnail: '/templates/premium-store.jpg',
    images: ['/templates/premium-store-1.jpg'],
    rating: 4.5,
    downloads: 3892,
    isPremium: false,
    isNew: true,
    tags: ['loja', 'varejo', 'moda'],
    rooms: 3,
    area: 150,
    style: 'Moderno',
    author: { name: 'Retail Masters', avatar: '/avatars/retail.jpg', isVerified: true },
    data: {}
  },
  {
    id: 'template-6',
    name: 'Studio Compacto 35m²',
    description: 'Studio otimizado com áreas multifuncionais e smart storage.',
    category: 'residential',
    subcategory: 'studio',
    thumbnail: '/templates/studio-35.jpg',
    images: ['/templates/studio-35-1.jpg', '/templates/studio-35-2.jpg'],
    rating: 4.7,
    downloads: 15678,
    isPremium: false,
    isNew: false,
    tags: ['studio', 'compacto', 'otimizado'],
    rooms: 1,
    area: 35,
    style: 'Escandinavo',
    author: { name: 'Small Space Solutions', avatar: '/avatars/small.jpg', isVerified: true },
    data: {}
  },
  {
    id: 'template-7',
    name: 'Cobertura Duplex',
    description: 'Cobertura de luxo com dois andares, terraço e vista panorâmica.',
    category: 'residential',
    subcategory: 'penthouse',
    thumbnail: '/templates/penthouse-duplex.jpg',
    images: ['/templates/penthouse-duplex-1.jpg', '/templates/penthouse-duplex-2.jpg'],
    rating: 4.9,
    downloads: 7234,
    isPremium: true,
    isNew: true,
    tags: ['cobertura', 'duplex', 'luxo', 'terraço'],
    rooms: 8,
    area: 380,
    style: 'Contemporâneo',
    author: { name: 'SkyLine Designs', avatar: '/avatars/skyline.jpg', isVerified: true },
    data: {}
  },
  {
    id: 'template-8',
    name: 'Clínica Médica',
    description: 'Consultório médico com recepção, 3 salas de atendimento e esterilização.',
    category: 'commercial',
    subcategory: 'healthcare',
    thumbnail: '/templates/medical-clinic.jpg',
    images: ['/templates/medical-clinic-1.jpg'],
    rating: 4.6,
    downloads: 5234,
    isPremium: false,
    isNew: false,
    tags: ['clínica', 'saúde', 'consultório'],
    rooms: 5,
    area: 180,
    style: 'Clean & Modern',
    author: { name: 'MedDesign', avatar: '/avatars/med.jpg', isVerified: true },
    data: {}
  },
  {
    id: 'template-9',
    name: 'Jardim Paisagístico',
    description: 'Área externa com paisagismo, deck, churrasqueira e piscina.',
    category: 'outdoor',
    subcategory: 'garden',
    thumbnail: '/templates/landscape-garden.jpg',
    images: ['/templates/landscape-garden-1.jpg', '/templates/landscape-garden-2.jpg'],
    rating: 4.8,
    downloads: 9876,
    isPremium: false,
    isNew: true,
    tags: ['jardim', 'paisagismo', 'externo', 'lazer'],
    rooms: 0,
    area: 500,
    style: 'Natural',
    author: { name: 'GreenScape', avatar: '/avatars/green.jpg', isVerified: true },
    data: {}
  },
  {
    id: 'template-10',
    name: 'Hotel Boutique 20 Q',
    description: 'Hotel boutique completo com 20 quartos, lobby, restaurante e spa.',
    category: 'commercial',
    subcategory: 'hospitality',
    thumbnail: '/templates/boutique-hotel.jpg',
    images: ['/templates/boutique-hotel-1.jpg', '/templates/boutique-hotel-2.jpg'],
    rating: 4.9,
    downloads: 3456,
    isPremium: true,
    isNew: false,
    tags: ['hotel', 'hospedagem', 'boutique'],
    rooms: 35,
    area: 2500,
    style: 'Eclético',
    author: { name: 'Hospitality Masters', avatar: '/avatars/hosp.jpg', isVerified: true },
    data: {}
  },
  {
    id: 'template-11',
    name: 'Cozinha Industrial',
    description: 'Cozinha profissional completa para restaurante de médio porte.',
    category: 'commercial',
    subcategory: 'kitchen',
    thumbnail: '/templates/industrial-kitchen.jpg',
    images: ['/templates/industrial-kitchen-1.jpg'],
    rating: 4.5,
    downloads: 4123,
    isPremium: false,
    isNew: false,
    tags: ['cozinha', 'industrial', 'profissional'],
    rooms: 2,
    area: 120,
    style: 'Industrial',
    author: { name: 'ChefDesign', avatar: '/avatars/chef.jpg', isVerified: false },
    data: {}
  },
  {
    id: 'template-12',
    name: 'Salão de Beleza',
    description: 'Salão completo com área de espera, 8 estações e lavatórios.',
    category: 'commercial',
    subcategory: 'beauty',
    thumbnail: '/templates/beauty-salon.jpg',
    images: ['/templates/beauty-salon-1.jpg'],
    rating: 4.7,
    downloads: 6234,
    isPremium: false,
    isNew: true,
    tags: ['salão', 'beleza', 'estética'],
    rooms: 4,
    area: 140,
    style: 'Glamour',
    author: { name: 'BeautySpace', avatar: '/avatars/beauty.jpg', isVerified: true },
    data: {}
  }
];

// ============================================
// CATEGORIES
// ============================================
const categories = [
  { id: 'all', name: 'Todos', icon: Grid3X3 },
  { id: 'residential', name: 'Residencial', icon: Home },
  { id: 'commercial', name: 'Comercial', icon: Building2 },
  { id: 'outdoor', name: 'Externo', icon: Trees },
  { id: 'specialty', name: 'Especializado', icon: Sparkles },
];

const subcategories: Record<string, { id: string; name: string }[]> = {
  residential: [
    { id: 'all', name: 'Todos' },
    { id: 'apartment', name: 'Apartamentos' },
    { id: 'house', name: 'Casas' },
    { id: 'studio', name: 'Studios' },
    { id: 'penthouse', name: 'Coberturas' },
  ],
  commercial: [
    { id: 'all', name: 'Todos' },
    { id: 'office', name: 'Escritórios' },
    { id: 'restaurant', name: 'Restaurantes' },
    { id: 'retail', name: 'Lojas' },
    { id: 'healthcare', name: 'Saúde' },
    { id: 'hospitality', name: 'Hotéis' },
    { id: 'beauty', name: 'Beleza' },
    { id: 'kitchen', name: 'Cozinhas' },
  ],
  outdoor: [
    { id: 'all', name: 'Todos' },
    { id: 'garden', name: 'Jardins' },
    { id: 'terrace', name: 'Terraços' },
    { id: 'pool', name: 'Áreas de Piscina' },
  ],
  specialty: [
    { id: 'all', name: 'Todos' },
    { id: 'themed', name: 'Temáticos' },
    { id: 'historical', name: 'Históricos' },
    { id: 'futuristic', name: 'Futuristas' },
  ],
};

// ============================================
// COMPONENT
// ============================================
interface TemplateGalleryProps {
  onSelectTemplate: (template: Template) => void;
  onClose: () => void;
}

export function TemplateGallery({ onSelectTemplate, onClose }: TemplateGalleryProps) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeSubcategory, setActiveSubcategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [filterPremium, setFilterPremium] = useState(false);
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'rating'>('popular');

  // Filter templates
  const filteredTemplates = mockTemplates.filter(template => {
    const matchesCategory = activeCategory === 'all' || template.category === activeCategory;
    const matchesSubcategory = activeSubcategory === 'all' || template.subcategory === activeSubcategory;
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesPremium = !filterPremium || template.isPremium;
    
    return matchesCategory && matchesSubcategory && matchesSearch && matchesPremium;
  });

  // Sort templates
  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return b.downloads - a.downloads;
      case 'newest':
        return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
      case 'rating':
        return b.rating - a.rating;
      default:
        return 0;
    }
  });

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-7xl h-[90vh] bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/50">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Galeria de Templates</h2>
              <p className="text-sm text-slate-400">{sortedTemplates.length} templates disponíveis</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* View Mode */}
            <div className="flex items-center bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="border-b border-slate-800 p-4 bg-slate-900/30">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Categories */}
            <div className="flex items-center gap-2">
              {categories.map(cat => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setActiveCategory(cat.id);
                      setActiveSubcategory('all');
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeCategory === cat.id
                        ? 'bg-purple-500 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {cat.name}
                  </button>
                );
              })}
            </div>

            <div className="w-px h-6 bg-slate-700" />

            {/* Subcategories */}
            {activeCategory !== 'all' && subcategories[activeCategory] && (
              <div className="flex items-center gap-2">
                {subcategories[activeCategory].map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => setActiveSubcategory(sub.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                      activeSubcategory === sub.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    {sub.name}
                  </button>
                ))}
              </div>
            )}

            <div className="flex-1" />

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
            >
              <option value="popular">Mais Populares</option>
              <option value="newest">Mais Recentes</option>
              <option value="rating">Melhor Avaliados</option>
            </select>

            {/* Premium Filter */}
            <label className="flex items-center gap-2 px-3 py-2 bg-slate-800 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={filterPremium}
                onChange={(e) => setFilterPremium(e.target.checked)}
                className="w-4 h-4 rounded border-slate-600 text-purple-500 focus:ring-purple-500"
              />
              <span className="text-sm text-slate-300">Apenas Premium</span>
            </label>
          </div>
        </div>

        {/* Templates Grid/List */}
        <div className="flex-1 overflow-y-auto p-6">
          {sortedTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <Search className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg">Nenhum template encontrado</p>
              <p className="text-sm">Tente ajustar seus filtros</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sortedTemplates.map((template, index) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group bg-slate-800 rounded-xl overflow-hidden border border-slate-700 hover:border-purple-500/50 transition-all cursor-pointer"
                  onClick={() => setSelectedTemplate(template)}
                >
                  {/* Thumbnail */}
                  <div className="aspect-video bg-slate-700 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Home className="w-12 h-12 text-slate-600" />
                    </div>
                    
                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex gap-2">
                      {template.isPremium && (
                        <span className="px-2 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          PREMIUM
                        </span>
                      )}
                      {template.isNew && (
                        <span className="px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                          NOVO
                        </span>
                      )}
                    </div>

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button className="p-3 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors">
                        <Eye className="w-5 h-5 text-white" />
                      </button>
                      <button className="p-3 bg-purple-500 rounded-full hover:bg-purple-600 transition-colors">
                        <Download className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-white line-clamp-1">{template.name}</h3>
                      <div className="flex items-center gap-1 text-yellow-400">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="text-sm">{template.rating}</span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-slate-400 line-clamp-2 mb-3">{template.description}</p>
                    
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{template.rooms} cômodos</span>
                      <span>{template.area}m²</span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {template.downloads.toLocaleString()}
                      </span>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mt-3">
                      {template.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {sortedTemplates.map((template, index) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-4 p-4 bg-slate-800 rounded-xl border border-slate-700 hover:border-purple-500/50 transition-all cursor-pointer"
                  onClick={() => setSelectedTemplate(template)}
                >
                  <div className="w-24 h-16 bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Home className="w-8 h-8 text-slate-600" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white">{template.name}</h3>
                      {template.isPremium && (
                        <span className="px-2 py-0.5 bg-yellow-500 text-white text-xs font-bold rounded-full">
                          PREMIUM
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-400 line-clamp-1">{template.description}</p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                      <span>{template.rooms} cômodos</span>
                      <span>{template.area}m²</span>
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-400 fill-current" />
                        {template.rating}
                      </span>
                      <span>{template.downloads.toLocaleString()} downloads</span>
                    </div>
                  </div>

                  <button className="p-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors">
                    <Download className="w-5 h-5" />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Template Preview Modal */}
      <AnimatePresence>
        {selectedTemplate && (
          <TemplatePreviewModal
            template={selectedTemplate}
            onClose={() => setSelectedTemplate(null)}
            onUse={() => {
              onSelectTemplate(selectedTemplate);
              onClose();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// TEMPLATE PREVIEW MODAL
// ============================================
interface TemplatePreviewModalProps {
  template: Template;
  onClose: () => void;
  onUse: () => void;
}

function TemplatePreviewModal({ template, onClose, onUse }: TemplatePreviewModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-4xl bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Preview Image */}
        <div className="aspect-video bg-slate-800 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Home className="w-24 h-24 text-slate-600" />
          </div>
          
          {/* Badges */}
          <div className="absolute top-4 left-4 flex gap-2">
            {template.isPremium && (
              <span className="px-3 py-1.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-sm font-bold rounded-full flex items-center gap-1">
                <Star className="w-4 h-4" />
                PREMIUM
              </span>
            )}
            {template.isNew && (
              <span className="px-3 py-1.5 bg-green-500 text-white text-sm font-bold rounded-full">
                NOVO
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info */}
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">{template.name}</h2>
              <p className="text-slate-400">{template.description}</p>
            </div>
            <div className="flex items-center gap-1 text-yellow-400">
              <Star className="w-5 h-5 fill-current" />
              <span className="text-lg font-semibold">{template.rating}</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-slate-800 rounded-xl">
              <p className="text-sm text-slate-500 mb-1">Cômodos</p>
              <p className="text-xl font-bold text-white">{template.rooms}</p>
            </div>
            <div className="p-4 bg-slate-800 rounded-xl">
              <p className="text-sm text-slate-500 mb-1">Área</p>
              <p className="text-xl font-bold text-white">{template.area}m²</p>
            </div>
            <div className="p-4 bg-slate-800 rounded-xl">
              <p className="text-sm text-slate-500 mb-1">Estilo</p>
              <p className="text-xl font-bold text-white">{template.style}</p>
            </div>
            <div className="p-4 bg-slate-800 rounded-xl">
              <p className="text-sm text-slate-500 mb-1">Downloads</p>
              <p className="text-xl font-bold text-white">{template.downloads.toLocaleString()}</p>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-6">
            {template.tags.map(tag => (
              <span key={tag} className="px-3 py-1.5 bg-slate-800 text-slate-300 text-sm rounded-lg">
                {tag}
              </span>
            ))}
          </div>

          {/* Author */}
          <div className="flex items-center gap-3 mb-6 p-4 bg-slate-800/50 rounded-xl">
            <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center">
              <span className="text-lg font-bold text-slate-400">
                {template.author.name.charAt(0)}
              </span>
            </div>
            <div>
              <p className="font-medium text-white flex items-center gap-2">
                {template.author.name}
                {template.author.isVerified && (
                  <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                    Verificado
                  </span>
                )}
              </p>
              <p className="text-sm text-slate-500">Criador do template</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={onUse}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
            >
              <Check className="w-5 h-5" />
              Usar Template
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-slate-800 text-white font-semibold rounded-xl hover:bg-slate-700 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default TemplateGallery;
