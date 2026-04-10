// ============================================
// QUOTATION SYSTEM - Sistema de Orçamento
// ============================================

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calculator, 
  DollarSign, 
  FileText, 
  Download, 
  Share2, 
  Plus, 
  Minus, 
  Trash2, 
  Edit3,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Package,
  Hammer,
  Paintbrush,
  Wrench,
  Search,
  Filter,
  Save,
  Send,
  Printer,
  Mail,
  Copy,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Info
} from 'lucide-react';
import { useEditorStore } from '@store/editorStore';

// ============================================
// TYPES
// ============================================
export interface QuotationItem {
  id: string;
  category: 'material' | 'labor' | 'service' | 'furniture';
  name: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount: number;
  tax: number;
}

export interface Quotation {
  id: string;
  name: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  projectAddress: string;
  date: string;
  validUntil: string;
  items: QuotationItem[];
  notes: string;
  terms: string;
  status: 'draft' | 'sent' | 'approved' | 'rejected';
}

// ============================================
// MOCK DATA
// ============================================
const materialDatabase = [
  { id: 'mat-1', name: 'Porcelanato 60x60', category: 'material', unit: 'm²', unitPrice: 85.00 },
  { id: 'mat-2', name: 'Laminado Madeira', category: 'material', unit: 'm²', unitPrice: 120.00 },
  { id: 'mat-3', name: 'Tinta Acrílica Premium', category: 'material', unit: 'L', unitPrice: 45.00 },
  { id: 'mat-4', name: 'Revestimento 3D', category: 'material', unit: 'm²', unitPrice: 150.00 },
  { id: 'mat-5', name: 'Granito Preto São Gabriel', category: 'material', unit: 'm²', unitPrice: 450.00 },
  { id: 'mat-6', name: 'Mármore Carrara', category: 'material', unit: 'm²', unitPrice: 850.00 },
  { id: 'mat-7', name: 'Cimento Queimado', category: 'material', unit: 'm²', unitPrice: 95.00 },
  { id: 'mat-8', name: 'Papel de Parede Importado', category: 'material', unit: 'm²', unitPrice: 180.00 },
];

const laborDatabase = [
  { id: 'labor-1', name: 'Mão de Obra - Pedreiro', category: 'labor', unit: 'dia', unitPrice: 280.00 },
  { id: 'labor-2', name: 'Mão de Obra - Pintor', category: 'labor', unit: 'dia', unitPrice: 220.00 },
  { id: 'labor-3', name: 'Mão de Obra - Eletricista', category: 'labor', unit: 'dia', unitPrice: 320.00 },
  { id: 'labor-4', name: 'Mão de Obra - Hidráulico', category: 'labor', unit: 'dia', unitPrice: 300.00 },
  { id: 'labor-5', name: 'Mão de Obra - Marceneiro', category: 'labor', unit: 'dia', unitPrice: 350.00 },
  { id: 'labor-6', name: 'Mão de Obra - Gesso', category: 'labor', unit: 'dia', unitPrice: 250.00 },
  { id: 'labor-7', name: 'Projeto Arquitetônico', category: 'labor', unit: 'un', unitPrice: 2500.00 },
  { id: 'labor-8', name: 'Projeto de Interiores', category: 'labor', unit: 'un', unitPrice: 3500.00 },
];

const furnitureDatabase = [
  { id: 'fur-1', name: 'Sofá 3 Lugares', category: 'furniture', unit: 'un', unitPrice: 2800.00 },
  { id: 'fur-2', name: 'Mesa de Jantar 6 Lugares', category: 'furniture', unit: 'un', unitPrice: 1800.00 },
  { id: 'fur-3', name: 'Cama King Size', category: 'furniture', unit: 'un', unitPrice: 3200.00 },
  { id: 'fur-4', name: 'Guarda-Roupa 6 Portas', category: 'furniture', unit: 'un', unitPrice: 2400.00 },
  { id: 'fur-5', name: 'Cozinha Completa', category: 'furniture', unit: 'un', unitPrice: 15000.00 },
  { id: 'fur-6', name: 'Conjunto de Banheiro', category: 'furniture', unit: 'un', unitPrice: 2800.00 },
  { id: 'fur-7', name: 'Escritório Completo', category: 'furniture', unit: 'un', unitPrice: 4500.00 },
  { id: 'fur-8', name: 'Iluminação Completa', category: 'furniture', unit: 'un', unitPrice: 3500.00 },
];

// ============================================
// COMPONENT
// ============================================
interface QuotationSystemProps {
  onClose: () => void;
}

