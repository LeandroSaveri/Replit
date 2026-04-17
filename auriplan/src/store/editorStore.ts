// ============================================
// EditorStore.ts - State Management Puro
// SEM lógica geométrica - apenas UI, seleção, histórico
// ============================================

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

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

import { FLOOR_PLAN_TEMPLATES } from '@features/editor/templates/floorPlanTemplates';
import type { FloorPlanTemplate } from '@features/editor/templates/floorPlanTemplates';

// ==================== CONSTANTES ====================
const MAX_HISTORY_SIZE = 50;

// ==================== INTERFACES ====================
export interface EditorState {
  // === DADOS DO PROJETO ===
  project: Project | null;
  scenes: Scene[];
  currentSceneId: string | null;

  // === UI STATE ===
  viewMode: ViewMode;
  tool: Tool;
  selectedIds: string[];
  hoveredId: string | null;
  assembleMode: boolean;

  // === CONFIGURAÇÕES ===
  grid: GridSettings;
  snap: SnapSettings;
  camera: CameraState;

  // === HISTÓRICO ===
  history: Array<{ scenes: Scene[]; currentSceneId: string | null }>;
  historyIndex: number;

  // === CACHE ===
  _topologyCache: Record<string, any>;

  // === PROJETO ===
  createProject: (name: string, owner: User, description?: string) => void;
  loadTemplate: (templateId: string, name: string) => Promise<void>;
  saveProject: () => void;
  exportProject: () => string;
  importProject: (data: string) => boolean;
  addScene: (name: string) => void;
  deleteScene: (id: string) => void;
  setCurrentScene: (id: string) => void;

  // === OPERAÇÕES DE CENA (wrappers simples) ===
  // Estes são chamados APENAS pelo GeometryController
  setSceneWalls: (sceneId: string, walls: Wall[]) => void;
  setSceneRooms: (sceneId: string, rooms: Room[]) => void;
  setSceneDoors: (sceneId: string, doors: Door[]) => void;
  setSceneWindows: (sceneId: string, windows: Window[]) => void;
  setSceneFurniture: (sceneId: string, furniture: Furniture[]) => void;

  // === OPERAÇÕES DE OBJETOS INDIVIDUAIS (não geométricas) ===
  updateWallProperties: (id: string, updates: Partial<Omit<Wall, 'start' | 'end'>>) => void;
  updateRoomProperties: (id: string, updates: Partial<Omit<Room, 'points'>>) => void;
  updateDoor: (id: string, updates: Partial<Door>) => void;
  updateWindow: (id: string, updates: Partial<Window>) => void;
  updateFurniture: (id: string, updates: Partial<Furniture>) => void;

  // === DELEÇÃO (sem pipeline) ===
  deleteWall: (id: string) => void;
  deleteRoom: (id: string) => void;
  deleteDoor: (id: string) => void;
  deleteWindow: (id: string) => void;
  deleteFurniture: (id: string) => void;
  deleteMeasurement: (id: string) => void;

  // === ADIÇÃO DE OBJETOS NÃO-GEOMÉTRICOS ===
  addDoor: (door: Omit<Door, 'id'>) => void;
  addWindow: (window: Omit<Window, 'id'>) => void;
  addFurniture: (furniture: Omit<Furniture, 'id'>) => void;
  addMeasurement: (measurement: Omit<Measurement, 'id'>) => void;

  // === LIVE UPDATES (sem histórico, para drag) ===
  _liveUpdateFurniturePos: (id: string, position: [number, number, number]) => void;
  _liveUpdateRoomPoints: (id: string, points: Vec2[]) => void;

  // === SELEÇÃO ===
  select: (id: string | string[], addToSelection?: boolean) => void;
  deselect: (id: string) => void;
  deselectAll: () => void;

