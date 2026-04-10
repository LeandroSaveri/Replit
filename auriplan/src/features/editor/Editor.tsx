// ============================================
// EDITOR — Interface Premium SaaS
// Layout limpo, sem duplicatas, mobile-first
// ============================================

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEditorStore, selectProjectStats } from '@store/editorStore';
import { Toolbar } from './components/Toolbar';
import { Canvas2D } from './components/Canvas2D';
import { Canvas3D } from './components/Canvas3D';
import { PropertiesPanel } from './components/PropertiesPanel';
import { FurnitureCatalog } from './components/FurnitureCatalog';
import { Sidebar } from './components/Sidebar';
import { StatusBar } from './components/StatusBar';
import { AIAssistant } from './components/AIAssistant';
import { ProjectManager } from './components/ProjectManager';
import { TemplateGallery } from '@features/templates/TemplateGallery';
import { QuotationSystem } from '@features/quotation/QuotationSystem';
import { VirtualTour } from '@features/tour/VirtualTour';
import { ShareSystem } from '@features/share/ShareSystem';
import { CommandPalette } from '@components/ui/CommandPalette';
import { useToastSimple } from '@components/ui/SimpleToast';
import { SettingsPanel } from './components/SettingsPanel';
import { ScanModal } from './components/ScanModal';
import type { ViewMode } from '@auriplan-types';
import {
  ChevronLeft, Sparkles, Camera, Box, Save, Settings,
  LayoutTemplate, Calculator, View, Share2, FolderOpen,
  Undo, Redo, MoreHorizontal, X, Plus, RotateCw,
} from 'lucide-react';
import { AddRoomModal } from './components/AddRoomModal';

// ── Overflow menu ─────────────────────────────────────────────
interface OverflowMenuProps {
  onTemplates: () => void;
  onQuotation: () => void;
  onTour: () => void;
  onShare: () => void;
  onProjects: () => void;
  onSettings: () => void;
  onClose: () => void;
}

function OverflowMenu({
  onTemplates, onQuotation, onTour, onShare, onProjects, onSettings, onClose,
}: OverflowMenuProps) {
  const items = [
    { icon: LayoutTemplate, label: 'Templates',     action: onTemplates },
    { icon: Calculator,     label: 'Orçamento',     action: onQuotation },
    { icon: View,           label: 'Tour Virtual',   action: onTour },
    { icon: Share2,         label: 'Compartilhar',  action: onShare },
    { icon: FolderOpen,     label: 'Projetos',       action: onProjects },
    { icon: Settings,       label: 'Configurações',  action: onSettings },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -4 }}
      transition={{ duration: 0.12 }}
      className="absolute top-full right-0 mt-1.5 w-44 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl shadow-black/50 z-50 overflow-hidden"
    >
      {items.map(({ icon: Icon, label, action }) => (
        <button
          key={label}
          onClick={() => { action(); onClose(); }}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <Icon className="w-4 h-4 text-slate-400 flex-shrink-0" />
          {label}
        </button>
      ))}
    </motion.div>
  );
}

// ── Editor props ──────────────────────────────────────────────
interface EditorProps {
  onBack?: () => void;
  openScanOnMount?: boolean;
}

