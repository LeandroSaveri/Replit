// ============================================================
// WallToolHandler — click-to-click (MagicPlan style)
// Flow: click(1) = set start → move = preview → click(2) = commit + new start
// Escape / Enter / double-click = finish
// ============================================================

import type { InteractionEvent } from '@core/interaction/InteractionEngine';
import type { ToolHandler } from '../ToolHandler';
import type { PreviewState } from '../ToolContext';
import type { EditorStore } from '@store/editorStore';
import { SnapSolver } from '@core/snap/SnapSolver';
import type { Vec2 } from '@auriplan-types';

const MIN_WALL_LENGTH = 0.05;
const CLOSE_TOLERANCE = 0.3; // world-units to snap back to start

type Mode = 'idle' | 'drawing';

export class WallToolHandler implements ToolHandler {
  private mode: Mode = 'idle';
  private startPoint: Vec2 | null = null;
  private currentPoint: Vec2 | null = null;
  private segmentStartHistory: Vec2[] = []; // history of segment starts (for chain drawing)
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
      case 'mouseup': break; // ignored — we use click-to-click
      case 'dblclick': this.onDoubleClick(event); break;
      case 'keydown': this.onKey(event); break;
    }
  }

  reset(): void {
    this.mode = 'idle';
    this.startPoint = null;
    this.currentPoint = null;
    this.segmentStartHistory = [];
    this.onPreviewChange(null);
  }

  getPreviewState(): PreviewState | null {
    if (this.mode !== 'drawing' || !this.startPoint || !this.currentPoint) return null;
    return { type: 'wall', start: this.startPoint, end: this.currentPoint };
  }

  private onDown(event: InteractionEvent): void {
    const snapped = this.snap(event.position);

    if (this.mode === 'idle') {
      // First click: set start point and enter drawing mode
      this.startPoint = snapped;
      this.currentPoint = snapped;
      this.mode = 'drawing';
      this.segmentStartHistory = [snapped];
      this.updatePreview();
      return;
    }

    // Already drawing: commit this segment
    if (!this.startPoint) { this.reset(); return; }
    const end = this.snap(event.position, this.startPoint);
    const length = Math.hypot(end[0] - this.startPoint[0], end[1] - this.startPoint[1]);

    if (length >= MIN_WALL_LENGTH) {
      this.store.getState().addWall(this.startPoint, end);
      this.segmentStartHistory.push(end);
      this.startPoint = end; // continue chain from this point
      this.currentPoint = end;
      this.updatePreview();
    }
    // If too short, ignore (still in drawing mode)
  }

  private onMove(event: InteractionEvent): void {
    if (this.mode !== 'drawing' || !this.startPoint) return;
    let pos = event.position;
    // Orthogonal constraint (Shift)
    if (event.modifiers.includes('shift')) {
      const dx = pos[0] - this.startPoint[0];
      const dy = pos[1] - this.startPoint[1];
      if (Math.abs(dx) > Math.abs(dy)) {
        pos = [this.startPoint[0] + dx, this.startPoint[1]];
      } else {
        pos = [this.startPoint[0], this.startPoint[1] + dy];
      }
    }
    this.currentPoint = this.snap(pos, this.startPoint);
    this.updatePreview();
  }

  private onDoubleClick(_event: InteractionEvent): void {
    this.reset();
  }

  private onKey(event: InteractionEvent): void {
    if (event.key === 'Escape' || event.key === 'Enter') {
      this.reset();
    }
    // Ctrl+Z while drawing: undo last segment and go back one step
    if (event.key === 'Backspace' && this.segmentStartHistory.length > 1) {
      this.segmentStartHistory.pop();
      const prev = this.segmentStartHistory[this.segmentStartHistory.length - 1];
      this.startPoint = prev;
      this.currentPoint = prev;
      this.store.getState().undo();
      this.updatePreview();
    }
  }

  private updatePreview(): void {
    this.onPreviewChange(this.getPreviewState());
  }

  private snap(point: Vec2, startPoint?: Vec2): Vec2 {
    const state = this.store.getState();
    const scene = state.scenes.find(s => s.id === state.currentSceneId);
    const walls = scene?.walls ?? [];
    const snapConfig = state.snap;
    const gridSize = state.grid.size;
    const scale = 60;
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
    return SnapSolver.computeSnap(point, walls, startPoint, options).point;
  }
}