  // === UI ===
  setViewMode: (mode: ViewMode) => void;
  setTool: (tool: Tool) => void;
  toggleGrid: () => void;
  toggleSnap: () => void;
  setGrid: (grid: Partial<GridSettings>) => void;
  setSnap: (snap: Partial<SnapSettings>) => void;
  setCamera: (camera: Partial<CameraState>) => void;
  panCamera: (dx: number, dy: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  fitToView: () => void;
  zoomToRoom: (roomId: string) => void;
  setAssembleMode: (enabled: boolean) => void;

  // === HISTÓRICO ===
  saveToHistory: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // === UTILIDADES ===
  duplicateFurniture: (id: string) => void;
  duplicateRoom: (id: string) => void;
  splitWall: (wallId: string, point: Vec2) => void; // Mantido para compatibilidade
}

// ==================== HELPERS ====================
const safeClone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

const getCurrentScene = (state: EditorState): Scene | undefined => {
  return state.scenes.find(s => s.id === state.currentSceneId);
};

// ==================== STORE ====================
const initialState = {
  project: null,
  scenes: [],
  currentSceneId: null,
  viewMode: '2d' as ViewMode,
  tool: 'select' as Tool,
  selectedIds: [],
  hoveredId: null,
  assembleMode: false,
  grid: { visible: true, size: 0.5, color: '#475569', opacity: 0.3 },
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
  camera: { position: [0, 0, 10], target: [0, 0, 0], zoom: 1, rotation: 0 },
  history: [],
  historyIndex: -1,
  _topologyCache: {},
};

export const useEditorStore = create<EditorState>()(
  devtools(
    immer((set, get) => ({
      ...initialState,

      // ==========================================
      // PROJETO
      // ==========================================
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
        });

        get().saveToHistory();
      },

      loadTemplate: async (templateId, name) => {
        const template = (FLOOR_PLAN_TEMPLATES as FloorPlanTemplate[]).find(
          t => t.id === templateId
        );
        if (!template) return;

        const sceneId = uuidv4();
        const newScene: Scene = {
          id: sceneId,
          name: 'Planta Baixa',
          level: 0,
          height: 2.8,
          walls: template.walls.map(w => ({
            id: uuidv4(),
            start: [...w.start] as Vec2,
            end: [...w.end] as Vec2,
            thickness: 0.15,
            height: 2.8,
            material: 'concrete',
            color: '#64748b',
            visible: true,
            locked: false,
            openingIds: [],
            roomIds: [],
          })),
          rooms: [],
          doors: [],
          windows: [],
          furniture: [],
          measurements: [],
        };

        const newProject: Project = {
          id: uuidv4(),
          name,
          description: template.description,
          owner: {
            id: 'user-1',
            name: 'Usuário',
            email: 'user@example.com',
            role: 'owner',
          },
          collaborators: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          settings: { units: 'metric', currency: 'BRL' },
        };

        // Pipeline inicial para template
        const { resolveTopology } = await import('@core/wall/TopologyResolver');
        const { buildGraph } = await import('@core/wall/WallGraph');
        const { RoomDetection } = await import('@core/room/RoomDetectionEngine');

        const topoResult = resolveTopology(newScene.walls, {
          aggressive: false,
          preserveShortWalls: true,
        });
        newScene.walls = topoResult.walls;

        const graph = buildGraph(newScene.walls);
        newScene.rooms = RoomDetection.detectRooms(graph, newScene.walls);

        set(state => {
          state.project = newProject;
          state.scenes = [newScene];
          state.currentSceneId = sceneId;
          state.history = [];
          state.historyIndex = -1;
          state.selectedIds = [];
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

      exportProject: () =>
        JSON.stringify({ project: get().project, scenes: get().scenes }, null, 2),

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
            state._topologyCache = {};
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
        });

        get().saveToHistory();
      },

      deleteScene: (id: string) => {
        set(state => {
          state.scenes = state.scenes.filter(s => s.id !== id);
          if (state.currentSceneId === id) {
            state.currentSceneId = state.scenes[0]?.id || null;
          }
          if (state._topologyCache[id]) {
            delete state._topologyCache[id];
          }
        });

        get().saveToHistory();
      },

      setCurrentScene: (id: string) => {
        set(state => {
          state.currentSceneId = id;
        });
      },

      // ==========================================
      // OPERAÇÕES DE CENA - Wrappers Simples
      // Chamados APENAS pelo GeometryController
      // CORREÇÃO: Sem saveToHistory (o controller gerencia)
      // ==========================================
      setSceneWalls: (sceneId: string, walls: Wall[]) => {
        set(state => {
          const scene = state.scenes.find(s => s.id === sceneId);
          if (scene) {
            scene.walls = walls;
          }
        });
        // REMOVIDO: get().saveToHistory(); - Agora é gerenciado pelo controller
      },

      setSceneRooms: (sceneId: string, rooms: Room[]) => {
        set(state => {
          const scene = state.scenes.find(s => s.id === sceneId);
          if (scene) {
            scene.rooms = rooms;
          }
        });
        // REMOVIDO: get().saveToHistory(); - Agora é gerenciado pelo controller
      },

      setSceneDoors: (sceneId: string, doors: Door[]) => {
        set(state => {
          const scene = state.scenes.find(s => s.id === sceneId);
          if (scene) {
            scene.doors = doors;
          }
        });
        get().saveToHistory();
      },

      setSceneWindows: (sceneId: string, windows: Window[]) => {
        set(state => {
          const scene = state.scenes.find(s => s.id === sceneId);
          if (scene) {
            scene.windows = windows;
          }
        });
        get().saveToHistory();
      },

      setSceneFurniture: (sceneId: string, furniture: Furniture[]) => {
        set(state => {
          const scene = state.scenes.find(s => s.id === sceneId);
          if (scene) {
            scene.furniture = furniture;
          }
        });
        get().saveToHistory();
      },

      // ==========================================
      // PROPRIEDADES NÃO-GEOMÉTRICAS
      // ==========================================
      updateWallProperties: (
        id: string,
        updates: Partial<Omit<Wall, 'start' | 'end'>>
      ) => {
        set(state => {
          const scene = getCurrentScene(state);
          const wall = scene?.walls.find(w => w.id === id);
          if (wall) {
            Object.assign(wall, updates);
          }
        });
        get().saveToHistory();
      },

      updateRoomProperties: (id: string, updates: Partial<Omit<Room, 'points'>>) => {
        set(state => {
          const scene = getCurrentScene(state);
          const room = scene?.rooms.find(r => r.id === id);
          if (room) {
            Object.assign(room, updates);
          }
        });
        get().saveToHistory();
      },

      updateDoor: (id: string, updates: Partial<Door>) => {
        set(state => {
          const scene = getCurrentScene(state);
          const door = scene?.doors.find(d => d.id === id);
          if (door) {
            Object.assign(door, updates);
          }
        });
        get().saveToHistory();
      },

      updateWindow: (id: string, updates: Partial<Window>) => {
        set(state => {
          const scene = getCurrentScene(state);
          const windowObj = scene?.windows.find(w => w.id === id);
          if (windowObj) {
            Object.assign(windowObj, updates);
          }
        });
        get().saveToHistory();
      },

      updateFurniture: (id: string, updates: Partial<Furniture>) => {
        set(state => {
          const scene = getCurrentScene(state);
          const furniture = scene?.furniture.find(f => f.id === id);
          if (furniture) {
            Object.assign(furniture, updates);
          }
        });
        get().saveToHistory();
      },

      // ==========================================
      // DELEÇÃO (sem pipeline - controller recalcula)
      // ==========================================
      deleteWall: (id: string) => {
        set(state => {
          const scene = getCurrentScene(state);
          if (scene) {
            scene.walls = scene.walls.filter(w => w.id !== id);
          }
        });
        // NOTA: O controller deve chamar pipeline após deleção
        get().saveToHistory();
      },

      deleteRoom: (id: string) => {
        set(state => {
          const scene = getCurrentScene(state);
          if (scene) {
            scene.rooms = scene.rooms.filter(r => r.id !== id);
          }
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

      deleteFurniture: (id: string) => {
        set(state => {
          const scene = getCurrentScene(state);
          if (scene) {
            scene.furniture = scene.furniture.filter(f => f.id !== id);
          }
        });
        get().saveToHistory();
      },

      deleteMeasurement: (id: string) => {
        set(state => {
          const scene = getCurrentScene(state);
          if (scene) {
            scene.measurements = scene.measurements.filter(m => m.id !== id);
          }
        });
        get().saveToHistory();
      },

      // ==========================================
      // ADIÇÃO DE OBJETOS NÃO-GEOMÉTRICOS
      // ==========================================
      addDoor: (door: Omit<Door, 'id'>) => {
        set(state => {
          const scene = getCurrentScene(state);
          if (!scene) return;

          const newDoor: Door = { id: uuidv4(), ...door };
          scene.doors.push(newDoor);

          const wall = scene.walls.find(w => w.id === door.wallId);
          if (wall) {
            wall.openingIds ??= [];
            if (!wall.openingIds.includes(newDoor.id)) {
              wall.openingIds.push(newDoor.id);
            }
          }
        });
        get().saveToHistory();
      },

      addWindow: (window: Omit<Window, 'id'>) => {
        set(state => {
          const scene = getCurrentScene(state);
          if (!scene) return;

          const newWindow: Window = { id: uuidv4(), ...window };
          scene.windows.push(newWindow);

          const wall = scene.walls.find(w => w.id === window.wallId);
          if (wall) {
            wall.openingIds ??= [];
            if (!wall.openingIds.includes(newWindow.id)) {
              wall.openingIds.push(newWindow.id);
            }
          }
        });
        get().saveToHistory();
      },

      addFurniture: (furniture: Omit<Furniture, 'id'>) => {
        set(state => {
          const scene = getCurrentScene(state);
          if (scene) {
            const newFurniture: Furniture = { id: uuidv4(), ...furniture };
            scene.furniture.push(newFurniture);
          }
        });
        get().saveToHistory();
      },

      addMeasurement: (measurement: Omit<Measurement, 'id'>) => {
        set(state => {
          const scene = getCurrentScene(state);
          if (scene) {
            const newMeasurement: Measurement = { id: uuidv4(), ...measurement };
            scene.measurements.push(newMeasurement);
          }
        });
        get().saveToHistory();
      },

      // ==========================================
      // LIVE UPDATES (sem histórico - para drag)
      // ==========================================
      _liveUpdateFurniturePos: (id: string, position: [number, number, number]) => {
        set(state => {
          const scene = getCurrentScene(state);
          if (!scene) return;
          const furn = scene.furniture.find(f => f.id === id);
          if (furn) {
            furn.position = [...position] as [number, number, number];
          }
        });
        // NÃO salva no histórico - é live update
      },

      _liveUpdateRoomPoints: (id: string, points: Vec2[]) => {
        set(state => {
          const scene = getCurrentScene(state);
          if (!scene) return;
          const room = scene.rooms.find(r => r.id === id);
          if (!room) return;

          room.points = points.map(p => [...p] as Vec2);

          // Recalcula área e perímetro
          let area = 0;
          for (let i = 0; i < points.length; i++) {
            const j = (i + 1) % points.length;
            area += points[i][0] * points[j][1] - points[j][0] * points[i][1];
          }
          room.area = Math.abs(area) / 2;

          let perimeter = 0;
          for (let i = 0; i < points.length; i++) {
            const j = (i + 1) % points.length;
            perimeter += Math.hypot(points[j][0] - points[i][0], points[j][1] - points[i][1]);
          }
          room.perimeter = perimeter;
        });
        // NÃO salva no histórico - é live update
      },

      // ==========================================
      // SPLIT WALL (mantido para compatibilidade)
      // ==========================================
      splitWall: (wallId: string, point: Vec2) => {
        set(state => {
          const scene = getCurrentScene(state);
          if (!scene) return;

          const { splitWallAtPoint } = require('@core/wall/WallSplitEngine');
          const result = splitWallAtPoint(scene.walls, wallId, point);

          if (result.removedWallIds.length === 0) return;

          // Reatribui aberturas
          const { segments } = result;
          const findSegmentForPosition = (positionOnWall: number) => {
            const t = positionOnWall;
            for (const seg of segments) {
              if (t >= seg.tStart - 1e-6 && t <= seg.tEnd + 1e-6) {
                return seg;
              }
            }
            return null;
          };

          // Atualiza doors
          for (const door of scene.doors) {
            if (door.wallId === wallId) {
              let totalLength = 0;
              for (const seg of segments) {
                totalLength += Math.hypot(
                  seg.end[0] - seg.start[0],
                  seg.end[1] - seg.start[1]
                );
              }
              const t = totalLength > 0 ? door.position / totalLength : 0;
              const targetSeg = findSegmentForPosition(t);
              if (targetSeg) {
                door.wallId = targetSeg.wallId;
                const segLength = Math.hypot(
                  targetSeg.end[0] - targetSeg.start[0],
                  targetSeg.end[1] - targetSeg.start[1]
                );
                const localT = (t - targetSeg.tStart) / (targetSeg.tEnd - targetSeg.tStart);
                door.position = localT * segLength;
              }
            }
          }

          // Atualiza windows
          for (const win of scene.windows) {
            if (win.wallId === wallId) {
              let totalLength = 0;
              for (const seg of segments) {
                totalLength += Math.hypot(
                  seg.end[0] - seg.start[0],
                  seg.end[1] - seg.start[1]
                );
              }
              const t = totalLength > 0 ? win.position / totalLength : 0;
              const targetSeg = findSegmentForPosition(t);
              if (targetSeg) {
                win.wallId = targetSeg.wallId;
                const segLength = Math.hypot(
                  targetSeg.end[0] - targetSeg.start[0],
                  targetSeg.end[1] - targetSeg.start[1]
                );
                const localT = (t - targetSeg.tStart) / (targetSeg.tEnd - targetSeg.tStart);
                win.position = localT * segLength;
              }
            }
          }

          // Atualiza walls
          scene.walls = result.updatedWalls;

          // Atualiza openingIds
          for (const seg of segments) {
            const newWall = scene.walls.find(w => w.id === seg.wallId);
            if (newWall) newWall.openingIds = [];
          }
          for (const door of scene.doors) {
            const wall = scene.walls.find(w => w.id === door.wallId);
            if (wall && !wall.openingIds?.includes(door.id)) {
              wall.openingIds ??= [];
              wall.openingIds.push(door.id);
            }
          }
          for (const win of scene.windows) {
            const wall = scene.walls.find(w => w.id === win.wallId);
            if (wall && !wall.openingIds?.includes(win.id)) {
              wall.openingIds ??= [];
              wall.openingIds.push(win.id);
            }
          }
        });

        get().saveToHistory();
      },

      // ==========================================
      // SELEÇÃO
      // ==========================================
      select: (id: string | string[], addToSelection = false) => {
        set(state => {
          if (Array.isArray(id)) {
            state.selectedIds = id;
          } else if (addToSelection) {
            if (!state.selectedIds.includes(id)) {
              state.selectedIds.push(id);
            }
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

      // ==========================================
      // UI
      // ==========================================
      setViewMode: (mode: ViewMode) => {
        set(state => {
          state.viewMode = mode;
        });
      },

      setTool: (tool: Tool) => {
        set(state => {
          state.tool = tool;
        });
      },

      toggleGrid: () => {
        set(state => {
          state.grid.visible = !state.grid.visible;
        });
      },

      toggleSnap: () => {
        set(state => {
          state.snap.enabled = !state.snap.enabled;
        });
      },

      setGrid: (grid: Partial<GridSettings>) => {
        set(state => {
          state.grid = { ...state.grid, ...grid };
        });
      },

      setSnap: (snap: Partial<SnapSettings>) => {
        set(state => {
          state.snap = { ...state.snap, ...snap };
        });
      },

      setCamera: (camera: Partial<CameraState>) => {
        set(state => {
          state.camera = { ...state.camera, ...camera };
        });
      },

      panCamera: (dx: number, dy: number) => {
        set(state => {
          state.camera.position[0] += dx / state.camera.zoom;
          state.camera.position[1] += dy / state.camera.zoom;
        });
      },

      zoomIn: () => {
        set(state => {
          state.camera.zoom = Math.min(state.camera.zoom * 1.2, 10);
        });
      },

      zoomOut: () => {
        set(state => {
          state.camera.zoom = Math.max(state.camera.zoom / 1.2, 0.1);
        });
      },

      fitToView: () => {
        set(state => {
          state.camera.position = [0, 0, 10];
          state.camera.target = [0, 0, 0];
          state.camera.zoom = 1;
          state.camera.rotation = 0;
        });
      },

      zoomToRoom: (roomId: string) => {
        const state = get();
        const scene = getCurrentScene(state);
        if (!scene) return;

        const room = scene.rooms.find(r => r.id === roomId);
        if (!room) return;

        const points = room.points;
        let minX = Infinity,
          minY = Infinity,
          maxX = -Infinity,
          maxY = -Infinity;

        for (const p of points) {
          minX = Math.min(minX, p[0]);
          minY = Math.min(minY, p[1]);
          maxX = Math.max(maxX, p[0]);
          maxY = Math.max(maxY, p[1]);
        }

        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        const width = maxX - minX;
        const height = maxY - minY;
        const newZoom = Math.min(10, 5 / Math.max(width, height));

        set(s => {
          s.camera.target = [centerX, centerY, 0];
          s.camera.zoom = newZoom;
        });
      },

      setAssembleMode: (enabled: boolean) => {
        set(state => {
          state.assembleMode = enabled;
        });
      },

      // ==========================================
      // HISTÓRICO
      // ==========================================
      saveToHistory: () => {
        set(state => {
          const currentState = {
            scenes: safeClone(state.scenes),
            currentSceneId: state.currentSceneId,
          };

          // Remove estados futuros se estiver no meio do histórico
          if (state.historyIndex < state.history.length - 1) {
            state.history = state.history.slice(0, state.historyIndex + 1);
          }

          state.history.push(currentState);
          state.historyIndex++;

          // Limita tamanho do histórico
          if (state.history.length > MAX_HISTORY_SIZE) {
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
          s._topologyCache = {};
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
          s._topologyCache = {};
        });
      },

      canUndo: () => get().historyIndex > 0,
      canRedo: () => get().historyIndex < get().history.length - 1,

      // ==========================================
      // UTILIDADES
      // ==========================================
      duplicateFurniture: (id: string) => {
        set(state => {
          const scene = getCurrentScene(state);
          if (!scene) return;

          const original = scene.furniture.find(f => f.id === id);
          if (!original) return;

          const origPos = original.position;
          const px = Array.isArray(origPos) ? origPos[0] : (origPos as any).x ?? 0;
          const py = Array.isArray(origPos) ? origPos[1] : (origPos as any).y ?? 0;
          const pz = Array.isArray(origPos) ? origPos[2] : (origPos as any).z ?? 0;

          const cloned: Furniture = {
            ...original,
            id: uuidv4(),
            position: [px + 0.5, py + 0.5, pz ?? 0] as [number, number, number],
            name: `${original.name} (cópia)`,
          };

          scene.furniture.push(cloned);
        });

        get().saveToHistory();
      },

      duplicateRoom: (id: string) => {
        const state = get();
        const scene = getCurrentScene(state);
        if (!scene) return;

        const original = scene.rooms.find(r => r.id === id);
        if (!original) return;

        const offset = 2.0;
        const newPoints = original.points.map(p => [p[0] + offset, p[1]] as Vec2);

        const newRoom: Room = {
          ...original,
          id: uuidv4(),
          points: newPoints,
          name: `${original.name} (cópia)`,
        };

        set(s => {
          const sc = getCurrentScene(s);
          if (sc) {
            sc.rooms.push(newRoom);
          }
        });

        get().saveToHistory();
      },
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

  for (const id of state.selectedIds) {
    const wall = scene.walls.find(w => w.id === id);
    if (wall) items.push(wall);

    const room = scene.rooms.find(r => r.id === id);
    if (room) items.push(room);

    const door = scene.doors.find(d => d.id === id);
    if (door) items.push(door);

    const windowObj = scene.windows.find(w => w.id === id);
    if (windowObj) items.push(windowObj);

    const furniture = scene.furniture.find(f => f.id === id);
    if (furniture) items.push(furniture);
  }

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

export const selectCurrentTopology = (state: EditorState) => {
  const sceneId = state.currentSceneId;
  if (!sceneId) return undefined;
  return state._topologyCache[sceneId];
};

export default useEditorStore;
