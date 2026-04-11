
# Criar Sidebar.tsx corrigido
new_sidebar = '''// ============================================
// SIDEBAR - Painel Lateral Otimizado
// Mobile: Drawer overlay (não empurra canvas)
// Desktop: Slide lateral (empurra canvas)
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
  X
} from 'lucide-react';
import type { Scene } from '@auriplan-types';

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
  onClose
}: SidebarProps) {
  const [activeTab, setActiveTab] = useState<'scenes' | 'layers' | 'stats'>('scenes');
  const [expandedLayers, setExpandedLayers] = useState(true);
  const [newSceneName, setNewSceneName] = useState('');
  const [showAddScene, setShowAddScene] = useState(false);

  const currentScene = scenes.find(s => s.id === currentSceneId);

  const tabs = [
    { id: 'scenes' as const, label: 'Cenas', icon: Layers },
    { id: 'layers' as const, label: 'Camadas', icon: Box },
    { id: 'stats' as const, label: 'Estatísticas', icon: Ruler },
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
      {/* Header com tabs */}
      <div className="flex border-b border-slate-800">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/5'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'scenes' && (
          <div className="space-y-3">
            {scenes.map((scene) => (
              <div
                key={scene.id}
                onClick={() => { onSceneChange(scene.id); if (isMobile && onClose) onClose(); }}
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
              </div>
            ))}

            {/* Add Scene */}
            {showAddScene ? (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
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
              <button
                onClick={() => setShowAddScene(true)}
                className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-700 rounded-xl text-slate-500 hover:text-slate-300 hover:border-slate-600 hover:bg-slate-800/50 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">Adicionar Andar</span>
              </button>
            )}
          </div>
        )}

        {activeTab === 'layers' && currentScene && (
          <div className="space-y-2">
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
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-4">
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
          </div>
        )}
      </div>
    </div>
  );
}
