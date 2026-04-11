// ============================================
// SIDEBAR - Painel Lateral Premium
// Mobile: Drawer CLARO (light theme) com transições Apple/Google
// Desktop: Slide lateral escuro tradicional
// Ferramentas: Integradas na aba CENAS, abaixo de "Adicionar Andar"
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
  Wrench,
  Calculator,
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

// Tool groups definition
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
    <div className="flex items-center justify-between px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-slate-800/60 rounded-xl group transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-gray-500 dark:text-slate-400" />
        </div>
        <div className="min-w-0">
          <span className="text-sm text-gray-700 dark:text-slate-300 font-medium">{name}</span>
          <span className="text-xs text-gray-400 dark:text-slate-500 ml-1.5">({count})</span>
        </div>
      </div>
      <div className="flex items-center gap-0.5">
        <button
          onClick={onToggleVisibility}
          className={`p-2 rounded-lg transition-all ${visible ? 'text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-800'}`}
        >
          {visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>
        <button
          onClick={onToggleLock}
          className={`p-2 rounded-lg transition-all ${locked ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-800'}`}
        >
          {locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

// Tool Button Component - Mobile Light Theme
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
      className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all duration-200 border ${
        isActive
          ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 border-transparent'
          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="text-[10px] font-medium leading-tight">{tool.label}</span>
    </motion.button>
  );
}

// Desktop Tool Button - Dark Theme
function DesktopToolButton({ 
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

// Canvas Controls - Mobile Light Theme
function MobileCanvasControls() {
  const { grid, toggleGrid, snap, toggleSnap, fitToView } = useEditorStore();

  return (
    <div className="flex gap-2">
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={toggleGrid}
        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm transition-all border ${
          grid.visible 
            ? 'bg-blue-50 text-blue-600 border-blue-200' 
            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
        }`}
      >
        <Grid3X3 className="w-4 h-4" />
        Grade
      </motion.button>
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={toggleSnap}
        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm transition-all border ${
          snap.enabled 
            ? 'bg-purple-50 text-purple-600 border-purple-200' 
            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
        }`}
      >
        <Magnet className="w-4 h-4" />
        Snap
      </motion.button>
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={fitToView}
        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm transition-all border bg-white text-gray-600 border-gray-200 hover:border-gray-300"
      >
        <Maximize2 className="w-4 h-4" />
        Ajustar
      </motion.button>
    </div>
  );
}

// Desktop Canvas Controls - Dark Theme
function DesktopCanvasControls() {
  const { grid, toggleGrid, snap, toggleSnap, fitToView } = useEditorStore();

  return (
    <div className="flex gap-1">
      <button
        onClick={toggleGrid}
        className={`p-2 rounded-lg transition-all duration-200 ${
          grid.visible 
            ? 'text-blue-400 bg-blue-500/15 shadow-sm shadow-blue-500/20' 
            : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/80'
        }`}
        title={`Grade ${grid.visible ? 'ligada' : 'desligada'}`}
      >
        <Grid3X3 className="w-4 h-4" />
      </button>
      <button
        onClick={toggleSnap}
        className={`p-2 rounded-lg transition-all duration-200 ${
          snap.enabled 
            ? 'text-purple-400 bg-purple-500/15 shadow-sm shadow-purple-500/20' 
            : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/80'
        }`}
        title={`Snap ${snap.enabled ? 'ligado' : 'desligado'}`}
      >
        <Magnet className="w-4 h-4" />
      </button>
      <button
        onClick={fitToView}
        className="p-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800/80 transition-all duration-200"
        title="Ajustar à tela"
      >
        <Maximize2 className="w-4 h-4" />
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
}: SidebarProps) {
  const [activeTab, setActiveTab] = useState<'scenes' | 'layers' | 'stats'>('scenes');
  const [expandedLayers, setExpandedLayers] = useState(true);
  const [expandedTools, setExpandedTools] = useState(true);
  const [newSceneName, setNewSceneName] = useState('');
  const [showAddScene, setShowAddScene] = useState(false);

  const currentScene = scenes.find(s => s.id === currentSceneId);
  const tool = useEditorStore(state => state.tool);
  const setTool = useEditorStore(state => state.setTool);

  // Tabs definition - apenas 3 abas (sem aba Ferramentas separada)
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

  // Função para selecionar ferramenta com feedback
  const handleToolSelect = (toolId: Tool) => {
    setTool(toolId);
    // Não fechar o menu para permitir múltiplas seleções
  };

  // Renderiza o conteúdo da aba Cenas (com ferramentas incluídas)
  const renderScenesTab = () => (
    <motion.div
      key="scenes"
      initial={{ opacity: 0, x: isMobile ? 20 : -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: isMobile ? -20 : 20 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="p-4 space-y-4"
    >
      {/* Lista de Cenas */}
      <div className="space-y-2">
        {scenes.map((scene) => (
          <motion.div
            key={scene.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => { 
              onSceneChange(scene.id); 
              if (isMobile && onClose) onClose(); 
            }}
            className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${
              scene.id === currentSceneId
                ? isMobile 
                  ? 'bg-gradient-to-r from-blue-500/10 to-blue-600/5 border-blue-300 shadow-sm'
                  : 'bg-gradient-to-r from-blue-500/20 to-blue-600/10 border-blue-500/30 shadow-lg shadow-blue-500/10'
                : isMobile
                  ? 'bg-white border-gray-200 hover:border-gray-300'
                  : 'bg-slate-800/50 border-transparent hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                scene.id === currentSceneId 
                  ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25' 
                  : isMobile ? 'bg-gray-100' : 'bg-slate-700'
              }`}>
                <Home className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className={`text-sm font-semibold truncate ${
                  scene.id === currentSceneId 
                    ? isMobile ? 'text-blue-700' : 'text-white'
                    : isMobile ? 'text-gray-700' : 'text-slate-300'
                }`}>
                  {scene.name}
                </p>
                <p className={`text-xs ${isMobile ? 'text-gray-400' : 'text-slate-500'}`}>
                  Andar {scene.level + 1} • {scene.height.toFixed(1)}m
                </p>
              </div>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); }}
              className={`p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all flex-shrink-0 ${
                isMobile ? 'text-gray-400 hover:text-gray-600 hover:bg-gray-100' : 'text-slate-500 hover:text-white hover:bg-slate-700'
              }`}
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </div>

      {/* Adicionar Andar */}
      <AnimatePresence>
        {showAddScene ? (
          <motion.div 
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className={`p-3 rounded-xl border ${
              isMobile ? 'bg-gray-50 border-gray-200' : 'bg-slate-800 border-slate-700'
            }`}
          >
            <input
              type="text"
              value={newSceneName}
              onChange={(e) => setNewSceneName(e.target.value)}
              placeholder="Nome da cena"
              className={`w-full h-10 px-3 border rounded-lg text-sm focus:outline-none focus:border-blue-500 mb-3 ${
                isMobile 
                  ? 'bg-white border-gray-200 text-gray-900 placeholder-gray-400' 
                  : 'bg-slate-900 border-slate-700 text-white placeholder-slate-500'
              }`}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddScene();
                if (e.key === 'Escape') setShowAddScene(false);
              }}
            />
            <div className="flex gap-2">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleAddScene}
                className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Adicionar
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowAddScene(false)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isMobile
                    ? 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                }`}
              >
                Cancelar
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowAddScene(true)}
            className={`w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-xl transition-all ${
              isMobile
                ? 'border-gray-300 text-gray-500 hover:text-gray-700 hover:border-gray-400 hover:bg-gray-50 bg-white'
                : 'border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-600 hover:bg-slate-800/50'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">Adicionar Andar</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* SEPARADOR */}
      <div className={`h-px ${isMobile ? 'bg-gray-200' : 'bg-slate-800'} my-2`} />

      {/* FERRAMENTAS - SEMPRE VISÍVEIS NA ABA CENAS */}
      <div className="space-y-3">
        <button
          onClick={() => setExpandedTools(!expandedTools)}
          className={`w-full flex items-center justify-between p-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
            isMobile ? 'text-gray-500 hover:text-gray-700' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <span>Ferramentas de Desenho</span>
          {expandedTools ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        <AnimatePresence>
          {expandedTools && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="space-y-4 overflow-hidden"
            >
              {toolGroups.map((group) => (
                <div key={group.label} className="space-y-2">
                  <p className={`text-[10px] uppercase tracking-wider font-semibold px-1 ${
                    isMobile ? 'text-gray-400' : 'text-slate-500'
                  }`}>
                    {group.label}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {group.tools.map((t) => (
                      isMobile ? (
                        <MobileToolButton
                          key={t.id}
                          tool={t}
                          isActive={tool === t.id}
                          onClick={() => handleToolSelect(t.id)}
                        />
                      ) : (
                        <div key={t.id} className="flex justify-center">
                          <DesktopToolButton
                            tool={t}
                            isActive={tool === t.id}
                            onClick={() => handleToolSelect(t.id)}
                          />
                        </div>
                      )
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Canvas Controls - Apenas Mobile (no desktop fica na Toolbar) */}
      {isMobile && (
        <>
          <div className="h-px bg-gray-200 my-2" />
          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold px-1">Canvas</p>
            <MobileCanvasControls />
          </div>
        </>
      )}
    </motion.div>
  );

  // Renderiza o conteúdo da aba Camadas
  const renderLayersTab = () => (
    <motion.div
      key="layers"
      initial={{ opacity: 0, x: isMobile ? 20 : -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: isMobile ? -20 : 20 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="p-4 space-y-2"
    >
      <button
        onClick={() => setExpandedLayers(!expandedLayers)}
        className={`w-full flex items-center justify-between p-3 text-sm font-medium rounded-xl transition-colors ${
          isMobile 
            ? 'text-gray-700 hover:bg-gray-100' 
            : 'text-slate-300 hover:bg-slate-800/50'
        }`}
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
  );

  // Renderiza o conteúdo da aba Estatísticas
  const renderStatsTab = () => (
    <motion.div
      key="stats"
      initial={{ opacity: 0, x: isMobile ? 20 : -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: isMobile ? -20 : 20 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="p-4 space-y-4"
    >
      <div className="grid grid-cols-2 gap-3">
        <div className={`p-4 rounded-xl border ${
          isMobile 
            ? 'bg-gradient-to-br from-gray-50 to-white border-gray-200' 
            : 'bg-gradient-to-br from-slate-800 to-slate-800/50 border-slate-700/50'
        }`}>
          <p className={`text-xs mb-1 ${isMobile ? 'text-gray-500' : 'text-slate-500'}`}>Área Total</p>
          <p className={`text-2xl font-bold ${isMobile ? 'text-gray-900' : 'text-white'}`}>{stats.area.toFixed(1)}</p>
          <p className={`text-xs ${isMobile ? 'text-gray-400' : 'text-slate-500'}`}>m²</p>
        </div>
        <div className={`p-4 rounded-xl border ${
          isMobile 
            ? 'bg-gradient-to-br from-gray-50 to-white border-gray-200' 
            : 'bg-gradient-to-br from-slate-800 to-slate-800/50 border-slate-700/50'
        }`}>
          <p className={`text-xs mb-1 ${isMobile ? 'text-gray-500' : 'text-slate-500'}`}>Cômodos</p>
          <p className={`text-2xl font-bold ${isMobile ? 'text-gray-900' : 'text-white'}`}>{stats.rooms}</p>
          <p className={`text-xs ${isMobile ? 'text-gray-400' : 'text-slate-500'}`}>unidades</p>
        </div>
        <div className={`p-4 rounded-xl border ${
          isMobile 
            ? 'bg-gradient-to-br from-gray-50 to-white border-gray-200' 
            : 'bg-gradient-to-br from-slate-800 to-slate-800/50 border-slate-700/50'
        }`}>
          <p className={`text-xs mb-1 ${isMobile ? 'text-gray-500' : 'text-slate-500'}`}>Paredes</p>
          <p className={`text-2xl font-bold ${isMobile ? 'text-gray-900' : 'text-white'}`}>{stats.walls}</p>
          <p className={`text-xs ${isMobile ? 'text-gray-400' : 'text-slate-500'}`}>segmentos</p>
        </div>
        <div className={`p-4 rounded-xl border ${
          isMobile 
            ? 'bg-gradient-to-br from-gray-50 to-white border-gray-200' 
            : 'bg-gradient-to-br from-slate-800 to-slate-800/50 border-slate-700/50'
        }`}>
          <p className={`text-xs mb-1 ${isMobile ? 'text-gray-500' : 'text-slate-500'}`}>Móveis</p>
          <p className={`text-2xl font-bold ${isMobile ? 'text-gray-900' : 'text-white'}`}>{stats.furniture}</p>
          <p className={`text-xs ${isMobile ? 'text-gray-400' : 'text-slate-500'}`}>itens</p>
        </div>
      </div>

      <div className={`p-4 rounded-xl border ${
        isMobile 
          ? 'bg-gradient-to-br from-gray-50 to-white border-gray-200' 
          : 'bg-gradient-to-br from-slate-800 to-slate-800/50 border-slate-700/50'
      }`}>
        <h4 className={`text-sm font-semibold mb-4 ${isMobile ? 'text-gray-800' : 'text-slate-300'}`}>Resumo do Projeto</h4>
        <div className="space-y-3">
          <div className={`flex justify-between items-center text-sm py-2 border-b ${
            isMobile ? 'border-gray-200' : 'border-slate-700/50'
          }`}>
            <span className={isMobile ? 'text-gray-500' : 'text-slate-500'}>Portas</span>
            <span className={`font-medium ${isMobile ? 'text-gray-900' : 'text-white'}`}>{stats.doors}</span>
          </div>
          <div className={`flex justify-between items-center text-sm py-2 border-b ${
            isMobile ? 'border-gray-200' : 'border-slate-700/50'
          }`}>
            <span className={isMobile ? 'text-gray-500' : 'text-slate-500'}>Janelas</span>
            <span className={`font-medium ${isMobile ? 'text-gray-900' : 'text-white'}`}>{stats.windows}</span>
          </div>
          <div className={`flex justify-between items-center text-sm py-2`}>
            <span className={isMobile ? 'text-gray-500' : 'text-slate-500'}>Andares</span>
            <span className={`font-medium ${isMobile ? 'text-gray-900' : 'text-white'}`}>{scenes.length}</span>
          </div>
        </div>
      </div>

      {/* Ações rápidas */}
      <div className="grid grid-cols-2 gap-3">
        {onSave && (
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onSave}
            className="p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
          >
            Salvar Projeto
          </motion.button>
        )}
        {onShare && (
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onShare}
            className="p-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
          >
            Compartilhar
          </motion.button>
        )}
      </div>
    </motion.div>
  );

  return (
    <div className={`h-full flex flex-col ${isMobile ? 'bg-gray-50' : 'bg-slate-900'}`}>
      {/* Header com tabs */}
      <div className={`flex border-b ${
        isMobile 
          ? 'bg-white/95 backdrop-blur-sm border-gray-200' 
          : 'bg-slate-900/95 backdrop-blur-sm border-slate-800'
      }`}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs sm:text-sm font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? isMobile
                  ? 'text-blue-600 border-b-2 border-blue-500 bg-blue-50/50'
                  : 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/5'
                : isMobile
                  ? 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
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
          {activeTab === 'scenes' && renderScenesTab()}
          {activeTab === 'layers' && renderLayersTab()}
          {activeTab === 'stats' && renderStatsTab()}
        </AnimatePresence>
      </div>
    </div>
  );
}
