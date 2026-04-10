// ============================================
// EDITOR STORE - Estado Global do Editor (com pipeline geométrico)
// ============================================

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

import { applyGeometryPipeline } from '@core/pipeline/applyGeometryPipeline';
import { FLOOR_PLAN_TEMPLATES } from '@features/editor/templates/floorPlanTemplates';
import type { FloorPlanTemplate } from '@features/editor/templates/floorPlanTemplates';

import type {
  Project,
  Scene,
  Wall,
  Room,
  Door,
  Window,
  Furniture,
  Measurement,
  User,
  ViewMode,
  Tool,
  GridSettings,
  SnapSettings,
  CameraState,
  Vec2,
} from '@auriplan-types';


  // ==================== EDITOR STATE INTERFACE ====================
  export interface EditorState {
    // Data
    project: import('@auriplan-types').Project | null;
    scenes: import('@auriplan-types').Scene[];
    currentSceneId: string | null;

    // UI state
    viewMode: import('@auriplan-types').ViewMode;
    tool: import('@auriplan-types').Tool;
    selectedIds: string[];
    hoveredId: string | null;

    // Settings
    grid: import('@auriplan-types').GridSettings;
    snap: import('@auriplan-types').SnapSettings;
    camera: import('@auriplan-types').CameraState;

    // History
    history: Array<{ scenes: import('@auriplan-types').Scene[]; currentSceneId: string | null }>;
    historyIndex: number;

    // Internal cache
    _junctionsCache: Record<string, any>;

    // Actions - Project
    createProject: (name: string, owner: import('@auriplan-types').User, description?: string) => void;
    loadTemplate: (templateId: string, name: string) => void;
    saveProject: () => void;
    exportProject: () => string;
    importProject: (data: string) => boolean;
    addScene: (name: string) => void;
    deleteScene: (id: string) => void;
    setCurrentScene: (id: string) => void;

    // Actions - Walls
    addWall: (start: import('@auriplan-types').Vec2, end: import('@auriplan-types').Vec2) => void;
    updateWall: (id: string, updates: Partial<import('@auriplan-types').Wall>) => void;
    deleteWall: (id: string) => void;
    moveWallVertex: (wallId: string, vertex: 'start' | 'end', newPosition: import('@auriplan-types').Vec2) => void;
    moveWall: (wallId: string, delta: import('@auriplan-types').Vec2) => void;
    createWallsFromPolygon: (points: import('@auriplan-types').Vec2[]) => void;
    // Live updates (no history — for smooth dragging)
    _liveUpdateWall: (id: string, start: import('@auriplan-types').Vec2, end: import('@auriplan-types').Vec2) => void;
    _liveUpdateRoomPoints: (id: string, points: import('@auriplan-types').Vec2[]) => void;
    _liveUpdateFurniturePos: (id: string, position: [number, number, number]) => void;

    // Actions - Rooms
    addRoom: (points: import('@auriplan-types').Vec2[]) => void;
    updateRoom: (id: string, updates: Partial<import('@auriplan-types').Room>) => void;
    deleteRoom: (id: string) => void;

    // Actions - Doors
    addDoor: (wallId: string, position: number, width: number) => void;
    updateDoor: (id: string, updates: Partial<import('@auriplan-types').Door>) => void;
    deleteDoor: (id: string) => void;

    // Actions - Windows
    addWindow: (wallId: string, position: number, width: number) => void;
    updateWindow: (id: string, updates: Partial<import('@auriplan-types').Window>) => void;
    deleteWindow: (id: string) => void;

    // Actions - Furniture
    addFurniture: (furniture: Omit<import('@auriplan-types').Furniture, 'id'>) => void;
    updateFurniture: (id: string, updates: Partial<import('@auriplan-types').Furniture>) => void;
    deleteFurniture: (id: string) => void;
    duplicateFurniture: (id: string) => void;

    // Actions - Measurements
    addMeasurement: (start: import('@auriplan-types').Vec2, end: import('@auriplan-types').Vec2) => void;
    deleteMeasurement: (id: string) => void;

    // Actions - Selection
    select: (id: string | string[], addToSelection?: boolean) => void;
    deselect: (id: string) => void;
    deselectAll: () => void;

    // Actions - UI
    setViewMode: (mode: import('@auriplan-types').ViewMode) => void;
    setTool: (tool: import('@auriplan-types').Tool) => void;
    toggleGrid: () => void;
    toggleSnap: () => void;
    setGrid: (grid: Partial<import('@auriplan-types').GridSettings>) => void;
    setSnap: (snap: Partial<import('@auriplan-types').SnapSettings>) => void;
    setCamera: (camera: Partial<import('@auriplan-types').CameraState>) => void;
    zoomIn: () => void;
    zoomOut: () => void;
    fitToView: () => void;

    // Actions - History
    saveToHistory: () => void;
    undo: () => void;
    redo: () => void;
    canUndo: () => boolean;
    canRedo: () => boolean;
  }

  const safeClone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

