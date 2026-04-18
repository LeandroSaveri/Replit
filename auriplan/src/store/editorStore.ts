// src/store/editorStore.ts
// ============================================
// EDITOR STORE - Zustand Store Principal
// Corrigido: addWallsBatch exposto, sem require, compatível com Vercel
// ============================================

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

// Tipos
export interface Point2D { x: number; y: number; }
export interface Wall { id: string; start: Point2D; end: Point2D; thickness: number; height: number; }
export interface Room { id: string; name: string; points: Point2D[]; area: number; }
export interface Furniture { id: string; type: string; position: { x: number; y: number; z: number }; rotation: number; }
export interface Project { id: string; name: string; owner: { id: string; name: string; email: string; role: 'owner' | 'editor' | 'viewer'; }; }
export interface ViewState { zoom: number; pan: { x: number; y: number }; }
export interface Tool { id: string; name: string; icon: string; cursor: string; }
export interface EditorState {
  project: Project | null;
  walls: Wall[];
  rooms: Room[];
  furniture: Furniture[];
  selectedIds: string[];
  currentTool: string;
  viewState: ViewState;
  isLoading: boolean;
  error: string | null;
  // Ações
  createProject: (name: string, owner: Project['owner'], templateId?: string) => void;
  addWall: (wall: Omit<Wall, 'id'>) => void;
  addWallsBatch: (walls: Omit<Wall, 'id'>[]) => void;
  updateWall: (id: string, updates: Partial<Wall>) => void;
  deleteWall: (id: string) => void;
  addRoom: (room: Omit<Room, 'id'>) => void;
  updateRoom: (id: string, updates: Partial<Room>) => void;
  deleteRoom: (id: string) => void;
  addFurniture: (furniture: Omit<Furniture, 'id'>) => void;
  setSelectedIds: (ids: string[]) => void;
  clearSelection: () => void;
  setTool: (toolId: string) => void;
  setViewState: (updates: Partial<ViewState>) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  loadTemplate: (template: { id: string; name: string; walls: Wall[]; rooms: Room[] }) => void;
  undo: () => void;
  redo: () => void;
  clearError: () => void;
}

// Template vazio inicial
const createEmptyProject = (name: string, owner: Project['owner']): Project => ({
  id: uuidv4(),
  name,
  owner,
});

// Store principal
export const useEditorStore = create<EditorState>()(
  immer(
    persist(
      (set, get) => ({
        // Estado inicial
        project: null,
        walls: [],
        rooms: [],
        furniture: [],
        selectedIds: [],
        currentTool: 'select',
        viewState: { zoom: 1, pan: { x: 0, y: 0 } },
        isLoading: false,
        error: null,

        // Criar projeto
        createProject: (name, owner, templateId) => {
          set((state) => {
            state.project = createEmptyProject(name, owner);
            state.walls = [];
            state.rooms = [];
            state.furniture = [];
            state.selectedIds = [];
            state.viewState = { zoom: 1, pan: { x: 0, y: 0 } };
            state.error = null;
          });
          
          // Se tiver template, aplicar após criação
          if (templateId) {
            // Template será aplicado via loadTemplate
            console.log('Template ID recebido:', templateId);
          }
        },

        // Adicionar parede única
        addWall: (wall) => {
          set((state) => {
            const newWall: Wall = { ...wall, id: uuidv4() };
            state.walls.push(newWall);
          });
        },

        // ⭐ CRÍTICO: addWallsBatch - usado por GeometryController e Templates
        addWallsBatch: (walls) => {
          set((state) => {
            const newWalls: Wall[] = walls.map(w => ({ ...w, id: uuidv4() }));
            state.walls.push(...newWalls);
            console.log(`[editorStore] ${newWalls.length} paredes adicionadas. Total: ${state.walls.length}`);
          });
        },

        updateWall: (id, updates) => {
          set((state) => {
            const wall = state.walls.find(w => w.id === id);
            if (wall) Object.assign(wall, updates);
          });
        },

        deleteWall: (id) => {
          set((state) => {
            state.walls = state.walls.filter(w => w.id !== id);
            state.selectedIds = state.selectedIds.filter(sid => sid !== id);
          });
        },

        addRoom: (room) => {
          set((state) => {
            const newRoom: Room = { ...room, id: uuidv4() };
            state.rooms.push(newRoom);
          });
        },

        updateRoom: (id, updates) => {
          set((state) => {
            const room = state.rooms.find(r => r.id === id);
            if (room) Object.assign(room, updates);
          });
        },

        deleteRoom: (id) => {
          set((state) => {
            state.rooms = state.rooms.filter(r => r.id !== id);
            state.selectedIds = state.selectedIds.filter(sid => sid !== id);
          });
        },

        addFurniture: (furniture) => {
          set((state) => {
            const newFurniture: Furniture = { ...furniture, id: uuidv4() };
            state.furniture.push(newFurniture);
          });
        },

        setSelectedIds: (ids) => {
          set((state) => { state.selectedIds = ids; });
        },

        clearSelection: () => {
          set((state) => { state.selectedIds = []; });
        },

        setTool: (toolId) => {
          set((state) => { state.currentTool = toolId; });
        },

        setViewState: (updates) => {
          set((state) => { Object.assign(state.viewState, updates); });
        },

        zoomIn: () => {
          set((state) => { state.viewState.zoom = Math.min(state.viewState.zoom * 1.2, 10); });
        },

        zoomOut: () => {
          set((state) => { state.viewState.zoom = Math.max(state.viewState.zoom / 1.2, 0.1); });
        },

        resetView: () => {
          set((state) => { state.viewState = { zoom: 1, pan: { x: 0, y: 0 } }; });
        },

        // ⭐ CRÍTICO: Carregar template completo
        loadTemplate: (template) => {
          set((state) => {
            state.walls = template.walls.map(w => ({ ...w, id: w.id || uuidv4() }));
            state.rooms = template.rooms.map(r => ({ ...r, id: r.id || uuidv4() }));
            state.selectedIds = [];
            state.viewState = { zoom: 1, pan: { x: 0, y: 0 } };
            console.log(`[editorStore] Template "${template.name}" carregado: ${state.walls.length} paredes, ${state.rooms.length} cômodos`);
          });
        },

        undo: () => {
          console.log('[editorStore] Undo não implementado com history engine');
        },

        redo: () => {
          console.log('[editorStore] Redo não implementado com history engine');
        },

        clearError: () => {
          set((state) => { state.error = null; });
        },
      }),
      {
        name: 'auriplan-editor-storage',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({ 
          project: state.project,
          walls: state.walls,
          rooms: state.rooms,
          furniture: state.furniture,
        }),
      }
    )
  )
);

// Hook para acesso fácil
export default useEditorStore;
