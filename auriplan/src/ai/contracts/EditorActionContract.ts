/**
 * EditorActionContract - Contrato central de ações do editor
 * Define todas as ações que podem ser executadas pela IA
 */

// Tipos base para geometria
export interface Point2D {
  x: number;
  y: number;
}

export interface Point3D extends Point2D {
  z: number;
}

export interface Dimensions {
  width: number;
  height: number;
  depth?: number;
}

// Ações de criação
export interface CreateWallAction {
  type: 'createWall';
  payload: {
    id?: string;
    start: Point2D;
    end: Point2D;
    thickness?: number;
    height?: number;
  };
}

export interface CreateRoomAction {
  type: 'createRoom';
  payload: {
    id?: string;
    points: Point2D[];
    name?: string;
    type?: string;
    roomType?: string;
    floorMaterial?: string;
  };
}

export interface CreateFurnitureAction {
  type: 'createFurniture';
  payload: {
    type: string;
    position: Point3D;
    rotation?: number;
    scale?: number;
    dimensions?: Dimensions;
    material?: string;
    color?: string;
  };
}

// Ações de modificação
export interface UpdateWallAction {
  type: 'updateWall';
  payload: {
    id: string;
    updates: Partial<{
      start: Point2D;
      end: Point2D;
      thickness: number;
      height: number;
    }>;
  };
}

export interface UpdateRoomAction {
  type: 'updateRoom';
  payload: {
    id: string;
    updates: Partial<{
      points: Point2D[];
      name: string;
      roomType: string;
      floorMaterial: string;
    }>;
  };
}

export interface MoveFurnitureAction {
  type: 'moveFurniture';
  payload: {
    id: string;
    position: Point3D;
    rotation?: number;
  };
}

// Ações de remoção
export interface DeleteElementAction {
  type: 'deleteElement';
  payload: {
    id: string;
    elementType: 'wall' | 'room' | 'furniture';
  };
}

// Ação para carregar planta completa
export interface LoadFloorPlanAction {
  type: 'loadFloorPlan';
  payload: {
    id: string;
    name: string;
    rooms: Array<{
      id: string;
      points: Point2D[];
      name: string;
      type: string;
      floorMaterial?: string;
    }>;
    walls: Array<{
      id: string;
      start: Point2D;
      end: Point2D;
      thickness: number;
      height: number;
    }>;
    furniture: Array<{
      id: string;
      type: string;
      position: Point3D;
      rotation: number;
      scale: number;
      dimensions?: Dimensions;
      material?: string;
      color?: string;
    }>;
  };
}

export interface SetMetadataAction {
  type: 'setMetadata';
  payload: {
    source?: string;
    scanId?: string;
    confidence?: number;
    [key: string]: unknown;
  };
}

// União discriminada de todas as ações possíveis
export type EditorAction =
  | CreateWallAction
  | CreateRoomAction
  | CreateFurnitureAction
  | UpdateWallAction
  | UpdateRoomAction
  | MoveFurnitureAction
  | DeleteElementAction
  | LoadFloorPlanAction
  | SetMetadataAction;

// Metadados comuns para ações geradas por IA
export interface AIActionMetadata {
  source: 'ai';
  timestamp: number;
  confidence?: number;
  description?: string;
}

// Ação enriquecida com metadados
export interface EditorActionWithMetadata {
  action: EditorAction;
  metadata: AIActionMetadata;
}

// Tipo para resultado de processamento de comando
export interface CommandProcessingResult {
  success: boolean;
  actions?: EditorActionWithMetadata[];
  message?: string;
  error?: string;
  preview?: {
    roomsCount: number;
    wallsCount: number;
    furnitureCount: number;
    totalArea?: number;
  };
}