export function QuotationSystem({ onClose }: QuotationSystemProps) {
  const { project } = useEditorStore();
  
  const [quotation, setQuotation] = useState<Quotation>({
    id: `QT-${Date.now()}`,
    name: project?.name ? `Orçamento - ${project.name}` : 'Novo Orçamento',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    projectAddress: '',
    date: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    items: [],
    notes: '',
    terms: 'Validade do orçamento: 30 dias.\nCondições de pagamento: 30% entrada, 70% na entrega.\nPrazo de execução conforme cronograma aprovado.',
    status: 'draft',
  });

  const [showAddItem, setShowAddItem] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState<string[]>(['items']);

  // Calculations
  const calculations = useMemo(() => {
    const subtotal = quotation.items.reduce((sum, item) => {
      const itemTotal = item.quantity * item.unitPrice;
      const discountAmount = itemTotal * (item.discount / 100);
      return sum + itemTotal - discountAmount;
    }, 0);

    const taxAmount = quotation.items.reduce((sum, item) => {
      const itemTotal = item.quantity * item.unitPrice;
      const discountAmount = itemTotal * (item.discount / 100);
      const taxableAmount = itemTotal - discountAmount;
      return sum + (taxableAmount * (item.tax / 100));
    }, 0);

    const total = subtotal + taxAmount;

    return { subtotal, taxAmount, total };
  }, [quotation.items]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const addItem = (item: typeof materialDatabase[0]) => {
    const newItem: QuotationItem = {
      id: `item-${Date.now()}`,
      category: item.category as any,
      name: item.name,
      description: '',
      quantity: 1,
      unit: item.unit,
      unitPrice: item.unitPrice,
      discount: 0,
      tax: 0,
    };
    
    setQuotation(prev => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
    setShowAddItem(false);
  };

  const updateItem = (id: string, updates: Partial<QuotationItem>) => {
    setQuotation(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.id === id ? { ...item, ...updates } : item
      ),
    }));
  };

  const removeItem = (id: string) => {
    setQuotation(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id),
    }));
  };

  const allItems = [...materialDatabase, ...laborDatabase, ...furnitureDatabase];
  
  const filteredItems = allItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const itemsByCategory = {
    material: quotation.items.filter(i => i.category === 'material'),
    labor: quotation.items.filter(i => i.category === 'labor'),
    furniture: quotation.items.filter(i => i.category === 'furniture'),
    service: quotation.items.filter(i => i.category === 'service'),
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-6xl h-[90vh] bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/50">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
              <Calculator className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Orçamento</h2>
              <p className="text-sm text-slate-400">{quotation.id}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddItem(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Adicionar Item
            </button>
            <button
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Salvar"
            >
              <Save className="w-5 h-5" />
            </button>
            <button
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Exportar PDF"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Compartilhar"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Form */}
          <div className="w-80 border-r border-slate-800 overflow-y-auto p-6">
            {/* Client Info */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                Informações do Cliente
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Nome</label>
                  <input
                    type="text"
                    value={quotation.clientName}
                    onChange={(e) => setQuotation(prev => ({ ...prev, clientName: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                    placeholder="Nome do cliente"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={quotation.clientEmail}
                    onChange={(e) => setQuotation(prev => ({ ...prev, clientEmail: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Telefone</label>
                  <input
                    type="tel"
                    value={quotation.clientPhone}
                    onChange={(e) => setQuotation(prev => ({ ...prev, clientPhone: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>
            </div>

            {/* Project Info */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                Informações do Projeto
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Endereço</label>
                  <textarea
                    value={quotation.projectAddress}
                    onChange={(e) => setQuotation(prev => ({ ...prev, projectAddress: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
                    rows={3}
                    placeholder="Endereço completo do projeto"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Data</label>
                    <input
                      type="date"
                      value={quotation.date}
                      onChange={(e) => setQuotation(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Válido até</label>
                    <input
                      type="date"
                      value={quotation.validUntil}
                      onChange={(e) => setQuotation(prev => ({ ...prev, validUntil: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                Observações
              </h3>
              <textarea
                value={quotation.notes}
                onChange={(e) => setQuotation(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
                rows={4}
                placeholder="Observações adicionais..."
              />
            </div>

            {/* Terms */}
            <div>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                Termos e Condições
              </h3>
              <textarea
                value={quotation.terms}
                onChange={(e) => setQuotation(prev => ({ ...prev, terms: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
                rows={6}
              />
            </div>
          </div>

          {/* Right Panel - Items */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-6">
              {quotation.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500">
                  <Calculator className="w-16 h-16 mb-4 opacity-50" />
                  <p className="text-lg">Nenhum item adicionado</p>
                  <p className="text-sm">Clique em "Adicionar Item" para começar</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Materials Section */}
                  {itemsByCategory.material.length > 0 && (
                    <div className="border border-slate-700 rounded-xl overflow-hidden">
                      <button
                        onClick={() => toggleSection('materials')}
                        className="w-full flex items-center justify-between p-4 bg-slate-800/50 hover:bg-slate-800 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Package className="w-5 h-5 text-blue-400" />
                          <span className="font-semibold text-white">Materiais</span>
                          <span className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded-full">
                            {itemsByCategory.material.length}
                          </span>
                        </div>
                        {expandedSections.includes('materials') ? (
                          <ChevronUp className="w-5 h-5 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-400" />
                        )}
                      </button>
                      
                      <AnimatePresence>
                        {expandedSections.includes('materials') && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="p-4 space-y-3">
                              {itemsByCategory.material.map(item => (
                                <QuotationItemRow
                                  key={item.id}
                                  item={item}
                                  onUpdate={(updates) => updateItem(item.id, updates)}
                                  onRemove={() => removeItem(item.id)}
                                />
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Labor Section */}
                  {itemsByCategory.labor.length > 0 && (
                    <div className="border border-slate-700 rounded-xl overflow-hidden">
                      <button
                        onClick={() => toggleSection('labor')}
                        className="w-full flex items-center justify-between p-4 bg-slate-800/50 hover:bg-slate-800 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Hammer className="w-5 h-5 text-orange-400" />
                          <span className="font-semibold text-white">Mão de Obra</span>
                          <span className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded-full">
                            {itemsByCategory.labor.length}
                          </span>
                        </div>
                        {expandedSections.includes('labor') ? (
                          <ChevronUp className="w-5 h-5 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-400" />
                        )}
                      </button>
                      
                      <AnimatePresence>
                        {expandedSections.includes('labor') && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="p-4 space-y-3">
                              {itemsByCategory.labor.map(item => (
                                <QuotationItemRow
                                  key={item.id}
                                  item={item}
                                  onUpdate={(updates) => updateItem(item.id, updates)}
                                  onRemove={() => removeItem(item.id)}
                                />
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Furniture Section */}
                  {itemsByCategory.furniture.length > 0 && (
                    <div className="border border-slate-700 rounded-xl overflow-hidden">
                      <button
                        onClick={() => toggleSection('furniture')}
                        className="w-full flex items-center justify-between p-4 bg-slate-800/50 hover:bg-slate-800 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Package className="w-5 h-5 text-purple-400" />
                          <span className="font-semibold text-white">Móveis</span>
                          <span className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded-full">
                            {itemsByCategory.furniture.length}
                          </span>
                        </div>
                        {expandedSections.includes('furniture') ? (
                          <ChevronUp className="w-5 h-5 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-400" />
                        )}
                      </button>
                      
                      <AnimatePresence>
                        {expandedSections.includes('furniture') && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="p-4 space-y-3">
                              {itemsByCategory.furniture.map(item => (
                                <QuotationItemRow
                                  key={item.id}
                                  item={item}
                                  onUpdate={(updates) => updateItem(item.id, updates)}
                                  onRemove={() => removeItem(item.id)}
                                />
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="border-t border-slate-800 p-6 bg-slate-900/50">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-400">Subtotal</span>
                <span className="text-white">{formatCurrency(calculations.subtotal)}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-400">Impostos</span>
                <span className="text-white">{formatCurrency(calculations.taxAmount)}</span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-slate-700">
                <span className="text-lg font-semibold text-white">Total</span>
                <span className="text-2xl font-bold text-green-400">
                  {formatCurrency(calculations.total)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Add Item Modal */}
      <AnimatePresence>
        {showAddItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
            onClick={() => setShowAddItem(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-2xl bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="h-14 border-b border-slate-800 flex items-center justify-between px-6">
                <h3 className="text-lg font-semibold text-white">Adicionar Item</h3>
                <button
                  onClick={() => setShowAddItem(false)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                {/* Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Buscar itens..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Category Filter */}
                <div className="flex gap-2 mb-4">
                  {[
                    { id: 'all', name: 'Todos', icon: Package },
                    { id: 'material', name: 'Materiais', icon: Paintbrush },
                    { id: 'labor', name: 'Mão de Obra', icon: Hammer },
                    { id: 'furniture', name: 'Móveis', icon: Package },
                  ].map(cat => {
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
                          selectedCategory === cat.id
                            ? 'bg-blue-500 text-white'
                            : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {cat.name}
                      </button>
                    );
                  })}
                </div>

                {/* Items List */}
                <div className="max-h-80 overflow-y-auto space-y-2">
                  {filteredItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => addItem(item)}
                      className="w-full flex items-center justify-between p-4 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors text-left"
                    >
                      <div>
                        <p className="font-medium text-white">{item.name}</p>
                        <p className="text-sm text-slate-400">
                          {item.category === 'material' && 'Material'}
                          {item.category === 'labor' && 'Mão de Obra'}
                          {item.category === 'furniture' && 'Móvel'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-white">
                          {formatCurrency(item.unitPrice)}
                        </p>
                        <p className="text-sm text-slate-400">/{item.unit}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// QUOTATION ITEM ROW
// ============================================
interface QuotationItemRowProps {
  item: QuotationItem;
  onUpdate: (updates: Partial<QuotationItem>) => void;
  onRemove: () => void;
}

function QuotationItemRow({ item, onUpdate, onRemove }: QuotationItemRowProps) {
  const itemTotal = item.quantity * item.unitPrice;
  const discountAmount = itemTotal * (item.discount / 100);
  const taxableAmount = itemTotal - discountAmount;
  const taxAmount = taxableAmount * (item.tax / 100);
  const finalTotal = taxableAmount + taxAmount;

  return (
    <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-medium text-white">{item.name}</p>
          <input
            type="text"
            value={item.description}
            onChange={(e) => onUpdate({ description: e.target.value })}
            className="mt-1 w-full bg-transparent text-sm text-slate-400 focus:outline-none focus:text-white"
            placeholder="Adicionar descrição..."
          />
        </div>
        <button
          onClick={onRemove}
          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-6 gap-3 items-end">
        {/* Quantity */}
        <div>
          <label className="block text-xs text-slate-500 mb-1">Qtd</label>
          <div className="flex items-center">
            <button
              onClick={() => onUpdate({ quantity: Math.max(0.1, item.quantity - 1) })}
              className="p-2 bg-slate-700 hover:bg-slate-600 rounded-l-lg transition-colors"
            >
              <Minus className="w-3 h-3" />
            </button>
            <input
              type="number"
              value={item.quantity}
              onChange={(e) => onUpdate({ quantity: parseFloat(e.target.value) || 0 })}
              className="w-16 px-2 py-2 bg-slate-700 text-center text-white text-sm focus:outline-none"
              min="0.1"
              step="0.1"
            />
            <button
              onClick={() => onUpdate({ quantity: item.quantity + 1 })}
              className="p-2 bg-slate-700 hover:bg-slate-600 rounded-r-lg transition-colors"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Unit */}
        <div>
          <label className="block text-xs text-slate-500 mb-1">Unidade</label>
          <span className="px-3 py-2 bg-slate-700 rounded-lg text-white text-sm block">
            {item.unit}
          </span>
        </div>

        {/* Unit Price */}
        <div>
          <label className="block text-xs text-slate-500 mb-1">Preço Unit.</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">R$</span>
            <input
              type="number"
              value={item.unitPrice}
              onChange={(e) => onUpdate({ unitPrice: parseFloat(e.target.value) || 0 })}
              className="w-full pl-10 pr-3 py-2 bg-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              step="0.01"
            />
          </div>
        </div>

        {/* Discount */}
        <div>
          <label className="block text-xs text-slate-500 mb-1">Desconto %</label>
          <div className="relative">
            <input
              type="number"
              value={item.discount}
              onChange={(e) => onUpdate({ discount: Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)) })}
              className="w-full px-3 py-2 bg-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              max="100"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">%</span>
          </div>
        </div>

        {/* Tax */}
        <div>
          <label className="block text-xs text-slate-500 mb-1">Imposto %</label>
          <div className="relative">
            <input
              type="number"
              value={item.tax}
              onChange={(e) => onUpdate({ tax: Math.max(0, parseFloat(e.target.value) || 0) })}
              className="w-full px-3 py-2 bg-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">%</span>
          </div>
        </div>

        {/* Total */}
        <div className="text-right">
          <label className="block text-xs text-slate-500 mb-1">Total</label>
          <p className="text-lg font-semibold text-green-400">
            {formatCurrency(finalTotal)}
          </p>
          {item.discount > 0 && (
            <p className="text-xs text-slate-500 line-through">
              {formatCurrency(itemTotal)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// UTILS
// ============================================
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export default QuotationSystem;
