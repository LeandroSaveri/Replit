// ============================================================
// CAMINHO ORIGINAL: src/features/editor/Editor.tsx
// VERSÃO ATUALIZADA:
// - Toolbar sem props viewMode/onViewModeChange
// - Botões flutuantes reposicionados para não sobrepor
// - Estrutura preparada para correção de zoom/pan
// ============================================================

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
  Undo, Redo, MoreHorizontal, X, Plus,
  Menu, ZoomIn, ZoomOut, Maximize,
} from 'lucide-react';
import { AddRoomModal } from './components/AddRoomModal';

// ── Overflow menu (top bar) ─────────────────────────────────
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
      className="absolute top-full right-0 mt-1.5 w-44 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden"
    >
      {items.map(({ icon: Icon, label, action }) => (
        <button
          key={label}
          onClick={() => { action(); onClose(); }}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Icon className="w-4 h-4 text-gray-500 dark:text-slate-400 flex-shrink-0" />
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

  useEffect(() => {
    if (openScanOnMount) {
      const timer = setTimeout(() => setShowScan(true), 400);
      return () => clearTimeout(timer);
    }
  }, [openScanOnMount]);

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

  useEffect(() => {
    if (!project) {
      try {
        createProject('Novo Projeto', { id: 'user-1', email: 'user@example.com', name: 'Usuário', role: 'owner' });
      } catch (error) {
        console.error('Failed to create project:', error);
      }
    }
  }, [project, createProject]);

  useEffect(() => {
    if (scenes.length === 0) { addScene('Planta 1'); return; }
    if (!currentSceneId && scenes.length > 0) setCurrentScene(scenes[0].id);
  }, [scenes, currentSceneId, addScene, setCurrentScene]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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

  // Handlers para zoom / centralizar / girar (eventos customizados)
  const handleZoom = (delta: number) => {
    window.dispatchEvent(new CustomEvent('editor:zoom', { detail: delta }));
    toast.info('Zoom', `Zoom ${delta > 0 ? '+' : '-'} disparado.`);
  };
  const handleCenter = () => {
    window.dispatchEvent(new CustomEvent('editor:center'));
    toast.info('Centralizar', 'Evento de centralização enviado.');
  };

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-slate-950 overflow-hidden">

      {/* ── TOP BAR (PRIMEIRA BARRA) ─────────────────────────── */}
      <header className="h-14 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-slate-800 flex items-center px-2 sm:px-3 gap-1.5 sm:gap-2 flex-shrink-0 z-30">

        {/* Left: Back + Logo + Menu button (mobile) */}
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 sm:p-2 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0"
              title="Voltar"
            >
              <ChevronLeft className="w-[18px] h-[18px]" />
            </button>
          )}
          <button
            onClick={() => setIsSidebarOpen(v => !v)}
            className="p-1.5 sm:p-2 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0 md:hidden"
            title="Menu lateral"
          >
            <Menu className="w-[18px] h-[18px]" />
          </button>
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
              <Box className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
            </div>
            <div className="min-w-0 hidden sm:block">
              <h1 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white truncate leading-tight">
                {project?.name || 'Novo Projeto'}
              </h1>
              <p className="text-[10px] text-gray-500 dark:text-slate-500 truncate leading-tight">
                {currentScene?.name || 'Planta Baixa'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-2" />

        {/* Right side actions */}
        <div className="flex items-center gap-0.5 sm:gap-1.5">

          {/* Undo / Redo */}
          <div className="flex items-center bg-gray-100 dark:bg-slate-800 rounded-lg p-0.5 flex-shrink-0">
            <button
              onClick={undo}
              disabled={!canUndo()}
              className="p-1 sm:p-1.5 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed rounded-md transition-colors"
              title="Desfazer (Ctrl+Z)"
            >
              <Undo className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button
              onClick={redo}
              disabled={!canRedo()}
              className="p-1 sm:p-1.5 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed rounded-md transition-colors"
              title="Refazer (Ctrl+Y)"
            >
              <Redo className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>

          {/* View mode switcher (2D/3D/Split) - APENAS NA PRIMEIRA BARRA */}
          <div className="flex items-center bg-gray-100 dark:bg-slate-800 rounded-lg p-0.5 flex-shrink-0">
            <button
              onClick={() => setViewMode('2d')}
              className={`px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-semibold rounded-md transition-all ${
                viewMode === '2d'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              2D
            </button>
            <button
              onClick={() => setViewMode('3d')}
              className={`px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-semibold rounded-md transition-all ${
                viewMode === '3d'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              3D
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-semibold rounded-md transition-all ${
                viewMode === 'split'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Split
            </button>
          </div>

          {/* Separador (apenas desktop) */}
          <div className="hidden sm:block w-px h-5 bg-gray-300 dark:bg-slate-700 mx-0.5" />

          {/* Scan button */}
          <button
            onClick={() => setShowScan(true)}
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 text-xs sm:text-sm bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-lg transition-all shadow-md hover:shadow-lg flex-shrink-0"
            title="Escanear Cômodo"
          >
            <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline text-xs font-medium">Scan</span>
          </button>

          {/* AI button */}
          <button
            onClick={() => setShowAIAssistant(true)}
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 text-xs sm:text-sm bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white rounded-lg transition-all shadow-md hover:shadow-lg flex-shrink-0"
            title="Assistente IA"
          >
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline text-xs font-medium">IA</span>
          </button>

          {/* Catalog (desktop) */}
          <button
            onClick={() => setIsCatalogOpen(true)}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-sm bg-blue-500 hover:bg-blue-400 text-white rounded-lg transition-all shadow-md hover:shadow-lg"
            title="Catálogo de Móveis"
          >
            <Box className="w-4 h-4" />
            <span className="text-xs font-medium">Catálogo</span>
          </button>

          {/* Overflow menu */}
          <div ref={overflowRef} className="relative flex-shrink-0">
            <button
              onClick={() => setShowOverflow(v => !v)}
              className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
                showOverflow
                  ? 'bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-white'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800'
              }`}
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

      {/* ── TOOLBAR (SEGUNDA BARRA) - SEM viewMode/onViewModeChange ── */}
      <div className="hidden md:block flex-shrink-0">
        <Toolbar
          onToggleSidebar={() => setIsSidebarOpen(v => !v)}
          isSidebarOpen={isSidebarOpen}
        />
      </div>

      {/* ── MAIN CONTENT ────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">

        {/* Desktop sidebar */}
        <div className="hidden md:block">
          <AnimatePresence initial={false}>
            {isSidebarOpen && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 288, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.18, ease: 'easeInOut' }}
                className="border-r border-gray-200 dark:border-slate-800 overflow-hidden flex-shrink-0"
              >
                <Sidebar
                  scenes={scenes}
                  currentSceneId={currentSceneId}
                  onSceneChange={setCurrentScene}
                  onAddScene={addScene}
                  stats={stats}
                  onOpenCatalog={() => setIsCatalogOpen(true)}
                  onShare={() => setShowShare(true)}
                  onSave={() => { saveProject(); toast.success('Projeto salvo', 'Salvo com sucesso.'); }}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile sidebar drawer */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 md:hidden"
              onClick={() => setIsSidebarOpen(false)}
            >
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
              <motion.div
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="absolute left-0 top-0 bottom-0 w-72 bg-white dark:bg-slate-900 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-end p-2">
                  <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-gray-500 dark:text-slate-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <Sidebar
                  scenes={scenes}
                  currentSceneId={currentSceneId}
                  onSceneChange={setCurrentScene}
                  onAddScene={addScene}
                  stats={stats}
                  onOpenCatalog={() => setIsCatalogOpen(true)}
                  onShare={() => setShowShare(true)}
                  onSave={() => { saveProject(); toast.success('Projeto salvo', 'Salvo com sucesso.'); }}
                  isMobile
                  onClose={() => setIsSidebarOpen(false)}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Canvas area */}
        <div className="flex-1 relative overflow-hidden">
          {viewMode === '2d' && <Canvas2D />}
          {viewMode === '3d' && <Canvas3D />}
          {viewMode === 'split' && (
            <div className="flex h-full flex-col sm:flex-row">
              <div className="flex-1 border-b sm:border-b-0 sm:border-r border-gray-200 dark:border-slate-800"><Canvas2D /></div>
              <div className="flex-1"><Canvas3D /></div>
            </div>
          )}

          {/* ── BOTÕES FLUTUANTES REPOSICIONADOS ── */}
          {/* Zoom controls - canto inferior esquerdo (acima do botão + em mobile) */}
          <div className="fixed bottom-20 left-4 z-20 flex flex-col gap-2 md:bottom-6">
            <button
              onClick={() => handleZoom(1)}
              className="w-11 h-11 rounded-full bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-white flex items-center justify-center shadow-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-all active:scale-95"
              title="Aproximar (+)"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleZoom(-1)}
              className="w-11 h-11 rounded-full bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-white flex items-center justify-center shadow-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-all active:scale-95"
              title="Afastar (-)"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <button
              onClick={handleCenter}
              className="w-11 h-11 rounded-full bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-white flex items-center justify-center shadow-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-all active:scale-95"
              title="Centralizar visualização"
            >
              <Maximize className="w-5 h-5" />
            </button>
          </div>

          {/* ── BOTÃO FLUTUANTE "+" - APENAS MOBILE ── */}
          <button
            onClick={() => setShowAddRoom(true)}
            className="fixed bottom-6 right-4 z-20 w-14 h-14 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xl hover:shadow-2xl transition-all active:scale-95 flex items-center justify-center md:hidden"
            title="Adicionar cômodo"
          >
            <Plus className="w-7 h-7" />
          </button>
        </div>

        {/* Properties Panel */}
        <AnimatePresence initial={false}>
          {selectedIds.length > 0 && <PropertiesPanel />}
        </AnimatePresence>
      </div>

      {/* ── STATUS BAR (apenas desktop) ── */}
      <div className="hidden md:block flex-shrink-0">
        <StatusBar viewMode={viewMode} tool={tool} stats={stats} selectedCount={selectedIds.length} />
      </div>

      {/* MODAIS (mantidos) */}
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
              className="w-full max-w-4xl h-[80vh] bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="h-12 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-2.5">
                  <Box className="w-5 h-5 text-blue-400" />
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">Catálogo de Móveis</h2>
                </div>
                <button onClick={() => setIsCatalogOpen(false)}
                  className="p-1.5 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                  <X className="w-[18px] h-[18px]" />
                </button>
              </div>
              <div className="h-[calc(80vh-52px)]"><FurnitureCatalog /></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAIAssistant && <AIAssistant onClose={() => setShowAIAssistant(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showScan && <ScanModal onClose={() => setShowScan(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showAddRoom && (
          <AddRoomModal
            onClose={() => setShowAddRoom(false)}
            onScan={() => { setShowAddRoom(false); setShowScan(true); }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showProjectManager && <ProjectManager onClose={() => setShowProjectManager(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showTemplates && (
          <TemplateGallery
            onSelectTemplate={(t) => { console.log('Template:', t); setShowTemplates(false); }}
            onClose={() => setShowTemplates(false)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showQuotation && <QuotationSystem onClose={() => setShowQuotation(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showTour && <VirtualTour onClose={() => setShowTour(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showShare && <ShareSystem onClose={() => setShowShare(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
      </AnimatePresence>
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