interface JunctionPoint {
  x: number;
  y: number;
  walls: Array<{ wallId: string; endpoint: 'start' | 'end' }>;
}
interface JunctionIndex {
  points: Record<string, JunctionPoint>;
}

// ==================== UTILITÁRIOS DE JUNÇÃO ====================
function roundCoord(coord: number, tolerance: number): number {
  const factor = 1 / tolerance;
  return Math.round(coord * factor) / factor;
}

function computeJunctionsIndex(scene: Scene): JunctionIndex {
  const points: Record<string, JunctionPoint> = {};
  const tolerance = 0.001;
  for (const wall of scene.walls) {
    const startX = roundCoord(wall.start[0], tolerance);
    const startY = roundCoord(wall.start[1], tolerance);
    const startKey = `${startX},${startY}`;
    if (!points[startKey]) points[startKey] = { x: startX, y: startY, walls: [] };
    points[startKey].walls.push({ wallId: wall.id, endpoint: 'start' });

    const endX = roundCoord(wall.end[0], tolerance);
    const endY = roundCoord(wall.end[1], tolerance);
    const endKey = `${endX},${endY}`;
    if (!points[endKey]) points[endKey] = { x: endX, y: endY, walls: [] };
    points[endKey].walls.push({ wallId: wall.id, endpoint: 'end' });
  }
  return { points };
}

function updateJunctionsForScene(state: EditorState, sceneId: string) {
  const scene = state.scenes.find(s => s.id === sceneId);
  if (!scene) return;
  if (!state._junctionsCache) state._junctionsCache = {};
  state._junctionsCache[sceneId] = computeJunctionsIndex(scene);
}

// ==================== APLICA O PIPELINE GEOMÉTRICO EM UMA CENA ====================
/**
 * Executa o pipeline de geometria (split, grafo, detecção de cômodos)
 * utilizando o wrapper seguro applyGeometryPipeline.
 *
 * LIMITAÇÃO ATUAL: scene.walls é substituído pelas paredes resultantes do pipeline,
 * o que pode quebrar referências de IDs em doors.wallId, windows.wallId e openingIds.
 * TODO: Futuramente, o WallSplitEngine deve retornar um idMap para atualizar essas referências.
 */
function applyGeometryToScene(scene: Scene): void {
  applyGeometryPipeline(scene); // o wrapper já atualiza scene.walls e scene.rooms
}

// ==================== AUXILIARES ====================
function getCurrentScene(state: EditorState): Scene | undefined {
  return state.scenes.find(s => s.id === state.currentSceneId);
}

