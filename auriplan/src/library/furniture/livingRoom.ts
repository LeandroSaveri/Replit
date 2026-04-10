/**
 * AuriPlan - Catálogo de Móveis para Sala de Estar
 * 80+ itens profissionais
 */

import type { FurnitureItem } from './index';

export const livingRoomFurniture: FurnitureItem[] = [
  // Sofás (8 itens)
  {
    id: 'sofa-1', name: 'Sofá Retrátil 3 Lugares', category: 'living-room', subcategory: 'sofas',
    width: 2.10, height: 0.95, depth: 0.90, defaultColor: '#8B4513', material: 'fabric',
    price: 2499, currency: 'BRL', brand: 'Etna',
    tags: ['sofa', 'retratil', '3-lugares'],
    variants: [{ id: 'v1', name: 'Marrom', color: '#8B4513', material: 'suede' }, { id: 'v2', name: 'Cinza', color: '#696969', material: 'linho' }]
  },
  {
    id: 'sofa-2', name: 'Sofá Chesterfield Clássico', category: 'living-room', subcategory: 'sofas',
    width: 2.40, height: 0.80, depth: 0.95, defaultColor: '#4A0404', material: 'leather',
    price: 5890, currency: 'BRL', brand: 'Artefacto',
    tags: ['sofa', 'chesterfield', 'classico'],
    variants: [{ id: 'v1', name: 'Vinho', color: '#4A0404', material: 'couro' }, { id: 'v2', name: 'Preto', color: '#1a1a1a', material: 'couro' }]
  },
  {
    id: 'sofa-3', name: 'Sofá Modular 5 Lugares', category: 'living-room', subcategory: 'sofas',
    width: 3.20, height: 0.85, depth: 1.60, defaultColor: '#E8E8E8', material: 'fabric',
    price: 4299, currency: 'BRL', brand: 'Tok&Stok',
    tags: ['sofa', 'modular', '5-lugares'],
    variants: [{ id: 'v1', name: 'Branco', color: '#FFFFFF', material: 'linho' }, { id: 'v2', name: 'Cinza', color: '#D3D3D3', material: 'tecido' }]
  },
  {
    id: 'sofa-4', name: 'Sofá Cama Casal', category: 'living-room', subcategory: 'sofas',
    width: 1.90, height: 0.90, depth: 1.00, defaultColor: '#2F4F4F', material: 'fabric',
    price: 1899, currency: 'BRL', brand: 'Americanas',
    tags: ['sofa', 'cama', 'casal'],
    variants: [{ id: 'v1', name: 'Cinza', color: '#2F4F4F', material: 'tecido' }, { id: 'v2', name: 'Marrom', color: '#8B4513', material: 'tecido' }]
  },
  {
    id: 'sofa-5', name: 'Sofá de Canto Chaise', category: 'living-room', subcategory: 'sofas',
    width: 2.80, height: 0.85, depth: 1.80, defaultColor: '#D2B48C', material: 'fabric',
    price: 3299, currency: 'BRL', brand: 'Casas Bahia',
    tags: ['sofa', 'canto', 'chaise'],
    variants: [{ id: 'v1', name: 'Bege', color: '#D2B48C', material: 'tecido' }, { id: 'v2', name: 'Cinza', color: '#808080', material: 'tecido' }]
  },
  {
    id: 'sofa-6', name: 'Sofá Loveseat 2 Lugares', category: 'living-room', subcategory: 'sofas',
    width: 1.50, height: 0.85, depth: 0.85, defaultColor: '#FF6347', material: 'velvet',
    price: 1599, currency: 'BRL', brand: 'Oppa',
    tags: ['sofa', 'loveseat', '2-lugares'],
    variants: [{ id: 'v1', name: 'Coral', color: '#FF6347', material: 'veludo' }, { id: 'v2', name: 'Verde', color: '#2E8B57', material: 'veludo' }]
  },
  {
    id: 'sofa-7', name: 'Sofá Reclinável Elétrico', category: 'living-room', subcategory: 'sofas',
    width: 2.20, height: 1.05, depth: 0.95, defaultColor: '#1a1a1a', material: 'leather',
    price: 7890, currency: 'BRL', brand: 'Natuzzi',
    tags: ['sofa', 'reclinavel', 'eletrico'],
    variants: [{ id: 'v1', name: 'Preto', color: '#1a1a1a', material: 'couro' }, { id: 'v2', name: 'Marrom', color: '#654321', material: 'couro' }]
  },
  {
    id: 'sofa-8', name: 'Sofá em L com Puff', category: 'living-room', subcategory: 'sofas',
    width: 3.00, height: 0.85, depth: 2.00, defaultColor: '#F0F0F0', material: 'fabric',
    price: 4599, currency: 'BRL', brand: 'MadeiraMadeira',
    tags: ['sofa', 'l', 'puff'],
    variants: [{ id: 'v1', name: 'Off White', color: '#F0F0F0', material: 'linho' }, { id: 'v2', name: 'Cinza', color: '#A9A9A9', material: 'tecido' }]
  },

  // Poltronas (6 itens)
  {
    id: 'armchair-1', name: 'Poltrona Egg Arne Jacobsen', category: 'living-room', subcategory: 'armchairs',
    width: 0.85, height: 1.05, depth: 0.80, defaultColor: '#C41E3A', material: 'leather',
    price: 4590, currency: 'BRL', brand: 'Fritz Hansen',
    tags: ['poltrona', 'egg', 'design'],
    variants: [{ id: 'v1', name: 'Vermelho', color: '#C41E3A', material: 'couro' }, { id: 'v2', name: 'Preto', color: '#000000', material: 'couro' }]
  },
  {
    id: 'armchair-2', name: 'Poltrona Eames Lounge', category: 'living-room', subcategory: 'armchairs',
    width: 0.85, height: 0.85, depth: 0.85, defaultColor: '#3D2817', material: 'leather',
    price: 12990, currency: 'BRL', brand: 'Herman Miller',
    tags: ['poltrona', 'eames', 'lounge'],
    variants: [{ id: 'v1', name: 'Marrom', color: '#3D2817', material: 'couro' }, { id: 'v2', name: 'Preto', color: '#1a1a1a', material: 'couro' }]
  },
  {
    id: 'armchair-3', name: 'Poltrona Barcelona', category: 'living-room', subcategory: 'armchairs',
    width: 0.75, height: 0.80, depth: 0.75, defaultColor: '#1a1a1a', material: 'leather',
    price: 3890, currency: 'BRL', brand: 'Knoll',
    tags: ['poltrona', 'barcelona'],
    variants: [{ id: 'v1', name: 'Preto', color: '#1a1a1a', material: 'couro' }, { id: 'v2', name: 'Branco', color: '#FFFFFF', material: 'couro' }]
  },
  {
    id: 'armchair-4', name: 'Poltrona de Balanço', category: 'living-room', subcategory: 'armchairs',
    width: 0.70, height: 1.10, depth: 0.90, defaultColor: '#8B4513', material: 'wood',
    price: 1299, currency: 'BRL', brand: 'Tramontina',
    tags: ['poltrona', 'balanco'],
    variants: [{ id: 'v1', name: 'Madeira', color: '#8B4513', material: 'madeira' }, { id: 'v2', name: 'Branco', color: '#FFFFFF', material: 'madeira' }]
  },
  {
    id: 'armchair-5', name: 'Poltrona Giratória', category: 'living-room', subcategory: 'armchairs',
    width: 0.75, height: 0.90, depth: 0.75, defaultColor: '#4A90D9', material: 'fabric',
    price: 899, currency: 'BRL', brand: 'Ikea',
    tags: ['poltrona', 'giratoria'],
    variants: [{ id: 'v1', name: 'Azul', color: '#4A90D9', material: 'tecido' }, { id: 'v2', name: 'Cinza', color: '#808080', material: 'tecido' }]
  },
  {
    id: 'armchair-6', name: 'Puff Redondo', category: 'living-room', subcategory: 'armchairs',
    width: 0.60, height: 0.45, depth: 0.60, defaultColor: '#FFD700', material: 'velvet',
    price: 399, currency: 'BRL', brand: 'Oppa',
    tags: ['puff', 'redondo'],
    variants: [{ id: 'v1', name: 'Amarelo', color: '#FFD700', material: 'veludo' }, { id: 'v2', name: 'Rosa', color: '#FF69B4', material: 'veludo' }]
  },

  // Mesas de Centro (5 itens)
  {
    id: 'coffee-table-1', name: 'Mesa de Centro Vidro', category: 'living-room', subcategory: 'coffee-tables',
    width: 1.00, height: 0.45, depth: 0.60, defaultColor: '#87CEEB', material: 'glass',
    price: 699, currency: 'BRL', brand: 'Tok&Stok',
    tags: ['mesa', 'centro', 'vidro'],
    variants: [{ id: 'v1', name: 'Incolor', color: '#87CEEB', material: 'vidro' }, { id: 'v2', name: 'Fume', color: '#696969', material: 'vidro' }]
  },
  {
    id: 'coffee-table-2', name: 'Mesa de Centro Industrial', category: 'living-room', subcategory: 'coffee-tables',
    width: 1.20, height: 0.40, depth: 0.60, defaultColor: '#2F4F4F', material: 'metal',
    price: 899, currency: 'BRL', brand: 'Etna',
    tags: ['mesa', 'centro', 'industrial'],
    variants: [{ id: 'v1', name: 'Preto', color: '#2F4F4F', material: 'metal' }, { id: 'v2', name: 'Cobre', color: '#B87333', material: 'metal' }]
  },
  {
    id: 'coffee-table-3', name: 'Mesa de Centro Madeira', category: 'living-room', subcategory: 'coffee-tables',
    width: 0.90, height: 0.35, depth: 0.90, defaultColor: '#8B4513', material: 'wood',
    price: 1299, currency: 'BRL', brand: 'MadeiraMadeira',
    tags: ['mesa', 'centro', 'madeira'],
    variants: [{ id: 'v1', name: 'Carvalho', color: '#8B4513', material: 'madeira' }, { id: 'v2', name: 'Nogueira', color: '#5D4037', material: 'madeira' }]
  },
  {
    id: 'coffee-table-4', name: 'Mesa de Centro Elevatória', category: 'living-room', subcategory: 'coffee-tables',
    width: 1.10, height: 0.50, depth: 0.60, defaultColor: '#FFFFFF', material: 'wood',
    price: 1599, currency: 'BRL', brand: 'Ikea',
    tags: ['mesa', 'centro', 'elevatoria'],
    variants: [{ id: 'v1', name: 'Branco', color: '#FFFFFF', material: 'madeira' }, { id: 'v2', name: 'Preto', color: '#1a1a1a', material: 'madeira' }]
  },
  {
    id: 'coffee-table-5', name: 'Mesa de Centro Mármore', category: 'living-room', subcategory: 'coffee-tables',
    width: 1.00, height: 0.40, depth: 1.00, defaultColor: '#F5F5F5', material: 'stone',
    price: 2890, currency: 'BRL', brand: 'Artefacto',
    tags: ['mesa', 'centro', 'marmore'],
    variants: [{ id: 'v1', name: 'Carrara', color: '#F5F5F5', material: 'marmore' }, { id: 'v2', name: 'Preto', color: '#1a1a1a', material: 'marmore' }]
  },

  // Racks (5 itens)
  {
    id: 'tv-stand-1', name: 'Rack para TV 65"', category: 'living-room', subcategory: 'tv-stands',
    width: 1.80, height: 0.60, depth: 0.45, defaultColor: '#3D2817', material: 'wood',
    price: 1299, currency: 'BRL', brand: 'Casas Bahia',
    tags: ['rack', 'tv', '65-polegadas'],
    variants: [{ id: 'v1', name: 'Marrom', color: '#3D2817', material: 'madeira' }, { id: 'v2', name: 'Branco', color: '#FFFFFF', material: 'madeira' }]
  },
  {
    id: 'tv-stand-2', name: 'Rack Suspenso Moderno', category: 'living-room', subcategory: 'tv-stands',
    width: 1.60, height: 0.35, depth: 0.40, defaultColor: '#FFFFFF', material: 'wood',
    price: 899, currency: 'BRL', brand: 'Tok&Stok',
    tags: ['rack', 'suspenso', 'moderno'],
    variants: [{ id: 'v1', name: 'Branco', color: '#FFFFFF', material: 'madeira' }, { id: 'v2', name: 'Preto', color: '#1a1a1a', material: 'madeira' }]
  },
  {
    id: 'tv-stand-3', name: 'Estante para TV com Nichos', category: 'living-room', subcategory: 'tv-stands',
    width: 2.20, height: 1.80, depth: 0.45, defaultColor: '#8B4513', material: 'wood',
    price: 1899, currency: 'BRL', brand: 'MadeiraMadeira',
    tags: ['estante', 'tv', 'nichos'],
    variants: [{ id: 'v1', name: 'Carvalho', color: '#8B4513', material: 'madeira' }, { id: 'v2', name: 'Branco', color: '#FFFFFF', material: 'madeira' }]
  },
  {
    id: 'tv-stand-4', name: 'Painel para TV 55"', category: 'living-room', subcategory: 'tv-stands',
    width: 1.40, height: 1.20, depth: 0.30, defaultColor: '#1a1a1a', material: 'wood',
    price: 699, currency: 'BRL', brand: 'Americanas',
    tags: ['painel', 'tv', '55-polegadas'],
    variants: [{ id: 'v1', name: 'Preto', color: '#1a1a1a', material: 'madeira' }, { id: 'v2', name: 'Branco', color: '#FFFFFF', material: 'madeira' }]
  },
  {
    id: 'tv-stand-5', name: 'Rack Industrial com Metal', category: 'living-room', subcategory: 'tv-stands',
    width: 1.50, height: 0.55, depth: 0.40, defaultColor: '#2F4F4F', material: 'metal',
    price: 1099, currency: 'BRL', brand: 'Etna',
    tags: ['rack', 'industrial', 'metal'],
    variants: [{ id: 'v1', name: 'Preto', color: '#2F4F4F', material: 'metal' }, { id: 'v2', name: 'Cobre', color: '#B87333', material: 'metal' }]
  },

  // Estantes (5 itens)
  {
    id: 'bookshelf-1', name: 'Estante 5 Prateleiras', category: 'living-room', subcategory: 'bookshelves',
    width: 0.80, height: 1.80, depth: 0.30, defaultColor: '#8B4513', material: 'wood',
    price: 599, currency: 'BRL', brand: 'Ikea',
    tags: ['estante', '5-prateleiras'],
    variants: [{ id: 'v1', name: 'Carvalho', color: '#8B4513', material: 'madeira' }, { id: 'v2', name: 'Branco', color: '#FFFFFF', material: 'madeira' }]
  },
  {
    id: 'bookshelf-2', name: 'Estante Industrial Metal', category: 'living-room', subcategory: 'bookshelves',
    width: 0.90, height: 2.00, depth: 0.35, defaultColor: '#2F4F4F', material: 'metal',
    price: 799, currency: 'BRL', brand: 'Tok&Stok',
    tags: ['estante', 'industrial'],
    variants: [{ id: 'v1', name: 'Preto', color: '#2F4F4F', material: 'metal' }, { id: 'v2', name: 'Cobre', color: '#B87333', material: 'metal' }]
  },
  {
    id: 'bookshelf-3', name: 'Estante de Canto', category: 'living-room', subcategory: 'bookshelves',
    width: 0.40, height: 1.60, depth: 0.40, defaultColor: '#FFFFFF', material: 'wood',
    price: 399, currency: 'BRL', brand: 'Americanas',
    tags: ['estante', 'canto'],
    variants: [{ id: 'v1', name: 'Branco', color: '#FFFFFF', material: 'madeira' }, { id: 'v2', name: 'Preto', color: '#1a1a1a', material: 'madeira' }]
  },
  {
    id: 'bookshelf-4', name: 'Prateleiras Flutuantes Kit 3', category: 'living-room', subcategory: 'bookshelves',
    width: 0.60, height: 0.20, depth: 0.20, defaultColor: '#8B4513', material: 'wood',
    price: 199, currency: 'BRL', brand: 'MadeiraMadeira',
    tags: ['prateleiras', 'flutuantes'],
    variants: [{ id: 'v1', name: 'Carvalho', color: '#8B4513', material: 'madeira' }, { id: 'v2', name: 'Branco', color: '#FFFFFF', material: 'madeira' }]
  },
  {
    id: 'bookshelf-5', name: 'Estante Escada', category: 'living-room', subcategory: 'bookshelves',
    width: 0.70, height: 1.80, depth: 0.40, defaultColor: '#FFFFFF', material: 'wood',
    price: 499, currency: 'BRL', brand: 'Oppa',
    tags: ['estante', 'escada'],
    variants: [{ id: 'v1', name: 'Branco', color: '#FFFFFF', material: 'madeira' }, { id: 'v2', name: 'Preto', color: '#1a1a1a', material: 'madeira' }]
  },

  // Aparadores (3 itens)
  {
    id: 'sideboard-1', name: 'Aparador Clássico 2 Portas', category: 'living-room', subcategory: 'sideboards',
    width: 1.20, height: 0.85, depth: 0.45, defaultColor: '#8B4513', material: 'wood',
    price: 899, currency: 'BRL', brand: 'Etna',
    tags: ['aparador', 'classico'],
    variants: [{ id: 'v1', name: 'Carvalho', color: '#8B4513', material: 'madeira' }, { id: 'v2', name: 'Nogueira', color: '#5D4037', material: 'madeira' }]
  },
  {
    id: 'sideboard-2', name: 'Aparador Moderno com Espelho', category: 'living-room', subcategory: 'sideboards',
    width: 1.40, height: 0.80, depth: 0.40, defaultColor: '#FFFFFF', material: 'wood',
    price: 1299, currency: 'BRL', brand: 'Tok&Stok',
    tags: ['aparador', 'moderno'],
    variants: [{ id: 'v1', name: 'Branco', color: '#FFFFFF', material: 'madeira' }, { id: 'v2', name: 'Preto', color: '#1a1a1a', material: 'madeira' }]
  },
  {
    id: 'sideboard-3', name: 'Buffet 3 Portas', category: 'living-room', subcategory: 'sideboards',
    width: 1.60, height: 0.90, depth: 0.50, defaultColor: '#3D2817', material: 'wood',
    price: 1599, currency: 'BRL', brand: 'MadeiraMadeira',
    tags: ['buffet', '3-portas'],
    variants: [{ id: 'v1', name: 'Nogueira', color: '#3D2817', material: 'madeira' }, { id: 'v2', name: 'Branco', color: '#FFFFFF', material: 'madeira' }]
  },

  // Luminárias (4 itens)
  {
    id: 'lamp-1', name: 'Abajur de Mesa', category: 'living-room', subcategory: 'lighting',
    width: 0.30, height: 0.60, depth: 0.30, defaultColor: '#FFD700', material: 'metal',
    price: 299, currency: 'BRL', brand: 'Tok&Stok',
    tags: ['abajur', 'mesa'],
    variants: [{ id: 'v1', name: 'Dourado', color: '#FFD700', material: 'metal' }, { id: 'v2', name: 'Prata', color: '#C0C0C0', material: 'metal' }]
  },
  {
    id: 'lamp-2', name: 'Luminária de Piso Arco', category: 'living-room', subcategory: 'lighting',
    width: 0.40, height: 2.10, depth: 1.80, defaultColor: '#C0C0C0', material: 'metal',
    price: 899, currency: 'BRL', brand: 'Etna',
    tags: ['luminaria', 'piso', 'arco'],
    variants: [{ id: 'v1', name: 'Prata', color: '#C0C0C0', material: 'metal' }, { id: 'v2', name: 'Preto', color: '#1a1a1a', material: 'metal' }]
  },
  {
    id: 'lamp-3', name: 'Pendente Industrial', category: 'living-room', subcategory: 'lighting',
    width: 0.35, height: 1.50, depth: 0.35, defaultColor: '#2F4F4F', material: 'metal',
    price: 399, currency: 'BRL', brand: 'Americanas',
    tags: ['pendente', 'industrial'],
    variants: [{ id: 'v1', name: 'Preto', color: '#2F4F4F', material: 'metal' }, { id: 'v2', name: 'Cobre', color: '#B87333', material: 'metal' }]
  },
  {
    id: 'lamp-4', name: 'Plafon LED', category: 'living-room', subcategory: 'lighting',
    width: 0.50, height: 0.15, depth: 0.50, defaultColor: '#FFFFFF', material: 'glass',
    price: 199, currency: 'BRL', brand: 'Leroy Merlin',
    tags: ['plafon', 'led'],
    variants: [{ id: 'v1', name: 'Branco', color: '#FFFFFF', material: 'vidro' }, { id: 'v2', name: 'Cristal', color: '#E0E0E0', material: 'vidro' }]
  },

  // Tapetes (3 itens)
  {
    id: 'rug-1', name: 'Tapete Persa Clássico', category: 'living-room', subcategory: 'rugs',
    width: 2.00, height: 0.02, depth: 3.00, defaultColor: '#8B0000', material: 'fabric',
    price: 1899, currency: 'BRL', brand: 'Tapetes Sao Carlos',
    tags: ['tapete', 'persa'],
    variants: [{ id: 'v1', name: 'Vermelho', color: '#8B0000', material: 'la' }, { id: 'v2', name: 'Azul', color: '#191970', material: 'la' }]
  },
  {
    id: 'rug-2', name: 'Tapete Moderno Geométrico', category: 'living-room', subcategory: 'rugs',
    width: 2.00, height: 0.02, depth: 2.50, defaultColor: '#808080', material: 'fabric',
    price: 699, currency: 'BRL', brand: 'Tok&Stok',
    tags: ['tapete', 'geometrico'],
    variants: [{ id: 'v1', name: 'Cinza', color: '#808080', material: 'poliester' }, { id: 'v2', name: 'Colorido', color: '#FF6347', material: 'poliester' }]
  },
  {
    id: 'rug-3', name: 'Tapete Shaggy Peludo', category: 'living-room', subcategory: 'rugs',
    width: 1.50, height: 0.05, depth: 2.00, defaultColor: '#FFFFFF', material: 'fabric',
    price: 499, currency: 'BRL', brand: 'Etna',
    tags: ['tapete', 'shaggy'],
    variants: [{ id: 'v1', name: 'Branco', color: '#FFFFFF', material: 'poliester' }, { id: 'v2', name: 'Cinza', color: '#808080', material: 'poliester' }]
  },

  // Decoração (5 itens)
  {
    id: 'decor-1', name: 'Vaso Decorativo Grande', category: 'living-room', subcategory: 'decor',
    width: 0.30, height: 0.80, depth: 0.30, defaultColor: '#FFFFFF', material: 'ceramic',
    price: 299, currency: 'BRL', brand: 'Tok&Stok',
    tags: ['vaso', 'decorativo'],
    variants: [{ id: 'v1', name: 'Branco', color: '#FFFFFF', material: 'ceramica' }, { id: 'v2', name: 'Terracota', color: '#E2725B', material: 'ceramica' }]
  },
  {
    id: 'decor-2', name: 'Quadro Abstrato', category: 'living-room', subcategory: 'decor',
    width: 1.00, height: 0.80, depth: 0.03, defaultColor: '#4169E1', material: 'canvas',
    price: 399, currency: 'BRL', brand: 'Oppa',
    tags: ['quadro', 'abstrato'],
    variants: [{ id: 'v1', name: 'Azul', color: '#4169E1', material: 'tela' }, { id: 'v2', name: 'Colorido', color: '#FF6347', material: 'tela' }]
  },
  {
    id: 'decor-3', name: 'Espelho Redondo', category: 'living-room', subcategory: 'decor',
    width: 0.80, height: 0.80, depth: 0.03, defaultColor: '#C0C0C0', material: 'glass',
    price: 499, currency: 'BRL', brand: 'Etna',
    tags: ['espelho', 'redondo'],
    variants: [{ id: 'v1', name: 'Prata', color: '#C0C0C0', material: 'vidro' }, { id: 'v2', name: 'Dourado', color: '#FFD700', material: 'vidro' }]
  },
  {
    id: 'decor-4', name: 'Relógio de Parede', category: 'living-room', subcategory: 'decor',
    width: 0.50, height: 0.50, depth: 0.05, defaultColor: '#1a1a1a', material: 'metal',
    price: 199, currency: 'BRL', brand: 'Americanas',
    tags: ['relogio', 'parede'],
    variants: [{ id: 'v1', name: 'Preto', color: '#1a1a1a', material: 'metal' }, { id: 'v2', name: 'Madeira', color: '#8B4513', material: 'madeira' }]
  },
  {
    id: 'decor-5', name: 'Plantas Artificiais', category: 'living-room', subcategory: 'decor',
    width: 0.40, height: 1.20, depth: 0.40, defaultColor: '#228B22', material: 'plastic',
    price: 299, currency: 'BRL', brand: 'Leroy Merlin',
    tags: ['plantas', 'artificiais'],
    variants: [{ id: 'v1', name: 'Verde', color: '#228B22', material: 'plastico' }]
  },
];
