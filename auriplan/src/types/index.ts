/*
 * ============================================
 * TYPES - Tipos da Aplicação
 * ============================================
 */

/* * ============================================
 * VECTORS
 * ============================================ */
export type Vec2 = [number, number];
export type Vec3 = [number, number, number];

/* * ============================================
 * METADATA
 * ============================================ */
export type Metadata = Record<string, any>;

/* * ============================================
 * USER
 * ============================================ */
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'owner' | 'editor' | 'viewer';
}

/* * ============================================
 * PROJECT
 * ============================================ */
export interface Project {
  id: string;
  name: string;
  description?: string;
  owner: User;
  collaborators: User[];
  createdAt: string | Date;
  updatedAt: string | Date;
  settings: {
    units: 'metric' | 'imperial';
    currency: string;
    gridSize?: number;
    defaultWallHeight?: number;
    defaultWallThickness?: number;
    language?: string;
    precision?: number;
    snapEnabled?: boolean;
    snapToGrid?: boolean;
  };
  floors?: Scene[];
  scenes?: Scene[];
  currentFloorId?: string;
  currentSceneId?: string;
  tags?: string[];
  version?: string;
  authorId?: string;
  author?: User;
  thumbnail?: string;
  floorPlan?: {
    id?: string;
    walls?: Wall[];
    rooms?: Room[];
    furniture?: Furniture[];
    [key: string]: any;
  };
  metadata?: {
    version?: string;
    exportedAt?: string;
    fileSize?: number;
    [key: string]: any;
  };
  status?: 'draft' | 'active' | 'archived';
  isPublic?: boolean;
  shareToken?: string;
}

/* * ============================================
 * SCENE (FLOOR)
 * ============================================ */
export interface Scene {
  id: string;
  name: string;
  level: number;
  height: number;
  walls: Wall[];
  rooms: Room[];
  doors: Door[];
  windows: Window[];
  furniture: Furniture[];
  measurements: Measurement[];
  metadata?: Metadata;
  visible?: boolean;
  locked?: boolean;
  annotations?: any[];
  canvas?: any;
  thumbnail?: string;
}

/* * ============================================
 * WALL
 * ============================================ */
export interface Wall {
  id: string;
  start: Vec2;
  end: Vec2;
  thickness: number;
  height: number;
  color: string;
  material: string;
  visible: boolean;
  locked: boolean;
  metadata?: Metadata;

  // Conexões topológicas – suporte a junções L, T, X
  connections?: {
    start: string[]; // IDs das paredes conectadas no início
    end: string[];   // IDs das paredes conectadas no fim
  };
  roomIds?: string[];
  openingIds?: string[];
  connectedWalls?: { start: string[]; end: string[] };
  startConnected?: string[] | boolean;
  endConnected?: string[] | boolean;
}

/* * ============================================
 * ROOM
 * ============================================ */
export type RoomType = 'living' | 'bedroom' | 'kitchen' | 'bathroom' | 'dining' | 'office' | 'custom';

export interface Room {
  id: string;
  name: string;
  points: Vec2[];
  type?: RoomType;
  wallColor?: string;
  floorColor?: string;
  ceilingColor?: string;
  height?: number;
  area?: number;
  perimeter?: number;
  visible?: boolean;
  locked?: boolean;
  metadata?: Metadata;
  wallIds?: string[];
}

/* * ============================================
 * DOOR
 * ============================================ */
export type DoorSwing = 'left' | 'right' | 'double' | 'sliding';
export type DoorStyle = 'panel' | 'flush' | 'french' | 'sliding';

export interface Door {
  id: string;
  wallId: string;
  position: number;
  width: number;
  height: number;
  // thickness/depth – stored as 'thickness' internally
  thickness?: number;
  depth?: number;
  swing: DoorSwing;
  style?: DoorStyle;
  // color fields – accept either naming convention
  color?: string;
  panelColor?: string;
  frameColor?: string;
  // material
  material?: string;
  // open angle
  openAngle?: number;
  visible: boolean;
  locked: boolean;
  metadata?: Metadata;
}

/* * ============================================
 * WINDOW
 * ============================================ */
export type WindowStyle = 'single-hung' | 'double-hung' | 'sliding' | 'casement' | 'picture';

export interface Window {
  id: string;
  wallId: string;
  position: number;
  width: number;
  height: number;
  sillHeight?: number;
  depth?: number;
  style?: WindowStyle;
  color?: string;
  frameColor?: string;
  material?: string;
  visible: boolean;
  locked: boolean;
  metadata?: Metadata;
}

/* * ============================================
 * FURNITURE
 * ============================================ */
export type FurnitureCategory = 
  | 'living' 
  | 'bedroom' 
  | 'kitchen' 
  | 'bathroom' 
  | 'lighting' 
  | 'decor' 
  | 'office' 
  | 'appliances'
  | 'outdoor';

export type FurnitureType = 
  | 'sofa' 
  | 'sectional'
  | 'armchair'
  | 'coffee-table'
  | 'tv-stand'
  | 'bookshelf'
  | 'bed'
  | 'nightstand'
  | 'dresser'
  | 'wardrobe'
  | 'dining-table'
  | 'dining-chair'
  | 'kitchen-island'
  | 'bar-stool'
  | 'vanity-unit'
  | 'bathtub'
  | 'chandelier'
  | 'floor-lamp'
  | 'table-lamp'
  | 'plant'
  | 'rug'
  | 'mirror'
  | 'artwork'
  | 'desk'
  | 'office-chair'
  | 'bookshelf-office'
  | 'fridge'
  | 'stove'
  | 'oven'
  | 'dishwasher'
  | 'washer'
  | 'patio-set'
  | 'grill'
  | 'generic';

