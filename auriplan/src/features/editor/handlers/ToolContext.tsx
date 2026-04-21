// ============================================================
// CAMINHO: src/features/editor/handlers/ToolContext.tsx
// FUNÇÃO: Prover ToolManager e estado de preview para toda a UI 
// ============================================================

import React, { createContext, useContext, ReactNode, useMemo, useRef, useEffect, useState, useCallback } from 'react';
import type { Vec2, Tool } from '@auriplan-types';
import { useEditorStore, selectCurrentScene } from '@store/editorStore';
import { ToolManager } from './ToolManager';
import { GeometryController } from '@core/geometry/GeometryController';

export type PreviewType = 'wall' | 'polygon' | 'edit' | 'none';

export interface WallPreview {
  type: 'wall';
  start: Vec2;
  end: Vec2;
  snapPoint?: Vec2;
  snapType?: string;
}

export interface PolygonPreview {
  type: 'polygon';
  vertices: Vec2[];
  previewPoint: Vec2 | null;
  snapPoint?: Vec2;
  snapType?: string;
}

export interface EditPreview {
  type: 'edit';
  wall: { start: Vec2; end: Vec2 };
  vertex?: 'start' | 'end';
}

export type PreviewState = WallPreview | PolygonPreview | EditPreview | null;

export interface ToolContextValue {
  toolManager: ToolManager;
  previewState: PreviewState;
  setPreviewState: (state: PreviewState) => void;
  activeTool: Tool;
}

export const ToolContext = createContext<ToolContextValue | null>(null);

export function useToolContext() {
  const ctx = useContext(ToolContext);
  if (!ctx) throw new Error('useToolContext must be used within ToolProvider');
  return ctx;
}

interface ToolProviderProps {
  children: ReactNode;
  store?: unknown;
}

export function ToolProvider({ children }: ToolProviderProps) {
  const [previewState, setPreviewState] = useState<PreviewState>(null);
  const [activeTool, setActiveTool] = useState<Tool>('select');
  
  const store = useEditorStore;
  const currentScene = useEditorStore(selectCurrentScene);

  // Refs para o controller e manager
  const geometryControllerRef = useRef<GeometryController | null>(null);
  const toolManagerRef = useRef<ToolManager | null>(null);

  // Callbacks memoizados para o store
  const getWalls = useCallback(() => currentScene?.walls ?? [], [currentScene]);
  const getRooms = useCallback(() => currentScene?.rooms ?? [], [currentScene]);
  const getFurniture = useCallback(() => currentScene?.furniture ?? [], [currentScene]);
  
  const onSelect = useCallback((id: string, addToSelection: boolean) => {
    store.getState().select(id, addToSelection);
  }, [store]);
  
  const onDeselectAll = useCallback(() => {
    store.getState().deselectAll();
  }, [store]);
  
  const onDelete = useCallback((id: string) => {
    const state = store.getState();
    const scene = currentScene;
    if (!scene) return;
    
    if (scene.walls.some(w => w.id === id)) state.deleteWall(id);
    else if (scene.rooms.some(r => r.id === id)) state.deleteRoom(id);
    else if (scene.furniture.some(f => f.id === id)) state.deleteFurniture(id);
  }, [store, currentScene]);
  
  const onZoomToRoom = useCallback((roomId: string) => {
    store.getState().zoomToRoom(roomId);
  }, [store]);

  // Inicialização única do GeometryController e ToolManager
  if (!geometryControllerRef.current) {
    geometryControllerRef.current = new GeometryController(
      () => store.getState(),
      { debug: process.env.NODE_ENV === 'development' }
    );
  }

  if (!toolManagerRef.current) {
    toolManagerRef.current = new ToolManager({
      geometryController: geometryControllerRef.current,
      onPreviewChange: setPreviewState,
      onToolChange: setActiveTool,
      getWalls,
      getRooms,
      getFurniture,
      onSelect,
      onDeselectAll,
      onDelete,
      onZoomToRoom,
    });
  }

  // Sincroniza ferramenta ativa com o store
  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      const state = store.getState();
      const newTool = state.tool;
      if (newTool !== activeTool) {
        setActiveTool(newTool);
        toolManagerRef.current?.setTool(newTool);
      }
    });
    return unsubscribe;
  }, [store, activeTool]);

  const value = useMemo(() => ({
    toolManager: toolManagerRef.current!,
    previewState,
    setPreviewState,
    activeTool,
  }), [previewState, activeTool]);

  return (
    <ToolContext.Provider value={value}>
      {children}
    </ToolContext.Provider>
  );
}
