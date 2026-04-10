/**
 * EditorActionMapper - Mapeador de Ações do Editor
 * Responsável por converter o resultado da IA em comandos da engine do editor
 */

import { EventEmitter } from '../utils/EventEmitter';
// Engine type (minimal interface for type compatibility)
interface Engine {
  addWall?: (start: any, end: any, options?: any) => string;
  addRoom?: (points: any[], options?: any) => string;
  addFurniture?: (type: string, position: any, options?: any) => string;
  getStore?: () => any;
  [key: string]: any;
}

// FloorPlan type (compatible with generated floor plans)  
interface FloorPlan {
  id: string;
  name: string;
  rooms: Array<{ id: string; name: string; type: string; x?: number; y?: number; width?: number; height?: number; points?: any[]; [key: string]: any }>;
  walls: Array<{ id: string; start: any; end: any; thickness: number; [key: string]: any }>;
  furniture: Array<{ id: string; type: string; x?: number; y?: number; [key: string]: any }>;
}



// Types
interface Point { x: number; y: number; }
interface Room { id: string; name: string; type: string; x: number; y: number; width: number; height: number; }
interface Wall { id: string; start: Point; end: Point; thickness: number; }
interface Furniture { id: string; type: string; name?: string; x: number; y: number; rotation: number; scale: number; [key: string]: any; }

export interface EditorAction {
  type: 'createRoom' | 'createWall' | 'createFurniture' | 'modifyRoom' | 'deleteElement' | 'moveElement' | 'setMaterial';
  payload: any;
  metadata?: {
    description: string;
    source: 'ai';
    timestamp: number;
  };
}

export interface ActionResult {
  success: boolean;
  action?: EditorAction;
  error?: string;
  affectedElements?: string[];
}

export interface BatchActionResult {
  success: boolean;
  results: ActionResult[];
  completed: number;
  failed: number;
}

export class EditorActionMapper extends EventEmitter {
  private engine: Engine | null = null;
  private actionHistory: EditorAction[] = [];
  private maxHistorySize = 100;

  /**
   * Conecta com a engine do editor
   */
  public connect(engine: Engine): void {
    this.engine = engine;
    this.emit('connected', engine);
  }

  /**
   * Desconecta da engine
   */
  public disconnect(): void {
    this.engine = null;
    this.emit('disconnected');
  }

  /**
   * Verifica se está conectado à engine
   */
  public isConnected(): boolean {
    return this.engine !== null;
  }

  /**
   * Converte uma planta baixa gerada em ações do editor
   */
  public mapFloorPlanToActions(floorPlan: FloorPlan): EditorAction[] {
    const actions: EditorAction[] = [];

    // Mapear cômodos
    for (const room of floorPlan.rooms) {
      actions.push(this.createRoomAction(room as Room));
    }

    // Mapear paredes
    for (const wall of floorPlan.walls) {
      actions.push(this.createWallAction(wall));
    }

    // Mapear móveis
    for (const furniture of floorPlan.furniture) {
      actions.push(this.createFurnitureAction(furniture as Furniture));
    }

    return actions;
  }

