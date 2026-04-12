// ============================================
// CORE INDEX - Exportação consolidada
// ============================================
// O pipeline novo (GeometryPipeline) é o caminho canônico.
// Módulos legados são mantidos apenas para compatibilidade e estão marcados como @deprecated.

// Math utilities (sempre necessário)
export * from './math/vector';

// ============================================
// PIPELINE CANÔNICO (Fase 4)
// ============================================
export { runGeometryPipeline } from './pipeline/GeometryPipeline';
export { applyGeometryPipeline } from './pipeline/applyGeometryPipeline';

// Snap canônico
export { SnapSolver, computeSnap, SNAP_PRIORITIES, SNAP_COLORS } from './snap/SnapSolver';

// Topologia e divisão de paredes
export { resolveTopology } from './wall/TopologyResolver';
export { WallSplit, splitWallAtPoint, splitWallsAtIntersections } from './wall/WallSplitEngine';
export { buildGraph, createEmptyWallGraph, WallGraphTopology } from './wall/WallGraph';

// Detecção de cômodos canônica
export { RoomDetection } from './room/RoomDetectionEngine';

// ============================================
// ENGINES LEGADAS (compatibilidade temporária)
// ============================================
/** @deprecated Use SnapSolver em vez de SnapEngine */
export { SnapEngine } from './snap/SnapEngine';

/** @deprecated Use SnapSolver em vez de SnapSystem */
export { SnapSystem } from './snap/SnapSystem';

/** @deprecated Use WallSplitEngine e TopologyResolver */
export { WallEngine } from './wall/WallEngine';

/** @deprecated Use RoomDetectionEngine; RoomEngine será removida em versão futura */
export { RoomEngine } from './room/RoomEngine';

/** @deprecated CollisionEngine permanece por enquanto, mas não faz parte do pipeline geométrico */
export { CollisionEngine } from './collision/CollisionEngine';

// Outras engines (histórico, câmera, grid, interação, export/import)
// Mantidas por enquanto, mas não relacionadas ao pipeline geométrico.
export { HistoryEngine } from './history/HistoryEngine';
export { HistoryManager } from './history/HistoryManager';
export { CameraEngine } from './camera/CameraEngine';
export { GridEngine } from './grid/GridEngine';
export { InteractionEngine } from './interaction/InteractionEngine';
export { ExportEngine } from './export/ExportEngine';
export { ImportEngine } from './import/ImportEngine';
