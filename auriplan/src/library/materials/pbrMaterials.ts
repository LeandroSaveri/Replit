// ============================================
// PBR MATERIALS - Materiais Physically Based Rendering
// Sistema completo de materiais realistas
// ============================================

export interface PBRMaterial {
  id: string;
  name: string;
  category: 'wood' | 'metal' | 'stone' | 'fabric' | 'glass' | 'plastic' | 'ceramic' | 'paint' | 'concrete' | 'other';
  // Propriedades PBR
  albedo: string;           // Cor base (hex)
  roughness: number;        // 0-1 (0=espelho, 1=mate)
  metallic: number;         // 0-1 (0=dielétrico, 1=metálico)
  normalScale: number;      // Intensidade do normal map
  aoIntensity: number;      // Intensidade do ambient occlusion
  // Propriedades avançadas
  reflectivity?: number;    // Refletividade
  transparency?: number;    // Transparência
  ior?: number;            // Índice de refração
  emissive?: string;       // Cor emissiva
  emissiveIntensity?: number;
  // Texturas (URLs ou base64)
  textures?: {
    albedo?: string;
    roughness?: string;
    metallic?: string;
    normal?: string;
    ao?: string;
    height?: string;
    emissive?: string;
  };
  // Tags para busca
  tags: string[];
  isPremium: boolean;
}

// ============================================
// MADEIRAS - 50 materiais
// ============================================
export const woodMaterials: PBRMaterial[] = [
  // Madeiras Nacionais
  { id: 'wood-pine', name: 'Pinho Natural', category: 'wood', albedo: '#D2B48C', roughness: 0.7, metallic: 0, normalScale: 0.5, aoIntensity: 0.8, tags: ['pinho', 'clara', 'natural'], isPremium: false },
  { id: 'wood-pine-dark', name: 'Pinho Escurecido', category: 'wood', albedo: '#8B7355', roughness: 0.65, metallic: 0, normalScale: 0.5, aoIntensity: 0.85, tags: ['pinho', 'escura', 'rustica'], isPremium: false },
  { id: 'wood-oak', name: 'Carvalho', category: 'wood', albedo: '#C19A6B', roughness: 0.6, metallic: 0, normalScale: 0.6, aoIntensity: 0.8, tags: ['carvalho', 'classica', 'nobre'], isPremium: true },
  { id: 'wood-oak-dark', name: 'Carvalho Escuro', category: 'wood', albedo: '#8B6914', roughness: 0.55, metallic: 0, normalScale: 0.6, aoIntensity: 0.85, tags: ['carvalho', 'escura', 'elegante'], isPremium: true },
  { id: 'wood-walnut', name: 'Nogueira', category: 'wood', albedo: '#5D4E37', roughness: 0.5, metallic: 0, normalScale: 0.7, aoIntensity: 0.9, tags: ['nogueira', 'escura', 'luxo'], isPremium: true },
  { id: 'wood-cherry', name: 'Cerejeira', category: 'wood', albedo: '#8B4513', roughness: 0.55, metallic: 0, normalScale: 0.6, aoIntensity: 0.85, tags: ['cerejeira', 'avermelhada', 'classica'], isPremium: true },
  { id: 'wood-mahogany', name: ' Mogno', category: 'wood', albedo: '#4A0404', roughness: 0.45, metallic: 0, normalScale: 0.7, aoIntensity: 0.9, tags: ['mogno', 'escura', 'luxo'], isPremium: true },
  { id: 'wood-maple', name: 'Bordo', category: 'wood', albedo: '#F5DEB3', roughness: 0.65, metallic: 0, normalScale: 0.5, aoIntensity: 0.75, tags: ['bordo', 'clara', 'americana'], isPremium: true },
  { id: 'wood-birch', name: 'Bétula', category: 'wood', albedo: '#FFE4C4', roughness: 0.7, metallic: 0, normalScale: 0.4, aoIntensity: 0.7, tags: ['betula', 'clara', 'nordica'], isPremium: true },
  { id: 'wood-ash', name: 'Freixo', category: 'wood', albedo: '#B5A642', roughness: 0.6, metallic: 0, normalScale: 0.6, aoIntensity: 0.8, tags: ['freixo', 'clara', 'europeia'], isPremium: true },
  { id: 'wood-beech', name: 'Faia', category: 'wood', albedo: '#F5F5DC', roughness: 0.65, metallic: 0, normalScale: 0.5, aoIntensity: 0.75, tags: ['faia', 'clara', 'alema'], isPremium: true },
  { id: 'wood-teak', name: 'Teca', category: 'wood', albedo: '#8B7355', roughness: 0.5, metallic: 0, normalScale: 0.7, aoIntensity: 0.85, tags: ['teca', 'externa', 'resistente'], isPremium: true },
  { id: 'wood-ipe', name: 'Ipê', category: 'wood', albedo: '#4A3728', roughness: 0.55, metallic: 0, normalScale: 0.7, aoIntensity: 0.9, tags: ['ipe', 'brasileira', 'externa'], isPremium: true },
  { id: 'wood-jatoba', name: 'Jatobá', category: 'wood', albedo: '#8B4513', roughness: 0.6, metallic: 0, normalScale: 0.65, aoIntensity: 0.85, tags: ['jatoba', 'brasileira', 'resistente'], isPremium: true },
  { id: 'wood-cumaru', name: 'Cumarú', category: 'wood', albedo: '#654321', roughness: 0.55, metallic: 0, normalScale: 0.7, aoIntensity: 0.9, tags: ['cumarú', 'brasileira', 'externa'], isPremium: true },
  { id: 'wood-garapa', name: 'Garapeira', category: 'wood', albedo: '#DAA520', roughness: 0.6, metallic: 0, normalScale: 0.6, aoIntensity: 0.8, tags: ['garapeira', 'amarela', 'externa'], isPremium: true },
  { id: 'wood-massaranduba', name: 'Massaranduba', category: 'wood', albedo: '#3D2B1F', roughness: 0.5, metallic: 0, normalScale: 0.75, aoIntensity: 0.9, tags: ['massaranduba', 'escura', 'externa'], isPremium: true },
  { id: 'wood-tauari', name: 'Tauari', category: 'wood', albedo: '#DEB887', roughness: 0.65, metallic: 0, normalScale: 0.55, aoIntensity: 0.8, tags: ['tauari', 'clara', 'brasileira'], isPremium: false },
  { id: 'wood-angico', name: 'Angico', category: 'wood', albedo: '#8B4513', roughness: 0.6, metallic: 0, normalScale: 0.65, aoIntensity: 0.85, tags: ['angico', 'vermelha', 'brasileira'], isPremium: true },
  { id: 'wood-peroba', name: 'Peroba', category: 'wood', albedo: '#A0522D', roughness: 0.55, metallic: 0, normalScale: 0.7, aoIntensity: 0.85, tags: ['peroba', 'demolicao', 'rustica'], isPremium: true },
  { id: 'wood-cedar', name: 'Cedro', category: 'wood', albedo: '#C19A6B', roughness: 0.6, metallic: 0, normalScale: 0.6, aoIntensity: 0.8, tags: ['cedro', 'aromatica', 'resistente'], isPremium: true },
  { id: 'wood-eucalyptus', name: 'Eucalipto', category: 'wood', albedo: '#D2691E', roughness: 0.65, metallic: 0, normalScale: 0.55, aoIntensity: 0.8, tags: ['eucalipto', 'clara', 'sustentavel'], isPremium: false },
  { id: 'wood-bamboo', name: 'Bambu', category: 'wood', albedo: '#D2B48C', roughness: 0.7, metallic: 0, normalScale: 0.4, aoIntensity: 0.75, tags: ['bambu', 'ecologico', 'oriental'], isPremium: true },
  { id: 'wood-bamboo-carbonized', name: 'Bambu Carbonizado', category: 'wood', albedo: '#8B7355', roughness: 0.65, metallic: 0, normalScale: 0.4, aoIntensity: 0.8, tags: ['bambu', 'carbonizado', 'escuro'], isPremium: true },
  { id: 'wood-rattan', name: 'Rattan', category: 'wood', albedo: '#DEB887', roughness: 0.75, metallic: 0, normalScale: 0.3, aoIntensity: 0.7, tags: ['rattan', 'trancado', 'tropical'], isPremium: true },
  { id: 'wood-wicker', name: 'Vime', category: 'wood', albedo: '#D2B48C', roughness: 0.8, metallic: 0, normalScale: 0.35, aoIntensity: 0.75, tags: ['vime', 'trancado', 'rustico'], isPremium: true },
  { id: 'wood-cork', name: 'Cortiça', category: 'wood', albedo: '#D2B48C', roughness: 0.9, metallic: 0, normalScale: 0.6, aoIntensity: 0.85, tags: ['cortica', 'natural', 'acustica'], isPremium: true },
  { id: 'wood-osb', name: 'OSB', category: 'wood', albedo: '#D2691E', roughness: 0.85, metallic: 0, normalScale: 0.5, aoIntensity: 0.8, tags: ['osb', 'industrial', 'ecologico'], isPremium: false },
  { id: 'wood-mdf-raw', name: 'MDF Cru', category: 'wood', albedo: '#DEB887', roughness: 0.75, metallic: 0, normalScale: 0.3, aoIntensity: 0.7, tags: ['mdf', 'cru', 'industrial'], isPremium: false },
  { id: 'wood-mdf-white', name: 'MDF Branco', category: 'wood', albedo: '#FFFFFF', roughness: 0.6, metallic: 0, normalScale: 0.2, aoIntensity: 0.65, tags: ['mdf', 'branco', 'laminado'], isPremium: false },
  { id: 'wood-plywood', name: 'Compensado', category: 'wood', albedo: '#D2B48C', roughness: 0.7, metallic: 0, normalScale: 0.4, aoIntensity: 0.75, tags: ['compensado', 'construcao', 'barato'], isPremium: false },
  { id: 'wood-chipboard', name: 'Aglomerado', category: 'wood', albedo: '#D2691E', roughness: 0.8, metallic: 0, normalScale: 0.35, aoIntensity: 0.75, tags: ['aglomerado', 'economico', 'mobiliario'], isPremium: false },
  { id: 'wood-laminate-oak', name: 'Laminado Carvalho', category: 'wood', albedo: '#C19A6B', roughness: 0.5, metallic: 0, normalScale: 0.4, aoIntensity: 0.7, tags: ['laminado', 'carvalho', 'piso'], isPremium: false },
  { id: 'wood-laminate-walnut', name: 'Laminado Nogueira', category: 'wood', albedo: '#5D4E37', roughness: 0.45, metallic: 0, normalScale: 0.45, aoIntensity: 0.75, tags: ['laminado', 'nogueira', 'piso'], isPremium: false },
  { id: 'wood-laminate-cherry', name: 'Laminado Cerejeira', category: 'wood', albedo: '#8B4513', roughness: 0.5, metallic: 0, normalScale: 0.4, aoIntensity: 0.7, tags: ['laminado', 'cerejeira', 'piso'], isPremium: false },
  { id: 'wood-vinyl-plank', name: 'Piso Vinílico Madeira', category: 'wood', albedo: '#C19A6B', roughness: 0.55, metallic: 0, normalScale: 0.35, aoIntensity: 0.65, tags: ['vinilico', 'madeira', 'resistente'], isPremium: false },
  { id: 'wood-engineered', name: 'Madeira Engenheirada', category: 'wood', albedo: '#C19A6B', roughness: 0.5, metallic: 0, normalScale: 0.5, aoIntensity: 0.75, tags: ['engenheirada', 'multi-camadas', 'estavel'], isPremium: true },
  { id: 'wood-reclaimed', name: 'Madeira de Demolição', category: 'wood', albedo: '#8B7355', roughness: 0.8, metallic: 0, normalScale: 0.8, aoIntensity: 0.9, tags: ['demolicao', 'rustica', 'sustentavel'], isPremium: true },
  { id: 'wood-driftwood', name: 'Madeira de Praia', category: 'wood', albedo: '#C0C0C0', roughness: 0.85, metallic: 0, normalScale: 0.7, aoIntensity: 0.85, tags: ['praia', 'desgastada', 'decorativa'], isPremium: true },
  { id: 'wood-barn', name: 'Madeira de Celeiro', category: 'wood', albedo: '#8B4513', roughness: 0.75, metallic: 0, normalScale: 0.75, aoIntensity: 0.9, tags: ['celeiro', 'envelhecida', 'rustica'], isPremium: true },
  { id: 'wood-distressed', name: 'Madeira Desgastada', category: 'wood', albedo: '#A0522D', roughness: 0.8, metallic: 0, normalScale: 0.8, aoIntensity: 0.85, tags: ['desgastada', 'vintage', 'rustica'], isPremium: true },
  { id: 'wood-whitewash', name: 'Madeira Branqueada', category: 'wood', albedo: '#F5F5F5', roughness: 0.7, metallic: 0, normalScale: 0.5, aoIntensity: 0.7, tags: ['branqueada', 'provençal', 'clara'], isPremium: true },
  { id: 'wood-greywash', name: 'Madeira Cinza', category: 'wood', albedo: '#A9A9A9', roughness: 0.7, metallic: 0, normalScale: 0.5, aoIntensity: 0.75, tags: ['cinza', 'escandinava', 'moderna'], isPremium: true },
  { id: 'wood-black-stain', name: 'Madeira Preta', category: 'wood', albedo: '#1C1C1C', roughness: 0.55, metallic: 0, normalScale: 0.6, aoIntensity: 0.8, tags: ['preta', 'moderna', 'elegante'], isPremium: true },
  { id: 'wood-charred', name: 'Madeira Carbonizada (Shou Sugi Ban)', category: 'wood', albedo: '#000000', roughness: 0.9, metallic: 0, normalScale: 0.8, aoIntensity: 0.95, tags: ['carbonizada', 'japonesa', 'resistente'], isPremium: true },
  { id: 'wood-olive', name: 'Oliveira', category: 'wood', albedo: '#8B7355', roughness: 0.6, metallic: 0, normalScale: 0.65, aoIntensity: 0.85, tags: ['oliveira', 'mediterranea', 'nobre'], isPremium: true },
  { id: 'wood-rosewood', name: 'Jacarandá', category: 'wood', albedo: '#4A0404', roughness: 0.45, metallic: 0, normalScale: 0.75, aoIntensity: 0.9, tags: ['jacaranda', 'brasileira', 'nobre'], isPremium: true },
  { id: 'wood-ebony', name: 'Ébano', category: 'wood', albedo: '#1C1C1C', roughness: 0.4, metallic: 0, normalScale: 0.8, aoIntensity: 0.95, tags: ['ebano', 'africana', 'luxo'], isPremium: true },
  { id: 'wood-palisander', name: 'Palissandro', category: 'wood', albedo: '#4A3728', roughness: 0.5, metallic: 0, normalScale: 0.7, aoIntensity: 0.9, tags: ['palissandro', 'indiana', 'nobre'], isPremium: true },
  { id: 'wood-bubinga', name: 'Bubinga', category: 'wood', albedo: '#8B4513', roughness: 0.55, metallic: 0, normalScale: 0.7, aoIntensity: 0.85, tags: ['bubinga', 'africana', 'exotica'], isPremium: true },
  { id: 'wood-wenge', name: 'Wengé', category: 'wood', albedo: '#2F2F2F', roughness: 0.5, metallic: 0, normalScale: 0.75, aoIntensity: 0.9, tags: ['wenge', 'africana', 'escura'], isPremium: true },
  { id: 'wood-zebrano', name: 'Zebrano', category: 'wood', albedo: '#D2B48C', roughness: 0.6, metallic: 0, normalScale: 0.8, aoIntensity: 0.85, tags: ['zebrano', 'listrada', 'exotica'], isPremium: true },
  { id: 'wood-padauk', name: 'Padauk', category: 'wood', albedo: '#FF6347', roughness: 0.55, metallic: 0, normalScale: 0.7, aoIntensity: 0.85, tags: ['padauk', 'laranja', 'africana'], isPremium: true },
  { id: 'wood-purpleheart', name: 'Purpleheart', category: 'wood', albedo: '#800080', roughness: 0.5, metallic: 0, normalScale: 0.75, aoIntensity: 0.9, tags: ['purpleheart', 'roxa', 'exotica'], isPremium: true },
  { id: 'wood-lacewood', name: 'Lacewood', category: 'wood', albedo: '#D2691E', roughness: 0.6, metallic: 0, normalScale: 0.8, aoIntensity: 0.85, tags: ['lacewood', 'australiana', 'padrao'], isPremium: true },
  { id: 'wood-spalted', name: 'Madeira Manchada', category: 'wood', albedo: '#DEB887', roughness: 0.7, metallic: 0, normalScale: 0.85, aoIntensity: 0.9, tags: ['manchada', 'artistica', 'unica'], isPremium: true },
  { id: 'wood-burl', name: 'Madeira Radial', category: 'wood', albedo: '#8B4513', roughness: 0.65, metallic: 0, normalScale: 0.9, aoIntensity: 0.9, tags: ['radial', 'burl', 'luxo'], isPremium: true },
  { id: 'wood-curly', name: 'Madeira Ondulada', category: 'wood', albedo: '#C19A6B', roughness: 0.55, metallic: 0, normalScale: 0.75, aoIntensity: 0.85, tags: ['ondulada', 'figurada', 'iridescente'], isPremium: true },
  { id: 'wood-quilted', name: 'Madeira Matelassê', category: 'wood', albedo: '#8B7355', roughness: 0.6, metallic: 0, normalScale: 0.8, aoIntensity: 0.9, tags: ['matelassee', 'figurada', 'luxo'], isPremium: true },
  { id: 'wood-birdseye', name: 'Madeira Olho de Pássaro', category: 'wood', albedo: '#F5DEB3', roughness: 0.6, metallic: 0, normalScale: 0.75, aoIntensity: 0.85, tags: ['olho-de-passaro', 'figurada', 'maple'], isPremium: true },
  { id: 'wood-flame', name: 'Madeira Chama', category: 'wood', albedo: '#D2691E', roughness: 0.55, metallic: 0, normalScale: 0.8, aoIntensity: 0.9, tags: ['chama', 'figurada', 'exotica'], isPremium: true },
  { id: 'wood-fiddleback', name: 'Madeira Violino', category: 'wood', albedo: '#C19A6B', roughness: 0.5, metallic: 0, normalScale: 0.85, aoIntensity: 0.9, tags: ['violino', 'figurada', 'musical'], isPremium: true },
];

