// ============================================
// SIDEBAR - Painel Lateral
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
  Trash2,
  Edit3,
  Eye,
  EyeOff,
  Lock,
  Unlock
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
}

interface LayerItemProps {
  icon: React.FC<{ className?: string }>;
  name: string;
  count: number;
  visible: boolean;
  locked: boolean;
  onToggleVisibility: () => void;
  onToggleLock: () => void;
}

function LayerItem({ icon: Icon, name, count, visible, locked, onToggleVisibility, onToggleLock }: LayerItemProps) {
  return (
    <div className="flex items-center justify-between px-3 py-2 hover:bg-slate-800/50 rounded-lg group">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-slate-500" />
        <span className="text-sm text-slate-300">{name}</span>
        <span className="text-xs text-slate-500">({count})</span>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onToggleVisibility}
          className={`p-1 rounded ${visible ? 'text-blue-400' : 'text-slate-600'}`}
        >
          {visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={onToggleLock}
          className={`p-1 rounded ${locked ? 'text-red-400' : 'text-slate-600'}`}
        >
          {locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}

export function Sidebar({ scenes, currentSceneId, onSceneChange, onAddScene, stats }: SidebarProps) {
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
      {/* Tabs */}
      <div className="flex border-b border-slate-800">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'scenes' && (
          <div className="space-y-2">
            {scenes.map((scene, index) => (
              <div
                key={scene.id}
                onClick={() => onSceneChange(scene.id)}
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                  scene.id === currentSceneId
                    ? 'bg-blue-500/20 border border-blue-500/30'
                    : 'bg-slate-800 hover:bg-slate-700 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    scene.id === currentSceneId ? 'bg-blue-500' : 'bg-slate-700'
                  }`}>
                    <Home className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${
                      scene.id === currentSceneId ? 'text-white' : 'text-slate-300'
                    }`}>
                      {scene.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      Andar {scene.level + 1} • {scene.height.toFixed(1)}m
                    </p>
                  </div>
                </div>
                <button className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-700 rounded">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            ))}

            {/* Add Scene */}
            {showAddScene ? (
              <div className="p-3 bg-slate-800 rounded-lg border border-slate-700">
                <input
                  type="text"
                  value={newSceneName}
                  onChange={(e) => setNewSceneName(e.target.value)}
                  placeholder="Nome da cena"
                  className="w-full h-9 px-3 bg-slate-900 border border-slate-700 rounded text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 mb-2"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddScene();
                    if (e.key === 'Escape') setShowAddScene(false);
                  }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAddScene}
                    className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded transition-colors"
                  >
                    Adicionar
                  </button>
                  <button
                    onClick={() => setShowAddScene(false)}
                    className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddScene(true)}
                className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-700 rounded-lg text-slate-500 hover:text-slate-300 hover:border-slate-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Adicionar Andar
              </button>
            )}
          </div>
        )}

        {activeTab === 'layers' && currentScene && (
          <div className="space-y-2">
            <button
              onClick={() => setExpandedLayers(!expandedLayers)}
              className="w-full flex items-center justify-between p-2 text-sm font-medium text-slate-300 hover:bg-slate-800 rounded-lg"
            >
              <span>Camadas</span>
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
              <div className="p-4 bg-slate-800 rounded-xl">
                <p className="text-xs text-slate-500 mb-1">Área Total</p>
                <p className="text-2xl font-bold text-white">{stats.area.toFixed(1)}</p>
                <p className="text-xs text-slate-500">m²</p>
              </div>
              <div className="p-4 bg-slate-800 rounded-xl">
                <p className="text-xs text-slate-500 mb-1">Cômodos</p>
                <p className="text-2xl font-bold text-white">{stats.rooms}</p>
                <p className="text-xs text-slate-500">unidades</p>
              </div>
              <div className="p-4 bg-slate-800 rounded-xl">
                <p className="text-xs text-slate-500 mb-1">Paredes</p>
                <p className="text-2xl font-bold text-white">{stats.walls}</p>
                <p className="text-xs text-slate-500">segmentos</p>
              </div>
              <div className="p-4 bg-slate-800 rounded-xl">
                <p className="text-xs text-slate-500 mb-1">Móveis</p>
                <p className="text-2xl font-bold text-white">{stats.furniture}</p>
                <p className="text-xs text-slate-500">itens</p>
              </div>
            </div>

            <div className="p-4 bg-slate-800 rounded-xl">
              <h4 className="text-sm font-medium text-slate-300 mb-3">Resumo do Projeto</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Portas</span>
                  <span className="text-white">{stats.doors}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Janelas</span>
                  <span className="text-white">{stats.windows}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Andares</span>
                  <span className="text-white">{scenes.length}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
