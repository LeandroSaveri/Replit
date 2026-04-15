// ============================================================
// WallToolHandler — click-to-click (MagicPlan style)
// Fase 4.1: Acumula paredes e aplica pipeline apenas ao finalizar
// ============================================================

import type { InteractionEvent } from '@core/interaction/InteractionEngine';
import type { ToolHandler } from '../ToolHandler';
import type { PreviewState } from '../ToolContext';
import type { EditorStore } from '@store/editorStore';
import { SnapSolver } from '@core/snap/SnapSolver';
import type { Vec2 } from '@auriplan-types';

const MIN_WALL_LENGTH = 0.05;

type Mode = 'idle' | 'drawing';

export class WallToolHandler implements ToolHandler {
  private mode: Mode = 'idle';
  private startPoint: Vec2 | null = null;
  private currentPoint: Vec2 | null = null;
  private segmentStartHistory: Vec2[] = [];
  private pendingWalls: Array<{ start: Vec2; end: Vec2 }> = []; // Acumula paredes
  private store: EditorStore;
  private onPreviewChange: (state: PreviewState) => void;

  constructor(store: EditorStore, onPreviewChange: (state: PreviewState) => void) {
    this.store = store;
    this.onPreviewChange = onPreviewChange;
  }

  handleEvent(event: InteractionEvent): void {
    switch (event.type) {
      case 'mousedown': this.onDown(event); break;
      case 'mousemove': this.onMove(event); break;
      case 'mouseup': break;
      case 'dblclick': this.onDoubleClick(event); break;
      case 'keydown': this.onKey(event); break;
    }
  }

  reset(): void {
    // Se houver paredes pendentes, aplica em lote antes de resetar
    if (this.pendingWalls.length > 0) {
      this.store.getState().addWallsBatch(this.pendingWalls);
    }
    this.mode = 'idle';
    this.startPoint = null;
    this.currentPoint = null;
    this.segmentStartHistory = [];
    this.pendingWalls = [];
    this.onPreviewChange(null);
  }

  getPreviewState(): PreviewState | null {
    if (this.mode !== 'drawing' || !this.startPoint || !this.currentPoint) return null;
    return { type: 'wall', start: this.startPoint, end: this.currentPoint };
  }

  private onDown(event: InteractionEvent): void {
    const snapped = this.snap(event);

    if (this.mode === 'idle') {
      this.startPoint = snapped;
      this.currentPoint = snapped;
      this.mode = 'drawing';
      this.segmentStartHistory = [snapped];
      this.pendingWalls = [];
      this.updatePreview();
      return;
    }

    if (!this.startPoint) { this.reset(); return; }
    const end = this.snap(event, this.startPoint);
    const length = Math.hypot(end[0] - this.startPoint[0], end[1] - this.startPoint[1]);

    if (length >= MIN_WALL_LENGTH) {
      // Acumula para aplicação posterior
      this.pendingWalls.push({ start: this.startPoint, end });
      // Atualiza preview imediatamente (usando live update)
      this.store.getState()._liveUpdateWallsBatch(
        this.pendingWalls.map((w, idx) => ({
          id: `preview-${idx}`, // ID fictício, não usado de fato
          start: w.start,
          end: w.end,
        }))
      );
      this.segmentStartHistory.push(end);
      this.startPoint = end;
      this.currentPoint = end;
      this.updatePreview();
    }
  }

  private onMove(event: InteractionEvent): void {
    if (this.mode !== 'drawing' || !this.startPoint) return;
    let pos = event.position;
    if (event.modifiers.includes('shift')) {
      const dx = pos[0] - this.startPoint[0];
      const dy = pos[1] - this.startPoint[1];
      if (Math.abs(dx) > Math.abs(dy)) {
        pos = [this.startPoint[0] + dx, this.startPoint[1]];
      } else {
        pos = [this.startPoint[0], this.startPoint[1] + dy];
      }
    }
    const snapResult = this.snapWithDetails(event, this.startPoint);
    this.currentPoint = snapResult.point;
    this.updatePreview(snapResult.point, snapResult.type);
  }

  private onDoubleClick(_event: InteractionEvent): void {
    // Finaliza e aplica todas as paredes acumuladas
    if (this.pendingWalls.length > 0) {
      this.store.getState().addWallsBatch(this.pendingWalls);
    }
    this.reset();
  }

  private onKey(event: InteractionEvent): void {
    if (event.key === 'Escape') {
      // Cancela sem aplicar
      this.mode = 'idle';
      this.startPoint = null;
      this.currentPoint = null;
      this.segmentStartHistory = [];
      this.pendingWalls = [];
      this.onPreviewChange(null);
    }
    if (event.key === 'Enter') {
      // Finaliza e aplica
      if (this.pendingWalls.length > 0) {
        this.store.getState().addWallsBatch(this.pendingWalls);
      }
      this.reset();
    }
    if (event.key === 'Backspace' && this.segmentStartHistory.length > 1) {
      // Remove última parede pendente
      this.pendingWalls.pop();
      this.segmentStartHistory.pop();
      const prev = this.segmentStartHistory[this.segmentStartHistory.length - 1];
      this.startPoint = prev;
      this.currentPoint = prev;
      this.updatePreview();
      // Atualiza preview com as paredes restantes
      if (this.pendingWalls.length > 0) {
        this.store.getState()._liveUpdateWallsBatch(
          this.pendingWalls.map((w, idx) => ({
            id: `preview-${idx}`,
            start: w.start,
            end: w.end,
          }))
        );
      } else {
        this.store.getState()._liveUpdateWallsBatch([]);
      }
    }
  }

  private updatePreview(snapPoint?: Vec2, snapType?: any): void {
    const baseState = this.getPreviewState();
    if (!baseState) {
      this.onPreviewChange(null);
      return;
    }
    const preview: PreviewState = {
      ...baseState,
      snapPoint: snapPoint ?? this.currentPoint ?? undefined,
      snapType: snapType ?? undefined,
    };
    this.onPreviewChange(preview);
  }

  private snap(event: InteractionEvent, startPoint?: Vec2): Vec2 {
    return this.snapWithDetails(event, startPoint).point;
  }

  private snapWithDetails(event: InteractionEvent, startPoint?: Vec2): { point: Vec2; type: any } {
    const state = this.store.getState();
    const scene = state.scenes.find(s => s.id === state.currentSceneId);
    const walls = scene?.walls ?? [];
    const snapConfig = state.snap;
    const gridSize = state.grid.size;
    const zoom = event.viewportZoom ?? 1;

    const options = {
      gridSize,
      snapTol: snapConfig.distance,
      enableGrid: snapConfig.grid,
      enableVertex: snapConfig.endpoints,
      enableMidpoint: snapConfig.midpoints,
      enableIntersection: snapConfig.edges,
      enableWall: snapConfig.perpendicular,
      enableAngle: snapConfig.angle,
      zoom,
    };
    const result = SnapSolver.computeSnap(event.position, walls, startPoint, options);
    return { point: result.point, type: result.type };
  }
}