// ============================================
// METAIS - 40 materiais
// ============================================
export const metalMaterials: PBRMaterial[] = [
  { id: 'metal-steel', name: 'Aço', category: 'metal', albedo: '#C0C0C0', roughness: 0.4, metallic: 1, normalScale: 0.3, aoIntensity: 0.7, tags: ['aco', 'industrial', 'estrutural'], isPremium: false },
  { id: 'metal-stainless', name: 'Aço Inox', category: 'metal', albedo: '#E8E8E8', roughness: 0.15, metallic: 1, normalScale: 0.2, aoIntensity: 0.6, tags: ['inox', 'inoxidable', 'cozinha'], isPremium: false },
  { id: 'metal-stainless-brushed', name: 'Aço Inox Escovado', category: 'metal', albedo: '#D3D3D3', roughness: 0.25, metallic: 1, normalScale: 0.4, aoIntensity: 0.65, tags: ['inox', 'escovado', 'premium'], isPremium: true },
  { id: 'metal-aluminum', name: 'Alumínio', category: 'metal', albedo: '#D3D3D3', roughness: 0.3, metallic: 1, normalScale: 0.25, aoIntensity: 0.65, tags: ['aluminio', 'leve', 'moderno'], isPremium: false },
  { id: 'metal-aluminum-anodized', name: 'Alumínio Anodizado', category: 'metal', albedo: '#C0C0C0', roughness: 0.2, metallic: 0.9, normalScale: 0.2, aoIntensity: 0.6, tags: ['aluminio', 'anodizado', 'protegido'], isPremium: true },
  { id: 'metal-aluminum-brushed', name: 'Alumínio Escovado', category: 'metal', albedo: '#C0C0C0', roughness: 0.35, metallic: 1, normalScale: 0.45, aoIntensity: 0.7, tags: ['aluminio', 'escovado', 'premium'], isPremium: true },
  { id: 'metal-copper', name: 'Cobre', category: 'metal', albedo: '#B87333', roughness: 0.25, metallic: 1, normalScale: 0.3, aoIntensity: 0.7, tags: ['cobre', 'quentinho', 'classico'], isPremium: true },
  { id: 'metal-copper-aged', name: 'Cobre Envelhecido', category: 'metal', albedo: '#8B4513', roughness: 0.5, metallic: 0.9, normalScale: 0.6, aoIntensity: 0.85, tags: ['cobre', 'envelhecido', 'patina'], isPremium: true },
  { id: 'metal-copper-oxidized', name: 'Cobre Oxidado', category: 'metal', albedo: '#4A6741', roughness: 0.7, metallic: 0.7, normalScale: 0.8, aoIntensity: 0.9, tags: ['cobre', 'oxidado', 'verdigris'], isPremium: true },
  { id: 'metal-brass', name: 'Latão', category: 'metal', albedo: '#D4AF37', roughness: 0.2, metallic: 1, normalScale: 0.25, aoIntensity: 0.65, tags: ['latao', 'dourado', 'classico'], isPremium: true },
  { id: 'metal-brass-aged', name: 'Latão Envelhecido', category: 'metal', albedo: '#B5A642', roughness: 0.45, metallic: 0.9, normalScale: 0.55, aoIntensity: 0.8, tags: ['latao', 'envelhecido', 'vintage'], isPremium: true },
  { id: 'metal-bronze', name: 'Bronze', category: 'metal', albedo: '#CD7F32', roughness: 0.25, metallic: 1, normalScale: 0.3, aoIntensity: 0.7, tags: ['bronze', 'classico', 'escultura'], isPremium: true },
  { id: 'metal-bronze-aged', name: 'Bronze Envelhecido', category: 'metal', albedo: '#8B7355', roughness: 0.5, metallic: 0.9, normalScale: 0.6, aoIntensity: 0.85, tags: ['bronze', 'envelhecido', 'patina'], isPremium: true },
  { id: 'metal-gold', name: 'Ouro', category: 'metal', albedo: '#FFD700', roughness: 0.1, metallic: 1, normalScale: 0.15, aoIntensity: 0.5, tags: ['ouro', 'luxo', 'precioso'], isPremium: true },
  { id: 'metal-gold-rose', name: 'Ouro Rosé', category: 'metal', albedo: '#B76E79', roughness: 0.1, metallic: 1, normalScale: 0.15, aoIntensity: 0.5, tags: ['ouro-rose', 'elegante', 'moderno'], isPremium: true },
  { id: 'metal-gold-white', name: 'Ouro Branco', category: 'metal', albedo: '#E8E8E8', roughness: 0.1, metallic: 1, normalScale: 0.15, aoIntensity: 0.5, tags: ['ouro-branco', 'elegante', 'premium'], isPremium: true },
  { id: 'metal-silver', name: 'Prata', category: 'metal', albedo: '#C0C0C0', roughness: 0.1, metallic: 1, normalScale: 0.15, aoIntensity: 0.5, tags: ['prata', 'elegante', 'precioso'], isPremium: true },
  { id: 'metal-chrome', name: 'Cromo', category: 'metal', albedo: '#E8E8E8', roughness: 0.05, metallic: 1, normalScale: 0.1, aoIntensity: 0.45, tags: ['cromo', 'espelhado', 'moderno'], isPremium: true },
  { id: 'metal-chrome-brushed', name: 'Cromo Escovado', category: 'metal', albedo: '#D3D3D3', roughness: 0.15, metallic: 1, normalScale: 0.4, aoIntensity: 0.6, tags: ['cromo', 'escovado', 'premium'], isPremium: true },
  { id: 'metal-nickel', name: 'Níquel', category: 'metal', albedo: '#C0C0C0', roughness: 0.2, metallic: 1, normalScale: 0.2, aoIntensity: 0.6, tags: ['niquel', 'industrial', 'resistente'], isPremium: true },
  { id: 'metal-nickel-brushed', name: 'Níquel Escovado', category: 'metal', albedo: '#B8B8B8', roughness: 0.3, metallic: 1, normalScale: 0.45, aoIntensity: 0.7, tags: ['niquel', 'escovado', 'elegante'], isPremium: true },
  { id: 'metal-titanium', name: 'Titânio', category: 'metal', albedo: '#C0C0C0', roughness: 0.25, metallic: 1, normalScale: 0.25, aoIntensity: 0.65, tags: ['titanio', 'aeroespacial', 'leve'], isPremium: true },
  { id: 'metal-zinc', name: 'Zinco', category: 'metal', albedo: '#A9A9A9', roughness: 0.35, metallic: 1, normalScale: 0.3, aoIntensity: 0.7, tags: ['zinco', 'industrial', 'cobertura'], isPremium: true },
  { id: 'metal-lead', name: 'Chumbo', category: 'metal', albedo: '#696969', roughness: 0.4, metallic: 1, normalScale: 0.35, aoIntensity: 0.75, tags: ['chumbo', 'pesado', 'protecao'], isPremium: true },
  { id: 'metal-tin', name: 'Estanho', category: 'metal', albedo: '#D3D3D3', roughness: 0.3, metallic: 1, normalScale: 0.25, aoIntensity: 0.65, tags: ['estanho', 'solda', 'revestimento'], isPremium: true },
  { id: 'metal-iron', name: 'Ferro', category: 'metal', albedo: '#4A4A4A', roughness: 0.6, metallic: 1, normalScale: 0.5, aoIntensity: 0.8, tags: ['ferro', 'fundido', 'industrial'], isPremium: false },
  { id: 'metal-iron-wrought', name: 'Ferro Forjado', category: 'metal', albedo: '#2F2F2F', roughness: 0.7, metallic: 0.9, normalScale: 0.6, aoIntensity: 0.85, tags: ['ferro', 'forjado', 'artesanal'], isPremium: true },
  { id: 'metal-iron-rust', name: 'Ferro Enferrujado', category: 'metal', albedo: '#8B4513', roughness: 0.85, metallic: 0.6, normalScale: 0.9, aoIntensity: 0.95, tags: ['ferro', 'ferrugem', 'rustico'], isPremium: true },
  { id: 'metal-iron-cast', name: 'Ferro Fundido', category: 'metal', albedo: '#2F2F2F', roughness: 0.65, metallic: 0.95, normalScale: 0.45, aoIntensity: 0.8, tags: ['ferro', 'fundido', 'pesado'], isPremium: true },
  { id: 'metal-galvanized', name: 'Aço Galvanizado', category: 'metal', albedo: '#C0C0C0', roughness: 0.5, metallic: 1, normalScale: 0.4, aoIntensity: 0.75, tags: ['aco', 'galvanizado', 'zincado'], isPremium: false },
  { id: 'metal-corten', name: 'Aço Corten', category: 'metal', albedo: '#B7410E', roughness: 0.8, metallic: 0.7, normalScale: 0.85, aoIntensity: 0.9, tags: ['corten', 'enferrujado', 'arquitetura'], isPremium: true },
  { id: 'metal-perforated', name: 'Metal Perfurado', category: 'metal', albedo: '#C0C0C0', roughness: 0.45, metallic: 1, normalScale: 0.5, aoIntensity: 0.75, tags: ['perfurado', 'industrial', 'ventilacao'], isPremium: true },
  { id: 'metal-mesh', name: 'Malha Metálica', category: 'metal', albedo: '#C0C0C0', roughness: 0.5, metallic: 1, normalScale: 0.6, aoIntensity: 0.8, tags: ['malha', 'tela', 'industrial'], isPremium: true },
  { id: 'metal-expanded', name: 'Metal Expandido', category: 'metal', albedo: '#C0C0C0', roughness: 0.55, metallic: 1, normalScale: 0.55, aoIntensity: 0.8, tags: ['expandido', 'diamantado', 'industrial'], isPremium: true },
  { id: 'metal-wire', name: 'Arame', category: 'metal', albedo: '#C0C0C0', roughness: 0.4, metallic: 1, normalScale: 0.35, aoIntensity: 0.7, tags: ['arame', 'fio', 'trancado'], isPremium: true },
  { id: 'metal-foil', name: 'Folha Metálica', category: 'metal', albedo: '#FFD700', roughness: 0.15, metallic: 1, normalScale: 0.2, aoIntensity: 0.6, tags: ['folha', 'lamina', 'decorativa'], isPremium: true },
  { id: 'metal-mirror', name: 'Espelho Metálico', category: 'metal', albedo: '#E8E8E8', roughness: 0.02, metallic: 1, normalScale: 0.05, aoIntensity: 0.4, reflectivity: 1, tags: ['espelho', 'refletivo', 'luxo'], isPremium: true },
  { id: 'metal-powder-white', name: 'Metal Pintura Eletrostática Branca', category: 'metal', albedo: '#FFFFFF', roughness: 0.4, metallic: 0.3, normalScale: 0.25, aoIntensity: 0.65, tags: ['eletrostatica', 'branca', 'industrial'], isPremium: false },
  { id: 'metal-powder-black', name: 'Metal Pintura Eletrostática Preta', category: 'metal', albedo: '#000000', roughness: 0.4, metallic: 0.3, normalScale: 0.25, aoIntensity: 0.65, tags: ['eletrostatica', 'preta', 'industrial'], isPremium: false },
  { id: 'metal-powder-color', name: 'Metal Pintura Eletrostática Colorida', category: 'metal', albedo: '#FF6347', roughness: 0.4, metallic: 0.3, normalScale: 0.25, aoIntensity: 0.65, tags: ['eletrostatica', 'colorida', 'personalizada'], isPremium: true },
];

