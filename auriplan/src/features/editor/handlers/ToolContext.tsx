// ============================================================
// CAMINHO: src/features/editor/handlers/ToolContext.tsx
// FUNÇÃO: Prover ToolManager e estado de preview para toda a UI
// ============================================================

import React, { createContext, useContext, ReactNode, useMemo, useRef, useEffect, useState } from 'react';
import type { Vec2, Tool } from '@auriplan-types';
import type { EditorStore } from '@store/editorStore';
import { ToolManager } from './ToolManager';
import { WallGraphTopology } from '@core/wall/WallGraph';

export type PreviewType = 'wall' | 'polygon' | 'edit' | 'none';

export interface WallPreview {
  type: 'wall';
  start: Vec2;
  end: Vec2;
}

export interface PolygonPreview {
  type: 'polygon';
  vertices: Vec2[];
  previewPoint: Vec2 | null;
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
  activeTool: Tool | null;
}

// CORREÇÃO: Adicionado 'export' antes de 'const ToolContext'
export const ToolContext = createContext<ToolContextValue | null>(null);

export function useToolContext() {
  const ctx = useContext(ToolContext);
  if (!ctx) throw new Error('useToolContext must be used within ToolProvider');
  return ctx;
}

interface ToolProviderProps {
  store: EditorStore;
  children: ReactNode;
}

export function ToolProvider({ store, children }: ToolProviderProps) {
  const [previewState, setPreviewState] = useState<PreviewState>(null);
  const [activeTool, setActiveTool] = useState<Tool | null>(store.getState().tool);

  const toolManagerRef = useRef<ToolManager | null>(null);

  if (!toolManagerRef.current) {
    const onPreviewChange = (state: PreviewState) => setPreviewState(state);
    const onHoverChange = (id: string | null) => {
      // Hover feedback pode ser tratado externamente
    };
    const onCursorChange = (cursor: string) => {
      // Cursor será atualizado pelo Canvas2D/3D conforme necessário
    };
    const currentScene = store.getState().scenes.find(s => s.id === store.getState().currentSceneId);
    const topology = new WallGraphTopology(currentScene?.walls || []);
    toolManagerRef.current = new ToolManager(store, onPreviewChange, onHoverChange, onCursorChange, topology);
  }

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      const newTool = store.getState().tool;
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
