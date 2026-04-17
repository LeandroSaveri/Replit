
# ============================================
# 3. WALL TOOL HANDLER REFATORADO
# ============================================

wall_tool_handler = '''// ============================================
// WallToolHandler.ts - Desenho de paredes
// Refatorado para usar GeometryController
// ============================================

import type { InteractionEvent } from '@core/interaction/InteractionEngine';
import type { ToolHandler } from '../ToolHandler';
import type { PreviewState } from '../ToolContext';
import type { GeometryController } from '@core/geometry/GeometryController';
import type { Vec2 } from '@auriplan-types';

const MIN_WALL_LENGTH = 0.05;

export type WallToolMode = 'idle' | 'dragging';

export interface WallToolState {
  mode: WallToolMode;
  startPoint: Vec2 | null;
  currentPoint: Vec2 | null;
}

export class WallToolHandler implements ToolHandler {
  private mode: WallToolMode = 'idle';
  private startPoint: Vec2 | null = null;
  private currentPoint: Vec2 | null = null;
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
    return {
      type: 'wall',
      start: this.startPoint,
      end: this.currentPoint,
    };
  }

  // ============================================
  // HANDLERS DE EVENTO
  // ============================================

  private onPointerDown(event: InteractionEvent): void {
    if (this.mode !== 'idle') return;
    
    // Usa GeometryController para snap
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

    // Usa GeometryController para snap com contexto (startPoint)
    const snapResult = this.snapWithDetails(pos, this.startPoint);
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
      // ✅ USA GEOMETRY CONTROLLER - não chama store diretamente
      this.geometryController.addWall(start, end);
    }

    this.reset();
  }

  private onKeyDown(event: InteractionEvent): void {
    if (event.key === 'Escape') {
      this.reset();
    }
  }

  // ============================================
  // SNAP (via GeometryController)
  // ============================================

  private snap(event: InteractionEvent): Vec2 {
    return this.geometryController.snapPoint(event.position);
  }

  private snapWithDetails(point: Vec2, startPoint?: Vec2): { point: Vec2; type: any } {
    const result = this.geometryController.computeSnap(point, startPoint);
    return { point: result.point, type: result.type };
  }

  // ============================================
  // PREVIEW
  // ============================================

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
}

export default WallToolHandler;