// ============================================
// PEDRAS E ROCHAS - 40 materiais
// ============================================
export const stoneMaterials: PBRMaterial[] = [
  // Mármores
  { id: 'stone-marble-carrara', name: 'Mármore Carrara', category: 'stone', albedo: '#F5F5F5', roughness: 0.15, metallic: 0, normalScale: 0.4, aoIntensity: 0.7, tags: ['marmore', 'carrara', 'italiano'], isPremium: true },
  { id: 'stone-marble-calacatta', name: 'Mármore Calacatta', category: 'stone', albedo: '#FFFFFF', roughness: 0.12, metallic: 0, normalScale: 0.45, aoIntensity: 0.65, tags: ['marmore', 'calacatta', 'luxo'], isPremium: true },
  { id: 'stone-marble-statuario', name: 'Mármore Statuário', category: 'stone', albedo: '#FAFAFA', roughness: 0.1, metallic: 0, normalScale: 0.5, aoIntensity: 0.6, tags: ['marmore', 'statuario', 'premium'], isPremium: true },
  { id: 'stone-marble-nero-marquina', name: 'Mármore Nero Marquina', category: 'stone', albedo: '#1C1C1C', roughness: 0.15, metallic: 0, normalScale: 0.4, aoIntensity: 0.75, tags: ['marmore', 'nero', 'preto'], isPremium: true },
  { id: 'stone-marble-rosso-verona', name: 'Mármore Rosso Verona', category: 'stone', albedo: '#B22222', roughness: 0.2, metallic: 0, normalScale: 0.5, aoIntensity: 0.8, tags: ['marmore', 'rosso', 'vermelho'], isPremium: true },
  { id: 'stone-marble-verde-alpi', name: 'Mármore Verde Alpi', category: 'stone', albedo: '#2E8B57', roughness: 0.18, metallic: 0, normalScale: 0.45, aoIntensity: 0.75, tags: ['marmore', 'verde', 'alpi'], isPremium: true },
  { id: 'stone-marble-crema-marfil', name: 'Mármore Crema Marfil', category: 'stone', albedo: '#FFF8DC', roughness: 0.2, metallic: 0, normalScale: 0.4, aoIntensity: 0.7, tags: ['marmore', 'crema', 'bege'], isPremium: true },
  { id: 'stone-marble-travertine', name: 'Mármore Travertino', category: 'stone', albedo: '#D2B48C', roughness: 0.6, metallic: 0, normalScale: 0.7, aoIntensity: 0.85, tags: ['travertino', 'romanico', 'rustico'], isPremium: true },
  { id: 'stone-marble-travertine-filled', name: 'Travertino Resinado', category: 'stone', albedo: '#DEB887', roughness: 0.35, metallic: 0, normalScale: 0.5, aoIntensity: 0.75, tags: ['travertino', 'resinado', 'liso'], isPremium: true },
  { id: 'stone-marble-botticino', name: 'Mármore Botticino', category: 'stone', albedo: '#F5F5DC', roughness: 0.18, metallic: 0, normalScale: 0.4, aoIntensity: 0.7, tags: ['marmore', 'botticino', 'creme'], isPremium: true },
  { id: 'stone-marble-emperador-light', name: 'Mármore Emperador Claro', category: 'stone', albedo: '#D2B48C', roughness: 0.2, metallic: 0, normalScale: 0.45, aoIntensity: 0.75, tags: ['marmore', 'emperador', 'marrom'], isPremium: true },
  { id: 'stone-marble-emperador-dark', name: 'Mármore Emperador Escuro', category: 'stone', albedo: '#4A3728', roughness: 0.18, metallic: 0, normalScale: 0.5, aoIntensity: 0.8, tags: ['marmore', 'emperador', 'escuro'], isPremium: true },
  { id: 'stone-marble-sivec', name: 'Mármore Sivec', category: 'stone', albedo: '#FFFFFF', roughness: 0.08, metallic: 0, normalScale: 0.3, aoIntensity: 0.55, tags: ['marmore', 'sivec', 'branco-puro'], isPremium: true },
  { id: 'stone-marble-thassos', name: 'Mármore Thassos', category: 'stone', albedo: '#FFFFFF', roughness: 0.1, metallic: 0, normalScale: 0.35, aoIntensity: 0.6, tags: ['marmore', 'thassos', 'grego'], isPremium: true },
  { id: 'stone-marble-pietra-grey', name: 'Mármore Pietra Grey', category: 'stone', albedo: '#696969', roughness: 0.15, metallic: 0, normalScale: 0.45, aoIntensity: 0.75, tags: ['marmore', 'pietra', 'cinza'], isPremium: true },
  
  // Granitos
  { id: 'stone-granite-black', name: 'Granito Preto', category: 'stone', albedo: '#1C1C1C', roughness: 0.25, metallic: 0, normalScale: 0.5, aoIntensity: 0.8, tags: ['granito', 'preto', 'sao-gabriel'], isPremium: true },
  { id: 'stone-granite-white', name: 'Granito Branco', category: 'stone', albedo: '#F5F5F5', roughness: 0.3, metallic: 0, normalScale: 0.55, aoIntensity: 0.75, tags: ['granito', 'branco', 'serra'], isPremium: true },
  { id: 'stone-granite-grey', name: 'Granito Cinza', category: 'stone', albedo: '#808080', roughness: 0.28, metallic: 0, normalScale: 0.52, aoIntensity: 0.78, tags: ['granito', 'cinza', 'corumba'], isPremium: true },
  { id: 'stone-granite-red', name: 'Granito Vermelho', category: 'stone', albedo: '#8B0000', roughness: 0.3, metallic: 0, normalScale: 0.55, aoIntensity: 0.8, tags: ['granito', 'vermelho', 'brasil'], isPremium: true },
  { id: 'stone-granite-green', name: 'Granito Verde', category: 'stone', albedo: '#006400', roughness: 0.25, metallic: 0, normalScale: 0.5, aoIntensity: 0.75, tags: ['granito', 'verde', 'ubatuba'], isPremium: true },
  { id: 'stone-granite-yellow', name: 'Granito Amarelo', category: 'stone', albedo: '#DAA520', roughness: 0.3, metallic: 0, normalScale: 0.55, aoIntensity: 0.8, tags: ['granito', 'amarelo', 'ouro'], isPremium: true },
  { id: 'stone-granite-brown', name: 'Granito Marrom', category: 'stone', albedo: '#8B4513', roughness: 0.28, metallic: 0, normalScale: 0.52, aoIntensity: 0.78, tags: ['granito', 'marrom', 'café'], isPremium: true },
  { id: 'stone-granite-blue', name: 'Granito Azul', category: 'stone', albedo: '#191970', roughness: 0.25, metallic: 0, normalScale: 0.5, aoIntensity: 0.75, tags: ['granito', 'azul', 'labrador'], isPremium: true },
  { id: 'stone-granite-pink', name: 'Granito Rosa', category: 'stone', albedo: '#BC8F8F', roughness: 0.3, metallic: 0, normalScale: 0.55, aoIntensity: 0.8, tags: ['granito', 'rosa', 'romantico'], isPremium: true },
  { id: 'stone-granite-kashmir', name: 'Granito Kashmir White', category: 'stone', albedo: '#F5F5F5', roughness: 0.28, metallic: 0, normalScale: 0.5, aoIntensity: 0.75, tags: ['granito', 'kashmir', 'indiano'], isPremium: true },
  { id: 'stone-granite-tan-brown', name: 'Granito Tan Brown', category: 'stone', albedo: '#4A3728', roughness: 0.25, metallic: 0, normalScale: 0.52, aoIntensity: 0.78, tags: ['granito', 'brown', 'marrom'], isPremium: true },
  { id: 'stone-granite-steel', name: 'Granito Steel Grey', category: 'stone', albedo: '#708090', roughness: 0.3, metallic: 0, normalScale: 0.55, aoIntensity: 0.8, tags: ['granito', 'steel', 'industrial'], isPremium: true },
  { id: 'stone-granite-absolute', name: 'Granito Absolute Black', category: 'stone', albedo: '#000000', roughness: 0.2, metallic: 0, normalScale: 0.45, aoIntensity: 0.75, tags: ['granito', 'absolute', 'preto-puro'], isPremium: true },
  
  // Outras pedras
  { id: 'stone-slate-black', name: 'Ardósia Preta', category: 'stone', albedo: '#2F2F2F', roughness: 0.85, metallic: 0, normalScale: 0.8, aoIntensity: 0.9, tags: ['ardosia', 'preta', 'rustica'], isPremium: true },
  { id: 'stone-slate-grey', name: 'Ardósia Cinza', category: 'stone', albedo: '#696969', roughness: 0.85, metallic: 0, normalScale: 0.8, aoIntensity: 0.9, tags: ['ardosia', 'cinza', 'natural'], isPremium: true },
  { id: 'stone-slate-green', name: 'Ardósia Verde', category: 'stone', albedo: '#2E8B57', roughness: 0.85, metallic: 0, normalScale: 0.8, aoIntensity: 0.9, tags: ['ardosia', 'verde', 'exterior'], isPremium: true },
  { id: 'stone-slate-rustic', name: 'Ardósia Rústica', category: 'stone', albedo: '#8B4513', roughness: 0.9, metallic: 0, normalScale: 0.85, aoIntensity: 0.95, tags: ['ardosia', 'rustica', 'envelhecida'], isPremium: true },
  { id: 'stone-quartzite-white', name: 'Quartzito Branco', category: 'stone', albedo: '#FFFFFF', roughness: 0.2, metallic: 0, normalScale: 0.45, aoIntensity: 0.7, tags: ['quartzito', 'branco', 'resistente'], isPremium: true },
  { id: 'stone-quartzite-grey', name: 'Quartzito Cinza', category: 'stone', albedo: '#A9A9A9', roughness: 0.22, metallic: 0, normalScale: 0.48, aoIntensity: 0.72, tags: ['quartzito', 'cinza', 'moderno'], isPremium: true },
  { id: 'stone-onyx-white', name: 'Ônix Branco', category: 'stone', albedo: '#FFF8DC', roughness: 0.1, metallic: 0, normalScale: 0.35, aoIntensity: 0.6, transparency: 0.3, tags: ['onix', 'branco', 'translucido'], isPremium: true },
  { id: 'stone-onyx-honey', name: 'Ônix Mel', category: 'stone', albedo: '#DAA520', roughness: 0.1, metallic: 0, normalScale: 0.35, aoIntensity: 0.6, transparency: 0.4, tags: ['onix', 'mel', 'dourado'], isPremium: true },
  { id: 'stone-onyx-green', name: 'Ônix Verde', category: 'stone', albedo: '#228B22', roughness: 0.1, metallic: 0, normalScale: 0.35, aoIntensity: 0.6, transparency: 0.35, tags: ['onix', 'verde', 'exotico'], isPremium: true },
  { id: 'stone-sandstone-beige', name: 'Arenito Bege', category: 'stone', albedo: '#D2B48C', roughness: 0.75, metallic: 0, normalScale: 0.7, aoIntensity: 0.85, tags: ['arenito', 'bege', 'rustico'], isPremium: true },
  { id: 'stone-sandstone-red', name: 'Arenito Vermelho', category: 'stone', albedo: '#CD5C5C', roughness: 0.75, metallic: 0, normalScale: 0.7, aoIntensity: 0.85, tags: ['arenito', 'vermelho', 'indiano'], isPremium: true },
  { id: 'stone-limestone-beige', name: 'Calcário Bege', category: 'stone', albedo: '#F5F5DC', roughness: 0.65, metallic: 0, normalScale: 0.6, aoIntensity: 0.8, tags: ['calcario', 'bege', 'portugues'], isPremium: true },
  { id: 'stone-basalt-black', name: 'Basalto Preto', category: 'stone', albedo: '#1C1C1C', roughness: 0.4, metallic: 0, normalScale: 0.55, aoIntensity: 0.8, tags: ['basalto', 'preto', 'vulcanico'], isPremium: true },
  { id: 'stone-quartz-white', name: 'Quartzo Branco', category: 'stone', albedo: '#FFFFFF', roughness: 0.08, metallic: 0, normalScale: 0.2, aoIntensity: 0.5, tags: ['quartzo', 'branco', 'brilhante'], isPremium: true },
  { id: 'stone-quartz-rose', name: 'Quartzo Rosa', category: 'stone', albedo: '#FFB6C1', roughness: 0.1, metallic: 0, normalScale: 0.25, aoIntensity: 0.55, tags: ['quartzo', 'rosa', 'decoração'], isPremium: true },
  { id: 'stone-semi-precious', name: 'Pedra Semi-Preciosa', category: 'stone', albedo: '#800080', roughness: 0.05, metallic: 0, normalScale: 0.3, aoIntensity: 0.5, transparency: 0.2, tags: ['semi-preciosa', 'ametista', 'luxo'], isPremium: true },
  { id: 'stone-pebble', name: 'Seixos', category: 'stone', albedo: '#A9A9A9', roughness: 0.9, metallic: 0, normalScale: 0.85, aoIntensity: 0.95, tags: ['seixos', 'rio', 'natural'], isPremium: false },
  { id: 'stone-cobblestone', name: 'Paralelepípedo', category: 'stone', albedo: '#808080', roughness: 0.85, metallic: 0, normalScale: 0.8, aoIntensity: 0.9, tags: ['paralelepipedo', 'calcamento', 'rustico'], isPremium: false },
  { id: 'stone-flagstone', name: 'Laje Irregular', category: 'stone', albedo: '#A9A9A9', roughness: 0.8, metallic: 0, normalScale: 0.75, aoIntensity: 0.88, tags: ['laje', 'irregular', 'natural'], isPremium: true },
  { id: 'stone-fieldstone', name: 'Pedra de Campo', category: 'stone', albedo: '#8B7355', roughness: 0.9, metallic: 0, normalScale: 0.85, aoIntensity: 0.95, tags: ['campo', 'rustica', 'natural'], isPremium: true },
  { id: 'stone-stacked', name: 'Pedra Empilhada', category: 'stone', albedo: '#8B7355', roughness: 0.85, metallic: 0, normalScale: 0.8, aoIntensity: 0.9, tags: ['empilhada', 'muro', 'rustico'], isPremium: true },
  { id: 'stone-veneer', name: 'Revestimento de Pedra', category: 'stone', albedo: '#A9A9A9', roughness: 0.75, metallic: 0, normalScale: 0.7, aoIntensity: 0.85, tags: ['revestimento', 'fachada', 'decorativo'], isPremium: true },
  { id: 'stone-cultured', name: 'Pedra Cultivada', category: 'stone', albedo: '#D2B48C', roughness: 0.7, metallic: 0, normalScale: 0.65, aoIntensity: 0.8, tags: ['cultivada', 'artificial', 'economica'], isPremium: false },
];

