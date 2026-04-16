// src/features/editor/handlers/tools/WallToolHandler.ts
// Com snap forte ao grid e ortogonal

import type { InteractionEvent } from '@core/interaction/InteractionEngine';
import type { ToolHandler } from '../ToolHandler';
import type { PreviewState } from '../ToolContext';
import type { EditorStore } from '@store/editorStore';
import { SnapSolver } from '@core/snap/SnapSolver';
import type { Vec2 } from '@auriplan-types';

const MIN_WALL_LENGTH = 0.05;

type Mode = 'idle' | 'dragging';

export class WallToolHandler implements ToolHandler {
  private mode: Mode = 'idle';
  private startPoint: Vec2 | null = null;
  private currentPoint: Vec2 | null = null;
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
      case 'mouseup':
        this.onPointerUp(event);
        break;
      case 'keydown':
        this.onKeyDown(event);
        break;
    }
  }

  reset(): void {
    this.mode = 'idle';
    this.startPoint = null;
    this.currentPoint = null;
    this.onPreviewChange(null);
  }

  getPreviewState(): PreviewState | null {
    if (this.mode !== 'dragging' || !this.startPoint || !this.currentPoint) return null;
    return { type: 'wall', start: this.startPoint, end: this.currentPoint };
  }

  private onPointerDown(event: InteractionEvent): void {
    if (this.mode !== 'idle') return;
    const snapped = this.snap(event);
    this.startPoint = snapped;
    this.currentPoint = snapped;
    this.mode = 'dragging';
    this.updatePreview();
  }

  private onPointerMove(event: InteractionEvent): void {
    if (this.mode !== 'dragging' || !this.startPoint) return;

    let pos = event.position;
    // Snap ortogonal com Shift
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

  private onPointerUp(event: InteractionEvent): void {
    if (this.mode !== 'dragging' || !this.startPoint || !this.currentPoint) {
      this.reset();
      return;
    }

    const start = this.startPoint;
    const end = this.currentPoint;
    const length = Math.hypot(end[0] - start[0], end[1] - start[1]);

    if (length >= MIN_WALL_LENGTH) {
      this.store.getState().addWallsBatch([{ start, end }]);
    }

    this.reset();
  }

  private onKeyDown(event: InteractionEvent): void {
    if (event.key === 'Escape') {
      this.reset();
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
      enableGrid: true,               // força grid sempre ligado para alinhar
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