// ==================== ESTADO INICIAL ====================
const initialState = {
  project: null,
  scenes: [],
  currentSceneId: null,
  viewMode: '2d' as ViewMode,
  tool: 'select' as Tool,
  selectedIds: [],
  hoveredId: null,
  grid: {
    visible: true,
    size: 0.5,
    color: '#475569',
    opacity: 0.3,
  },
  snap: {
    enabled: true,
    grid: true,
    endpoints: true,
    midpoints: true,
    edges: true,
    centers: true,
    perpendicular: true,
    angle: true,
    distance: 0.3,
  },
  camera: {
    position: [0, 0, 10] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    zoom: 1,
    rotation: 0,
  },
  history: [],
  historyIndex: -1,
  _junctionsCache: {} as Record<string, any>,
};

// ==================== STORE PRINCIPAL ====================
// EditorStore represents the full zustand store API
export type EditorStore = {
  getState: () => EditorState;
  setState: (state: Partial<EditorState> | ((s: EditorState) => Partial<EditorState>)) => void;
  subscribe: (listener: () => void) => () => void;
  destroy: () => void;
} & EditorState;
export const useEditorStore = create<EditorState>()(
  devtools(
    immer((set, get) => ({
      ...initialState,

      // --------------------------------------------------------------
      // PROJETO E CENAS
      // --------------------------------------------------------------
      createProject: (name, owner, description) => {
        const sceneId = uuidv4();
        const newScene: Scene = {
          id: sceneId,
          name: 'Planta Baixa',
          level: 0,
          height: 2.8,
          walls: [],
          rooms: [],
          doors: [],
          windows: [],
          furniture: [],
          measurements: [],
        };
        const newProject: Project = {
          id: uuidv4(),
          name,
          description,
          owner,
          collaborators: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          settings: { units: 'metric', currency: 'BRL' },
        };
        set(state => {
          state.project = newProject;
          state.scenes = [newScene];
          state.currentSceneId = sceneId;
          state.history = [];
          state.historyIndex = -1;
          state.selectedIds = [];
          updateJunctionsForScene(state, sceneId);
        });
        get().saveToHistory();
      },

      loadTemplate: (templateId, name) => {
        const template = (FLOOR_PLAN_TEMPLATES as FloorPlanTemplate[]).find(t => t.id === templateId);
        const sceneId = uuidv4();
        const newScene: Scene = {
          id: sceneId,
          name: 'Planta Baixa',
          level: 0,
          height: 2.8,
          walls: template
            ? template.walls.map(w => ({
                id: uuidv4(),
                start: w.start as Vec2,
                end: w.end as Vec2,
                thickness: 0.15,
                height: 2.8,
                material: 'concrete',
                color: '#64748b',
                visible: true,
                locked: false,
                openingIds: [],
                roomIds: [],
              }))
            : [],
          rooms: [],
          doors: [],
          windows: [],
          furniture: [],
          measurements: [],
        };
        const newProject: Project = {
          id: uuidv4(),
          name,
          description: template?.description ?? '',
          owner: { id: 'user-1', name: 'Usuário', email: 'user@example.com', role: 'owner' },
          collaborators: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          settings: { units: 'metric', currency: 'BRL' },
        };
        // Run geometry pipeline to auto-detect rooms
        applyGeometryPipeline(newScene);
        set(state => {
          state.project = newProject;
          state.scenes = [newScene];
          state.currentSceneId = sceneId;
          state.history = [];
          state.historyIndex = -1;
          state.selectedIds = [];
          updateJunctionsForScene(state, sceneId);
        });
        get().saveToHistory();
      },

      saveProject: () => {
        const { project, scenes } = get();
        if (!project) return;
        const data = JSON.stringify({ project, scenes });
        localStorage.setItem(`project_${project.id}`, data);
        set(state => {
          if (state.project) state.project.updatedAt = new Date().toISOString();
        });
      },

      exportProject: () => {
        const { project, scenes } = get();
        return JSON.stringify({ project, scenes }, null, 2);
      },

      importProject: (data: string) => {
        try {
          const parsed = JSON.parse(data);
          set(state => {
            state.project = parsed.project;
            state.scenes = parsed.scenes;
            state.currentSceneId = parsed.scenes[0]?.id || null;
            state.history = [];
            state.historyIndex = -1;
            state.selectedIds = [];
            state._junctionsCache = {};
            for (const scene of state.scenes) {
              updateJunctionsForScene(state, scene.id);
            }
          });
          get().saveToHistory();
          return true;
        } catch {
          return false;
        }
      },

      addScene: (name: string) => {
        const newScene: Scene = {
          id: uuidv4(),
          name,
          level: get().scenes.length,
          height: 2.8,
          walls: [],
          rooms: [],
          doors: [],
          windows: [],
          furniture: [],
          measurements: [],
        };
        set(state => {
          state.scenes.push(newScene);
          updateJunctionsForScene(state, newScene.id);
        });
        get().saveToHistory();
      },

      deleteScene: (id: string) => {
        set(state => {
          state.scenes = state.scenes.filter(s => s.id !== id);
          if (state.currentSceneId === id) {
            state.currentSceneId = state.scenes[0]?.id || null;
          }
          if (state._junctionsCache) delete state._junctionsCache[id];
        });
        get().saveToHistory();
      },

      setCurrentScene: (id: string) => {
        set(state => {
          state.currentSceneId = id;
          if (!state._junctionsCache?.[id] && state.scenes.find(s => s.id === id)) {
            updateJunctionsForScene(state, id);
          }
        });
      },

      // --------------------------------------------------------------
      // AÇÕES DE PAREDES (COM PIPELINE AUTOMÁTICO)
      // --------------------------------------------------------------
      addWall: (start: Vec2, end: Vec2) => {
        const dx = end[0] - start[0];
        const dy = end[1] - start[1];
        if (Math.hypot(dx, dy) < 1e-6) return;

        set(state => {
          const scene = getCurrentScene(state);
          if (!scene) return;
          const newWall: Wall = {
            id: uuidv4(),
            start: [...start] as Vec2,
            end: [...end] as Vec2,
            thickness: 0.15,
            height: 2.8,
            color: '#8B4513',
            material: 'paint-white',
            visible: true,
            locked: false,
            connections: { start: [], end: [] },
            roomIds: [],
            openingIds: [],
            metadata: {},
          };
          scene.walls.push(newWall);
          applyGeometryToScene(scene);
          updateJunctionsForScene(state, scene.id);
        });
        get().saveToHistory();
      },

      updateWall: (id: string, updates: Partial<Wall>) => {
        set(state => {
          const scene = getCurrentScene(state);
          if (!scene) return;
          const wall = scene.walls.find(w => w.id === id);
          if (!wall) return;
          Object.assign(wall, updates);
          applyGeometryToScene(scene);
          updateJunctionsForScene(state, scene.id);
        });
        get().saveToHistory();
      },

      deleteWall: (id: string) => {
        set(state => {
          const scene = getCurrentScene(state);
          if (!scene) return;
          scene.walls = scene.walls.filter(w => w.id !== id);
          applyGeometryToScene(scene);
          updateJunctionsForScene(state, scene.id);
        });
        get().saveToHistory();
      },

      moveWallVertex: (wallId: string, vertex: 'start' | 'end', newPosition: Vec2) => {
        set(state => {
          const scene = getCurrentScene(state);
          if (!scene) return;
          const wall = scene.walls.find(w => w.id === wallId);
          if (!wall) return;
          if (vertex === 'start') {
            wall.start = [newPosition[0], newPosition[1]];
          } else {
            wall.end = [newPosition[0], newPosition[1]];
          }
          applyGeometryToScene(scene);
          updateJunctionsForScene(state, scene.id);
        });
        get().saveToHistory();
      },

      moveWall: (wallId: string, delta: Vec2) => {
        set(state => {
          const scene = getCurrentScene(state);
          if (!scene) return;
          const wall = scene.walls.find(w => w.id === wallId);
          if (!wall) return;
          wall.start = [wall.start[0] + delta[0], wall.start[1] + delta[1]];
          wall.end = [wall.end[0] + delta[0], wall.end[1] + delta[1]];
          applyGeometryToScene(scene);
          updateJunctionsForScene(state, scene.id);
        });
        get().saveToHistory();
      },

      createWallsFromPolygon: (points: Vec2[]) => {
        if (!points || points.length < 3) return;
        let closedPoints = points;
        const first = points[0];
        const last = points[points.length - 1];
        if (first[0] !== last[0] || first[1] !== last[1]) {
          closedPoints = [...points, first];
        }
        for (let i = 0; i < closedPoints.length - 1; i++) {
          const start = closedPoints[i];
          const end = closedPoints[i + 1];
          if (Math.hypot(end[0] - start[0], end[1] - start[1]) < 1e-6) continue;
          get().addWall(start, end);
        }
      },

      // Live updates — no history, no geometry pipeline (for smooth drag)
      _liveUpdateWall: (id: string, start: Vec2, end: Vec2) => {
        set(state => {
          const scene = getCurrentScene(state);
          if (!scene) return;
          const wall = scene.walls.find(w => w.id === id);
          if (!wall) return;
          wall.start = [...start] as Vec2;
          wall.end = [...end] as Vec2;
          updateJunctionsForScene(state, scene.id);
        });
      },

      _liveUpdateRoomPoints: (id: string, points: Vec2[]) => {
        set(state => {
          const scene = getCurrentScene(state);
          if (!scene) return;
          const room = scene.rooms.find(r => r.id === id);
          if (!room) return;
          room.points = points.map(p => [...p] as Vec2);
          // Update area/perimeter live
          let area = 0;
          for (let i = 0; i < points.length; i++) {
            const j = (i + 1) % points.length;
            area += points[i][0] * points[j][1];
            area -= points[j][0] * points[i][1];
          }
          room.area = Math.abs(area) / 2;
          let perimeter = 0;
          for (let i = 0; i < points.length; i++) {
            const j = (i + 1) % points.length;
            perimeter += Math.hypot(points[j][0] - points[i][0], points[j][1] - points[i][1]);
          }
          room.perimeter = perimeter;
        });
      },

      _liveUpdateFurniturePos: (id: string, position: [number, number, number]) => {
        set(state => {
          const scene = getCurrentScene(state);
          if (!scene) return;
          const furn = scene.furniture.find(f => f.id === id);
          if (furn) furn.position = [...position] as [number, number, number];
        });
      },

      // --------------------------------------------------------------
      // AÇÕES DE CÔMODOS (MANUAIS)
      // --------------------------------------------------------------
      addRoom: (points: Vec2[]) => {
        const scene = getCurrentScene(get());
        if (!scene) return;
        let area = 0;
        for (let i = 0; i < points.length; i++) {
          const j = (i + 1) % points.length;
          area += points[i][0] * points[j][1];
          area -= points[j][0] * points[i][1];
        }
        area = Math.abs(area) / 2;
        let perimeter = 0;
        for (let i = 0; i < points.length; i++) {
          const j = (i + 1) % points.length;
          perimeter += Math.hypot(points[j][0] - points[i][0], points[j][1] - points[i][1]);
        }
        const newRoom: Room = {
          id: uuidv4(),
          name: 'Novo Cômodo',
          type: 'custom',
          points,
          wallColor: '#F5F5DC',
          floorColor: '#D2691E',
          ceilingColor: '#FFFFFF',
          height: 2.8,
          area,
          perimeter,
          visible: true,
          locked: false,
          metadata: {},
        };
        set(state => {
          const sc = state.scenes.find(s => s.id === state.currentSceneId);
          if (sc) sc.rooms.push(newRoom);
        });
        get().saveToHistory();
      },

      updateRoom: (id: string, updates: Partial<Room>) => {
        set(state => {
          const scene = state.scenes.find(s => s.id === state.currentSceneId);
          const room = scene?.rooms.find(r => r.id === id);
          if (room) Object.assign(room, updates);
        });
        get().saveToHistory();
      },

      deleteRoom: (id: string) => {
        set(state => {
          const scene = state.scenes.find(s => s.id === state.currentSceneId);
          if (scene) scene.rooms = scene.rooms.filter(r => r.id !== id);
        });
        get().saveToHistory();
      },

      // --------------------------------------------------------------
      // PORTAS
      // --------------------------------------------------------------
      addDoor: (wallId: string, position: number, width: number) => {
        set(state => {
          const scene = getCurrentScene(state);
          if (!scene) return;
          const newDoor: Door = {
            id: uuidv4(),
            wallId,
            position,
            width,
            height: 2.1,
            thickness: 0.05,
            material: 'wood',
            color: '#8B5A2B',
            swing: 'left',
            openAngle: 90,
            visible: true,
            locked: false,
            metadata: {},
          };
          scene.doors.push(newDoor);
          const wall = scene.walls.find(w => w.id === wallId);
          if (wall) {
            wall.openingIds ??= [];
            if (!wall.openingIds.includes(newDoor.id)) wall.openingIds.push(newDoor.id);
          }
        });
        get().saveToHistory();
      },

      updateDoor: (id: string, updates: Partial<Door>) => {
        set(state => {
          const scene = getCurrentScene(state);
          const door = scene?.doors.find(d => d.id === id);
          if (door) Object.assign(door, updates);
        });
        get().saveToHistory();
      },

      deleteDoor: (id: string) => {
        set(state => {
          const scene = getCurrentScene(state);
          if (!scene) return;
          const door = scene.doors.find(d => d.id === id);
          if (door) {
            const wall = scene.walls.find(w => w.id === door.wallId);
            if (wall) {
              wall.openingIds = (wall.openingIds ?? []).filter(oid => oid !== id);
            }
          }
          scene.doors = scene.doors.filter(d => d.id !== id);
        });
        get().saveToHistory();
      },

      // --------------------------------------------------------------
      // JANELAS
      // --------------------------------------------------------------
      addWindow: (wallId: string, position: number, width: number) => {
        set(state => {
          const scene = getCurrentScene(state);
          if (!scene) return;
          const newWindow: Window = {
            id: uuidv4(),
            wallId,
            position,
            width,
            height: 1.2,
            sillHeight: 0.9,
            material: 'aluminum',
            color: '#C0C0C0',
            visible: true,
            locked: false,
            metadata: {},
          };
          scene.windows.push(newWindow);
          const wall = scene.walls.find(w => w.id === wallId);
          if (wall) {
            wall.openingIds ??= [];
            if (!wall.openingIds.includes(newWindow.id)) wall.openingIds.push(newWindow.id);
          }
        });
        get().saveToHistory();
      },

      updateWindow: (id: string, updates: Partial<Window>) => {
        set(state => {
          const scene = getCurrentScene(state);
          const windowObj = scene?.windows.find(w => w.id === id);
          if (windowObj) Object.assign(windowObj, updates);
        });
        get().saveToHistory();
      },

      deleteWindow: (id: string) => {
        set(state => {
          const scene = getCurrentScene(state);
          if (!scene) return;
          const windowObj = scene.windows.find(w => w.id === id);
          if (windowObj) {
            const wall = scene.walls.find(w => w.id === windowObj.wallId);
            if (wall) {
              wall.openingIds = (wall.openingIds ?? []).filter(oid => oid !== id);
            }
          }
          scene.windows = scene.windows.filter(w => w.id !== id);
        });
        get().saveToHistory();
      },

      // --------------------------------------------------------------
      // MÓVEIS
      // --------------------------------------------------------------
      addFurniture: (furniture: Omit<Furniture, 'id'>) => {
        set(state => {
          const scene = getCurrentScene(state);
          if (!scene) return;
          const newFurniture: Furniture = {
            id: uuidv4(),
            ...furniture,
          };
          scene.furniture.push(newFurniture);
        });
        get().saveToHistory();
      },

      updateFurniture: (id: string, updates: Partial<Furniture>) => {
        set(state => {
          const scene = getCurrentScene(state);
          const furniture = scene?.furniture.find(f => f.id === id);
          if (furniture) Object.assign(furniture, updates);
        });
        get().saveToHistory();
      },

      deleteFurniture: (id: string) => {
        set(state => {
          const scene = getCurrentScene(state);
          if (scene) scene.furniture = scene.furniture.filter(f => f.id !== id);
        });
        get().saveToHistory();
      },

      duplicateFurniture: (id: string) => {
        set(state => {
          const scene = getCurrentScene(state);
          if (!scene) return;
          const original = scene.furniture.find(f => f.id === id);
          if (!original) return;
          const origPos = original.position;
          const px = Array.isArray(origPos) ? origPos[0] : (origPos as {x:number;y:number;z:number}).x;
          const py = Array.isArray(origPos) ? origPos[1] : (origPos as {x:number;y:number;z:number}).y;
          const pz = Array.isArray(origPos) ? origPos[2] : (origPos as {x:number;y:number;z:number}).z;
          const cloned: Furniture = {
            ...original,
            id: uuidv4(),
            position: [px + 0.5, py + 0.5, pz ?? 0] as [number, number, number],
            rotation: original.rotation,
            name: `${original.name} (cópia)`,
          };
          scene.furniture.push(cloned);
        });
        get().saveToHistory();
      },

      // --------------------------------------------------------------
      // MEDIDAS
      // --------------------------------------------------------------
      addMeasurement: (start: Vec2, end: Vec2) => {
        set(state => {
          const scene = getCurrentScene(state);
          if (!scene) return;
          const distance = Math.hypot(end[0] - start[0], end[1] - start[1]);
          const newMeasurement: Measurement = {
            id: uuidv4(),
            start,
            end,
            distance,
            text: `${distance.toFixed(2)} m`,
            visible: true,
            locked: false,
          };
          scene.measurements.push(newMeasurement);
        });
        get().saveToHistory();
      },

      deleteMeasurement: (id: string) => {
        set(state => {
          const scene = getCurrentScene(state);
          if (scene) scene.measurements = scene.measurements.filter(m => m.id !== id);
        });
        get().saveToHistory();
      },

      // --------------------------------------------------------------
      // SELEÇÃO E ESTADO DA INTERFACE
      // --------------------------------------------------------------
      select: (id: string | string[], addToSelection = false) => {
        set(state => {
          if (Array.isArray(id)) {
            state.selectedIds = id;
          } else if (addToSelection) {
            if (!state.selectedIds.includes(id)) state.selectedIds.push(id);
          } else {
            state.selectedIds = [id];
          }
        });
      },

      deselect: (id: string) => {
        set(state => {
          state.selectedIds = state.selectedIds.filter(sid => sid !== id);
        });
      },

      deselectAll: () => {
        set(state => {
          state.selectedIds = [];
        });
      },

      setViewMode: (mode: ViewMode) => {
        set(state => { state.viewMode = mode; });
      },

      setTool: (tool: Tool) => {
        set(state => { state.tool = tool; });
      },

      toggleSnap: () => { set(state => { state.snap.enabled = !state.snap.enabled; }); },
      toggleGrid: () => {
        set(state => { state.grid.visible = !state.grid.visible; });
      },

      setGrid: (grid: Partial<GridSettings>) => {
        set(state => { state.grid = { ...state.grid, ...grid }; });
      },

      setSnap: (snap: Partial<SnapSettings>) => {
        set(state => { state.snap = { ...state.snap, ...snap }; });
      },

      setCamera: (camera: Partial<CameraState>) => {
        set(state => { state.camera = { ...state.camera, ...camera }; });
      },

      zoomIn: () => {
        set(state => { state.camera.zoom = Math.min(state.camera.zoom * 1.2, 10); });
      },

      zoomOut: () => {
        set(state => { state.camera.zoom = Math.max(state.camera.zoom / 1.2, 0.1); });
      },

      fitToView: () => {
        set(state => {
          state.camera.position = [0, 0, 10] as [number, number, number];
          state.camera.target = [0, 0, 0];
          state.camera.zoom = 1;
          state.camera.rotation = 0;
        });
      },

      // --------------------------------------------------------------
      // HISTÓRICO (UNDO/REDO)
      // --------------------------------------------------------------
      saveToHistory: () => {
        set(state => {
          const currentState = {
            scenes: safeClone(state.scenes),
            currentSceneId: state.currentSceneId,
          };
          if (state.historyIndex < state.history.length - 1) {
            state.history = state.history.slice(0, state.historyIndex + 1);
          }
          state.history.push(currentState);
          state.historyIndex++;
          if (state.history.length > 50) {
            state.history.shift();
            state.historyIndex--;
          }
        });
      },

      undo: () => {
        const { historyIndex, history } = get();
        if (historyIndex <= 0) return;
        const newIndex = historyIndex - 1;
        const savedState = history[newIndex];
        set(s => {
          s.scenes = safeClone(savedState.scenes);
          s.currentSceneId = savedState.currentSceneId;
          s.historyIndex = newIndex;
          s.selectedIds = [];
          s._junctionsCache = {};
          for (const scene of s.scenes) {
            updateJunctionsForScene(s, scene.id);
          }
        });
      },

      redo: () => {
        const { historyIndex, history } = get();
        if (historyIndex >= history.length - 1) return;
        const newIndex = historyIndex + 1;
        const savedState = history[newIndex];
        set(s => {
          s.scenes = safeClone(savedState.scenes);
          s.currentSceneId = savedState.currentSceneId;
          s.historyIndex = newIndex;
          s.selectedIds = [];
          s._junctionsCache = {};
          for (const scene of s.scenes) {
            updateJunctionsForScene(s, scene.id);
          }
        });
      },

      canUndo: () => get().historyIndex > 0,
      canRedo: () => get().historyIndex < get().history.length - 1,
    }))
  )
);