// ============================================
// TECIDOS - 50 materiais
// ============================================
export const fabricMaterials: PBRMaterial[] = [
  { id: 'fabric-cotton-white', name: 'Algodão Branco', category: 'fabric', albedo: '#FFFFFF', roughness: 0.9, metallic: 0, normalScale: 0.3, aoIntensity: 0.8, tags: ['algodao', 'branco', 'natural'], isPremium: false },
  { id: 'fabric-cotton-beige', name: 'Algodão Bege', category: 'fabric', albedo: '#F5F5DC', roughness: 0.9, metallic: 0, normalScale: 0.3, aoIntensity: 0.8, tags: ['algodao', 'bege', 'natural'], isPremium: false },
  { id: 'fabric-cotton-grey', name: 'Algodão Cinza', category: 'fabric', albedo: '#A9A9A9', roughness: 0.9, metallic: 0, normalScale: 0.3, aoIntensity: 0.8, tags: ['algodao', 'cinza', 'natural'], isPremium: false },
  { id: 'fabric-cotton-black', name: 'Algodão Preto', category: 'fabric', albedo: '#1C1C1C', roughness: 0.9, metallic: 0, normalScale: 0.3, aoIntensity: 0.85, tags: ['algodao', 'preto', 'basico'], isPremium: false },
  { id: 'fabric-linen-natural', name: 'Linho Natural', category: 'fabric', albedo: '#F5F5DC', roughness: 0.95, metallic: 0, normalScale: 0.5, aoIntensity: 0.85, tags: ['linho', 'natural', 'rustico'], isPremium: true },
  { id: 'fabric-linen-white', name: 'Linho Branco', category: 'fabric', albedo: '#FFFFFF', roughness: 0.95, metallic: 0, normalScale: 0.5, aoIntensity: 0.85, tags: ['linho', 'branco', 'elegante'], isPremium: true },
  { id: 'fabric-linen-grey', name: 'Linho Cinza', category: 'fabric', albedo: '#D3D3D3', roughness: 0.95, metallic: 0, normalScale: 0.5, aoIntensity: 0.85, tags: ['linho', 'cinza', 'moderno'], isPremium: true },
  { id: 'fabric-wool-grey', name: 'Lã Cinza', category: 'fabric', albedo: '#808080', roughness: 0.95, metallic: 0, normalScale: 0.7, aoIntensity: 0.9, tags: ['la', 'cinza', 'quentinho'], isPremium: true },
  { id: 'fabric-wool-cream', name: 'Lã Creme', category: 'fabric', albedo: '#FFFDD0', roughness: 0.95, metallic: 0, normalScale: 0.7, aoIntensity: 0.9, tags: ['la', 'creme', 'conforto'], isPremium: true },
  { id: 'fabric-wool-tartan', name: 'Lã Tartan', category: 'fabric', albedo: '#8B0000', roughness: 0.95, metallic: 0, normalScale: 0.75, aoIntensity: 0.9, tags: ['la', 'tartan', 'xadrez'], isPremium: true },
  { id: 'fabric-silk-white', name: 'Seda Branca', category: 'fabric', albedo: '#FFFFFF', roughness: 0.4, metallic: 0.1, normalScale: 0.2, aoIntensity: 0.6, tags: ['seda', 'branca', 'luxo'], isPremium: true },
  { id: 'fabric-silk-gold', name: 'Seda Dourada', category: 'fabric', albedo: '#FFD700', roughness: 0.35, metallic: 0.15, normalScale: 0.2, aoIntensity: 0.6, tags: ['seda', 'dourada', 'luxo'], isPremium: true },
  { id: 'fabric-silk-red', name: 'Seda Vermelha', category: 'fabric', albedo: '#DC143C', roughness: 0.4, metallic: 0.1, normalScale: 0.2, aoIntensity: 0.65, tags: ['seda', 'vermelha', 'oriental'], isPremium: true },
  { id: 'fabric-silk-black', name: 'Seda Preta', category: 'fabric', albedo: '#000000', roughness: 0.35, metallic: 0.15, normalScale: 0.2, aoIntensity: 0.65, tags: ['seda', 'preta', 'elegante'], isPremium: true },
  { id: 'fabric-velvet-navy', name: 'Veludo Azul Marinho', category: 'fabric', albedo: '#000080', roughness: 0.6, metallic: 0.05, normalScale: 0.8, aoIntensity: 0.9, tags: ['veludo', 'azul', 'luxo'], isPremium: true },
  { id: 'fabric-velvet-emerald', name: 'Veludo Verde Esmeralda', category: 'fabric', albedo: '#50C878', roughness: 0.6, metallic: 0.05, normalScale: 0.8, aoIntensity: 0.9, tags: ['veludo', 'verde', 'luxo'], isPremium: true },
  { id: 'fabric-velvet-burgundy', name: 'Veludo Bordô', category: 'fabric', albedo: '#800020', roughness: 0.6, metallic: 0.05, normalScale: 0.8, aoIntensity: 0.9, tags: ['veludo', 'bordo', 'classico'], isPremium: true },
  { id: 'fabric-velvet-grey', name: 'Veludo Cinza', category: 'fabric', albedo: '#808080', roughness: 0.6, metallic: 0.05, normalScale: 0.8, aoIntensity: 0.9, tags: ['veludo', 'cinza', 'moderno'], isPremium: true },
  { id: 'fabric-velvet-rose', name: 'Veludo Rosa', category: 'fabric', albedo: '#FF69B4', roughness: 0.6, metallic: 0.05, normalScale: 0.8, aoIntensity: 0.9, tags: ['veludo', 'rosa', 'romantico'], isPremium: true },
  { id: 'fabric-leather-brown', name: 'Couro Marrom', category: 'fabric', albedo: '#8B4513', roughness: 0.5, metallic: 0, normalScale: 0.4, aoIntensity: 0.75, tags: ['couro', 'marrom', 'classico'], isPremium: true },
  { id: 'fabric-leather-black', name: 'Couro Preto', category: 'fabric', albedo: '#1C1C1C', roughness: 0.45, metallic: 0, normalScale: 0.4, aoIntensity: 0.75, tags: ['couro', 'preto', 'elegante'], isPremium: true },
  { id: 'fabric-leather-tan', name: 'Couro Caramelo', category: 'fabric', albedo: '#D2691E', roughness: 0.5, metallic: 0, normalScale: 0.4, aoIntensity: 0.75, tags: ['couro', 'caramelo', 'vintage'], isPremium: true },
  { id: 'fabric-leather-white', name: 'Couro Branco', category: 'fabric', albedo: '#FFFFFF', roughness: 0.45, metallic: 0, normalScale: 0.35, aoIntensity: 0.7, tags: ['couro', 'branco', 'moderno'], isPremium: true },
  { id: 'fabric-leather-red', name: 'Couro Vermelho', category: 'fabric', albedo: '#DC143C', roughness: 0.5, metallic: 0, normalScale: 0.4, aoIntensity: 0.75, tags: ['couro', 'vermelho', 'ousado'], isPremium: true },
  { id: 'fabric-leather-distressed', name: 'Couro Envelhecido', category: 'fabric', albedo: '#A0522D', roughness: 0.7, metallic: 0, normalScale: 0.6, aoIntensity: 0.85, tags: ['couro', 'envelhecido', 'vintage'], isPremium: true },
  { id: 'fabric-leather-suede', name: 'Camurça', category: 'fabric', albedo: '#D2B48C', roughness: 0.95, metallic: 0, normalScale: 0.7, aoIntensity: 0.9, tags: ['camurca', 'macia', 'nobre'], isPremium: true },
  { id: 'fabric-leather-nubuck', name: 'Nubuck', category: 'fabric', albedo: '#8B7355', roughness: 0.9, metallic: 0, normalScale: 0.65, aoIntensity: 0.85, tags: ['nubuck', 'aveludado', 'premium'], isPremium: true },
  { id: 'fabric-leather-patent', name: 'Couro Verniz', category: 'fabric', albedo: '#000000', roughness: 0.1, metallic: 0.1, normalScale: 0.1, aoIntensity: 0.5, tags: ['verniz', 'brilhante', 'luxo'], isPremium: true },
  { id: 'fabric-suede-beige', name: 'Suede Bege', category: 'fabric', albedo: '#D2B48C', roughness: 0.95, metallic: 0, normalScale: 0.75, aoIntensity: 0.9, tags: ['suede', 'bege', 'conforto'], isPremium: true },
  { id: 'fabric-suede-grey', name: 'Suede Cinza', category: 'fabric', albedo: '#808080', roughness: 0.95, metallic: 0, normalScale: 0.75, aoIntensity: 0.9, tags: ['suede', 'cinza', 'moderno'], isPremium: true },
  { id: 'fabric-chenille-cream', name: 'Chenille Creme', category: 'fabric', albedo: '#FFF8DC', roughness: 0.9, metallic: 0, normalScale: 0.6, aoIntensity: 0.85, tags: ['chenille', 'creme', 'macia'], isPremium: true },
  { id: 'fabric-boucle-white', name: 'Bouclê Branco', category: 'fabric', albedo: '#FFFFFF', roughness: 0.95, metallic: 0, normalScale: 0.7, aoIntensity: 0.9, tags: ['boucle', 'branco', 'texturizado'], isPremium: true },
  { id: 'fabric-tweed-brown', name: 'Tweed Marrom', category: 'fabric', albedo: '#8B7355', roughness: 0.95, metallic: 0, normalScale: 0.8, aoIntensity: 0.9, tags: ['tweed', 'marrom', 'classico'], isPremium: true },
  { id: 'fabric-tweed-grey', name: 'Tweed Cinza', category: 'fabric', albedo: '#808080', roughness: 0.95, metallic: 0, normalScale: 0.8, aoIntensity: 0.9, tags: ['tweed', 'cinza', 'ingles'], isPremium: true },
  { id: 'fabric-denim-blue', name: 'Jeans Azul', category: 'fabric', albedo: '#00008B', roughness: 0.85, metallic: 0, normalScale: 0.5, aoIntensity: 0.8, tags: ['jeans', 'denim', 'casual'], isPremium: false },
  { id: 'fabric-denim-black', name: 'Jeans Preto', category: 'fabric', albedo: '#1C1C1C', roughness: 0.85, metallic: 0, normalScale: 0.5, aoIntensity: 0.8, tags: ['jeans', 'preto', 'moderno'], isPremium: false },
  { id: 'fabric-canvas-natural', name: 'Lona Natural', category: 'fabric', albedo: '#D2B48C', roughness: 0.9, metallic: 0, normalScale: 0.6, aoIntensity: 0.85, tags: ['lona', 'natural', 'rustica'], isPremium: false },
  { id: 'fabric-canvas-white', name: 'Lona Branca', category: 'fabric', albedo: '#FFFFFF', roughness: 0.9, metallic: 0, normalScale: 0.6, aoIntensity: 0.85, tags: ['lona', 'branca', 'pintura'], isPremium: false },
  { id: 'fabric-jute-natural', name: 'Juta Natural', category: 'fabric', albedo: '#D2B48C', roughness: 0.95, metallic: 0, normalScale: 0.7, aoIntensity: 0.9, tags: ['juta', 'natural', 'rustica'], isPremium: false },
  { id: 'fabric-hemp-natural', name: 'Cânhamo Natural', category: 'fabric', albedo: '#8B7355', roughness: 0.95, metallic: 0, normalScale: 0.65, aoIntensity: 0.88, tags: ['canhamo', 'ecologico', 'sustentavel'], isPremium: true },
  { id: 'fabric-mohair-cream', name: 'Mohair Creme', category: 'fabric', albedo: '#FFF8DC', roughness: 0.9, metallic: 0, normalScale: 0.75, aoIntensity: 0.9, tags: ['mohair', 'pelo', 'luxo'], isPremium: true },
  { id: 'fabric-angora-white', name: 'Angora Branco', category: 'fabric', albedo: '#FFFFFF', roughness: 0.95, metallic: 0, normalScale: 0.8, aoIntensity: 0.92, tags: ['angora', 'pelo', 'macio'], isPremium: true },
  { id: 'fabric-cashmere-grey', name: 'Cashmere Cinza', category: 'fabric', albedo: '#D3D3D3', roughness: 0.9, metallic: 0, normalScale: 0.7, aoIntensity: 0.88, tags: ['cashmere', 'luxo', 'macio'], isPremium: true },
  { id: 'fabric-faux-fur-white', name: 'Pelúcia Branca', category: 'fabric', albedo: '#FFFFFF', roughness: 0.98, metallic: 0, normalScale: 0.9, aoIntensity: 0.95, tags: ['pelucia', 'branca', 'decorativa'], isPremium: true },
  { id: 'fabric-faux-fur-grey', name: 'Pelúcia Cinza', category: 'fabric', albedo: '#A9A9A9', roughness: 0.98, metallic: 0, normalScale: 0.9, aoIntensity: 0.95, tags: ['pelucia', 'cinza', 'decorativa'], isPremium: true },
  { id: 'fabric-faux-fur-brown', name: 'Pelúcia Marrom', category: 'fabric', albedo: '#8B4513', roughness: 0.98, metallic: 0, normalScale: 0.9, aoIntensity: 0.95, tags: ['pelucia', 'marrom', 'decorativa'], isPremium: true },
  { id: 'fabric-faux-leather-brown', name: 'Couro Sintético Marrom', category: 'fabric', albedo: '#8B4513', roughness: 0.55, metallic: 0, normalScale: 0.35, aoIntensity: 0.7, tags: ['sintetico', 'couro', 'economico'], isPremium: false },
  { id: 'fabric-faux-leather-black', name: 'Couro Sintético Preto', category: 'fabric', albedo: '#1C1C1C', roughness: 0.5, metallic: 0, normalScale: 0.35, aoIntensity: 0.7, tags: ['sintetico', 'couro', 'economico'], isPremium: false },
  { id: 'fabric-mesh-black', name: 'Tela Mesh Preta', category: 'fabric', albedo: '#000000', roughness: 0.7, metallic: 0, normalScale: 0.4, aoIntensity: 0.75, tags: ['mesh', 'tela', 'respiravel'], isPremium: false },
  { id: 'fabric-mesh-grey', name: 'Tela Mesh Cinza', category: 'fabric', albedo: '#808080', roughness: 0.7, metallic: 0, normalScale: 0.4, aoIntensity: 0.75, tags: ['mesh', 'tela', 'respiravel'], isPremium: false },
  { id: 'fabric-outdoor-beige', name: 'Tecido Outdoor Bege', category: 'fabric', albedo: '#D2B48C', roughness: 0.8, metallic: 0, normalScale: 0.5, aoIntensity: 0.8, tags: ['outdoor', 'externo', 'resistente'], isPremium: true },
  { id: 'fabric-outdoor-grey', name: 'Tecido Outdoor Cinza', category: 'fabric', albedo: '#808080', roughness: 0.8, metallic: 0, normalScale: 0.5, aoIntensity: 0.8, tags: ['outdoor', 'externo', 'resistente'], isPremium: true },
  { id: 'fabric-sunbrella-navy', name: 'Sunbrella Azul Marinho', category: 'fabric', albedo: '#000080', roughness: 0.75, metallic: 0, normalScale: 0.45, aoIntensity: 0.78, tags: ['sunbrella', 'outdoor', 'premium'], isPremium: true },
  { id: 'fabric-sunbrella-beige', name: 'Sunbrella Bege', category: 'fabric', albedo: '#F5F5DC', roughness: 0.75, metallic: 0, normalScale: 0.45, aoIntensity: 0.78, tags: ['sunbrella', 'outdoor', 'premium'], isPremium: true },
];

