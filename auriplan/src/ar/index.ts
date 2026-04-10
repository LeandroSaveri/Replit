/**
 * AR Module - Room Scanning System
 * Exporta todos os componentes e utilitários do sistema AR
 */

// Core AR Components
export { ARSessionManager, arSessionManager } from './ARSessionManager';
export type {
  ARSessionConfig,
  ARSessionState,
  ARSessionPhase,
  ARProgressUpdate,
} from './ARSessionManager';

// Room Scanner
export { RoomScanner, roomScanner } from './RoomScanner';
export type {
  ScanPoint,
  DetectedWall,
  DetectedCorner,
  RoomScanResult,
  ScanProgress,
  ScanCallback,
} from './RoomScanner';

// Room Scan Converter
export { RoomScanConverter, roomScanConverter } from './RoomScanConverter';
export type {
  WallData,
  RoomData,
  FloorPlanData,
  ConversionOptions,
} from './RoomScanConverter';