// ==================== SELECTORS ====================
export const selectCurrentScene = (state: EditorState) =>
  state.scenes.find(s => s.id === state.currentSceneId);

export const selectSelectedItems = (state: EditorState) => {
  const scene = selectCurrentScene(state);
  if (!scene) return [];
  const items: (Wall | Room | Door | Window | Furniture)[] = [];
  state.selectedIds.forEach(id => {
    const wall = scene.walls.find(w => w.id === id);
    if (wall) items.push(wall);
    const room = scene.rooms.find(r => r.id === id);
    if (room) items.push(room);
    const door = scene.doors.find(d => d.id === id);
    if (door) items.push(door);
    const window = scene.windows.find(w => w.id === id);
    if (window) items.push(window);
    const furniture = scene.furniture.find(f => f.id === id);
    if (furniture) items.push(furniture);
  });
  return items;
};

export const selectProjectStats = (state: EditorState) => {
  const scene = selectCurrentScene(state);
  if (!scene) {
    return { walls: 0, rooms: 0, doors: 0, windows: 0, furniture: 0, area: 0 };
  }
  const area = scene.rooms.reduce((acc, room) => acc + (room.area || 0), 0);
  return {
    walls: scene.walls.length,
    rooms: scene.rooms.length,
    doors: scene.doors.length,
    windows: scene.windows.length,
    furniture: scene.furniture.length,
    area,
  };
};

export const selectCurrentJunctions = (state: EditorState) => {
  const sceneId = state.currentSceneId;
  if (!sceneId) return undefined;
  return state._junctionsCache[sceneId];
};