// ============================================
// VIDROS - 30 materiais
// ============================================
export const glassMaterials: PBRMaterial[] = [
  { id: 'glass-clear', name: 'Vidro Transparente', category: 'glass', albedo: '#FFFFFF', roughness: 0.02, metallic: 0, normalScale: 0.05, aoIntensity: 0.4, transparency: 0.95, ior: 1.52, tags: ['vidro', 'transparente', 'limpo'], isPremium: false },
  { id: 'glass-tempered', name: 'Vidro Temperado', category: 'glass', albedo: '#FFFFFF', roughness: 0.02, metallic: 0, normalScale: 0.05, aoIntensity: 0.4, transparency: 0.95, ior: 1.52, tags: ['vidro', 'temperado', 'seguranca'], isPremium: false },
  { id: 'glass-laminated', name: 'Vidro Laminado', category: 'glass', albedo: '#FFFFFF', roughness: 0.03, metallic: 0, normalScale: 0.05, aoIntensity: 0.45, transparency: 0.9, ior: 1.52, tags: ['vidro', 'laminado', 'seguranca'], isPremium: true },
  { id: 'glass-frosted', name: 'Vidro Jateado', category: 'glass', albedo: '#F0F8FF', roughness: 0.6, metallic: 0, normalScale: 0.3, aoIntensity: 0.7, transparency: 0.5, ior: 1.52, tags: ['vidro', 'jateado', 'fosco'], isPremium: true },
  { id: 'glass-satin', name: 'Vidro Cetim', category: 'glass', albedo: '#FFFFFF', roughness: 0.4, metallic: 0, normalScale: 0.2, aoIntensity: 0.6, transparency: 0.6, ior: 1.52, tags: ['vidro', 'cetim', 'elegante'], isPremium: true },
  { id: 'glass-tinted-grey', name: 'Vidro Fumê', category: 'glass', albedo: '#696969', roughness: 0.05, metallic: 0, normalScale: 0.1, aoIntensity: 0.5, transparency: 0.7, ior: 1.52, tags: ['vidro', 'fume', 'cinza'], isPremium: true },
  { id: 'glass-tinted-bronze', name: 'Vidro Bronze', category: 'glass', albedo: '#8B4513', roughness: 0.05, metallic: 0, normalScale: 0.1, aoIntensity: 0.5, transparency: 0.7, ior: 1.52, tags: ['vidro', 'bronze', 'quente'], isPremium: true },
  { id: 'glass-tinted-blue', name: 'Vidro Azul', category: 'glass', albedo: '#4682B4', roughness: 0.05, metallic: 0, normalScale: 0.1, aoIntensity: 0.5, transparency: 0.7, ior: 1.52, tags: ['vidro', 'azul', 'frio'], isPremium: true },
  { id: 'glass-tinted-green', name: 'Vidro Verde', category: 'glass', albedo: '#2E8B57', roughness: 0.05, metallic: 0, normalScale: 0.1, aoIntensity: 0.5, transparency: 0.7, ior: 1.52, tags: ['vidro', 'verde', 'natural'], isPremium: true },
  { id: 'glass-mirrored', name: 'Espelho', category: 'glass', albedo: '#E8E8E8', roughness: 0.02, metallic: 1, normalScale: 0.05, aoIntensity: 0.4, reflectivity: 0.95, ior: 1.52, tags: ['espelho', 'refletivo', 'prata'], isPremium: true },
  { id: 'glass-mirrored-bronze', name: 'Espelho Bronze', category: 'glass', albedo: '#CD7F32', roughness: 0.02, metallic: 1, normalScale: 0.05, aoIntensity: 0.4, reflectivity: 0.9, ior: 1.52, tags: ['espelho', 'bronze', 'quente'], isPremium: true },
  { id: 'glass-mirrored-grey', name: 'Espelho Fumê', category: 'glass', albedo: '#696969', roughness: 0.02, metallic: 1, normalScale: 0.05, aoIntensity: 0.4, reflectivity: 0.9, ior: 1.52, tags: ['espelho', 'fume', 'moderno'], isPremium: true },
  { id: 'glass-mirrored-gold', name: 'Espelho Dourado', category: 'glass', albedo: '#FFD700', roughness: 0.02, metallic: 1, normalScale: 0.05, aoIntensity: 0.4, reflectivity: 0.9, ior: 1.52, tags: ['espelho', 'dourado', 'luxo'], isPremium: true },
  { id: 'glass-mirrored-rose', name: 'Espelho Rosé', category: 'glass', albedo: '#B76E79', roughness: 0.02, metallic: 1, normalScale: 0.05, aoIntensity: 0.4, reflectivity: 0.9, ior: 1.52, tags: ['espelho', 'rose', 'elegante'], isPremium: true },
  { id: 'glass-antique', name: 'Vidro Antiquário', category: 'glass', albedo: '#D4AF37', roughness: 0.3, metallic: 0.3, normalScale: 0.4, aoIntensity: 0.7, transparency: 0.6, ior: 1.52, tags: ['vidro', 'antiquario', 'vintage'], isPremium: true },
  { id: 'glass-seeded', name: 'Vidro com Bolhas', category: 'glass', albedo: '#F0F8FF', roughness: 0.2, metallic: 0, normalScale: 0.5, aoIntensity: 0.65, transparency: 0.7, ior: 1.52, tags: ['vidro', 'bolhas', 'texturizado'], isPremium: true },
  { id: 'glass-rain', name: 'Vidro Chuva', category: 'glass', albedo: '#F0F8FF', roughness: 0.25, metallic: 0, normalScale: 0.4, aoIntensity: 0.6, transparency: 0.75, ior: 1.52, tags: ['vidro', 'chuva', 'texturizado'], isPremium: true },
  { id: 'glass-reeded', name: 'Vidro Canelado', category: 'glass', albedo: '#F0F8FF', roughness: 0.3, metallic: 0, normalScale: 0.5, aoIntensity: 0.65, transparency: 0.7, ior: 1.52, tags: ['vidro', 'canelado', 'listrado'], isPremium: true },
  { id: 'glass-fluted', name: 'Vidro Estriado', category: 'glass', albedo: '#FFFFFF', roughness: 0.25, metallic: 0, normalScale: 0.6, aoIntensity: 0.7, transparency: 0.75, ior: 1.52, tags: ['vidro', 'estriado', 'ondulado'], isPremium: true },
  { id: 'glass-ribbed', name: 'Vidro Frisado', category: 'glass', albedo: '#F0F8FF', roughness: 0.3, metallic: 0, normalScale: 0.55, aoIntensity: 0.68, transparency: 0.7, ior: 1.52, tags: ['vidro', 'frisado', 'industrial'], isPremium: true },
  { id: 'glass-wired', name: 'Vidro Aramado', category: 'glass', albedo: '#F0F8FF', roughness: 0.35, metallic: 0.1, normalScale: 0.5, aoIntensity: 0.7, transparency: 0.65, ior: 1.52, tags: ['vidro', 'aramado', 'industrial'], isPremium: true },
  { id: 'glass-patterned', name: 'Vidro Estampado', category: 'glass', albedo: '#F0F8FF', roughness: 0.4, metallic: 0, normalScale: 0.6, aoIntensity: 0.75, transparency: 0.6, ior: 1.52, tags: ['vidro', 'estampado', 'decorativo'], isPremium: true },
  { id: 'glass-stained-red', name: 'Vitral Vermelho', category: 'glass', albedo: '#DC143C', roughness: 0.1, metallic: 0, normalScale: 0.2, aoIntensity: 0.55, transparency: 0.5, ior: 1.52, tags: ['vitral', 'vermelho', 'colorido'], isPremium: true },
  { id: 'glass-stained-blue', name: 'Vitral Azul', category: 'glass', albedo: '#4169E1', roughness: 0.1, metallic: 0, normalScale: 0.2, aoIntensity: 0.55, transparency: 0.5, ior: 1.52, tags: ['vitral', 'azul', 'colorido'], isPremium: true },
  { id: 'glass-stained-green', name: 'Vitral Verde', category: 'glass', albedo: '#228B22', roughness: 0.1, metallic: 0, normalScale: 0.2, aoIntensity: 0.55, transparency: 0.5, ior: 1.52, tags: ['vitral', 'verde', 'colorido'], isPremium: true },
  { id: 'glass-opal', name: 'Vidro Opalino', category: 'glass', albedo: '#F0F8FF', roughness: 0.5, metallic: 0, normalScale: 0.3, aoIntensity: 0.65, transparency: 0.4, ior: 1.52, tags: ['vidro', 'opalino', 'leitoso'], isPremium: true },
  { id: 'glass-crystal', name: 'Cristal', category: 'glass', albedo: '#FFFFFF', roughness: 0.01, metallic: 0, normalScale: 0.02, aoIntensity: 0.35, transparency: 0.98, ior: 1.62, tags: ['cristal', 'premium', 'luxo'], isPremium: true },
  { id: 'glass-lead-crystal', name: 'Cristal com Chumbo', category: 'glass', albedo: '#FFFFFF', roughness: 0.01, metallic: 0, normalScale: 0.02, aoIntensity: 0.35, transparency: 0.98, ior: 1.7, tags: ['cristal', 'chumbo', 'luxo'], isPremium: true },
  { id: 'glass-acrylic-clear', name: 'Acrílico Transparente', category: 'glass', albedo: '#FFFFFF', roughness: 0.05, metallic: 0, normalScale: 0.1, aoIntensity: 0.45, transparency: 0.92, ior: 1.49, tags: ['acrilico', 'plastico', 'leve'], isPremium: false },
  { id: 'glass-acrylic-frosted', name: 'Acrílico Fosco', category: 'glass', albedo: '#F0F8FF', roughness: 0.5, metallic: 0, normalScale: 0.25, aoIntensity: 0.65, transparency: 0.6, ior: 1.49, tags: ['acrilico', 'fosco', 'economico'], isPremium: false },
  { id: 'glass-polycarbonate', name: 'Policarbonato', category: 'glass', albedo: '#FFFFFF', roughness: 0.1, metallic: 0, normalScale: 0.15, aoIntensity: 0.5, transparency: 0.88, ior: 1.58, tags: ['policarbonato', 'resistente', 'impacto'], isPremium: false },
];