  /**
   * Executa uma ação no editor
   */
  public async executeAction(action: EditorAction): Promise<ActionResult> {
    if (!this.engine) {
      return {
        success: false,
        error: 'Engine not connected',
      };
    }

    try {
      this.emit('actionStarted', action);

      let result: ActionResult;

      switch (action.type) {
        case 'createRoom':
          result = await this.executeCreateRoom(action.payload);
          break;
        case 'createWall':
          result = await this.executeCreateWall(action.payload);
          break;
        case 'createFurniture':
          result = await this.executeCreateFurniture(action.payload);
          break;
        case 'modifyRoom':
          result = await this.executeModifyRoom(action.payload);
          break;
        case 'deleteElement':
          result = await this.executeDeleteElement(action.payload);
          break;
        case 'moveElement':
          result = await this.executeMoveElement(action.payload);
          break;
        case 'setMaterial':
          result = await this.executeSetMaterial(action.payload);
          break;
        default:
          result = {
            success: false,
            error: `Unknown action type: ${action.type}`,
          };
      }

      if (result.success) {
        this.addToHistory(action);
        this.emit('actionCompleted', { action, result });
      } else {
        this.emit('actionFailed', { action, error: result.error });
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Action execution failed';

      this.emit('actionFailed', { action, error: errorMessage });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Executa múltiplas ações em batch
   */
  public async executeBatch(actions: EditorAction[]): Promise<BatchActionResult> {
    const results: ActionResult[] = [];
    let completed = 0;
    let failed = 0;

    this.emit('batchStarted', { total: actions.length });

    for (const action of actions) {
      const result = await this.executeAction(action);
      results.push(result);

      if (result.success) {
        completed++;
      } else {
        failed++;
      }
    }

    const batchResult: BatchActionResult = {
      success: failed === 0,
      results,
      completed,
      failed,
    };

    this.emit('batchCompleted', batchResult);

    return batchResult;
  }

  /**
   * Executa uma planta baixa completa
   */
  public async executeFloorPlan(floorPlan: FloorPlan): Promise<BatchActionResult> {
    const actions = this.mapFloorPlanToActions(floorPlan);
    return this.executeBatch(actions);
  }

  /**
   * Cria ação de criação de cômodo
   */
  private createRoomAction(room: Room): EditorAction {
    return {
      type: 'createRoom',
      payload: room,
      metadata: {
        description: `Create ${room.name}`,
        source: 'ai',
        timestamp: Date.now(),
      },
    };
  }

  /**
   * Cria ação de criação de parede
   */
  private createWallAction(wall: Wall): EditorAction {
    return {
      type: 'createWall',
      payload: wall,
      metadata: {
        description: `Create wall`,
        source: 'ai',
        timestamp: Date.now(),
      },
    };
  }

  /**
   * Cria ação de criação de móvel
   */
  private createFurnitureAction(furniture: Furniture): EditorAction {
    return {
      type: 'createFurniture',
      payload: furniture,
      metadata: {
        description: `Create ${furniture.name}`,
        source: 'ai',
        timestamp: Date.now(),
      },
    };
  }

  /**
   * Executa criação de cômodo
   */
  private async executeCreateRoom(room: Room): Promise<ActionResult> {
    try {
      // Usar a engine para criar o cômodo
      const render2D = this.engine!.getRender2D();
      if (render2D) {
        render2D.addRoom(room as any);
      }

      const render3D = this.engine!.getRender3D();
      if (render3D) {
        render3D.addRoom(room as any);
      }

      return {
        success: true,
        affectedElements: [room.id],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create room',
      };
    }
  }

  /**
   * Executa criação de parede
   */
  private async executeCreateWall(wall: Wall): Promise<ActionResult> {
    try {
      const render2D = this.engine!.getRender2D();
      if (render2D) {
        render2D.addWall(wall);
      }

      const render3D = this.engine!.getRender3D();
      if (render3D) {
        render3D.addWall(wall);
      }

      return {
        success: true,
        affectedElements: [wall.id],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create wall',
      };
    }
  }

  /**
   * Executa criação de móvel
   */
  private async executeCreateFurniture(furniture: Furniture): Promise<ActionResult> {
    try {
      const render2D = this.engine!.getRender2D();
      if (render2D) {
        render2D.addFurniture(furniture as any);
      }

      const render3D = this.engine!.getRender3D();
      if (render3D) {
        render3D.addFurniture(furniture as any);
      }

      return {
        success: true,
        affectedElements: [furniture.id],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create furniture',
      };
    }
  }

  /**
   * Executa modificação de cômodo
   */
  private async executeModifyRoom(payload: any): Promise<ActionResult> {
    try {
      const { roomId, updates } = payload;

      // Implementar modificação via engine
      // Isso dependerá da API específica da engine

      return {
        success: true,
        affectedElements: [roomId],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to modify room',
      };
    }
  }

  /**
   * Executa exclusão de elemento
   */
  private async executeDeleteElement(payload: any): Promise<ActionResult> {
    try {
      const { elementId, elementType } = payload;

      const render3D = this.engine!.getRender3D();
      if (render3D) {
        render3D.removeObject(elementId);
      }

      return {
        success: true,
        affectedElements: [elementId],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete element',
      };
    }
  }

  /**
   * Executa movimentação de elemento
   */
  private async executeMoveElement(payload: any): Promise<ActionResult> {
    try {
      const { elementId, newPosition } = payload;

      // Implementar movimentação via engine

      return {
        success: true,
        affectedElements: [elementId],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to move element',
      };
    }
  }

  /**
   * Executa definição de material
   */
  private async executeSetMaterial(payload: any): Promise<ActionResult> {
    try {
      const { elementId, material } = payload;

      // Implementar via material system
      const materialSystem = this.engine!.getMaterialSystem();
      if (materialSystem) {
        // Aplicar material ao elemento
      }

      return {
        success: true,
        affectedElements: [elementId],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to set material',
      };
    }
  }

  /**
   * Adiciona ação ao histórico
   */
  private addToHistory(action: EditorAction): void {
    this.actionHistory.push(action);

    if (this.actionHistory.length > this.maxHistorySize) {
      this.actionHistory.shift();
    }
  }

  /**
   * Retorna o histórico de ações
   */
  public getActionHistory(): EditorAction[] {
    return [...this.actionHistory];
  }

  /**
   * Limpa o histórico
   */
  public clearHistory(): void {
    this.actionHistory = [];
    this.emit('historyCleared');
  }

  /**
   * Desfaz a última ação
   */
  public async undoLastAction(): Promise<boolean> {
    const lastAction = this.actionHistory.pop();
    if (!lastAction) return false;

    // Implementar undo baseado no tipo de ação
    this.emit('undo', lastAction);
    return true;
  }
}

// Singleton instance
export const editorActionMapper = new EditorActionMapper();
