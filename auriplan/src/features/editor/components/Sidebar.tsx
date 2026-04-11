// ============================================
// SIDEBAR - Painel Lateral Premium
// Mobile: Drawer overlay + Aba Ferramentas integrada
// Desktop: Slide lateral tradicional
// Transições: Estilo Apple/Google (spring physics)
// ============================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Layers, 
  Plus, 
  MoreVertical, 
  ChevronDown, 
  ChevronRight,
  Home,
  Box,
  Ruler,
  DoorOpen,
  AppWindow,
  Square,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  X,
  MousePointer2,
  Hand,
  BrickWall,
  Type,
  Grid3X3,
  Magnet,
  Maximize2,
  Split,
  Package,
  Layers as LayersIcon,
  Wrench,
} from 'lucide-react';
import { useEditorStore } from '@store/editorStore';
import type { Scene, ViewMode, Tool } from '@auriplan-types';

interface SidebarProps {
  scenes: Scene[];
  currentSceneId: string | null;
  onSceneChange: (id: string) => void;
  onAddScene: (name: string) => void;
  stats: {
    walls: number;
    rooms: number;
    doors: number;
    windows: number;
    furniture: number;
    area: number;
  };
  onOpenCatalog?: () => void;
  onShare?: () => void;
  onSave?: () => void;
  isMobile?: boolean;
  onClose?: () => void;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
}

interface LayerItemProps {
  icon: (props: { className?: string }) => JSX.Element;
  name: string;
  count: number;
  visible: boolean;
  locked: boolean;
  onToggleVisibility: () => void;
  onToggleLock: () => void;
}

// Tool groups definition (sync with Toolbar)
interface ToolGroup {
  label: string;
  tools: Array<{ id: Tool; icon: React.ElementType; label: string; shortcut: string }>;
}

const toolGroups: ToolGroup[] = [
  {
    label: 'Navegar',
    tools: [
      { id: 'select', icon: MousePointer2, label: 'Selecionar', shortcut: 'V' },
      { id: 'pan', icon: Hand, label: 'Mover Vista', shortcut: 'H' },
    ],
  },
  {
    label: 'Estrutura',
    tools: [
      { id: 'wall', icon: BrickWall, label: 'Parede', shortcut: 'W' },
      { id: 'room', icon: Square, label: 'Cômodo', shortcut: 'R' },
    ],
  },
  {
    label: 'Aberturas',
    tools: [
      { id: 'door', icon: DoorOpen, label: 'Porta', shortcut: 'D' },
      { id: 'window', icon: AppWindow, label: 'Janela', shortcut: 'J' },
    ],
  },
  {
    label: 'Anotação',
    tools: [
      { id: 'text', icon: Type, label: 'Texto', shortcut: 'T' },
      { id: 'measure', icon: Ruler, label: 'Medir', shortcut: 'M' },
    ],
  },
];

