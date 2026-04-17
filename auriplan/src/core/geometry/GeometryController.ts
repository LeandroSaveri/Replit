# ============================================
# 1. GEOMETRY CONTROLLER CORRIGIDO
# ============================================

geometry_controller = '''// ============================================
// GeometryController.ts - Controller Central Geométrico
// Integra SnapSolver + GeometryPipeline + Store
// ============================================

import type { Wall, Vec2, Scene, Furniture } from '@auriplan-types';
import { SnapSolver, type SnapOptions, type SnapResult } from '@core/snap/SnapSolver';
import { runGeometryPipeline, type GeometryPipelineOptions } from '@core/pipeline/GeometryPipeline';
import type { EditorStore } from '@store/editorStore';
import type { WallGraph } from '@core/wall/WallGraph';
import type { Room } from '@core/room/RoomDetectionEngine';

export interface GeometryControllerOptions {
  debug?: boolean;
  pipelineOptions?: Partial<GeometryPipelineOptions>;
}

export interface SnapConfig {
  enableGrid?: boolean;
  enableAngle?: boolean;
  enableVertex?: boolean;
  enableIntersection?: boolean;
  enableMidpoint?: boolean;
  enableWall?: boolean;
  gridSize?: number;
  snapTol?: number;
  zoom?: number;
}

/**
 * GeometryController - Centralizador de todas as operações geométricas
 * 
 * Responsabilidades:
 * - Centralizar TODA lógica geométrica
 * - Aplicar snap via SnapSolver (único sistema de snap)
 * - Executar pipeline via runGeometryPipeline
 * - Atualizar scene.walls e scene.rooms via store
 * - NUNCA modificar walls diretamente - sempre via store actions
 */
export class GeometryController {
  private store: EditorStore;
  private options: GeometryControllerOptions;
  private currentSceneId: string | null = null;

  constructor(store: EditorStore, options: GeometryControllerOptions = {}) {
    this.store = store;
    this.options = options;
  }

  // ============================================
  // CONFIGURAÇÃO
  // ============================================

  setCurrentScene(sceneId: string): void {
    this.currentSceneId = sceneId;
  }

  getCurrentScene(): Scene | undefined {
    const state = this.store.getState();
    return state.scenes.find(s => s.id === (this.currentSceneId || state.currentSceneId));
  }

  // ============================================
  // SNAP CENTRALIZADO (único ponto de snap)
  // ============================================

  /**
   * Computa snap para um ponto - ÚNICO método de snap no sistema
   */
  computeSnap(
    point: Vec2, 
    startPoint?: Vec2,
    customConfig?: Partial<SnapConfig>
  ): SnapResult {
    const scene = this.getCurrentScene();
    const state = this.store.getState();
    
    const walls = scene?.walls ?? [];
    
    const config: SnapConfig = {
      enableGrid: true,
      enableAngle: true,
      enableVertex: true,
      enableIntersection: true,
      enableMidpoint: true,
      enableWall: true,
      gridSize: state.grid.size,
      snapTol: state.snap.distance,
      zoom: 1,
      ...customConfig
    };

    const options: SnapOptions = {
      gridSize: config.gridSize,
      snapTol: config.snapTol,
      zoom: config.zoom,
      enableGrid: config.enableGrid,
      enableAngle: config.enableAngle,
      enableVertex: config.enableVertex,
      enableIntersection: config.enableIntersection,
      enableMidpoint: config.enableMidpoint,
      enableWall: config.enableWall,
    };

    return SnapSolver.computeSnap(point, walls, startPoint, options);
  }

  /**
   * Snap simplificado - retorna apenas o ponto
   */
  snapPoint(point: Vec2, startPoint?: Vec2, customConfig?: Partial<SnapConfig>): Vec2 {
    return this.computeSnap(point, startPoint, customConfig).point;
  }

  // ============================================
  // PIPELINE CENTRALIZADO (único ponto de pipeline)
  // ============================================

  /**
   * Executa o geometry pipeline - ÚNICO método de processamento geométrico
   */
  private runPipeline(walls: Wall[]): { walls: Wall[]; rooms: Room[]; graph: WallGraph } {
    const result = runGeometryPipeline(walls, {
      debug: this.options.debug,
      mode: 'incremental',
      applyCornerAdjustments: true,
      preserveShortWalls: true,
      ...this.options.pipelineOptions,
    });

    return result;
  }

  // ============================================
  // OPERAÇÕES DE PAREDE
  // ============================================

  /**
   * Adiciona uma nova parede com snap e pipeline automáticos
   */
  addWall(start: Vec2, end: Vec2, thickness: number = 0.15): Wall {
    const snappedStart = this.snapPoint(start);
    const snappedEnd = this.snapPoint(end, snappedStart);

    const newWall: Wall = {
      id: crypto.randomUUID(),
      start: snappedStart,
      end: snappedEnd,
      thickness,
      height: 2.8,
      type: 'wall',
    };

    const scene = this.getCurrentScene();
    const currentWalls = scene?.walls ?? [];
    const newWalls = [...currentWalls, newWall];

    const result = this.runPipeline(newWalls);
    this.commit(result);

    return newWall;
  }

  /**
   * Adiciona múltiplas paredes em batch
   */
  addWallsBatch(wallDefs: Array<{ start: Vec2; end: Vec2; thickness?: number }>): Wall[] {
    const scene = this.getCurrentScene();
    const currentWalls = scene?.walls ?? [];
    
    const newWalls: Wall[] = wallDefs.map(def => ({
      id: crypto.randomUUID(),
      start: this.snapPoint(def.start),
      end: this.snapPoint(def.end, def.start),
      thickness: def.thickness ?? 0.15,
      height: 2.8,
      type: 'wall',
    }));

    const allWalls = [...currentWalls, ...newWalls];
    const result = this.runPipeline(allWalls);
    this.commit(result);

    return newWalls;
  }

  /**
   * Move um vértice de parede (start ou end)
   */
  moveVertex(wallId: string, vertex: 'start' | 'end', newPos: Vec2): void {
    const snapped = this.snapPoint(newPos);
    
    const scene = this.getCurrentScene();
    if (!scene) return;

    const newWalls = scene.walls.map(w => {
      if (w.id !== wallId) return w;
      return { ...w, [vertex]: snapped };
    });

    const result = this.runPipeline(newWalls);
    this.commit(result);
  }

  /**
   * Move múltiplos vértices em batch (para drag contínuo otimizado)
   */
  moveVerticesBatch(updates: Array<{ wallId: string; vertex: 'start' | 'end'; newPos: Vec2 }>): void {
    const scene = this.getCurrentScene();
    if (!scene) return;

    let wallMap = new Map(scene.walls.map(w => [w.id, { ...w }]));

    for (const update of updates) {
      const wall = wallMap.get(update.wallId);
      if (wall) {
        const snapped = this.snapPoint(update.newPos);
        wallMap.set(update.wallId, { ...wall, [update.vertex]: snapped });
      }
    }

    const newWalls = Array.from(wallMap.values());
    const result = this.runPipeline(newWalls);
    this.commit(result);
  }

  /**
   * Move uma parede inteira por delta
   */
  moveWall(wallId: string, delta: Vec2): void {
    const scene = this.getCurrentScene();
    if (!scene) return;

    const newWalls = scene.walls.map(w => {
      if (w.id !== wallId) return w;
      return {
        ...w,
        start: [w.start[0] + delta[0], w.start[1] + delta[1]] as Vec2,
        end: [w.end[0] + delta[0], w.end[1] + delta[1]] as Vec2,
      };
    });

    const result = this.runPipeline(newWalls);
    this.commit(result);
  }

  /**
   * Move múltiplas paredes por delta (com propagação de conexões)
   */
  moveWallsBatch(wallIds: string[], delta: Vec2): void {
    const scene = this.getCurrentScene();
    if (!scene) return;

    const idSet = new Set(wallIds);
    
    const newWalls = scene.walls.map(w => {
      if (!idSet.has(w.id)) return w;
      return {
        ...w,
        start: [w.start[0] + delta[0], w.start[1] + delta[1]] as Vec2,
        end: [w.end[0] + delta[0], w.end[1] + delta[1]] as Vec2,
      };
    });

    const result = this.runPipeline(newWalls);
    this.commit(result);
  }

  /**
   * Atualiza geometria completa de uma parede
   */
  updateWallGeometry(wallId: string, newStart: Vec2, newEnd: Vec2): void {
    const snappedStart = this.snapPoint(newStart);
    const snappedEnd = this.snapPoint(newEnd, snappedStart);
    
    const scene = this.getCurrentScene();
    if (!scene) return;

    const newWalls = scene.walls.map(w => {
      if (w.id !== wallId) return w;
      return { ...w, start: snappedStart, end: snappedEnd };
    });

    const result = this.runPipeline(newWalls);
    this.commit(result);
  }

  /**
   * Atualiza múltiplas paredes em batch
   */
  updateWallsBatch(updates: Array<{ id: string; start: Vec2; end: Vec2 }>): void {
    const scene = this.getCurrentScene();
    if (!scene) return;

    const updateMap = new Map(updates.map(u => [u.id, u]));

    const newWalls = scene.walls.map(w => {
      const update = updateMap.get(w.id);
      if (!update) return w;
      return {
        ...w,
        start: this.snapPoint(update.start),
        end: this.snapPoint(update.end, update.start),
      };
    });

    const result = this.runPipeline(newWalls);
    this.commit(result);
  }

  /**
   * Substitui todas as paredes (uso avançado)
   */
  replaceWalls(walls: Wall[]): void {
    const result = this.runPipeline(walls);
    this.commit(result);
  }

  /**
   * Deleta uma parede
   */
  deleteWall(wallId: string): void {
    const scene = this.getCurrentScene();
    if (!scene) return;

    const newWalls = scene.walls.filter(w => w.id !== wallId);
    const result = this.runPipeline(newWalls);
    this.commit(result);
  }

  // ============================================
  // OPERAÇÕES DE CÔMODO
  // ============================================

  /**
   * Cria paredes a partir de um polígono (fecha automaticamente)
   */
  createWallsFromPolygon(points: Vec2[], thickness: number = 0.15): Wall[] {
    if (points.length < 3) return [];

    const walls: Wall[] = [];
    const n = points.length;

    for (let i = 0; i < n - 1; i++) {
      const start = this.snapPoint(points[i]);
      const end = this.snapPoint(points[i + 1], start);
      
      walls.push({
        id: crypto.randomUUID(),
        start,
        end,
        thickness,
        height: 2.8,
        type: 'wall',
      });
    }

    const scene = this.getCurrentScene();
    const currentWalls = scene?.walls ?? [];
    const allWalls = [...currentWalls, ...walls];

    const result = this.runPipeline(allWalls);
    this.commit(result);

    return walls;
  }

  /**
   * Atualiza pontos de um cômodo (propaga para paredes)
   */
  updateRoomPoints(roomId: string, newPoints: Vec2[]): void {
    // Atualiza o cômodo no store
    this.store.getState().updateRoom(roomId, { points: newPoints });
    
    // O pipeline já foi executado se as paredes foram atualizadas
    // Se necessário, podemos forçar re-detecção de cômodos aqui
  }

  // ============================================
  // OPERAÇÕES DE MOBÍLIA
  // ============================================

  /**
   * Move mobília
   */
  moveFurniture(furnitureId: string, newPosition: Vec2 | [number, number, number]): void {
    this.store.getState().updateFurniture(furnitureId, { position: newPosition });
  }

  /**
   * Atualiza posição de mobília em tempo real (live update)
   */
  liveUpdateFurniture(furnitureId: string, position: [number, number, number]): void {
    const state = this.store.getState();
    // Usa método interno do store se disponível, senão updateFurniture normal
    if (state._liveUpdateFurniturePos) {
      state._liveUpdateFurniturePos(furnitureId, position);
    } else {
      state.updateFurniture(furnitureId, { position });
    }
  }

  // ============================================
  // COMMIT - Único ponto de atualização do store
  // ============================================

  private commit(result: { walls: Wall[]; rooms: Room[]; graph: WallGraph }): void {
    const state = this.store.getState();
    const sceneId = this.currentSceneId || state.currentSceneId;
    
    if (!sceneId) {
      console.error('[GeometryController] No current scene');
      return;
    }

    // Atualiza via store actions - NUNCA modifica diretamente
    state.updateSceneWalls(sceneId, result.walls);
    state.updateSceneRooms(sceneId, result.rooms);

    if (this.options.debug) {
      console.log('[GeometryController] commit:', {
        walls: result.walls.length,
        rooms: result.rooms.length,
        sceneId,
      });
    }
  }

  // ============================================
  // UTILIDADES
  // ============================================

  /**
   * Obtém estatísticas da cena atual
   */
  getStats(): { walls: number; rooms: number; nodes: number } {
    const scene = this.getCurrentScene();
    const result = this.runPipeline(scene?.walls ?? []);
    
    return {
      walls: result.walls.length,
      rooms: result.rooms.length,
      nodes: result.graph.nodes.length,
    };
  }

  /**
   * Força reexecução do pipeline na cena atual
   */
  forceRecompute(): void {
    const scene = this.getCurrentScene();
    if (!scene) return;
    
    const result = this.runPipeline(scene.walls);
    this.commit(result);
  }
}

export default GeometryController;

print("✅ GeometryController.ts criado")
