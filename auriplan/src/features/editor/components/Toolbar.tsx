// ============================================
// TOOLBAR - Barra de Ferramentas Premium (TEMA CLARO)
// Desktop/Tablet (≥md): Barra clara com ferramentas (SEM 2D/3D/Split)
// Mobile (<md): Oculta (ferramentas ficam no menu lateral)
// NOTA: 2D/3D/Split estão apenas na primeira barra superior (Editor.tsx)
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
  Grid3X3,
  Magnet,
  Maximize2,
  Menu,
} from 'lucide-react';
import { useEditorStore } from '@store/editorStore';
import type { Tool } from '@auriplan-types';

interface ToolbarProps {
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
      className={`relative group flex flex-col items-center justify-center w-11 h-11 rounded-xl transition-all duration-200 ${
        isActive
          ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25 scale-105 ring-2 ring-blue-500/20'
          : 'bg-white text-gray-600 shadow-sm shadow-gray-200/50 hover:text-blue-600 hover:shadow-md hover:shadow-blue-500/10 hover:scale-105 border border-gray-200'
      }`}
      title={`${toolDef.label} (${toolDef.shortcut})`}
    >
      <Icon className="w-[18px] h-[18px]" />
      {/* Tooltip */}
      <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2.5 py-1.5 bg-gray-900 text-white text-[11px] font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap z-50 pointer-events-none shadow-xl">
        {toolDef.label}
        <span className="ml-1 text-gray-400">({toolDef.shortcut})</span>
      </span>
    </button>
  );
}

export function Toolbar({ 
  onToggleSidebar,
  isSidebarOpen,
}: ToolbarProps) {
  const tool = useEditorStore(state => state.tool);
  const setTool = useEditorStore(state => state.setTool);
  const { grid, toggleGrid, snap, toggleSnap, fitToView } = useEditorStore();

  return (
    <div className="hidden md:flex h-16 bg-white/95 backdrop-blur-md border-b border-gray-200 items-center px-4 gap-3 shadow-sm">
      {/* Sidebar Toggle */}
      <button
        onClick={onToggleSidebar}
        className={`p-2.5 rounded-xl transition-all duration-200 flex-shrink-0 shadow-sm ${
          isSidebarOpen 
            ? 'bg-blue-50 text-blue-600 shadow-blue-500/10 ring-2 ring-blue-500/20' 
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
        }`}
        title="Alternar painel lateral"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="w-px h-7 bg-gray-200 flex-shrink-0" />

      {/* TOOL GROUPS - Ferramentas de desenho */}
      {toolGroups.map((group, groupIndex) => (
        <div key={group.label} className="flex items-center gap-2 flex-shrink-0">
          {group.tools.map(t => (
            <ToolButton
              key={t.id}
              tool={t}
              isActive={tool === t.id}
              onClick={() => setTool(t.id)}
            />
          ))}
          {groupIndex < toolGroups.length - 1 && (
            <div className="w-px h-7 bg-gray-200 mx-1 flex-shrink-0" />
          )}
        </div>
      ))}

      {/* Spacer */}
      <div className="flex-1 min-w-4" />

      {/* Canvas Controls */}
      <div className="flex items-center gap-2 flex-shrink-0 bg-gray-100 rounded-xl p-1.5">
        <button
          onClick={toggleGrid}
          className={`p-2.5 rounded-lg text-xs transition-all duration-200 flex items-center gap-1.5 ${
            grid.visible 
              ? 'bg-white text-blue-600 shadow-sm shadow-gray-200/50 ring-1 ring-gray-200' 
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
          }`}
          title={`Grade ${grid.visible ? 'ligada' : 'desligada'}`}
        >
          <Grid3X3 className="w-[18px] h-[18px]" />
        </button>
        <button
          onClick={toggleSnap}
          className={`p-2.5 rounded-lg text-xs transition-all duration-200 flex items-center gap-1.5 ${
            snap.enabled 
              ? 'bg-white text-purple-600 shadow-sm shadow-gray-200/50 ring-1 ring-gray-200' 
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
          }`}
          title={`Snap ${snap.enabled ? 'ligado' : 'desligado'}`}
        >
          <Magnet className="w-[18px] h-[18px]" />
        </button>
        <div className="w-px h-5 bg-gray-300 mx-0.5" />
        <button
          onClick={fitToView}
          className="p-2.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-200/50 transition-all duration-200"
          title="Ajustar à tela"
        >
          <Maximize2 className="w-[18px] h-[18px]" />
        </button>
      </div>
    </div>
  );
}
