
# ============================================
# 6. TOOL MANAGER (Integração dos Handlers)
# ============================================

tool_manager = '''// ============================================
// ToolManager.ts - Orquestração de ferramentas
// Integra GeometryController com Handlers
// ============================================

import type { InteractionEvent } from '@core/interaction/InteractionEngine';
import type { GeometryController } from '@core/geometry/GeometryController';
import type { WallToolHandler } from './tools/WallToolHandler';
import type { SelectToolHandler } from './tools/SelectToolHandler';
import type { RoomToolHandler } from './tools/RoomToolHandler';
import type { PreviewState } from './ToolContext';

export type ToolType = 'select' | 'wall' | 'room' | 'door' | 'window' | 'furniture';

export interface ToolManagerOptions {
  geometryController: GeometryController;
  onPreviewChange: (state: PreviewState) => void;
  onToolChange?: (tool: ToolType) => void;
}

export class ToolManager {
  private geometryController: GeometryController;
  private onPreviewChange: (state: PreviewState) => void;
  private onToolChange?: (tool: ToolType) => void;
  
  private currentTool: ToolType = 'select';
  private handlers: Map<ToolType, WallToolHandler | SelectToolHandler | RoomToolHandler | null> = new Map();
  private currentHandler: WallToolHandler | SelectToolHandler | RoomToolHandler | null = null;

  constructor(options: ToolManagerOptions) {
    this.geometryController = options.geometryController;
    this.onPreviewChange = options.onPreviewChange;
    this.onToolChange = options.onToolChange;
    
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
        const WallToolHandlerClass = require('./tools/WallToolHandler').WallToolHandler;
        const handler = new WallToolHandlerClass(
          this.geometryController,
          this.onPreviewChange
        );
        this.handlers.set('wall', handler);
        break;
      }
      case 'select': {
        // SelectToolHandler requer callbacks adicionais - deve ser configurado externamente
        // ou usar factory method
        break;
      }
      case 'room': {
        const RoomToolHandlerClass = require('./tools/RoomToolHandler').RoomToolHandler;
        const handler = new RoomToolHandlerClass(
          this.geometryController,
          this.onPreviewChange
        );
        this.handlers.set('room', handler);
        break;
      }
    }
  }

  /**
   * Configura o SelectToolHandler com callbacks do store
   */
  configureSelectHandler(options: {
    onHoverChange: (id: string | null) => void;
    onCursorChange: (cursor: string) => void;
    getTopology: () => any;
    getWalls: () => any[];
    getRooms: () => any[];
    getFurniture: () => any[];
    onSelect: (id: string, addToSelection: boolean) => void;
    onDeselectAll: () => void;
    onZoomToRoom: (roomId: string) => void;
  }): void {
    const SelectToolHandlerClass = require('./tools/SelectToolHandler').SelectToolHandler;
    const handler = new SelectToolHandlerClass({
      geometryController: this.geometryController,
      onPreviewChange: this.onPreviewChange,
      ...options
    });
    this.handlers.set('select', handler);
    
    if (this.currentTool === 'select') {
      this.currentHandler = handler;
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
   * Verifica se está em modo de desenho
   */
  isDrawing(): boolean {
    const preview = this.getPreviewState();
    return preview !== null;
  }
}

export default ToolManager;
