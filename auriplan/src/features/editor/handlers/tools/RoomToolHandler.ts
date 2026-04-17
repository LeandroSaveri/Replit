// ============================================
// RoomToolHandler.ts - Ferramenta de desenho de cômodos
// Refatorado para usar GeometryController
// ============================================

import type { InteractionEvent } from '@core/interaction/InteractionEngine';
import type { ToolHandler } from '../ToolHandler';
import type { PreviewState } from '../ToolContext';
import type { GeometryController } from '@core/geometry/GeometryController';
import type { Vec2 } from '@auriplan-types';

const LAST_POINT_CONNECT_TOLERANCE = 0.4;

export type RoomToolMode = 'idle' | 'drawing';

export interface RoomToolState {
  isDrawing: boolean;
  vertices: Vec2[];
  previewPoint: Vec2 | null;
}

// Formas prontas para inserção rápida
export const ROOM_SHAPES = [
  { name: 'Quadrado 5x5', points: [[-2.5,-2.5],[2.5,-2.5],[2.5,2.5],[-2.5,2.5]] },
  { name: 'Retângulo 6x4', points: [[-3,-2],[3,-2],[3,2],[-3,2]] },
  { name: 'Quarto 4x4', points: [[-2,-2],[2,-2],[2,2],[-2,2]] },
  { name: 'Cozinha 3x4', points: [[-1.5,-2],[1.5,-2],[1.5,2],[-1.5,2]] },
  { name: 'Formato L', points: [[-3,-2],[0,-2],[0,0],[3,0],[3,2],[-3,2]] },
  { name: 'Formato U', points: [[-3,-2],[3,-2],[3,0],[1,0],[1,2],[-1,2],[-1,0],[-3,0]] },
  { name: 'Formato T', points: [[-3,-2],[3,-2],[3,0],[1,0],[1,2],[-1,2],[-1,0],[-3,0]] },
];

export class RoomToolHandler implements ToolHandler {
  private isDrawing = false;
  private vertices: Vec2[] = [];
  private previewPoint: Vec2 | null = null;
  private geometryController: GeometryController;
  private onPreviewChange: (state: PreviewState) => void;

  constructor(
    geometryController: GeometryController,
    onPreviewChange: (state: PreviewState) => void
  ) {
    this.geometryController = geometryController;
    this.onPreviewChange = onPreviewChange;
  }

  handleEvent(event: InteractionEvent): void {
    switch (event.type) {
      case 'mousedown':
        this.onPointerDown(event);
        break;
      case 'mousemove':
        this.onPointerMove(event);
        break;
      case 'keydown':
        this.onKeyDown(event);
        break;
    }
  }

  reset(): void {
    this.isDrawing = false;
    this.vertices = [];
    this.previewPoint = null;
    this.onPreviewChange(null);
  }

  getPreviewState(): PreviewState | null {
    if (!this.isDrawing) return null;
    return {
      type: 'polygon',
      vertices: this.vertices,
      previewPoint: this.previewPoint,
    };
  }

  /**
   * Insere uma forma pré-definida de cômodo
   */
  insertShape(shapeName: string, position: Vec2, thickness: number = 0.15): void {
    const shape = ROOM_SHAPES.find(s => s.name === shapeName);
    if (!shape) return;
    
    const transformedPoints = shape.points.map(p => [
      p[0] + position[0], 
      p[1] + position[1]
    ] as Vec2);
    
    // ✅ USA GEOMETRY CONTROLLER - cria paredes do polígono
    this.geometryController.createWallsFromPolygon(transformedPoints, thickness);
  }

  // ============================================
  // HANDLERS DE EVENTO
  // ============================================

  private onPointerDown(event: InteractionEvent): void {
    // Usa GeometryController para snap
    const snapped = this.computeSnap(event.position);
    
    if (!this.isDrawing) {
      this.isDrawing = true;
      this.vertices = [snapped];
      this.previewPoint = snapped;
    } else {
      const first = this.vertices[0];
      const dist = Math.hypot(snapped[0] - first[0], snapped[1] - first[1]);
      
      if (this.vertices.length >= 3 && dist < LAST_POINT_CONNECT_TOLERANCE) {
        // Fecha o polígono e cria paredes
        const closedPolygon = [...this.vertices, first];
        
        // ✅ USA GEOMETRY CONTROLLER
        this.geometryController.createWallsFromPolygon(closedPolygon);
        this.reset();
      } else {
        this.vertices.push(snapped);
        this.previewPoint = snapped;
      }
    }
    
    this.updatePreview();
  }

  private onPointerMove(event: InteractionEvent): void {
    if (!this.isDrawing) return;
    
    // Usa GeometryController para snap
    const snapped = this.computeSnap(event.position);
    this.previewPoint = snapped;
    
    this.updatePreview();
  }

  private onKeyDown(event: InteractionEvent): void {
    if (event.key === 'Escape') {
      this.reset();
    }
    
    if (event.key === 'Enter' && this.isDrawing && this.vertices.length >= 3) {
      // Fecha o polígono com Enter
      const closedPolygon = [...this.vertices, this.vertices[0]];
      
      // ✅ USA GEOMETRY CONTROLLER
      this.geometryController.createWallsFromPolygon(closedPolygon);
      this.reset();
    }
  }

  // ============================================
  // SNAP (via GeometryController)
  // ============================================

  private computeSnap(point: Vec2): Vec2 {
    // Usa o GeometryController para snap centralizado
    return this.geometryController.snapPoint(point);
  }

  // ============================================
  // PREVIEW
  // ============================================

  private updatePreview(): void {
    this.onPreviewChange(this.getPreviewState());
  }
}

export default RoomToolHandler;
