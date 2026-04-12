/**
 * EditorActionMapper - Mapeador de Intenções para Ações do Editor
 * Responsável por converter DesignIntent em EditorActionContract.
 * NÃO executa lógica de negócio, apenas mapeia.
 */

import { EventEmitter } from '../utils/EventEmitter';
import type { DesignIntent } from './NaturalLanguageInterpreter';
import type {
  EditorAction,
  EditorActionWithMetadata,
  Point2D,
  Point3D,
} from './contracts/EditorActionContract';

// Interface mínima para compatibilidade com tipos existentes (não usada para execução)
interface RoomLayout {
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface FloorPlan {
  id: string;
  name: string;
  rooms: Array<{
    id: string;
    name: string;
    type: string;
    points?: Point2D[];
    area?: number;
  }>;
  walls: Array<{
    id: string;
    start: Point2D;
    end: Point2D;
    thickness: number;
  }>;
  furniture: Array<{
    id: string;
    type: string;
    position: Point3D;
    rotation?: number;
    scale?: number;
  }>;
  footprintW?: number;
  footprintD?: number;
  totalArea?: number;
}

export interface MappingResult {
  success: boolean;
  actions?: EditorActionWithMetadata[];
  error?: string;
  warnings?: string[];
}

export class EditorActionMapper extends EventEmitter {
  private confidenceThreshold = 0.6;

  /**
   * Mapeia uma intenção de design para ações do editor.
   * NÃO executa as ações, apenas as gera.
   */
  public mapIntentToActions(intent: DesignIntent, confidence: number): MappingResult {
    try {
      if (confidence < this.confidenceThreshold) {
        return {
          success: false,
          error: `Confidence too low: ${confidence.toFixed(2)}`,
        };
      }

      const actions: EditorActionWithMetadata[] = [];
      const warnings: string[] = [];

      this.emit('mappingStarted', { intent, confidence });

      switch (intent.target) {
        case 'house':
          this.mapHouseIntent(intent, actions, warnings);
          break;
        case 'room':
          this.mapRoomIntent(intent, actions, warnings);
          break;
        case 'wall':
          this.mapWallIntent(intent, actions, warnings);
          break;
        case 'furniture':
          this.mapFurnitureIntent(intent, actions, warnings);
          break;
        default:
          warnings.push(`Target '${intent.target}' mapping not fully implemented`);
      }

      this.emit('mappingCompleted', { intent, actionsCount: actions.length, warnings });

      return {
        success: true,
        actions,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Mapping failed';
      this.emit('mappingError', { intent, error: errorMessage });
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Converte uma planta baixa completa em ações do editor.
   * Usado para compatibilidade com geradores existentes.
   */
  public mapFloorPlanToActions(floorPlan: FloorPlan): EditorActionWithMetadata[] {
    const actions: EditorActionWithMetadata[] = [];
    const metadata = {
      source: 'ai' as const,
      timestamp: Date.now(),
      description: `Load floor plan: ${floorPlan.name}`,
    };

    // Ação principal de carregar planta
    actions.push({
      action: {
        type: 'loadFloorPlan',
        payload: {
          id: floorPlan.id,
          name: floorPlan.name,
          rooms: floorPlan.rooms.map(r => ({
            id: r.id,
            points: r.points || this.rectToPoints(r as any),
            name: r.name,
            type: r.type,
          })),
          walls: floorPlan.walls.map(w => ({
            id: w.id,
            start: w.start,
            end: w.end,
            thickness: w.thickness,
            height: 2.8,
          })),
          furniture: floorPlan.furniture.map(f => ({
            id: f.id,
            type: f.type,
            position: f.position,
            rotation: f.rotation || 0,
            scale: f.scale || 1,
          })),
        },
      },
      metadata,
    });

    return actions;
  }

  private rectToPoints(rect: { x?: number; y?: number; width?: number; height?: number }): Point2D[] {
    const x = rect.x || 0;
    const y = rect.y || 0;
    const w = rect.width || 1;
    const h = rect.height || 1;
    return [
      { x, y },
      { x: x + w, y },
      { x: x + w, y: y + h },
      { x, y: y + h },
    ];
  }

  private mapHouseIntent(intent: DesignIntent, actions: EditorActionWithMetadata[], warnings: string[]): void {
    // Geração de casa completa será delegada ao gerador de planta,
    // que por sua vez produzirá ações via mapFloorPlanToActions.
    warnings.push('House generation requires floor plan generator');
  }

  private mapRoomIntent(intent: DesignIntent, actions: EditorActionWithMetadata[], warnings: string[]): void {
    const roomType = intent.specifications.roomType || 'living_room';
    const area = intent.specifications.area || 12;
    const width = Math.sqrt(area);
    const height = width;

    const points: Point2D[] = [
      { x: 0, y: 0 },
      { x: width, y: 0 },
      { x: width, y: height },
      { x: 0, y: height },
    ];

    const metadata = {
      source: 'ai' as const,
      timestamp: Date.now(),
      description: `Create ${roomType}`,
      confidence: 0.8,
    };

    actions.push({
      action: {
        type: 'createRoom',
        payload: {
          points,
          name: this.capitalize(roomType.replace('_', ' ')),
          roomType,
        },
      },
      metadata,
    });
  }

  private mapWallIntent(intent: DesignIntent, actions: EditorActionWithMetadata[], warnings: string[]): void {
    warnings.push('Wall creation from intent requires position context');
  }

  private mapFurnitureIntent(intent: DesignIntent, actions: EditorActionWithMetadata[], warnings: string[]): void {
    const furnitureType = intent.targetType || 'sofa';
    const metadata = {
      source: 'ai' as const,
      timestamp: Date.now(),
      description: `Add ${furnitureType}`,
      confidence: 0.75,
    };

    actions.push({
      action: {
        type: 'createFurniture',
        payload: {
          type: furnitureType,
          position: { x: 0, y: 0, z: 0 },
          rotation: 0,
          scale: 1,
        },
      },
      metadata,
    });

    warnings.push(`Furniture placement requires room context for positioning`);
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  public setConfidenceThreshold(threshold: number): void {
    this.confidenceThreshold = threshold;
  }
}

export const editorActionMapper = new EditorActionMapper();
