// ============================================================
// CAMINHO: src/features/editor/handlers/tools/RoomToolHandler.ts
// FUNCIONALIDADE: Implementa a ferramenta de desenho de cômodos
// por polígono (cliques) e oferece formas prontas.
// OBJETO: Criar paredes a partir de um polígono fechado.
// ============================================================

import type { InteractionEvent } from '@core/interaction/InteractionEngine';
import type { ToolHandler } from '../ToolHandler';
import type { PreviewState } from '../ToolContext';
import type { EditorStore } from '@store/editorStore';
import { SnapSolver } from '@core/snap/SnapSolver';
import type { Vec2 } from '@auriplan-types';

const LAST_POINT_CONNECT_TOLERANCE = 0.4;

// Formas prontas (relativas ao centro)
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
  private store: EditorStore;
  private onPreviewChange: (state: PreviewState) => void;

  constructor(store: EditorStore, onPreviewChange: (state: PreviewState) => void) {
    this.store = store;
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

  insertShape(shapeName: string, position: Vec2): void {
    const shape = ROOM_SHAPES.find(s => s.name === shapeName);
    if (!shape) return;
    const transformedPoints = shape.points.map(p => [p[0] + position[0], p[1] + position[1]] as Vec2);
    const state = this.store.getState();
    state.createWallsFromPolygon(transformedPoints);
  }

  private onPointerDown(event: InteractionEvent): void {
    const snapped = this.computeSnap(event.position);
    if (!this.isDrawing) {
      this.isDrawing = true;
      this.vertices = [snapped];
      this.previewPoint = snapped;
    } else {
      const first = this.vertices[0];
      const dist = Math.hypot(snapped[0] - first[0], snapped[1] - first[1]);
      if (this.vertices.length >= 3 && dist < LAST_POINT_CONNECT_TOLERANCE) {
        const closedPolygon = [...this.vertices, first];
        const state = this.store.getState();
        state.createWallsFromPolygon(closedPolygon);
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
    const snapped = this.computeSnap(event.position);
    this.previewPoint = snapped;
    this.updatePreview();
  }

  private onKeyDown(event: InteractionEvent): void {
    if (event.key === 'Escape') this.reset();
    if (event.key === 'Enter' && this.isDrawing && this.vertices.length >= 3) {
      const closedPolygon = [...this.vertices, this.vertices[0]];
      const state = this.store.getState();
      state.createWallsFromPolygon(closedPolygon);
      this.reset();
    }
  }

  private updatePreview(): void {
    this.onPreviewChange(this.getPreviewState());
  }

  private computeSnap(point: Vec2): Vec2 {
    const state = this.store.getState();
    const scene = state.scenes.find(s => s.id === state.currentSceneId);
    const walls = scene?.walls ?? [];
    const snapConfig = state.snap;
    const gridSize = state.grid.size;
    const scale = 80;
    const options = {
      gridSize,
      snapTol: snapConfig.distance / scale,
      enableGrid: snapConfig.grid,
      enableVertex: snapConfig.endpoints,
      enableMidpoint: snapConfig.midpoints,
      enableIntersection: snapConfig.edges,
      enableWall: snapConfig.perpendicular,
      enableAngle: snapConfig.angle,
      zoom: scale,
    };
    return SnapSolver.computeSnap(point, walls, undefined, options).point;
  }
}