function LayerItem({ icon: Icon, name, count, visible, locked, onToggleVisibility, onToggleLock }: LayerItemProps) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5 hover:bg-slate-800/60 rounded-xl group transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-slate-400" />
        </div>
        <div className="min-w-0">
          <span className="text-sm text-slate-300 font-medium">{name}</span>
          <span className="text-xs text-slate-500 ml-1.5">({count})</span>
        </div>
      </div>
      <div className="flex items-center gap-0.5">
        <button
          onClick={onToggleVisibility}
          className={`p-2 rounded-lg transition-all ${visible ? 'text-blue-400 hover:bg-blue-500/10' : 'text-slate-600 hover:text-slate-400 hover:bg-slate-800'}`}
        >
          {visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>
        <button
          onClick={onToggleLock}
          className={`p-2 rounded-lg transition-all ${locked ? 'text-amber-400 hover:bg-amber-500/10' : 'text-slate-600 hover:text-slate-400 hover:bg-slate-800'}`}
        >
          {locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

// Tool Button Component - Premium Style
function ToolButton({ 
  tool, 
  isActive, 
  onClick,
  isMobile = false,
}: { 
  tool: { id: Tool; icon: React.ElementType; label: string; shortcut: string }; 
  isActive: boolean; 
  onClick: () => void;
  isMobile?: boolean;
}) {
  const Icon = tool.icon;
  
  if (isMobile) {
    return (
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={onClick}
        className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all duration-200 ${
          isActive
            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
            : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
        }`}
      >
        <Icon className="w-5 h-5" />
        <span className="text-[10px] font-medium leading-tight">{tool.label}</span>
      </motion.button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`relative group flex flex-col items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 ${
        isActive
          ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105'
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 hover:scale-105'
      }`}
      title={`${tool.label} (${tool.shortcut})`}
    >
      <Icon className="w-4 h-4" />
      <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap z-50 pointer-events-none border border-slate-700 shadow-xl">
        {tool.label}
        <span className="ml-1 text-slate-400">({tool.shortcut})</span>
      </span>
    </button>
  );
}

// View Mode Switcher Component
function ViewModeSwitcher({ 
  viewMode, 
  onViewModeChange,
  isMobile = false,
}: { 
  viewMode: ViewMode; 
  onViewModeChange: (mode: ViewMode) => void;
  isMobile?: boolean;
}) {
  const views = [
    { id: '2d' as ViewMode, icon: LayersIcon, label: '2D' },
    { id: '3d' as ViewMode, icon: Package, label: '3D' },
    { id: 'split' as ViewMode, icon: Split, label: 'Split' },
  ];

  if (isMobile) {
    return (
      <div className="flex gap-2">
        {views.map(({ id, icon: Icon, label }) => (
          <motion.button
            key={id}
            whileTap={{ scale: 0.95 }}
            onClick={() => onViewModeChange(id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${
              viewMode === id
                ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30'
                : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </motion.button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center bg-slate-800 rounded-xl p-0.5 shadow-inner">
      {views.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => onViewModeChange(id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs transition-all ${
            viewMode === id
              ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
          }`}
        >
          <Icon className="w-3.5 h-3.5" />
          {label}
        </button>
      ))}
    </div>
  );
}

// Canvas Controls Component
function CanvasControls({ isMobile = false }: { isMobile?: boolean }) {
  const { grid, toggleGrid, snap, toggleSnap, fitToView } = useEditorStore();
  
  const buttonClass = isMobile 
    ? "p-3 rounded-xl transition-all duration-200"
    : "p-2 rounded-lg transition-all duration-200";

  return (
    <div className={`flex ${isMobile ? 'gap-2' : 'gap-1'}`}>
      <button
        onClick={toggleGrid}
        className={`${buttonClass} ${
          grid.visible 
            ? 'text-blue-400 bg-blue-500/15 shadow-sm shadow-blue-500/20' 
            : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/80'
        }`}
        title={`Grade ${grid.visible ? 'ligada' : 'desligada'}`}
      >
        <Grid3X3 className={isMobile ? "w-5 h-5" : "w-4 h-4"} />
      </button>
      <button
        onClick={toggleSnap}
        className={`${buttonClass} ${
          snap.enabled 
            ? 'text-purple-400 bg-purple-500/15 shadow-sm shadow-purple-500/20' 
            : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/80'
        }`}
        title={`Snap ${snap.enabled ? 'ligado' : 'desligado'}`}
      >
        <Magnet className={isMobile ? "w-5 h-5" : "w-4 h-4"} />
      </button>
      <button
        onClick={fitToView}
        className={`${buttonClass} text-slate-500 hover:text-slate-300 hover:bg-slate-800/80`}
        title="Ajustar à tela"
      >
        <Maximize2 className={isMobile ? "w-5 h-5" : "w-4 h-4"} />
      </button>
    </div>
  );
}

