// ============================================
// STATUS BAR - Barra de Status
// ============================================

import { 
  MousePointer2, 
  Layers, 
  Box, 
  Ruler,
  ZoomIn,
  Grid3X3,
  Maximize2,
  Eye,
  Users,
  Wifi,
  WifiOff,
  Save
} from 'lucide-react';
import { useEditorStore } from '@store/editorStore';
import type { ViewMode, Tool } from '@auriplan-types';

interface StatusBarProps {
  viewMode: ViewMode;
  tool: Tool;
  stats: {
    walls: number;
    rooms: number;
    doors: number;
    windows: number;
    furniture: number;
    area: number;
  };
  selectedCount: number;
}

const toolLabels: Record<Tool, string> = {
  select: 'Selecionar',
  pan: 'Mover Vista',
  wall: 'Parede',
  room: 'Cômodo',
  door: 'Porta',
  window: 'Janela',
  furniture: 'Móvel',
  measure: 'Medir',
  text: 'Texto',
  eraser: 'Apagar',
};

export function StatusBar({ viewMode, tool, stats, selectedCount }: StatusBarProps) {
  const { grid, camera, project } = useEditorStore();

  return (
    <div className="h-8 bg-slate-900 border-t border-slate-800 flex items-center px-4 text-xs">
      {/* Left Side */}
      <div className="flex items-center gap-4">
        {/* Current Tool */}
        <div className="flex items-center gap-2 text-slate-400">
          <MousePointer2 className="w-3.5 h-3.5" />
          <span>{toolLabels[tool]}</span>
        </div>

        <div className="w-px h-4 bg-slate-700" />

        {/* View Mode */}
        <div className="flex items-center gap-2 text-slate-400">
          <Layers className="w-3.5 h-3.5" />
          <span>{viewMode.toUpperCase()}</span>
        </div>

        <div className="w-px h-4 bg-slate-700" />

        {/* Grid Status */}
        <div className={`flex items-center gap-2 ${grid.visible ? 'text-blue-400' : 'text-slate-500'}`}>
          <Grid3X3 className="w-3.5 h-3.5" />
          <span>Grade {grid.size}m</span>
        </div>

        <div className="w-px h-4 bg-slate-700" />

        {/* Zoom Level */}
        <div className="flex items-center gap-2 text-slate-400">
          <ZoomIn className="w-3.5 h-3.5" />
          <span>{(camera.zoom * 100).toFixed(0)}%</span>
        </div>
      </div>

      <div className="flex-1" />

      {/* Center */}
      <div className="flex items-center gap-4">
        {/* Selection Info */}
        {selectedCount > 0 && (
          <div className="flex items-center gap-2 text-blue-400">
            <Box className="w-3.5 h-3.5" />
            <span>{selectedCount} objeto(s) selecionado(s)</span>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-3 text-slate-500">
          <span className="flex items-center gap-1">
            <Ruler className="w-3 h-3" />
            {stats.area.toFixed(1)}m²
          </span>
          <span>{stats.rooms} cômodos</span>
          <span>{stats.walls} paredes</span>
          <span>{stats.furniture} móveis</span>
        </div>
      </div>

      <div className="flex-1" />

      {/* Right Side */}
      <div className="flex items-center gap-4">
        {/* Save Status */}
        <div className="flex items-center gap-2 text-green-400">
          <Save className="w-3.5 h-3.5" />
          <span>Salvo</span>
        </div>

        <div className="w-px h-4 bg-slate-700" />

        {/* Connection Status */}
        <div className="flex items-center gap-2 text-green-400">
          <Wifi className="w-3.5 h-3.5" />
          <span>Online</span>
        </div>

        <div className="w-px h-4 bg-slate-700" />

        {/* Collaborators */}
        <div className="flex items-center gap-2 text-slate-400">
          <Users className="w-3.5 h-3.5" />
          <span>1 usuário</span>
        </div>

        <div className="w-px h-4 bg-slate-700" />

        {/* Coordinates */}
        <div className="text-slate-500">
          <span>X: {camera.position[0].toFixed(2)} Y: {camera.position[1].toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
