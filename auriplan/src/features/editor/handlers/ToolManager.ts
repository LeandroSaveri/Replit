// ============================================
// ToolManager.ts - Orquestração de ferramentas
// Integra GeometryController com Handlers 
// ============================================

import type { InteractionEvent } from '@core/interaction/InteractionEngine';
import type { GeometryController } from '@core/geometry/GeometryController';
import type { PreviewState } from './ToolContext';
import type { Tool } from '@auriplan-types';

export type ToolType = Tool;

export interface ToolManagerOptions {
  geometryController: GeometryController;
  onPreviewChange: (state: PreviewState) => void;
  onHoverChange?: (id: string | null) => void;
  onCursorChange?: (cursor: string) => void;
  onToolChange?: (tool: ToolType) => void;
  // Callbacks do store para SelectToolHandler
  getWalls: () => any[];
  getRooms: () => any[];
  getFurniture: () => any[];
  onSelect: (id: string, addToSelection: boolean) => void;
  onDeselectAll: () => void;
  onDelete?: (id: string) => void;
  onZoomToRoom?: (roomId: string) => void;
}

export class ToolManager {
  private geometryController: GeometryController;
  private onPreviewChange: (state: PreviewState) => void;
  private onHoverChange: (id: string | null) => void;
  private onCursorChange: (cursor: string) => void;
  private onToolChange?: (tool: ToolType) => void;
  
  private currentTool: ToolType = 'select';
  private handlers: Map<ToolType, any> = new Map();
  private currentHandler: any = null;

  // Store callbacks
  private getWalls: () => any[];
  private getRooms: () => any[];
  private getFurniture: () => any[];
  private onSelect: (id: string, addToSelection: boolean) => void;
  private onDeselectAll: () => void;
  private onDelete: (id: string) => void;
  private onZoomToRoom: (roomId: string) => void;

  constructor(options: ToolManagerOptions) {
    this.geometryController = options.geometryController;
    this.onPreviewChange = options.onPreviewChange;
    this.onHoverChange = options.onHoverChange || (() => {});
    this.onCursorChange = options.onCursorChange || (() => {});
    this.onToolChange = options.onToolChange;
    
    // Store callbacks
    this.getWalls = options.getWalls;
    this.getRooms = options.getRooms;
    this.getFurniture = options.getFurniture;
    this.onSelect = options.onSelect;
    this.onDeselectAll = options.onDeselectAll;
    this.onDelete = options.onDelete || (() => {});
    this.onZoomToRoom = options.onZoomToRoom || (() => {});
    
    this.initializeHandlers();
  }

  private initializeHandlers(): void {
    // Inicializa handlers sob demanda
    this.handlers.set('select', null);
    this.handlers.set('wall', null);
    this.handlers.set('room', null);
    this.handlers.set('door', null);
    this.handlers.set('window', null);
    this.handlers.set('furniture', null);
    this.handlers.set('measure', null);
  }

  /**
   * Define a ferramenta ativa
   */
  setTool(tool: ToolType): void {
    // Reseta handler anterior
    if (this.currentHandler) {
      this.currentHandler.reset();
    }

    this.currentTool = tool;
    
    // Lazy load dos handlers
    if (!this.handlers.get(tool)) {
      this.createHandler(tool);
    }
    
    this.currentHandler = this.handlers.get(tool) || null;
    
    if (this.onToolChange) {
      this.onToolChange(tool);
    }
  }

  /**
   * Cria handler sob demanda
   */
  private createHandler(tool: ToolType): void {
    switch (tool) {
      case 'wall': {
        const { WallToolHandler } = require('./tools/WallToolHandler');
        const handler = new WallToolHandler(
          this.geometryController,
          this.onPreviewChange
        );
        this.handlers.set('wall', handler);
        break;
      }
      case 'select': {
        const { SelectToolHandler } = require('./tools/SelectToolHandler');
        const handler = new SelectToolHandler({
          geometryController: this.geometryController,
          onPreviewChange: this.onPreviewChange,
          onHoverChange: this.onHoverChange,
          onCursorChange: this.onCursorChange,
          getWalls: this.getWalls,
          getRooms: this.getRooms,
          getFurniture: this.getFurniture,
          onSelect: this.onSelect,
          onDeselectAll: this.onDeselectAll,
          onDelete: this.onDelete,
          onZoomToRoom: this.onZoomToRoom,
        });
        this.handlers.set('select', handler);
        break;
      }
      case 'room': {
        const { RoomToolHandler } = require('./tools/RoomToolHandler');
        const handler = new RoomToolHandler(
          this.geometryController,
          this.onPreviewChange
        );
        this.handlers.set('room', handler);
        break;
      }
    }
  }

  /**
   * Processa evento de interação
   */
  handleEvent(event: InteractionEvent): void {
    if (this.currentHandler) {
      this.currentHandler.handleEvent(event);
    }
  }

  /**
   * Obtém estado de preview atual
   */
  getPreviewState(): PreviewState | null {
    if (this.currentHandler) {
      return this.currentHandler.getPreviewState();
    }
    return null;
  }

  /**
   * Reseta ferramenta atual
   */
  resetCurrentTool(): void {
    if (this.currentHandler) {
      this.currentHandler.reset();
    }
  }

  /**
   * Obtém ferramenta atual
   */
  getCurrentTool(): ToolType {
    return this.currentTool;
  }

  /**
   * Obtém handler atual
   */
  getCurrentHandler(): any {
    return this.currentHandler;
  }

  /**
   * Verifica se está em modo de desenho
   */
  isDrawing(): boolean {
    const preview = this.getPreviewState();
    return preview !== null;
  }
}

export default ToolManager;