// ============================================
// PLÁSTICOS - 25 materiais
// ============================================
export const plasticMaterials: PBRMaterial[] = [
  { id: 'plastic-white-gloss', name: 'Plástico Branco Brilhante', category: 'plastic', albedo: '#FFFFFF', roughness: 0.1, metallic: 0, normalScale: 0.1, aoIntensity: 0.5, tags: ['plastico', 'branco', 'brilhante'], isPremium: false },
  { id: 'plastic-white-matte', name: 'Plástico Branco Fosco', category: 'plastic', albedo: '#FFFFFF', roughness: 0.6, metallic: 0, normalScale: 0.2, aoIntensity: 0.7, tags: ['plastico', 'branco', 'fosco'], isPremium: false },
  { id: 'plastic-black-gloss', name: 'Plástico Preto Brilhante', category: 'plastic', albedo: '#000000', roughness: 0.1, metallic: 0, normalScale: 0.1, aoIntensity: 0.55, tags: ['plastico', 'preto', 'brilhante'], isPremium: false },
  { id: 'plastic-black-matte', name: 'Plástico Preto Fosco', category: 'plastic', albedo: '#1C1C1C', roughness: 0.6, metallic: 0, normalScale: 0.2, aoIntensity: 0.75, tags: ['plastico', 'preto', 'fosco'], isPremium: false },
  { id: 'plastic-grey', name: 'Plástico Cinza', category: 'plastic', albedo: '#808080', roughness: 0.4, metallic: 0, normalScale: 0.15, aoIntensity: 0.65, tags: ['plastico', 'cinza', 'industrial'], isPremium: false },
  { id: 'plastic-red', name: 'Plástico Vermelho', category: 'plastic', albedo: '#DC143C', roughness: 0.3, metallic: 0, normalScale: 0.15, aoIntensity: 0.6, tags: ['plastico', 'vermelho', 'colorido'], isPremium: false },
  { id: 'plastic-blue', name: 'Plástico Azul', category: 'plastic', albedo: '#4169E1', roughness: 0.3, metallic: 0, normalScale: 0.15, aoIntensity: 0.6, tags: ['plastico', 'azul', 'colorido'], isPremium: false },
  { id: 'plastic-green', name: 'Plástico Verde', category: 'plastic', albedo: '#228B22', roughness: 0.3, metallic: 0, normalScale: 0.15, aoIntensity: 0.6, tags: ['plastico', 'verde', 'colorido'], isPremium: false },
  { id: 'plastic-yellow', name: 'Plástico Amarelo', category: 'plastic', albedo: '#FFD700', roughness: 0.3, metallic: 0, normalScale: 0.15, aoIntensity: 0.6, tags: ['plastico', 'amarelo', 'colorido'], isPremium: false },
  { id: 'plastic-orange', name: 'Plástico Laranja', category: 'plastic', albedo: '#FF8C00', roughness: 0.3, metallic: 0, normalScale: 0.15, aoIntensity: 0.6, tags: ['plastico', 'laranja', 'colorido'], isPremium: false },
  { id: 'plastic-pink', name: 'Plástico Rosa', category: 'plastic', albedo: '#FF69B4', roughness: 0.3, metallic: 0, normalScale: 0.15, aoIntensity: 0.6, tags: ['plastico', 'rosa', 'colorido'], isPremium: false },
  { id: 'plastic-purple', name: 'Plástico Roxo', category: 'plastic', albedo: '#800080', roughness: 0.3, metallic: 0, normalScale: 0.15, aoIntensity: 0.6, tags: ['plastico', 'roxo', 'colorido'], isPremium: false },
  { id: 'plastic-transparent', name: 'Plástico Transparente', category: 'plastic', albedo: '#FFFFFF', roughness: 0.1, metallic: 0, normalScale: 0.1, aoIntensity: 0.5, transparency: 0.9, ior: 1.49, tags: ['plastico', 'transparente', 'limpo'], isPremium: false },
  { id: 'plastic-frosted', name: 'Plástico Fosco Transparente', category: 'plastic', albedo: '#F0F8FF', roughness: 0.5, metallic: 0, normalScale: 0.2, aoIntensity: 0.65, transparency: 0.6, ior: 1.49, tags: ['plastico', 'fosco', 'difuso'], isPremium: false },
  { id: 'plastic-pvc-white', name: 'PVC Branco', category: 'plastic', albedo: '#FFFFFF', roughness: 0.4, metallic: 0, normalScale: 0.15, aoIntensity: 0.65, tags: ['pvc', 'branco', 'construcao'], isPremium: false },
  { id: 'plastic-pvc-grey', name: 'PVC Cinza', category: 'plastic', albedo: '#C0C0C0', roughness: 0.4, metallic: 0, normalScale: 0.15, aoIntensity: 0.65, tags: ['pvc', 'cinza', 'construcao'], isPremium: false },
  { id: 'plastic-abs', name: 'ABS', category: 'plastic', albedo: '#FFFFFF', roughness: 0.35, metallic: 0, normalScale: 0.15, aoIntensity: 0.6, tags: ['abs', 'industrial', 'resistente'], isPremium: false },
  { id: 'plastic-nylon', name: 'Nylon', category: 'plastic', albedo: '#F5F5DC', roughness: 0.5, metallic: 0, normalScale: 0.2, aoIntensity: 0.7, tags: ['nylon', 'tecnico', 'resistente'], isPremium: false },
  { id: 'plastic-teflon', name: 'Teflon', category: 'plastic', albedo: '#FFFFFF', roughness: 0.2, metallic: 0, normalScale: 0.1, aoIntensity: 0.55, tags: ['teflon', 'antiaderente', 'tecnico'], isPremium: true },
  { id: 'plastic-bakelite', name: 'Baquelite', category: 'plastic', albedo: '#8B4513', roughness: 0.6, metallic: 0, normalScale: 0.3, aoIntensity: 0.75, tags: ['baquelite', 'vintage', 'historico'], isPremium: true },
  { id: 'plastic-melamine-white', name: 'Melamina Branca', category: 'plastic', albedo: '#FFFFFF', roughness: 0.3, metallic: 0, normalScale: 0.1, aoIntensity: 0.6, tags: ['melamina', 'branca', 'mobiliario'], isPremium: false },
  { id: 'plastic-melamine-wood', name: 'Melamina Madeira', category: 'plastic', albedo: '#D2B48C', roughness: 0.35, metallic: 0, normalScale: 0.2, aoIntensity: 0.65, tags: ['melamina', 'madeira', 'economica'], isPremium: false },
  { id: 'plastic-laminate', name: 'Laminado Plástico', category: 'plastic', albedo: '#FFFFFF', roughness: 0.25, metallic: 0, normalScale: 0.15, aoIntensity: 0.6, tags: ['laminado', 'formica', 'resistente'], isPremium: false },
  { id: 'plastic-corian-white', name: 'Corian Branco', category: 'plastic', albedo: '#FFFFFF', roughness: 0.2, metallic: 0, normalScale: 0.1, aoIntensity: 0.55, tags: ['corian', 'branco', 'premium'], isPremium: true },
  { id: 'plastic-corian-beige', name: 'Corian Bege', category: 'plastic', albedo: '#F5F5DC', roughness: 0.2, metallic: 0, normalScale: 0.1, aoIntensity: 0.55, tags: ['corian', 'bege', 'premium'], isPremium: true },
  { id: 'plastic-resin-clear', name: 'Resina Transparente', category: 'plastic', albedo: '#FFFFFF', roughness: 0.15, metallic: 0, normalScale: 0.1, aoIntensity: 0.5, transparency: 0.85, ior: 1.55, tags: ['resina', 'transparente', 'arte'], isPremium: true },
  { id: 'plastic-resin-amber', name: 'Resina Âmbar', category: 'plastic', albedo: '#FFBF00', roughness: 0.2, metallic: 0, normalScale: 0.15, aoIntensity: 0.55, transparency: 0.6, ior: 1.55, tags: ['resina', 'ambar', 'decorativa'], isPremium: true },
  { id: 'plastic-rubber-black', name: 'Borracha Preta', category: 'plastic', albedo: '#1C1C1C', roughness: 0.7, metallic: 0, normalScale: 0.4, aoIntensity: 0.8, tags: ['borracha', 'preta', 'antiderrapante'], isPremium: false },
  { id: 'plastic-silicone', name: 'Silicone', category: 'plastic', albedo: '#F0F8FF', roughness: 0.5, metallic: 0, normalScale: 0.2, aoIntensity: 0.65, transparency: 0.3, ior: 1.4, tags: ['silicone', 'flexivel', 'vedacao'], isPremium: false },
  { id: 'plastic-foam-white', name: 'Isopor Branco', category: 'plastic', albedo: '#FFFFFF', roughness: 0.9, metallic: 0, normalScale: 0.6, aoIntensity: 0.9, tags: ['isopor', 'leve', 'isolante'], isPremium: false },
  { id: 'plastic-carbon-fiber', name: 'Fibra de Carbono', category: 'plastic', albedo: '#1C1C1C', roughness: 0.3, metallic: 0.2, normalScale: 0.5, aoIntensity: 0.75, tags: ['carbono', 'fibra', 'esportivo'], isPremium: true },
  { id: 'plastic-kevlar', name: 'Kevlar', category: 'plastic', albedo: '#FFD700', roughness: 0.4, metallic: 0, normalScale: 0.4, aoIntensity: 0.7, tags: ['kevlar', 'aramida', 'blindagem'], isPremium: true },
  { id: 'plastic-fiberglass', name: 'Fibra de Vidro', category: 'plastic', albedo: '#F0F8FF', roughness: 0.5, metallic: 0, normalScale: 0.3, aoIntensity: 0.65, transparency: 0.4, ior: 1.52, tags: ['fibra', 'vidro', 'grp'], isPremium: false },
];