export interface Dimensions {
  width: number;
  height: number;
  depth: number;
}

export interface Furniture {
  id: string;
  catalogId?: string;
  name: string;
  category: FurnitureCategory | string;
  type: FurnitureType | string;
  position: Vec3 | { x: number; y: number; z: number };
  rotation: Vec3 | number | { x: number; y: number; z: number };
  scale?: Vec3;
  dimensions?: Dimensions;
  width?: number;
  height?: number;
  depth?: number;
  color: string;
  material?: string;
  visible: boolean;
  locked?: boolean;
  castShadow?: boolean;
  receiveShadow?: boolean;
  metadata?: Metadata;
}

/* * ============================================
 * MEASUREMENT
 * ============================================ */
export interface Measurement {
  id: string;
  start: Vec2;
  end: Vec2;
  value?: number;
  distance?: number;
  unit?: string;
  text?: string;
  visible: boolean;
  locked?: boolean;
}

/* * ============================================
 * SETTINGS
 * ============================================ */
export interface GridSettings {
  visible: boolean;
  size: number;
  color: string;
  opacity: number;
}

export interface SnapSettings {
  enabled: boolean;
  grid: boolean;
  endpoints: boolean;
  midpoints: boolean;
  edges: boolean;
  centers: boolean;
  perpendicular: boolean;
  angle: boolean;
  distance: number;
}

export interface CameraState {
  position: Vec3;
  target: Vec3;
  zoom: number;
  rotation?: number;
  fov?: number;
  near?: number;
  far?: number;
  type?: '2d' | '3d' | 'perspective' | 'orthographic';
}

/* * ============================================
 * UI
 * ============================================ */
export type ViewMode = '2d' | '3d' | 'split';

export type Tool = 
  | 'select' 
  | 'pan' 
  | 'wall' 
  | 'room' 
  | 'door' 
  | 'window' 
  | 'furniture' 
  | 'measure' 
  | 'text' 
  | 'eraser';

/* * ============================================
 * CATALOG
 * ============================================ */
export interface CatalogItem {
  id: string;
  name: string;
  category: FurnitureCategory;
  type: FurnitureType;
  thumbnail: string;
  dimensions: Dimensions;
  defaultColor: string;
  availableColors: string[];
  availableMaterials: string[];
  price?: number;
  brand?: string;
  isPremium: boolean;
  popularity: number;
}

/* * ============================================
 * EXPORT
 * ============================================ */
export interface ExportOptions {
  format: 'json' | 'png' | 'pdf' | 'obj' | 'svg';
  quality?: 'low' | 'medium' | 'high';
  includeFurniture?: boolean;
  includeMaterials?: boolean;
  scale?: number;
}

/* * ============================================
 * AI DESIGN
 * ============================================ */
export interface AIDesignRequest {
  roomType: RoomType;
  style: string;
  dimensions: Dimensions;
  budget?: number;
}

export interface AIDesignSuggestion {
  furniture: Array<{
    catalogId: string;
    position: Vec3;
    rotation: Vec3;
  }>;
  colors: {
    wall: string;
    floor: string;
  };
  description: string;
}

/* * ============================================
 * COLLABORATION
 * ============================================ */
export interface CursorPosition {
  userId: string;
  name: string;
  color: string;
  position: Vec2;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  userId: string;
  name: string;
  message: string;
  timestamp: string;
}

/* * ============================================
 * PROJECT SETTINGS
 * ============================================ */
export interface ProjectSettings {
  units: 'metric' | 'imperial';
  currency: string;
  defaultWallHeight?: number;
  defaultWallThickness?: number;
  snapEnabled?: boolean;
  snapToGrid?: boolean;
  snapToObjects?: boolean;
  gridSize?: number;
  language?: string;
  precision?: number;
  defaultFloorHeight?: number;
  renderQuality?: 'low' | 'medium' | 'high';
  shadows?: boolean;
  ambientOcclusion?: boolean;
  antialiasing?: boolean;
}

export const DEFAULT_PROJECT_SETTINGS: ProjectSettings = {
  units: 'metric',
  currency: 'BRL',
  defaultWallHeight: 2.7,
  defaultWallThickness: 0.15,
  snapEnabled: true,
  gridSize: 0.1,
  language: 'pt-BR',
};

/* * ============================================
 * ADDITIONAL TYPES (used across codebase)
 * ============================================ */

/** Floor – an alias for Scene, represents one level of a building */
export type Floor = Scene;

/** 2D point (alternative to Vec2 tuple) */
export interface Point2D {
  x: number;
  y: number;
}

/** 2D bounding box */
export interface Bounds2D {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
  /** Array aliases [x, y] for compatibility with collision engines */
  min?: [number, number];
  max?: [number, number];
}

/** 3D bounding box */
export interface Bounds3D {
  minX: number;
  minY: number;
  minZ: number;
  maxX: number;
  maxY: number;
  maxZ: number;
  width: number;
  height: number;
  depth: number;
}

/** Grid settings as state (used by engine/render) */
export interface GridState {
  visible: boolean;
  size: number;
  color: string;
  opacity: number;
  snapEnabled?: boolean;
  subdivisions?: number;
}

/** Snap state (used by tools) */
export interface SnapState {
  enabled: boolean;
  grid: boolean;
  endpoints: boolean;
  midpoints: boolean;
  edges: boolean;
  centers: boolean;
  perpendicular: boolean;
  angle: boolean;
  distance: number;
  snapped: boolean;
  snapPoint?: Vec2;
  snapType?: 'grid' | 'endpoint' | 'midpoint' | 'edge' | 'center' | 'perpendicular' | 'angle';
}
