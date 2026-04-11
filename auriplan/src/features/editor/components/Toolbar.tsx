// ============================================
// TOOLBAR - Barra de Ferramentas Premium
// Per spec: [2D|3D|Split] | [Select|Pan] | [Wall|Room] | [Door|Window] | [Text|Measure]
// VERSÃO RESPONSIVA: Desktop = barra visível, Mobile = escondida (tools vão pro Sidebar)
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
  ChevronDown,
} from 'lucide-react';
import { useEditorStore } from '@store/editorStore';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

export const toolGroups: ToolGroup[] = [
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

// Hook para exportar tools pro Sidebar mobile
export function useToolbarTools() {
  const tool = useEditorStore(state => state.tool);
  const setTool = useEditorStore(state => state.setTool);
  return { tool, setTool, toolGroups };
}

function ToolButton({ 
  tool: toolDef, 
  isActive, 
  onClick,
  size = 'md',
}: { 
  tool: { id: Tool; icon: React.ElementType; label: string; shortcut: string }; 
  isActive: boolean; 
  onClick: () => void;
  size?: 'sm' | 'md';
}) {
  const Icon = toolDef.icon as React.FC<{ className?: string }>;
  const sizeClasses = size === 'sm' 
    ? { button: 'w-8 h-8', icon: 'w-3.5 h-3.5', tooltip: 'text-[10px]' }
    : { button: 'w-10 h-10', icon: 'w-4 h-4', tooltip: 'text-xs' };
  
  return (
    <button
      onClick={onClick}
      className={`relative group flex flex-col items-center justify-center ${sizeClasses.button} rounded-xl transition-all duration-200 ease-out ${
        isActive
          ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105'
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 hover:scale-105'
      }`}
      title={`${toolDef.label} (${toolDef.shortcut})`}
    >
      <Icon className={sizeClasses.icon} />
      <span className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-slate-900 text-white ${sizeClasses.tooltip} rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap z-50 pointer-events-none border border-slate-700 shadow-xl`}>
        {toolDef.label}
        <span className="ml-1 text-slate-400">({toolDef.shortcut})</span>
      </span>
    </button>
  );
}

// Componente de ViewSwitcher reutilizável
export function ViewSwitcher({ 
  viewMode, 
  onViewModeChange,
  size = 'md',
}: { 
  viewMode: ViewMode; 
  onViewModeChange: (mode: ViewMode) => void;
  size?: 'sm' | 'md';
}) {
  const sizeClasses = size === 'sm'
    ? { container: 'p-0.5', button: 'px-2 py-1 text-[10px]', icon: 'w-3 h-3' }
    : { container: 'p-0.5', button: 'px-3 py-1.5 text-xs', icon: 'w-3.5 h-3.5' };

  const views = [
    { id: '2d' as ViewMode, icon: Layers, label: '2D' },
    { id: '3d' as ViewMode, icon: Package, label: '3D' },
    { id: 'split' as ViewMode, icon: Split, label: 'Split' },
  ];

  return (
    <div className={`flex items-center bg-slate-800 rounded-xl ${sizeClasses.container} shadow-inner`}>
      {views.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => onViewModeChange(id)}
          className={`flex items-center gap-1 ${sizeClasses.button} rounded-lg font-semibold transition-all duration-200 ${
            viewMode === id
              ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
          }`}
          title={`Vista ${label}`}
        >
          <Icon className={sizeClasses.icon} />
          {label}
        </button>
      ))}
    </div>
  );
}

// Componente de CanvasControls reutilizável
export function CanvasControls({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const { grid, toggleGrid, snap, toggleSnap, fitToView } = useEditorStore();
  const sizeClasses = size === 'sm'
    ? { button: 'p-1.5', icon: 'w-3.5 h-3.5' }
    : { button: 'p-2', icon: 'w-4 h-4' };

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={toggleGrid}
        className={`${sizeClasses.button} rounded-lg transition-all duration-200 ${
          grid.visible 
            ? 'text-blue-400 bg-blue-500/15 shadow-sm shadow-blue-500/20' 
            : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/80'
        }`}
        title={`Grade ${grid.visible ? 'ligada' : 'desligada'}`}
      >
        <Grid3X3 className={sizeClasses.icon} />
      </button>
      <button
        onClick={toggleSnap}
        className={`${sizeClasses.button} rounded-lg transition-all duration-200 ${
          snap.enabled 
            ? 'text-purple-400 bg-purple-500/15 shadow-sm shadow-purple-500/20' 
            : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/80'
        }`}
        title={`Snap ${snap.enabled ? 'ligado' : 'desligado'}`}
      >
        <Magnet className={sizeClasses.icon} />
      </button>
      <button
        onClick={fitToView}
        className={`${sizeClasses.button} rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800/80 transition-all duration-200`}
        title="Ajustar à tela"
      >
        <Maximize2 className={sizeClasses.icon} />
      </button>
    </div>
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
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <>
      {/* DESKTOP: Barra escura completa */}
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

        {/* View Switcher */}
        <ViewSwitcher viewMode={viewMode} onViewModeChange={onViewModeChange} />

        <div className="w-px h-6 bg-slate-700/50 flex-shrink-0" />

        {/* Tool Groups */}
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
        <CanvasControls />
      </div>

      {/* MOBILE: Botão flutuante de ferramentas */}
      <div className="md:hidden fixed top-20 left-4 z-40">
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className={`w-12 h-12 rounded-2xl shadow-xl backdrop-blur-md transition-all duration-300 flex items-center justify-center ${
            showMobileMenu
              ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-blue-500/40 rotate-180'
              : 'bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <ChevronDown className={`w-6 h-6 transition-transform duration-300 ${showMobileMenu ? 'rotate-180' : ''}`} />
        </button>

        {/* Menu flutuante mobile - Estilo Apple/Google */}
        <AnimatePresence>
          {showMobileMenu && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              transition={{ type: 'spring', damping: 25, stiffness: 400 }}
              className="absolute top-full left-0 mt-3 w-72 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden"
            >
              {/* Header do menu */}
              <div className="px-4 py-3 border-b border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-800/80">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Ferramentas</h3>
              </div>

              {/* View Modes */}
              <div className="p-3">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-2 px-1">Vista</p>
                <div className="flex justify-center">
                  <ViewSwitcher 
                    viewMode={viewMode} 
                    onViewModeChange={(mode) => {
                      onViewModeChange(mode);
                      setShowMobileMenu(false);
                    }}
                    size="sm"
                  />
                </div>
              </div>

              {/* Tool Groups */}
              <div className="px-3 pb-3 space-y-3">
                {toolGroups.map((group) => (
                  <div key={group.label}>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-2 px-1">
                      {group.label}
                    </p>
                    <div className="grid grid-cols-4 gap-1.5">
                      {group.tools.map(t => (
                        <motion.button
                          key={t.id}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setTool(t.id);
                            setShowMobileMenu(false);
                          }}
                          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 ${
                            tool === t.id
                              ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
                              : 'bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          <t.icon className="w-4 h-4" />
                          <span className="text-[9px] font-medium truncate w-full text-center">{t.label}</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Canvas Controls */}
              <div className="px-3 py-3 border-t border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-2 px-1">Canvas</p>
                <div className="flex justify-center">
                  <CanvasControls size="sm" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
