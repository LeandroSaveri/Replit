// ============================================================
// CAMINHO: src/features/editor/handlers/ToolContext.ts
// FUNCIONALIDADE: Gerencia o estado de pré-visualização das
// ferramentas e o disponibiliza para o Canvas via React Context.
// OBJETO: Desacoplar a comunicação entre ToolManager e Canvas,
// permitindo que o Canvas reaja a mudanças de preview sem
// acoplamento direto.
// ============================================================

import { createContext, useContext } from 'react';
import type { Vec2, Tool } from '@auriplan-types';

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
  previewState: PreviewState;
  setPreviewState: (state: PreviewState) => void;
  activeTool: Tool | null; // CORRIGIDO: agora usa o tipo Tool do @types
}

export const ToolContext = createContext<ToolContextValue | null>(null);

export function useToolContext() {
  const ctx = useContext(ToolContext);
  if (!ctx) throw new Error('useToolContext must be used within ToolProvider');
  return ctx;
}