// ============================================
// CERÂMICAS - 25 materiais
// ============================================
export const ceramicMaterials: PBRMaterial[] = [
  { id: 'ceramic-porcelain-white', name: 'Porcelana Branca', category: 'ceramic', albedo: '#FFFFFF', roughness: 0.1, metallic: 0, normalScale: 0.1, aoIntensity: 0.5, tags: ['porcelana', 'branca', 'fina'], isPremium: true },
  { id: 'ceramic-porcelain-cream', name: 'Porcelana Creme', category: 'ceramic', albedo: '#FFF8DC', roughness: 0.1, metallic: 0, normalScale: 0.1, aoIntensity: 0.5, tags: ['porcelana', 'creme', 'fina'], isPremium: true },
  { id: 'ceramic-porcelain-black', name: 'Porcelana Preta', category: 'ceramic', albedo: '#1C1C1C', roughness: 0.1, metallic: 0, normalScale: 0.1, aoIntensity: 0.55, tags: ['porcelana', 'preta', 'moderna'], isPremium: true },
  { id: 'ceramic-porcelain-blue', name: 'Porcelana Azul', category: 'ceramic', albedo: '#4169E1', roughness: 0.1, metallic: 0, normalScale: 0.1, aoIntensity: 0.5, tags: ['porcelana', 'azul', 'decorada'], isPremium: true },
  { id: 'ceramic-porcelain-gold', name: 'Porcelana com Ouro', category: 'ceramic', albedo: '#FFFFFF', roughness: 0.1, metallic: 0.3, normalScale: 0.1, aoIntensity: 0.5, tags: ['porcelana', 'ouro', 'luxo'], isPremium: true },
  { id: 'ceramic-tile-white-gloss', name: 'Azulejo Branco Brilhante', category: 'ceramic', albedo: '#FFFFFF', roughness: 0.1, metallic: 0, normalScale: 0.05, aoIntensity: 0.45, tags: ['azulejo', 'branco', 'brilhante'], isPremium: false },
  { id: 'ceramic-tile-white-matte', name: 'Azulejo Branco Fosco', category: 'ceramic', albedo: '#FFFFFF', roughness: 0.5, metallic: 0, normalScale: 0.15, aoIntensity: 0.65, tags: ['azulejo', 'branco', 'fosco'], isPremium: false },
  { id: 'ceramic-tile-beige', name: 'Azulejo Bege', category: 'ceramic', albedo: '#F5F5DC', roughness: 0.4, metallic: 0, normalScale: 0.1, aoIntensity: 0.6, tags: ['azulejo', 'bege', 'neutro'], isPremium: false },
  { id: 'ceramic-tile-blue', name: 'Azulejo Azul', category: 'ceramic', albedo: '#4682B4', roughness: 0.3, metallic: 0, normalScale: 0.1, aoIntensity: 0.55, tags: ['azulejo', 'azul', 'colorido'], isPremium: false },
  { id: 'ceramic-tile-patterned', name: 'Azulejo Estampado', category: 'ceramic', albedo: '#4169E1', roughness: 0.3, metallic: 0, normalScale: 0.15, aoIntensity: 0.6, tags: ['azulejo', 'estampado', 'decorativo'], isPremium: true },
  { id: 'ceramic-tile-subway', name: 'Azulejo Subway', category: 'ceramic', albedo: '#FFFFFF', roughness: 0.15, metallic: 0, normalScale: 0.08, aoIntensity: 0.5, tags: ['azulejo', 'subway', 'metro'], isPremium: false },
  { id: 'ceramic-tile-metro', name: 'Azulejo Metrô', category: 'ceramic', albedo: '#F5F5F5', roughness: 0.2, metallic: 0, normalScale: 0.1, aoIntensity: 0.55, tags: ['azulejo', 'metro', 'classico'], isPremium: false },
  { id: 'ceramic-tile-herringbone', name: 'Azulejo Espinha', category: 'ceramic', albedo: '#FFFFFF', roughness: 0.15, metallic: 0, normalScale: 0.1, aoIntensity: 0.55, tags: ['azulejo', 'espinha', 'padrao'], isPremium: true },
  { id: 'ceramic-tile-hexagon', name: 'Azulejo Hexagonal', category: 'ceramic', albedo: '#FFFFFF', roughness: 0.2, metallic: 0, normalScale: 0.1, aoIntensity: 0.55, tags: ['azulejo', 'hexagonal', 'geometrico'], isPremium: true },
  { id: 'ceramic-tile-mosaic', name: 'Azulejo Mosaico', category: 'ceramic', albedo: '#4169E1', roughness: 0.25, metallic: 0, normalScale: 0.2, aoIntensity: 0.65, tags: ['azulejo', 'mosaico', 'arte'], isPremium: true },
  { id: 'ceramic-tile-terrazzo', name: 'Azulejo Terrazzo', category: 'ceramic', albedo: '#F5F5F5', roughness: 0.3, metallic: 0, normalScale: 0.3, aoIntensity: 0.7, tags: ['azulejo', 'terrazzo', 'granilite'], isPremium: true },
  { id: 'ceramic-tile-cement', name: 'Azulejo Cimento', category: 'ceramic', albedo: '#808080', roughness: 0.7, metallic: 0, normalScale: 0.4, aoIntensity: 0.8, tags: ['azulejo', 'cimento', 'industrial'], isPremium: true },
  { id: 'ceramic-tile-wood-look', name: 'Azulejo Madeira', category: 'ceramic', albedo: '#D2B48C', roughness: 0.4, metallic: 0, normalScale: 0.3, aoIntensity: 0.7, tags: ['azulejo', 'madeira', 'imitacao'], isPremium: false },
  { id: 'ceramic-tile-stone-look', name: 'Azulejo Pedra', category: 'ceramic', albedo: '#A9A9A9', roughness: 0.5, metallic: 0, normalScale: 0.35, aoIntensity: 0.75, tags: ['azulejo', 'pedra', 'imitacao'], isPremium: false },
  { id: 'ceramic-tile-marble-look', name: 'Azulejo Mármore', category: 'ceramic', albedo: '#F5F5F5', roughness: 0.2, metallic: 0, normalScale: 0.2, aoIntensity: 0.6, tags: ['azulejo', 'marmore', 'imitacao'], isPremium: true },
  { id: 'ceramic-tile-large-format', name: 'Porcelanato Grande Formato', category: 'ceramic', albedo: '#F5F5F5', roughness: 0.15, metallic: 0, normalScale: 0.15, aoIntensity: 0.55, tags: ['porcelanato', 'grande', 'moderno'], isPremium: true },
  { id: 'ceramic-tile-polished', name: 'Porcelanato Polido', category: 'ceramic', albedo: '#000000', roughness: 0.05, metallic: 0, normalScale: 0.1, aoIntensity: 0.5, tags: ['porcelanato', 'polido', 'brilhante'], isPremium: true },
  { id: 'ceramic-tile-matte', name: 'Porcelanato Fosco', category: 'ceramic', albedo: '#808080', roughness: 0.5, metallic: 0, normalScale: 0.2, aoIntensity: 0.7, tags: ['porcelanato', 'fosco', 'antiderrapante'], isPremium: true },
  { id: 'ceramic-tile-textured', name: 'Porcelanato Texturizado', category: 'ceramic', albedo: '#A9A9A9', roughness: 0.7, metallic: 0, normalScale: 0.6, aoIntensity: 0.85, tags: ['porcelanato', 'texturizado', '3d'], isPremium: true },
  { id: 'ceramic-tile-outdoor', name: 'Porcelanato Externo', category: 'ceramic', albedo: '#808080', roughness: 0.6, metallic: 0, normalScale: 0.4, aoIntensity: 0.75, tags: ['porcelanato', 'externo', 'resistente'], isPremium: true },
  { id: 'ceramic-tile-pool', name: 'Azulejo de Piscina', category: 'ceramic', albedo: '#4682B4', roughness: 0.2, metallic: 0, normalScale: 0.1, aoIntensity: 0.55, tags: ['azulejo', 'piscina', 'impermeavel'], isPremium: true },
  { id: 'ceramic-brick-red', name: 'Tijolo Vermelho', category: 'ceramic', albedo: '#B22222', roughness: 0.85, metallic: 0, normalScale: 0.7, aoIntensity: 0.9, tags: ['tijolo', 'vermelho', 'rustico'], isPremium: false },
  { id: 'ceramic-brick-white', name: 'Tijolo Branco', category: 'ceramic', albedo: '#FFFFFF', roughness: 0.8, metallic: 0, normalScale: 0.65, aoIntensity: 0.88, tags: ['tijolo', 'branco', 'pintado'], isPremium: false },
  { id: 'ceramic-brick-exposed', name: 'Tijolo Aparente', category: 'ceramic', albedo: '#A0522D', roughness: 0.9, metallic: 0, normalScale: 0.75, aoIntensity: 0.92, tags: ['tijolo', 'aparente', 'industrial'], isPremium: true },
];

