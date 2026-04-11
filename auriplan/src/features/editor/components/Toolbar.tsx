// ============================================
// TOOLBAR - Barra de Ferramentas Premium
// Desktop/Tablet (≥md): Barra escura completa com ferramentas
// Mobile (<md): Oculta (ferramentas ficam no menu lateral)
// ============================================

import { 
  MousePointer2, 
  Hand,
  BrickWall, 
  Square, 
  DoorOpen,
  AppWindow,
  Ruler,
  Type,
  Layers,
  Package,
  Split,
  Grid3X3,
  Magnet,
  Maximize2,
  Menu,
} from 'lucide-react';
import { useEditorStore } from '@store/editorStore';
import type { ViewMode, Tool } from '@auriplan-types';

interface ToolbarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
}

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

function ToolButton({ 
  tool: toolDef, 
  isActive, 
  onClick 
}: { 
  tool: { id: Tool; icon: React.ElementType; label: string; shortcut: string }; 
  isActive: boolean; 
  onClick: () => void; 
}) {
  const Icon = toolDef.icon as React.FC<{ className?: string }>;
  return (
    <button
      onClick={onClick}
      className={`relative group flex flex-col items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 ${
        isActive
          ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105'
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 hover:scale-105'
      }`}
      title={`${toolDef.label} (${toolDef.shortcut})`}
    >
      <Icon className="w-4 h-4" />
      <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap z-50 pointer-events-none border border-slate-700 shadow-xl">
        {toolDef.label}
        <span className="ml-1 text-slate-400">({toolDef.shortcut})</span>
      </span>
    </button>
  );
}

export function Toolbar({ 
  viewMode, 
  onViewModeChange,
  onToggleSidebar,
  isSidebarOpen,
}: ToolbarProps) {
  const tool = useEditorStore(state => state.tool);
  const setTool = useEditorStore(state => state.setTool);
  const { grid, toggleGrid, snap, toggleSnap, fitToView } = useEditorStore();

  return (
    <div className="hidden md:flex h-14 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 items-center px-3 gap-2">
      {/* Sidebar Toggle */}
      <button
        onClick={onToggleSidebar}
        className={`p-2 rounded-xl transition-all duration-200 flex-shrink-0 ${
          isSidebarOpen 
            ? 'bg-blue-500/20 text-blue-400 shadow-sm shadow-blue-500/20' 
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
        }`}
        title="Alternar painel lateral"
      >
        <Menu className="w-4 h-4" />
      </button>

      <div className="w-px h-6 bg-slate-700/50 flex-shrink-0" />

      {/* VIEW GROUP */}
      <div className="flex items-center bg-slate-800 rounded-xl p-0.5 shadow-inner flex-shrink-0">
        <button
          onClick={() => onViewModeChange('2d')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            viewMode === '2d'
              ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
          }`}
          title="Vista 2D"
        >
          <Layers className="w-3.5 h-3.5" />
          2D
        </button>
        <button
          onClick={() => onViewModeChange('3d')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            viewMode === '3d'
              ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
          }`}
          title="Vista 3D"
        >
          <Package className="w-3.5 h-3.5" />
          3D
        </button>
        <button
          onClick={() => onViewModeChange('split')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            viewMode === 'split'
              ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
          }`}
          title="Vista Dividida"
        >
          <Split className="w-3.5 h-3.5" />
          Split
        </button>
      </div>

      <div className="w-px h-6 bg-slate-700/50 flex-shrink-0" />

      {/* TOOL GROUPS - Desktop/Tablet apenas */}
      {toolGroups.map((group, groupIndex) => (
        <div key={group.label} className="flex items-center gap-0.5 flex-shrink-0">
          {group.tools.map(t => (
            <ToolButton
              key={t.id}
              tool={t}
              isActive={tool === t.id}
              onClick={() => setTool(t.id)}
            />
          ))}
          {groupIndex < toolGroups.length - 1 && (
            <div className="w-px h-6 bg-slate-700/50 mx-1 flex-shrink-0" />
          )}
        </div>
      ))}

      {/* Spacer */}
      <div className="flex-1 min-w-4" />

      {/* Canvas Controls */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={toggleGrid}
          className={`p-2 rounded-lg text-xs transition-colors flex items-center gap-1.5 ${
            grid.visible ? 'text-blue-400 bg-blue-500/10' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
          }`}
          title={`Grade ${grid.visible ? 'ligada' : 'desligada'}`}
        >
          <Grid3X3 className="w-4 h-4" />
        </button>
        <button
          onClick={toggleSnap}
          className={`p-2 rounded-lg text-xs transition-colors flex items-center gap-1.5 ${
            snap.enabled ? 'text-purple-400 bg-purple-500/10' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
          }`}
          title={`Snap ${snap.enabled ? 'ligado' : 'desligado'}`}
        >
          <Magnet className="w-4 h-4" />
        </button>
        <button
          onClick={fitToView}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
          title="Ajustar à tela"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
