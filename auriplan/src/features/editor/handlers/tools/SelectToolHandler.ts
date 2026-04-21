import type { InteractionEvent } from '@core/interaction/InteractionEngine';
import type { GeometryController } from '@core/geometry/GeometryController';
import type { PreviewState } from '../ToolContext';
import type { ToolHandler } from '../ToolHandler';

interface SelectToolHandlerOptions {
  geometryController: GeometryController;
  onPreviewChange: (state: PreviewState) => void;
  onHoverChange?: (id: string | null) => void;
  onCursorChange?: (cursor: string) => void;
  getWalls: () => any[];
  getRooms: () => any[];
  getFurniture: () => any[];
  onSelect: (id: string, addToSelection: boolean) => void;
  onDeselectAll: () => void;
  onDelete?: (id: string) => void;
  onZoomToRoom?: (roomId: string) => void;
}

export class SelectToolHandler implements ToolHandler {
  private readonly geometryController: GeometryController;
  private readonly onPreviewChange: (state: PreviewState) => void;
  private readonly onHoverChange: (id: string | null) => void;
  private readonly onCursorChange: (cursor: string) => void;
  private previewState: PreviewState | null = null;

  constructor(options: SelectToolHandlerOptions) {
    this.geometryController = options.geometryController;
    this.onPreviewChange = options.onPreviewChange;
    this.onHoverChange = options.onHoverChange ?? (() => {});
    this.onCursorChange = options.onCursorChange ?? (() => {});
  }

  handleEvent(event: InteractionEvent): void {
    // Seleção base: manter contrato estável enquanto handlers legados são migrados.
    if (event.type === 'mousemove') {
      this.onCursorChange('default');
      this.onHoverChange(null);
    }

    if (event.type === 'mouseup') {
      this.previewState = null;
      this.onPreviewChange(this.previewState);
    }
  }

  getPreviewState(): PreviewState | null {
    return this.previewState;
  }

  reset(): void {
    this.previewState = null;
    this.onPreviewChange(this.previewState);
    this.onHoverChange(null);
    this.onCursorChange('default');
  }

  dispose(): void {
    this.reset();
    this.geometryController.endBatch();
  }
}

export default SelectToolHandler;