// ============================================
// TINTAS E REVESTIMENTOS - 30 materiais
// ============================================
export const paintMaterials: PBRMaterial[] = [
  { id: 'paint-white-matte', name: 'Tinta Branca Fosca', category: 'paint', albedo: '#FFFFFF', roughness: 0.9, metallic: 0, normalScale: 0.1, aoIntensity: 0.7, tags: ['tinta', 'branca', 'fosca'], isPremium: false },
  { id: 'paint-white-satin', name: 'Tinta Branca Cetim', category: 'paint', albedo: '#FFFFFF', roughness: 0.4, metallic: 0, normalScale: 0.08, aoIntensity: 0.6, tags: ['tinta', 'branca', 'cetim'], isPremium: false },
  { id: 'paint-white-gloss', name: 'Tinta Branca Brilhante', category: 'paint', albedo: '#FFFFFF', roughness: 0.15, metallic: 0, normalScale: 0.05, aoIntensity: 0.5, tags: ['tinta', 'branca', 'brilhante'], isPremium: false },
  { id: 'paint-cream', name: 'Tinta Creme', category: 'paint', albedo: '#FFF8DC', roughness: 0.8, metallic: 0, normalScale: 0.1, aoIntensity: 0.7, tags: ['tinta', 'creme', 'quente'], isPremium: false },
  { id: 'paint-beige', name: 'Tinta Bege', category: 'paint', albedo: '#F5F5DC', roughness: 0.8, metallic: 0, normalScale: 0.1, aoIntensity: 0.7, tags: ['tinta', 'bege', 'neutra'], isPremium: false },
  { id: 'paint-grey-light', name: 'Tinta Cinza Claro', category: 'paint', albedo: '#D3D3D3', roughness: 0.8, metallic: 0, normalScale: 0.1, aoIntensity: 0.7, tags: ['tinta', 'cinza', 'claro'], isPremium: false },
  { id: 'paint-grey-medium', name: 'Tinta Cinza Médio', category: 'paint', albedo: '#808080', roughness: 0.8, metallic: 0, normalScale: 0.1, aoIntensity: 0.7, tags: ['tinta', 'cinza', 'medio'], isPremium: false },
  { id: 'paint-grey-dark', name: 'Tinta Cinza Escuro', category: 'paint', albedo: '#696969', roughness: 0.8, metallic: 0, normalScale: 0.1, aoIntensity: 0.75, tags: ['tinta', 'cinza', 'escuro'], isPremium: false },
  { id: 'paint-black', name: 'Tinta Preta', category: 'paint', albedo: '#1C1C1C', roughness: 0.8, metallic: 0, normalScale: 0.1, aoIntensity: 0.75, tags: ['tinta', 'preta', 'dramatica'], isPremium: false },
  { id: 'paint-navy', name: 'Tinta Azul Marinho', category: 'paint', albedo: '#000080', roughness: 0.8, metallic: 0, normalScale: 0.1, aoIntensity: 0.75, tags: ['tinta', 'azul', 'marinho'], isPremium: true },
  { id: 'paint-sage', name: 'Tinta Verde Sálvia', category: 'paint', albedo: '#9DC183', roughness: 0.85, metallic: 0, normalScale: 0.12, aoIntensity: 0.72, tags: ['tinta', 'verde', 'salvia'], isPremium: true },
  { id: 'paint-terracotta', name: 'Tinta Terracota', category: 'paint', albedo: '#E2725B', roughness: 0.85, metallic: 0, normalScale: 0.15, aoIntensity: 0.75, tags: ['tinta', 'terracota', 'quente'], isPremium: true },
  { id: 'paint-mustard', name: 'Tinta Mostarda', category: 'paint', albedo: '#FFDB58', roughness: 0.8, metallic: 0, normalScale: 0.12, aoIntensity: 0.7, tags: ['tinta', 'mostarda', 'vintage'], isPremium: true },
  { id: 'paint-burgundy', name: 'Tinta Bordô', category: 'paint', albedo: '#800020', roughness: 0.8, metallic: 0, normalScale: 0.1, aoIntensity: 0.75, tags: ['tinta', 'bordo', 'elegante'], isPremium: true },
  { id: 'paint-blush', name: 'Tinta Rosa Blush', category: 'paint', albedo: '#DE5D83', roughness: 0.85, metallic: 0, normalScale: 0.1, aoIntensity: 0.72, tags: ['tinta', 'rosa', 'blush'], isPremium: true },
  { id: 'paint-teal', name: 'Tinta Verde Azulado', category: 'paint', albedo: '#008080', roughness: 0.8, metallic: 0, normalScale: 0.1, aoIntensity: 0.73, tags: ['tinta', 'teal', 'moderno'], isPremium: true },
  { id: 'paint-chalkboard', name: 'Tinta Lousa', category: 'paint', albedo: '#2F4F4F', roughness: 0.95, metallic: 0, normalScale: 0.3, aoIntensity: 0.85, tags: ['tinta', 'lousa', 'funcional'], isPremium: true },
  { id: 'paint-magnetic', name: 'Tinta Magnética', category: 'paint', albedo: '#808080', roughness: 0.7, metallic: 0.3, normalScale: 0.2, aoIntensity: 0.75, tags: ['tinta', 'magnetica', 'funcional'], isPremium: true },
  { id: 'paint-texture-stucco', name: 'Textura Stucco', category: 'paint', albedo: '#F5F5DC', roughness: 0.9, metallic: 0, normalScale: 0.6, aoIntensity: 0.85, tags: ['textura', 'stucco', 'mediterranea'], isPremium: true },
  { id: 'paint-texture-rough', name: 'Textura Rústica', category: 'paint', albedo: '#D2B48C', roughness: 0.95, metallic: 0, normalScale: 0.8, aoIntensity: 0.9, tags: ['textura', 'rustica', 'granulada'], isPremium: true },
  { id: 'paint-texture-smooth', name: 'Textura Lisa', category: 'paint', albedo: '#FFFFFF', roughness: 0.7, metallic: 0, normalScale: 0.2, aoIntensity: 0.7, tags: ['textura', 'lisa', 'suave'], isPremium: false },
  { id: 'paint-texture-sand', name: 'Textura Areia', category: 'paint', albedo: '#F4A460', roughness: 0.9, metallic: 0, normalScale: 0.7, aoIntensity: 0.88, tags: ['textura', 'areia', 'natural'], isPremium: true },
  { id: 'paint-metallic-gold', name: 'Tinta Metálica Dourada', category: 'paint', albedo: '#FFD700', roughness: 0.3, metallic: 0.8, normalScale: 0.1, aoIntensity: 0.6, tags: ['tinta', 'metalica', 'dourada'], isPremium: true },
  { id: 'paint-metallic-silver', name: 'Tinta Metálica Prata', category: 'paint', albedo: '#C0C0C0', roughness: 0.3, metallic: 0.8, normalScale: 0.1, aoIntensity: 0.6, tags: ['tinta', 'metalica', 'prata'], isPremium: true },
  { id: 'paint-metallic-copper', name: 'Tinta Metálica Cobre', category: 'paint', albedo: '#B87333', roughness: 0.3, metallic: 0.8, normalScale: 0.1, aoIntensity: 0.6, tags: ['tinta', 'metalica', 'cobre'], isPremium: true },
  { id: 'paint-pearl', name: 'Tinta Perolada', category: 'paint', albedo: '#F0F8FF', roughness: 0.25, metallic: 0.5, normalScale: 0.08, aoIntensity: 0.55, tags: ['tinta', 'perolada', 'iridescente'], isPremium: true },
  { id: 'paint-velvet', name: 'Tinta Veludo', category: 'paint', albedo: '#800020', roughness: 0.6, metallic: 0.1, normalScale: 0.4, aoIntensity: 0.8, tags: ['tinta', 'veludo', 'luxo'], isPremium: true },
  { id: 'paint-suede', name: 'Tinta Camurça', category: 'paint', albedo: '#8B7355', roughness: 0.85, metallic: 0, normalScale: 0.5, aoIntensity: 0.85, tags: ['tinta', 'camurca', 'texturizada'], isPremium: true },
  { id: 'paint-linen', name: 'Tinta Linho', category: 'paint', albedo: '#F5F5DC', roughness: 0.8, metallic: 0, normalScale: 0.4, aoIntensity: 0.8, tags: ['tinta', 'linho', 'texturizada'], isPremium: true },
  { id: 'paint-concrete-effect', name: 'Tinta Efeito Concreto', category: 'paint', albedo: '#808080', roughness: 0.85, metallic: 0, normalScale: 0.5, aoIntensity: 0.85, tags: ['tinta', 'concreto', 'industrial'], isPremium: true },
  { id: 'paint-marble-effect', name: 'Tinta Efeito Mármore', category: 'paint', albedo: '#F5F5F5', roughness: 0.3, metallic: 0, normalScale: 0.2, aoIntensity: 0.65, tags: ['tinta', 'marmore', 'elegante'], isPremium: true },
  { id: 'paint-wood-effect', name: 'Tinta Efeito Madeira', category: 'paint', albedo: '#8B4513', roughness: 0.6, metallic: 0, normalScale: 0.4, aoIntensity: 0.8, tags: ['tinta', 'madeira', 'imitacao'], isPremium: true },
];

// ============================================
// CONCRETOS - 20 materiais
// ============================================
export const concreteMaterials: PBRMaterial[] = [
  { id: 'concrete-plain', name: 'Concreto Liso', category: 'concrete', albedo: '#808080', roughness: 0.85, metallic: 0, normalScale: 0.3, aoIntensity: 0.8, tags: ['concreto', 'liso', 'padrao'], isPremium: false },
  { id: 'concrete-rough', name: 'Concreto Áspero', category: 'concrete', albedo: '#696969', roughness: 0.95, metallic: 0, normalScale: 0.7, aoIntensity: 0.9, tags: ['concreto', 'aspero', 'rustico'], isPremium: false },
  { id: 'concrete-smooth', name: 'Concreto Polido', category: 'concrete', albedo: '#A9A9A9', roughness: 0.3, metallic: 0, normalScale: 0.15, aoIntensity: 0.65, tags: ['concreto', 'polido', 'moderno'], isPremium: true },
  { id: 'concrete-exposed', name: 'Concreto Aparente', category: 'concrete', albedo: '#808080', roughness: 0.9, metallic: 0, normalScale: 0.5, aoIntensity: 0.85, tags: ['concreto', 'aparente', 'brutalista'], isPremium: true },
  { id: 'concrete-board-formed', name: 'Concreto Madeira', category: 'concrete', albedo: '#808080', roughness: 0.85, metallic: 0, normalScale: 0.6, aoIntensity: 0.88, tags: ['concreto', 'madeira', 'texturizado'], isPremium: true },
  { id: 'concrete-stamped', name: 'Concreto Estampado', category: 'concrete', albedo: '#A9A9A9', roughness: 0.8, metallic: 0, normalScale: 0.5, aoIntensity: 0.85, tags: ['concreto', 'estampado', 'decorativo'], isPremium: true },
  { id: 'concrete-stained', name: 'Concreto Acidificado', category: 'concrete', albedo: '#8B7355', roughness: 0.75, metallic: 0, normalScale: 0.4, aoIntensity: 0.8, tags: ['concreto', 'acidificado', 'colorido'], isPremium: true },
  { id: 'concrete-white', name: 'Concreto Branco', category: 'concrete', albedo: '#F5F5F5', roughness: 0.7, metallic: 0, normalScale: 0.25, aoIntensity: 0.7, tags: ['concreto', 'branco', 'minimalista'], isPremium: true },
  { id: 'concrete-black', name: 'Concreto Preto', category: 'concrete', albedo: '#2F2F2F', roughness: 0.7, metallic: 0, normalScale: 0.25, aoIntensity: 0.75, tags: ['concreto', 'preto', 'dramatico'], isPremium: true },
  { id: 'concrete-burnt', name: 'Concreto Queimado', category: 'concrete', albedo: '#4A3728', roughness: 0.8, metallic: 0, normalScale: 0.5, aoIntensity: 0.85, tags: ['concreto', 'queimado', 'industrial'], isPremium: true },
  { id: 'concrete-terrazzo', name: 'Concreto Terrazzo', category: 'concrete', albedo: '#F5F5F5', roughness: 0.4, metallic: 0, normalScale: 0.3, aoIntensity: 0.7, tags: ['concreto', 'terrazzo', 'granilite'], isPremium: true },
  { id: 'concrete-microcement', name: 'Microcimento', category: 'concrete', albedo: '#D3D3D3', roughness: 0.5, metallic: 0, normalScale: 0.2, aoIntensity: 0.65, tags: ['microcimento', 'fino', 'moderno'], isPremium: true },
  { id: 'concrete-fiber', name: 'Concreto Fibra', category: 'concrete', albedo: '#808080', roughness: 0.75, metallic: 0, normalScale: 0.35, aoIntensity: 0.8, tags: ['concreto', 'fibra', 'reforcado'], isPremium: true },
  { id: 'concrete-lightweight', name: 'Concreto Leve', category: 'concrete', albedo: '#A9A9A9', roughness: 0.8, metallic: 0, normalScale: 0.4, aoIntensity: 0.82, tags: ['concreto', 'leve', 'isopor'], isPremium: false },
  { id: 'concrete-precast', name: 'Concreto Pré-moldado', category: 'concrete', albedo: '#808080', roughness: 0.7, metallic: 0, normalScale: 0.3, aoIntensity: 0.75, tags: ['concreto', 'pre-moldado', 'industrial'], isPremium: false },
  { id: 'concrete-architectural', name: 'Concreto Arquitetônico', category: 'concrete', albedo: '#C0C0C0', roughness: 0.4, metallic: 0, normalScale: 0.2, aoIntensity: 0.65, tags: ['concreto', 'arquitetonico', 'premium'], isPremium: true },
  { id: 'concrete-urbancrete', name: 'Concreto Urbano', category: 'concrete', albedo: '#696969', roughness: 0.9, metallic: 0, normalScale: 0.6, aoIntensity: 0.88, tags: ['concreto', 'urbano', 'desgastado'], isPremium: true },
  { id: 'concrete-weathered', name: 'Concreto Envelhecido', category: 'concrete', albedo: '#8B7355', roughness: 0.95, metallic: 0, normalScale: 0.7, aoIntensity: 0.92, tags: ['concreto', 'envelhecido', 'rustico'], isPremium: true },
  { id: 'concrete-polished-grey', name: 'Concreto Polido Cinza', category: 'concrete', albedo: '#808080', roughness: 0.15, metallic: 0, normalScale: 0.1, aoIntensity: 0.6, tags: ['concreto', 'polido', 'cinza'], isPremium: true },
  { id: 'concrete-honed', name: 'Concreto Lapidado', category: 'concrete', albedo: '#A9A9A9', roughness: 0.35, metallic: 0, normalScale: 0.15, aoIntensity: 0.65, tags: ['concreto', 'lapidado', 'fosco'], isPremium: true },
];

// ============================================
// COLEÇÃO COMPLETA
// ============================================
export const pbrMaterials: PBRMaterial[] = [
  ...woodMaterials,
  ...metalMaterials,
  ...stoneMaterials,
  ...fabricMaterials,
  ...glassMaterials,
  ...plasticMaterials,
  ...ceramicMaterials,
  ...paintMaterials,
  ...concreteMaterials,
];

// Estatísticas
export const pbrStats = {
  total: pbrMaterials.length,
  byCategory: {
    wood: woodMaterials.length,
    metal: metalMaterials.length,
    stone: stoneMaterials.length,
    fabric: fabricMaterials.length,
    glass: glassMaterials.length,
    plastic: plasticMaterials.length,
    ceramic: ceramicMaterials.length,
    paint: paintMaterials.length,
    concrete: concreteMaterials.length,
  },
  premium: pbrMaterials.filter(m => m.isPremium).length,
  free: pbrMaterials.filter(m => !m.isPremium).length,
};

// Funções de busca
export const getMaterialsByCategory = (category: PBRMaterial['category']): PBRMaterial[] => {
  return pbrMaterials.filter(m => m.category === category);
};

export const searchMaterials = (query: string): PBRMaterial[] => {
  const lowerQuery = query.toLowerCase();
  return pbrMaterials.filter(m =>
    m.name.toLowerCase().includes(lowerQuery) ||
    m.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
};

export const getMaterialById = (id: string): PBRMaterial | undefined => {
  return pbrMaterials.find(m => m.id === id);
};

console.log(`🎨 Materiais PBR Carregados: ${pbrStats.total} materiais`);
console.log(`   Premium: ${pbrStats.premium} | Gratuitos: ${pbrStats.free}`);
