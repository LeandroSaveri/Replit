import type { InteractionEvent } from '@core/interaction/InteractionEngine';
import type { GeometryController } from '@core/geometry/GeometryController';
import type { Vec2 } from '@auriplan-types';
import type { PreviewState } from '../ToolContext';
import type { ToolHandler } from '../ToolHandler';

export class WallToolHandler implements ToolHandler {
  private readonly geometryController: GeometryController;
  private readonly onPreviewChange: (state: PreviewState) => void;
  private startPoint: Vec2 | null = null;
  private previewState: PreviewState | null = null;

  constructor(geometryController: GeometryController, onPreviewChange: (state: PreviewState) => void) {
    this.geometryController = geometryController;
    this.onPreviewChange = onPreviewChange;
  }

  handleEvent(event: InteractionEvent): void {
    const pos = event.worldPosition ?? event.position;

    if (event.type === 'mousedown') {
      this.startPoint = pos;
      this.previewState = { type: 'wall', start: pos, end: pos };
      this.onPreviewChange(this.previewState);
      return;
    }

    if (event.type === 'mousemove' && this.startPoint) {
      this.previewState = { type: 'wall', start: this.startPoint, end: pos };
      this.onPreviewChange(this.previewState);
      return;
    }

    if (event.type === 'mouseup' && this.startPoint) {
      this.geometryController.addWall(this.startPoint, pos);
      this.reset();
    }
  }

  getPreviewState(): PreviewState | null {
    return this.previewState;
  }

  reset(): void {
    this.startPoint = null;
    this.previewState = null;
    this.onPreviewChange(this.previewState);
  }
}

export default WallToolHandler;