export function Sidebar({ 
  scenes, 
  currentSceneId, 
  onSceneChange, 
  onAddScene, 
  stats,
  onOpenCatalog,
  onShare,
  onSave,
  isMobile,
  onClose,
  viewMode = '2d',
  onViewModeChange,
}: SidebarProps) {
  const [activeTab, setActiveTab] = useState<'scenes' | 'layers' | 'stats' | 'tools'>('scenes');
  const [expandedLayers, setExpandedLayers] = useState(true);
  const [newSceneName, setNewSceneName] = useState('');
  const [showAddScene, setShowAddScene] = useState(false);

  const currentScene = scenes.find(s => s.id === currentSceneId);
  const tool = useEditorStore(state => state.tool);
  const setTool = useEditorStore(state => state.setTool);

  // Tabs definition - inclui Ferramentas apenas em mobile
  const tabs = [
    { id: 'scenes' as const, label: 'Cenas', icon: Layers },
    { id: 'layers' as const, label: 'Camadas', icon: Box },
    { id: 'stats' as const, label: 'Estatísticas', icon: Ruler },
    ...(isMobile ? [{ id: 'tools' as const, label: 'Ferramentas', icon: Wrench }] : []),
  ];

  const handleAddScene = () => {
    if (newSceneName.trim()) {
      onAddScene(newSceneName.trim());
      setNewSceneName('');
      setShowAddScene(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-900">
      {/* Header com tabs - Estilo premium */}
      <div className="flex border-b border-slate-800 bg-slate-900/95 backdrop-blur-sm">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs sm:text-sm font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/5'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.label.slice(0, 4)}</span>
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto">
        <AnimatePresence mode="wait">
          {/* SCENES TAB */}
          {activeTab === 'scenes' && (
            <motion.div
              key="scenes"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="p-4 space-y-3"
            >
              {scenes.map((scene) => (
                <motion.div
                  key={scene.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { 
                    onSceneChange(scene.id); 
                    if (isMobile && onClose) onClose(); 
                  }}
                  className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                    scene.id === currentSceneId
                      ? 'bg-gradient-to-r from-blue-500/20 to-blue-600/10 border border-blue-500/30 shadow-lg shadow-blue-500/10'
                      : 'bg-slate-800/50 hover:bg-slate-800 border border-transparent hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      scene.id === currentSceneId 
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25' 
                        : 'bg-slate-700'
                    }`}>
                      <Home className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold truncate ${
                        scene.id === currentSceneId ? 'text-white' : 'text-slate-300'
                      }`}>
                        {scene.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        Andar {scene.level + 1} • {scene.height.toFixed(1)}m
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); }}
                    className="p-2 text-slate-500 hover:text-white hover:bg-slate-700 rounded-lg opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}

              {/* Add Scene */}
              <AnimatePresence>
                {showAddScene ? (
                  <motion.div 
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    className="p-3 bg-slate-800 rounded-xl border border-slate-700"
                  >
                    <input
                      type="text"
                      value={newSceneName}
                      onChange={(e) => setNewSceneName(e.target.value)}
                      placeholder="Nome da cena"
                      className="w-full h-10 px-3 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 mb-3"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddScene();
                        if (e.key === 'Escape') setShowAddScene(false);
                      }}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddScene}
                        className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        Adicionar
                      </button>
                      <button
                        onClick={() => setShowAddScene(false)}
                        className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-medium rounded-lg transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowAddScene(true)}
                    className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-700 rounded-xl text-slate-500 hover:text-slate-300 hover:border-slate-600 hover:bg-slate-800/50 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm font-medium">Adicionar Andar</span>
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* LAYERS TAB */}
          {activeTab === 'layers' && currentScene && (
            <motion.div
              key="layers"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="p-4 space-y-2"
            >
              <button
                onClick={() => setExpandedLayers(!expandedLayers)}
                className="w-full flex items-center justify-between p-3 text-sm font-medium text-slate-300 hover:bg-slate-800/50 rounded-xl transition-colors"
              >
                <span>Camadas do Projeto</span>
                {expandedLayers ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>

              <AnimatePresence>
                {expandedLayers && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="space-y-1 overflow-hidden"
                  >
                    <LayerItem
                      icon={Square}
                      name="Cômodos"
                      count={stats.rooms}
                      visible={true}
                      locked={false}
                      onToggleVisibility={() => {}}
                      onToggleLock={() => {}}
                    />
                    <LayerItem
                      icon={Square}
                      name="Paredes"
                      count={stats.walls}
                      visible={true}
                      locked={false}
                      onToggleVisibility={() => {}}
                      onToggleLock={() => {}}
                    />
                    <LayerItem
                      icon={DoorOpen}
                      name="Portas"
                      count={stats.doors}
                      visible={true}
                      locked={false}
                      onToggleVisibility={() => {}}
                      onToggleLock={() => {}}
                    />
                    <LayerItem
                      icon={AppWindow}
                      name="Janelas"
                      count={stats.windows}
                      visible={true}
                      locked={false}
                      onToggleVisibility={() => {}}
                      onToggleLock={() => {}}
                    />
                    <LayerItem
                      icon={Box}
                      name="Móveis"
                      count={stats.furniture}
                      visible={true}
                      locked={false}
                      onToggleVisibility={() => {}}
                      onToggleLock={() => {}}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* STATS TAB */}
          {activeTab === 'stats' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="p-4 space-y-4"
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-xl border border-slate-700/50">
                  <p className="text-xs text-slate-500 mb-1">Área Total</p>
                  <p className="text-2xl font-bold text-white">{stats.area.toFixed(1)}</p>
                  <p className="text-xs text-slate-500">m²</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-xl border border-slate-700/50">
                  <p className="text-xs text-slate-500 mb-1">Cômodos</p>
                  <p className="text-2xl font-bold text-white">{stats.rooms}</p>
                  <p className="text-xs text-slate-500">unidades</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-xl border border-slate-700/50">
                  <p className="text-xs text-slate-500 mb-1">Paredes</p>
                  <p className="text-2xl font-bold text-white">{stats.walls}</p>
                  <p className="text-xs text-slate-500">segmentos</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-xl border border-slate-700/50">
                  <p className="text-xs text-slate-500 mb-1">Móveis</p>
                  <p className="text-2xl font-bold text-white">{stats.furniture}</p>
                  <p className="text-xs text-slate-500">itens</p>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-xl border border-slate-700/50">
                <h4 className="text-sm font-semibold text-slate-300 mb-4">Resumo do Projeto</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm py-2 border-b border-slate-700/50">
                    <span className="text-slate-500">Portas</span>
                    <span className="text-white font-medium">{stats.doors}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm py-2 border-b border-slate-700/50">
                    <span className="text-slate-500">Janelas</span>
                    <span className="text-white font-medium">{stats.windows}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm py-2">
                    <span className="text-slate-500">Andares</span>
                    <span className="text-white font-medium">{scenes.length}</span>
                  </div>
                </div>
              </div>

              {/* Ações rápidas */}
              <div className="grid grid-cols-2 gap-3">
                {onSave && (
                  <button
                    onClick={onSave}
                    className="p-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-xl text-blue-400 text-sm font-medium transition-colors"
                  >
                    Salvar Projeto
                  </button>
                )}
                {onShare && (
                  <button
                    onClick={onShare}
                    className="p-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm font-medium transition-colors"
                  >
                    Compartilhar
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* TOOLS TAB - Apenas Mobile */}
          {activeTab === 'tools' && isMobile && (
            <motion.div
              key="tools"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="p-4 space-y-6"
            >
              {/* View Mode Section */}
              {onViewModeChange && (
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Modo de Vista</p>
                  <ViewModeSwitcher 
                    viewMode={viewMode} 
                    onViewModeChange={onViewModeChange}
                    isMobile={true}
                  />
                </div>
              )}

              {/* Tool Groups */}
              {toolGroups.map((group) => (
                <div key={group.label} className="space-y-3">
                  <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">{group.label}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {group.tools.map((t) => (
                      <ToolButton
                        key={t.id}
                        tool={t}
                        isActive={tool === t.id}
                        onClick={() => {
                          setTool(t.id);
                          if (onClose) onClose();
                        }}
                        isMobile={true}
                      />
                    ))}
                  </div>
                </div>
              ))}

              {/* Canvas Controls */}
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Canvas</p>
                <div className="flex justify-center p-3 bg-slate-800/50 rounded-xl">
                  <CanvasControls isMobile={true} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
