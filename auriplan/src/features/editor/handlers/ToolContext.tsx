// ============================================================
// CAMINHO: src/features/editor/handlers/ToolContext.ts
// FUNÇÃO: Prover ToolManager e estado de preview para toda a UI 
// ============================================================

import React, { createContext, useContext, ReactNode, useMemo, useRef, useEffect, useState } from 'react';
import type { Vec2, Tool } from '@auriplan-types';
import type { EditorStore } from '@store/editorStore';
import { ToolManager } from './ToolManager';
import { createEmptyWallGraphTopology } from '@core/wall/WallGraph'; // nova exportação
import { selectCurrentTopology } from '@store/editorStore';
import type { SnapType } from '@core/snap/SnapSolver';

export type PreviewType = 'wall' | 'polygon' | 'edit' | 'none';

export interface WallPreview {
  type: 'wall';
  start: Vec2;
  end: Vec2;
  snapPoint?: Vec2;
  snapType?: SnapType;
}

export interface PolygonPreview {
  type: 'polygon';
  vertices: Vec2[];
  previewPoint: Vec2 | null;
  snapPoint?: Vec2;
  snapType?: SnapType;
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

  const createToolManager = (): ToolManager => {
    const state = store.getState();
    // Garante que SEMPRE haja uma topologia (fallback vazio)
    const topology = selectCurrentTopology(state) ?? createEmptyWallGraphTopology();

    const onPreviewChange = (s: PreviewState) => setPreviewState(s);
    const onHoverChange = (id: string | null) => {};
    const onCursorChange = (cursor: string) => {};
    return new ToolManager(store, onPreviewChange, onHoverChange, onCursorChange, topology);
  };

  // Inicialização única
  if (!toolManagerRef.current) {
    toolManagerRef.current = createToolManager();
  }

  // useEffect apenas para sincronizar a ferramenta ativa (sem recriação)
  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      const state = store.getState();
      const newTool = state.tool;
      if (newTool !== activeTool) {
        setActiveTool(newTool);
        toolManagerRef.current?.setTool(newTool);
      }
      // A topologia é atualizada internamente no ToolManager via subscribe próprio
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
