/**
 * AI Module Index for AuriPlan
 * Export all AI-related components and services
 */

// Contratos
export type {
  EditorAction,
  EditorActionWithMetadata,
  CommandProcessingResult,
  Point2D,
  Point3D,
} from './contracts/EditorActionContract';

// Serviços principais
export { aiService } from './AIService';
export { naturalLanguageInterpreter, type DesignIntent } from './NaturalLanguageInterpreter';
export { editorActionMapper } from './EditorActionMapper';

// Serviço legado (compatibilidade)
export { aiService as aiOrchestrator } from './services/AIService';

// Geradores
export { default as FloorPlanGenerator } from './generators/floorplan/FloorPlanGenerator';
export { roomRules, validateRoomDimensions } from './generators/floorplan/RoomRules';
export type { RoomType, RoomRule } from './generators/floorplan/RoomRules';

// Types
export type {
  FloorPlan,
  FloorPlanRequest,
  RoomPlacement,
  WindowPlacement,
  DoorPlacement,
  WallPlacement,
} from './generators/floorplan/FloorPlanGenerator';

export type {
  AIGenerationResult,
  FloorPlanGenerationRequest,
  FurnishingRequest,
  LightingRequest,
} from './services/AIService';

// Aliases para compatibilidade
export { FloorPlanGenerator as default } from './generators/floorplan/FloorPlanGenerator';
