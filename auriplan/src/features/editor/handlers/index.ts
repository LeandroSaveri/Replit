// ============================================================
// CAMINHO: src/features/editor/handlers/index.ts
// FUNCIONALIDADE: Exporta todos os módulos da camada de handlers.
// OBJETO: Facilitar importações em outros arquivos.
// ============================================================

export { ToolManager } from './ToolManager';
export { ToolContext, useToolContext } from './ToolContext';
export type { ToolHandler } from './ToolHandler';
export type { PreviewState, PreviewType } from './ToolContext';
export { WallToolHandler } from './tools/WallToolHandler';
export { RoomToolHandler, ROOM_SHAPES } from './tools/RoomToolHandler';
export { SelectToolHandler } from './tools/SelectToolHandler';
