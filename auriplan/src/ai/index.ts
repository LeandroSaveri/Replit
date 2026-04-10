/**
 * AI Module Index for AuriPlan
 * Export all AI-related components and services
 */

// Services
export { aiService } from './services/AIService';

// Floor Plan Generator
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

// AI Process Result type
export interface AIProcessResult {
  success: boolean;
  command?: string;
  interpretation?: string;
  actions?: Array<{ type: string; payload: any }>;
  message?: string;
  error?: string;
  floorPlan?: any;
  preview?: any;
}

// AI Orchestrator (facade over aiService)
export { aiService as aiOrchestrator } from './services/AIService';