// ─────────────────────────────────────────────────────────────
export function Editor({ onBack, openScanOnMount }: EditorProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('2d');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showProjectManager, setShowProjectManager] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showQuotation, setShowQuotation] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showScan, setShowScan] = useState(false);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [showOverflow, setShowOverflow] = useState(false);
  const overflowRef = useRef<HTMLDivElement>(null);
  const toast = useToastSimple();

  // Auto-open Scan modal if requested from home page
  useEffect(() => {
    if (openScanOnMount) {
      const timer = setTimeout(() => setShowScan(true), 400);
      return () => clearTimeout(timer);
    }
    return;
  }, [openScanOnMount]);

  // Close overflow menu on outside click
  useEffect(() => {
    if (!showOverflow) return;
    const handler = (e: MouseEvent) => {
      if (overflowRef.current && !overflowRef.current.contains(e.target as Node)) {
        setShowOverflow(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showOverflow]);

  const {
    project, scenes, currentSceneId, createProject, saveProject,
    setCurrentScene, addScene, selectedIds, canUndo, canRedo, undo, redo,
    tool, setTool,
  } = useEditorStore();

  const stats = useEditorStore(selectProjectStats);

  // Initialize project if none exists
  useEffect(() => {
    if (!project) {
      try {
        createProject('Novo Projeto', { id: 'user-1', email: 'user@example.com', name: 'Usuário', role: 'owner' });
      } catch (error) {
        console.error('Failed to create project:', error);
      }
    }
  }, [project, createProject]);

  // Ensure active scene
  useEffect(() => {
    if (scenes.length === 0) { addScene('Planta 1'); return; }
    if (!currentSceneId && scenes.length > 0) setCurrentScene(scenes[0].id);
  }, [scenes, currentSceneId, addScene, setCurrentScene]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when typing in inputs
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'z': e.preventDefault(); e.shiftKey ? (canRedo() && redo()) : (canUndo() && undo()); break;
          case 'y': e.preventDefault(); canRedo() && redo(); break;
          case 's': e.preventDefault(); saveProject(); toast.success('Projeto salvo', 'Salvo com sucesso.'); break;
          case 'k': e.preventDefault(); setShowCommandPalette(v => !v); break;
        }
        return;
      }
      switch (e.key.toLowerCase()) {
        case 'v': setTool('select'); break;
        case 'h': setTool('pan'); break;
        case 'w': setTool('wall'); break;
        case 'r': setTool('room'); break;
        case 'd': setTool('door'); break;
        case 'j': setTool('window'); break;
        case 'm': setTool('measure'); break;
        case 'escape': setShowOverflow(false); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, undo, redo, saveProject, setTool]);

  const currentScene = scenes.find(s => s.id === currentSceneId);

  // ── RENDER ─────────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col bg-slate-950 overflow-hidden">

      {/* ── TOP BAR ─────────────────────────────────────────── */}
      <header className="h-14 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 flex items-center px-3 gap-2 flex-shrink-0 z-30">

        {/* Left: Back + Logo */}
        <div className="flex items-center gap-2 min-w-0">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0"
              title="Voltar"
            >
              <ChevronLeft className="w-[18px] h-[18px]" />
            </button>
          )}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Box className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="min-w-0 hidden sm:block">
              <h1 className="text-sm font-semibold text-white truncate leading-tight">
                {project?.name || 'Novo Projeto'}
              </h1>
              <p className="text-[10px] text-slate-500 truncate leading-tight">
                {currentScene?.name || 'Planta Baixa'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1" />

        {/* Center/Right: Actions */}
        <div className="flex items-center gap-1.5">

          {/* Undo / Redo */}
          <div className="hidden sm:flex items-center bg-slate-800 rounded-lg p-0.5">
            <button onClick={undo} disabled={!canUndo()}
              className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed rounded-md transition-colors"
              title="Desfazer (Ctrl+Z)">
              <Undo className="w-4 h-4" />
            </button>
            <button onClick={redo} disabled={!canRedo()}
              className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed rounded-md transition-colors"
              title="Refazer (Ctrl+Y)">
              <Redo className="w-4 h-4" />
            </button>
          </div>

          {/* Save (desktop) */}
          <button
            onClick={() => { saveProject(); toast.success('Projeto salvo', 'Todas as alterações foram salvas.'); }}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Salvar (Ctrl+S)"
          >
            <Save className="w-3.5 h-3.5" />
            <span className="hidden md:inline text-xs">Salvar</span>
          </button>

          <div className="hidden sm:block w-px h-5 bg-slate-700 mx-0.5" />

          {/* Scan button */}
          <button
            onClick={() => setShowScan(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-lg transition-all shadow-sm shadow-emerald-500/20"
            title="Escanear Cômodo"
          >
            <Camera className="w-4 h-4" />
            <span className="hidden sm:inline text-xs font-medium">Scan</span>
          </button>

          {/* AI button */}
          <button
            onClick={() => setShowAIAssistant(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white rounded-lg transition-all shadow-sm shadow-purple-500/20"
            title="Assistente IA"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline text-xs font-medium">IA</span>
          </button>

          {/* Catalog (desktop) */}
          <button
            onClick={() => setIsCatalogOpen(true)}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-sm bg-blue-500 hover:bg-blue-400 text-white rounded-lg transition-colors shadow-sm"
            title="Catálogo de Móveis"
          >
            <Box className="w-4 h-4" />
            <span className="text-xs font-medium">Catálogo</span>
          </button>

          {/* Overflow menu */}
          <div ref={overflowRef} className="relative">
            <button
              onClick={() => setShowOverflow(v => !v)}
              className={`p-2 rounded-lg transition-colors ${showOverflow ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
              title="Mais opções"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            <AnimatePresence>
              {showOverflow && (
                <OverflowMenu
                  onTemplates={() => setShowTemplates(true)}
                  onQuotation={() => setShowQuotation(true)}
                  onTour={() => setShowTour(true)}
                  onShare={() => setShowShare(true)}
                  onProjects={() => setShowProjectManager(true)}
                  onSettings={() => setShowSettings(true)}
                  onClose={() => setShowOverflow(false)}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* ── TOOLBAR ─────────────────────────────────────────── */}
      <Toolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onToggleSidebar={() => setIsSidebarOpen(v => !v)}
        isSidebarOpen={isSidebarOpen}
      />

      {/* ── MAIN CONTENT ────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* Sidebar (hidden on mobile by default) */}
        <AnimatePresence initial={false}>
          {isSidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 264, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.18, ease: 'easeInOut' }}
              className="border-r border-slate-800 bg-slate-900 overflow-hidden flex-shrink-0"
            >
              <Sidebar
                scenes={scenes}
                currentSceneId={currentSceneId}
                onSceneChange={setCurrentScene}
                onAddScene={addScene}
                stats={stats}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden">
          {viewMode === '2d' && <Canvas2D />}
          {viewMode === '3d' && <Canvas3D />}
          {viewMode === 'split' && (
            <div className="flex h-full">
              <div className="w-1/2 border-r border-slate-800"><Canvas2D /></div>
              <div className="w-1/2"><Canvas3D /></div>
            </div>
          )}

          {/* Mobile bottom action bar — MagicPlan style */}
          <div className="absolute bottom-0 left-0 right-0 md:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-t border-gray-200 dark:border-slate-800">
            <div className="flex items-stretch divide-x divide-gray-200 dark:divide-slate-800">
              <button
                onClick={() => setShowAddRoom(true)}
                className="flex-1 flex flex-col items-center justify-center gap-1 py-3 text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center shadow-md shadow-blue-500/30">
                  <Plus className="w-4 h-4 text-white" />
                </div>
                <span className="text-[11px] font-medium text-gray-700">Inserir</span>
              </button>
              <button
                onClick={() => setIsCatalogOpen(true)}
                className="flex-1 flex flex-col items-center justify-center gap-1 py-3 text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                <Box className="w-5 h-5 text-gray-600" />
                <span className="text-[11px] font-medium text-gray-700">Catálogo</span>
              </button>
              <button
                onClick={() => setShowAIAssistant(true)}
                className="flex-1 flex flex-col items-center justify-center gap-1 py-3 text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                <Sparkles className="w-5 h-5 text-purple-500" />
                <span className="text-[11px] font-medium text-gray-700">IA</span>
              </button>
              <button
                onClick={() => { saveProject(); toast.success('Salvo', 'Projeto salvo.'); }}
                className="flex-1 flex flex-col items-center justify-center gap-1 py-3 text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                <RotateCw className="w-5 h-5 text-gray-600" />
                <span className="text-[11px] font-medium text-gray-700">Girar</span>
              </button>
            </div>
            {/* iOS-style swipe hint */}
            <div className="pb-1 pt-0.5 text-center">
              <p className="text-[10px] text-gray-400">Deslize para cima ↑ ↺ para informações</p>
            </div>
          </div>
        </div>

        {/* Properties Panel */}
        <AnimatePresence initial={false}>
          {selectedIds.length > 0 && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 296, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.18, ease: 'easeInOut' }}
              className="border-l border-slate-800 bg-slate-900 overflow-hidden flex-shrink-0"
            >
              <PropertiesPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── STATUS BAR ──────────────────────────────────────── */}
      <div className="hidden md:block flex-shrink-0">
        <StatusBar viewMode={viewMode} tool={tool} stats={stats} selectedCount={selectedIds.length} />
      </div>

      {/* ═══════════════════════════════════════════════════════
          MODALS — all using portal-style fixed positioning
          ═══════════════════════════════════════════════════════ */}

      {/* Furniture Catalog */}
      <AnimatePresence>
        {isCatalogOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsCatalogOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 16 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-4xl h-[80vh] bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="h-12 border-b border-slate-800 flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-2.5">
                  <Box className="w-5 h-5 text-blue-400" />
                  <h2 className="text-base font-semibold text-white">Catálogo de Móveis</h2>
                </div>
                <button onClick={() => setIsCatalogOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                  <X className="w-[18px] h-[18px]" />
                </button>
              </div>
              <div className="h-[calc(80vh-52px)]"><FurnitureCatalog /></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Assistant */}
      <AnimatePresence>
        {showAIAssistant && <AIAssistant onClose={() => setShowAIAssistant(false)} />}
      </AnimatePresence>

      {/* Scan Modal */}
      <AnimatePresence>
        {showScan && <ScanModal onClose={() => setShowScan(false)} />}
      </AnimatePresence>

      {/* Add Room Modal */}
      <AnimatePresence>
        {showAddRoom && (
          <AddRoomModal
            onClose={() => setShowAddRoom(false)}
            onScan={() => { setShowAddRoom(false); setShowScan(true); }}
          />
        )}
      </AnimatePresence>

      {/* Project Manager */}
      <AnimatePresence>
        {showProjectManager && <ProjectManager onClose={() => setShowProjectManager(false)} />}
      </AnimatePresence>

      {/* Template Gallery */}
      <AnimatePresence>
        {showTemplates && (
          <TemplateGallery
            onSelectTemplate={(t) => { console.log('Template:', t); setShowTemplates(false); }}
            onClose={() => setShowTemplates(false)}
          />
        )}
      </AnimatePresence>

      {/* Quotation */}
      <AnimatePresence>
        {showQuotation && <QuotationSystem onClose={() => setShowQuotation(false)} />}
      </AnimatePresence>

      {/* Virtual Tour */}
      <AnimatePresence>
        {showTour && <VirtualTour onClose={() => setShowTour(false)} />}
      </AnimatePresence>

      {/* Share */}
      <AnimatePresence>
        {showShare && <ShareSystem onClose={() => setShowShare(false)} />}
      </AnimatePresence>

      {/* Settings */}
      <AnimatePresence>
        {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
      </AnimatePresence>

      {/* Command Palette */}
      <AnimatePresence>
        {showCommandPalette && (
          <CommandPalette
            onClose={() => setShowCommandPalette(false)}
            onAction={(id) => {
              const actions: Record<string, () => void> = {
                'save': () => { saveProject(); toast.success('Salvo', 'Projeto salvo.'); },
                'undo': () => canUndo() && undo(),
                'redo': () => canRedo() && redo(),
                'tool-select': () => setTool('select'),
                'tool-wall': () => setTool('wall'),
                'tool-door': () => setTool('door'),
                'tool-window': () => setTool('window'),
                'view-2d': () => setViewMode('2d'),
                'view-3d': () => setViewMode('3d'),
                'view-split': () => setViewMode('split'),
                'catalog': () => setIsCatalogOpen(true),
                'templates': () => setShowTemplates(true),
                'quotation': () => setShowQuotation(true),
                'tour': () => setShowTour(true),
                'share': () => setShowShare(true),
                'ai-assistant': () => setShowAIAssistant(true),
                'open-project': () => setShowProjectManager(true),
              };
              actions[id]?.();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
