// ============================================
// SIDEBAR - Painel Lateral Premium
// TEMA CLARO – Cores azuis, persistência de estado
// ============================================

import { useState, useEffect } from 'react';
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
  Calculator,
  SlidersHorizontal,
  Save,
  Share2,
} from 'lucide-react';
import { useEditorStore } from '@store/editorStore';
import type { Scene, Tool } from '@auriplan-types';

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
  onOpenProperties?: () => void;
  viewMode?: any;
  onViewModeChange?: (mode: any) => void;
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

// Tool groups - apenas para MOBILE
interface ToolGroup {
  label: string;
  tools: Array<{ id: Tool; icon: React.ElementType; label: string; shortcut: string }>;
}

const toolGroups: ToolGroup[] = [
  {
    label: 'Navegar',
    tools: [
      { id: 'select', icon: MousePointer2, label: 'Selecionar', shortcut: 'V' },
      { id: 'pan', icon: Hand, label: 'Mover', shortcut: 'H' },
    ],
  },
  {
    label: 'Desenhar',
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
    label: 'Anotar',
    tools: [
      { id: 'text', icon: Type, label: 'Texto', shortcut: 'T' },
      { id: 'measure', icon: Ruler, label: 'Medir', shortcut: 'M' },
    ],
  },
];

function LayerItem({ icon: Icon, name, count, visible, locked, onToggleVisibility, onToggleLock }: LayerItemProps) {
  return (
    <div className="flex items-center justify-between px-2 py-1.5 hover:bg-gray-100 rounded-lg group transition-colors">
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0">
          <Icon className="w-3.5 h-3.5 text-gray-500" />
        </div>
        <div className="min-w-0">
          <span className="text-xs text-gray-700 font-medium">{name}</span>
          <span className="text-[10px] text-gray-400 ml-1">({count})</span>
        </div>
      </div>
      <div className="flex items-center gap-0.5">
        <button
          onClick={onToggleVisibility}
          className={`p-1 rounded-md transition-all ${visible ? 'text-blue-500 hover:bg-blue-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
        >
          {visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={onToggleLock}
          className={`p-1 rounded-md transition-all ${locked ? 'text-amber-500 hover:bg-amber-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
        >
          {locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}

// Tool Button - Mobile Light Theme (compacto)
function MobileToolButton({ 
  tool, 
  isActive, 
  onClick,
}: { 
  tool: { id: Tool; icon: React.ElementType; label: string; shortcut: string }; 
  isActive: boolean; 
  onClick: () => void;
}) {
  const Icon = tool.icon;
  
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all duration-200 border ${
        isActive
          ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/30 border-transparent'
          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span className="text-[9px] font-medium leading-tight">{tool.label}</span>
    </motion.button>
  );
}

// Canvas Controls - Mobile Light Theme (SEM ZOOM)
function MobileCanvasControls({ onOpenProperties }: { onOpenProperties?: () => void }) {
  const { grid, toggleGrid, snap, toggleSnap, fitToView } = useEditorStore();

  return (
    <div className="space-y-2">
      <div className="flex gap-1.5">
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={toggleGrid}
          className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg font-medium text-xs transition-all border ${
            grid.visible 
              ? 'bg-blue-50 text-blue-600 border-blue-200' 
              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
          }`}
        >
          <Grid3X3 className="w-3.5 h-3.5" />
          Grade
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={toggleSnap}
          className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg font-medium text-xs transition-all border ${
            snap.enabled 
              ? 'bg-purple-50 text-purple-600 border-purple-200' 
              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
          }`}
        >
          <Magnet className="w-3.5 h-3.5" />
          Snap
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={fitToView}
          className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg font-medium text-xs transition-all border bg-white text-gray-600 border-gray-200 hover:border-gray-300"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          Ajustar
        </motion.button>
      </div>

      {/* Propriedades */}
      {onOpenProperties && (
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={onOpenProperties}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg font-medium text-xs transition-all border bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200 hover:border-blue-300"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Propriedades
        </motion.button>
      )}
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
  onOpenProperties,
}: SidebarProps) {
  const [activeTab, setActiveTab] = useState<'scenes' | 'layers' | 'stats'>('scenes');
  // Persistência do estado das seções
  const [expandedLayers, setExpandedLayers] = useState(() => {
    const saved = localStorage.getItem('sidebar_expandedLayers');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [expandedTools, setExpandedTools] = useState(() => {
    const saved = localStorage.getItem('sidebar_expandedTools');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [newSceneName, setNewSceneName] = useState('');
  const [showAddScene, setShowAddScene] = useState(false);

  useEffect(() => {
    localStorage.setItem('sidebar_expandedLayers', JSON.stringify(expandedLayers));
  }, [expandedLayers]);

  useEffect(() => {
    localStorage.setItem('sidebar_expandedTools', JSON.stringify(expandedTools));
  }, [expandedTools]);

  const currentScene = scenes.find(s => s.id === currentSceneId);
  const tool = useEditorStore(state => state.tool);
  const setTool = useEditorStore(state => state.setTool);

  const tabs = [
    { id: 'scenes' as const, label: 'Cenas', icon: Layers },
    { id: 'layers' as const, label: 'Camadas', icon: Box },
    { id: 'stats' as const, label: 'Estatísticas', icon: Calculator },
  ];

  const handleAddScene = () => {
    if (newSceneName.trim()) {
      onAddScene(newSceneName.trim());
      setNewSceneName('');
      setShowAddScene(false);
    }
  };

  const handleToolSelect = (toolId: Tool) => {
    setTool(toolId);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50" style={{ overscrollBehavior: 'contain' }}>
      <div className="flex border-b bg-white/95 backdrop-blur-sm border-gray-200">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1 py-2 text-xs font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? 'text-blue-600 border-b-2 border-blue-500 bg-blue-50/50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.label.slice(0, 4)}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto" style={{ overscrollBehavior: 'contain' }}>
        <AnimatePresence mode="wait">
          
          {activeTab === 'scenes' && (
            <motion.div
              key="scenes"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="p-3 space-y-3"
            >
              <div className="space-y-1.5">
                {scenes.map((scene) => (
                  <motion.div
                    key={scene.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { 
                      onSceneChange(scene.id); 
                      if (isMobile && onClose) onClose(); 
                    }}
                    className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all border ${
                      scene.id === currentSceneId
                        ? 'bg-gradient-to-r from-blue-500/10 to-blue-600/5 border-blue-300 shadow-sm'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${
                        scene.id === currentSceneId 
                          ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-md shadow-blue-500/25' 
                          : 'bg-gray-100'
                      }`}>
                        <Home className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xs font-semibold truncate ${
                          scene.id === currentSceneId ? 'text-blue-700' : 'text-gray-700'
                        }`}>
                          {scene.name}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          Andar {scene.level + 1} • {scene.height.toFixed(1)}m
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); }}
                      className="p-1 rounded-md opacity-0 group-hover:opacity-100 transition-all flex-shrink-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                ))}
              </div>

              <AnimatePresence>
                {showAddScene ? (
                  <motion.div 
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    className="p-2 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <input
                      type="text"
                      value={newSceneName}
                      onChange={(e) => setNewSceneName(e.target.value)}
                      placeholder="Nome da cena"
                      className="w-full h-8 px-2 bg-white border border-gray-200 rounded-md text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 mb-2"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddScene();
                        if (e.key === 'Escape') setShowAddScene(false);
                      }}
                    />
                    <div className="flex gap-1.5">
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={handleAddScene}
                        className="flex-1 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-md transition-colors"
                      >
                        Adicionar
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowAddScene(false)}
                        className="flex-1 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-medium rounded-md transition-colors"
                      >
                        Cancelar
                      </motion.button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowAddScene(true)}
                    className="w-full flex items-center justify-center gap-1.5 p-2 border-2 border-dashed border-gray-300 text-gray-500 hover:text-gray-700 hover:border-gray-400 hover:bg-gray-50 bg-white rounded-lg transition-all text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="font-medium">Adicionar Andar</span>
                  </motion.button>
                )}
              </AnimatePresence>

              {isMobile && (
                <>
                  <div className="h-px bg-gray-200 my-1" />
                  
                  <div className="space-y-2">
                    <button
                      onClick={() => setExpandedTools(!expandedTools)}
                      className="w-full flex items-center justify-between p-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      <span>Ferramentas de Desenho</span>
                      {expandedTools ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>

                    <AnimatePresence>
                      {expandedTools && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                          className="space-y-3 overflow-hidden"
                        >
                          {toolGroups.map((group) => (
                            <div key={group.label} className="space-y-1.5">
                              <p className="text-[9px] uppercase tracking-wider font-semibold px-1 text-gray-400">
                                {group.label}
                              </p>
                              <div className="grid grid-cols-2 gap-1.5">
                                {group.tools.map((t) => (
                                  <MobileToolButton
                                    key={t.id}
                                    tool={t}
                                    isActive={tool === t.id}
                                    onClick={() => handleToolSelect(t.id)}
                                  />
                                ))}
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="h-px bg-gray-200 my-1" />
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold px-1">Canvas</p>
                    <MobileCanvasControls onOpenProperties={onOpenProperties} />
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-2 pt-1">
                {onSave && (
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={onSave}
                    className="py-2 px-2 rounded-lg font-medium text-xs transition-all border bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200 hover:border-blue-300 flex items-center justify-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Salvar
                  </motion.button>
                )}
                {onShare && (
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={onShare}
                    className="py-2 px-2 rounded-lg font-medium text-xs transition-all border bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200 hover:border-blue-300 flex items-center justify-center gap-1.5"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Compartilhar
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'layers' && currentScene && (
            <motion.div
              key="layers"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="p-3 space-y-1.5"
            >
              <button
                onClick={() => setExpandedLayers(!expandedLayers)}
                className="w-full flex items-center justify-between p-2 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span>Camadas do Projeto</span>
                {expandedLayers ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>

              <AnimatePresence>
                {expandedLayers && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="space-y-0.5 overflow-hidden"
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

          {activeTab === 'stats' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="p-3 space-y-3"
            >
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200">
                  <p className="text-[10px] text-gray-500 mb-0.5">Área Total</p>
                  <p className="text-xl font-bold text-gray-900">{stats.area.toFixed(1)}</p>
                  <p className="text-[10px] text-gray-400">m²</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200">
                  <p className="text-[10px] text-gray-500 mb-0.5">Cômodos</p>
                  <p className="text-xl font-bold text-gray-900">{stats.rooms}</p>
                  <p className="text-[10px] text-gray-400">unidades</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200">
                  <p className="text-[10px] text-gray-500 mb-0.5">Paredes</p>
                  <p className="text-xl font-bold text-gray-900">{stats.walls}</p>
                  <p className="text-[10px] text-gray-400">segmentos</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200">
                  <p className="text-[10px] text-gray-500 mb-0.5">Móveis</p>
                  <p className="text-xl font-bold text-gray-900">{stats.furniture}</p>
                  <p className="text-[10px] text-gray-400">itens</p>
                </div>
              </div>

              <div className="p-3 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200">
                <h4 className="text-xs font-semibold text-gray-800 mb-3">Resumo do Projeto</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs py-1.5 border-b border-gray-200">
                    <span className="text-gray-500">Portas</span>
                    <span className="text-gray-900 font-medium">{stats.doors}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs py-1.5 border-b border-gray-200">
                    <span className="text-gray-500">Janelas</span>
                    <span className="text-gray-900 font-medium">{stats.windows}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs py-1.5">
                    <span className="text-gray-500">Andares</span>
                    <span className="text-gray-900 font-medium">{scenes.length}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
