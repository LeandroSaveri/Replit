import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, FolderOpen, Save, Undo, Redo,
  Layout, Box, Sparkles, Settings, Calculator,
  View, Share2, LayoutTemplate, ChevronRight, Keyboard,
  FileText, Download, Layers, Palette,
} from 'lucide-react';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  shortcut?: string;
  category: string;
  action: () => void;
}

interface CommandPaletteProps {
  onClose: () => void;
  onAction?: (id: string) => void;
}

function useCommandItems(onAction?: (id: string) => void, onClose?: () => void): CommandItem[] {
  const fire = (id: string) => {
    onAction?.(id);
    onClose?.();
  };

  return [
    { id: 'new-project', label: 'Novo Projeto', icon: <Plus className="w-4 h-4" />, shortcut: 'Ctrl+N', category: 'Projeto', action: () => fire('new-project') },
    { id: 'open-project', label: 'Abrir Projeto', icon: <FolderOpen className="w-4 h-4" />, shortcut: 'Ctrl+O', category: 'Projeto', action: () => fire('open-project') },
    { id: 'save', label: 'Salvar Projeto', icon: <Save className="w-4 h-4" />, shortcut: 'Ctrl+S', category: 'Projeto', action: () => fire('save') },
    { id: 'export-pdf', label: 'Exportar PDF', description: 'Salvar planta como PDF', icon: <FileText className="w-4 h-4" />, category: 'Projeto', action: () => fire('export-pdf') },
    { id: 'export-img', label: 'Exportar Imagem', icon: <Download className="w-4 h-4" />, category: 'Projeto', action: () => fire('export-img') },
    { id: 'undo', label: 'Desfazer', icon: <Undo className="w-4 h-4" />, shortcut: 'Ctrl+Z', category: 'Edição', action: () => fire('undo') },
    { id: 'redo', label: 'Refazer', icon: <Redo className="w-4 h-4" />, shortcut: 'Ctrl+Y', category: 'Edição', action: () => fire('redo') },
    { id: 'tool-select', label: 'Ferramenta Selecionar', icon: <Layers className="w-4 h-4" />, shortcut: 'V', category: 'Ferramentas', action: () => fire('tool-select') },
    { id: 'tool-wall', label: 'Ferramenta Parede', icon: <Layout className="w-4 h-4" />, shortcut: 'W', category: 'Ferramentas', action: () => fire('tool-wall') },
    { id: 'tool-door', label: 'Ferramenta Porta', icon: <Box className="w-4 h-4" />, shortcut: 'D', category: 'Ferramentas', action: () => fire('tool-door') },
    { id: 'tool-window', label: 'Ferramenta Janela', icon: <Box className="w-4 h-4" />, shortcut: 'J', category: 'Ferramentas', action: () => fire('tool-window') },
    { id: 'view-2d', label: 'Vista 2D', icon: <Layout className="w-4 h-4" />, category: 'Visualização', action: () => fire('view-2d') },
    { id: 'view-3d', label: 'Vista 3D', icon: <Box className="w-4 h-4" />, category: 'Visualização', action: () => fire('view-3d') },
    { id: 'view-split', label: 'Vista Dividida 2D/3D', icon: <Layers className="w-4 h-4" />, category: 'Visualização', action: () => fire('view-split') },
    { id: 'tour', label: 'Tour Virtual 360°', icon: <View className="w-4 h-4" />, category: 'Visualização', action: () => fire('tour') },
    { id: 'catalog', label: 'Catálogo de Móveis', icon: <Box className="w-4 h-4" />, shortcut: 'Ctrl+F', category: 'Biblioteca', action: () => fire('catalog') },
    { id: 'materials', label: 'Materiais e Texturas', icon: <Palette className="w-4 h-4" />, category: 'Biblioteca', action: () => fire('materials') },
    { id: 'templates', label: 'Galeria de Templates', icon: <LayoutTemplate className="w-4 h-4" />, category: 'Biblioteca', action: () => fire('templates') },
    { id: 'quotation', label: 'Sistema de Orçamento', icon: <Calculator className="w-4 h-4" />, category: 'Premium', action: () => fire('quotation') },
    { id: 'share', label: 'Compartilhar Projeto', icon: <Share2 className="w-4 h-4" />, category: 'Premium', action: () => fire('share') },
    { id: 'ai-assistant', label: 'Assistente de IA', description: 'Sugestões inteligentes de design', icon: <Sparkles className="w-4 h-4" />, category: 'Premium', action: () => fire('ai-assistant') },
    { id: 'settings', label: 'Configurações', icon: <Settings className="w-4 h-4" />, category: 'Sistema', action: () => fire('settings') },
    { id: 'shortcuts', label: 'Atalhos do Teclado', icon: <Keyboard className="w-4 h-4" />, shortcut: '?', category: 'Sistema', action: () => fire('shortcuts') },
  ];
}

export function CommandPalette({ onClose, onAction }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const allCommands = useCommandItems(onAction, onClose);

  const filtered = query.trim()
    ? allCommands.filter(c =>
        c.label.toLowerCase().includes(query.toLowerCase()) ||
        c.description?.toLowerCase().includes(query.toLowerCase()) ||
        c.category.toLowerCase().includes(query.toLowerCase())
      )
    : allCommands;

  const grouped = filtered.reduce<Record<string, CommandItem[]>>((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {});

  const flatFiltered = Object.values(grouped).flat();

  useEffect(() => {
    setActiveIndex(0);
    inputRef.current?.focus();
  }, [query]);

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, flatFiltered.length - 1)); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, 0)); }
      if (e.key === 'Enter') { e.preventDefault(); flatFiltered[activeIndex]?.action(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [flatFiltered, activeIndex, onClose]);

  let flatIndex = 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[250] flex items-start justify-center pt-[12vh] px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: -12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -12, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar ações, ferramentas, comandos..."
            className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none text-sm"
            autoComplete="off"
          />
          <kbd className="px-2 py-1 text-xs text-slate-500 bg-slate-800 rounded border border-slate-700">Esc</kbd>
        </div>

        <div ref={listRef} className="max-h-[60vh] overflow-y-auto py-2">
          {flatFiltered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-500">
              <Search className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-sm">Nenhum resultado para "{query}"</p>
            </div>
          ) : (
            Object.entries(grouped).map(([category, items]) => (
              <div key={category} className="mb-1">
                <p className="px-4 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {category}
                </p>
                {items.map(item => {
                  const idx = flatIndex++;
                  const isActive = idx === activeIndex;
                  return (
                    <button
                      key={item.id}
                      data-index={idx}
                      onClick={item.action}
                      onMouseEnter={() => setActiveIndex(idx)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        isActive ? 'bg-blue-500/15 text-white' : 'text-slate-300 hover:bg-slate-800/60'
                      }`}
                    >
                      <span className={`shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-500'}`}>
                        {item.icon}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="text-sm font-medium">{item.label}</span>
                        {item.description && (
                          <span className="block text-xs text-slate-500 truncate">{item.description}</span>
                        )}
                      </span>
                      {item.shortcut && (
                        <kbd className="shrink-0 text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                          {item.shortcut}
                        </kbd>
                      )}
                      {isActive && <ChevronRight className="w-4 h-4 text-blue-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="border-t border-slate-800 px-4 py-2 flex items-center gap-4 text-xs text-slate-600">
          <span><kbd className="font-mono">↑↓</kbd> navegar</span>
          <span><kbd className="font-mono">Enter</kbd> executar</span>
          <span><kbd className="font-mono">Esc</kbd> fechar</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
