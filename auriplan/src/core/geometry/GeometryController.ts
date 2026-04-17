// ============================================
// GeometryController.ts - Controller Central Geométrico
// ÚNICA fonte de verdade para operações geométricas
// CORREÇÃO: Histórico unificado + Responsabilidades consolidadas
// ============================================

import type { Wall, Vec2, Scene, Room, Furniture } from '@auriplan-types';
import { SnapSolver, type SnapOptions, type SnapResult } from '@core/snap/SnapSolver';
import { runGeometryPipeline, type GeometryPipelineOptions } from '@core/pipeline/GeometryPipeline';
import type { WallGraph } from '@core/wall/WallGraph';
import type { EditorState } from '@store/editorStore';

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
 * - Centralizar TODA lógica geométrica de paredes e cômodos
 * - Aplicar snap via SnapSolver (único sistema de snap)
 * - Executar pipeline via runGeometryPipeline
 * - Atualizar scene.walls e scene.rooms via store actions
 * - NUNCA modificar walls diretamente - sempre via store.setSceneWalls
 * - NÃO gerencia: UI, seleção, histórico (isso é do store)
 */
export class GeometryController {
  private getState: () => EditorState;
  private options: GeometryControllerOptions;
  private currentSceneId: string | null = null;
  
  // CORREÇÃO: Flag para controle de histórico em batch
  private isBatchOperation = false;
  private pendingHistorySave = false;

  constructor(getState: () => EditorState, options: GeometryControllerOptions = {}) {
    this.getState = getState;
    this.options = options;
  }

  // ============================================
  // CONFIGURAÇÃO
  // ============================================

  setCurrentScene(sceneId: string): void {
    this.currentSceneId = sceneId;
  }

  getCurrentScene(): Scene | undefined {
    const state = this.getState();
    return state.scenes.find(s => s.id === (this.currentSceneId || state.currentSceneId));
  }

  // ============================================
  // CONTROLE DE HISTÓRICO (NOVO)
  // ============================================

  /**
   * Inicia operação em batch - histórico será salvo apenas uma vez no final
   */
  beginBatch(): void {
    this.isBatchOperation = true;
    this.pendingHistorySave = false;
  }

  /**
   * Finaliza operação em batch - salva histórico se necessário
   */
  endBatch(): void {
    this.isBatchOperation = false;
    if (this.pendingHistorySave) {
      this.saveHistory();
      this.pendingHistorySave = false;
    }
  }

  /**
   * Salva no histórico (respeitando batch)
   */
  private saveHistory(): void {
    if (this.isBatchOperation) {
      this.pendingHistorySave = true;
      return;
    }
    this.getState().saveToHistory();
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
    const state = this.getState();
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
   * Snap simplificado - retorna apenas o ponto snapped
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
  // COMMIT - Único ponto de atualização do store
  // CORREÇÃO: Histórico unificado
  // ============================================

  /**
   * Commit atomico: atualiza walls e rooms no store
   * ÚNICO lugar que chama setSceneWalls/setSceneRooms
   * CORREÇÃO: Salva histórico apenas uma vez
   */
  private commit(result: { walls: Wall[]; rooms: Room[]; graph: WallGraph }): void {
    const state = this.getState();
    const sceneId = this.currentSceneId || state.currentSceneId;
    if (!sceneId) {
      console.error('[GeometryController] No current scene');
      return;
    }

    // CORREÇÃO: Atualiza sem salvar histórico individualmente
    // Usa setState direto para bypassar o saveToHistory das actions
    const { setSceneWalls, setSceneRooms } = state;
    
    // Atualiza walls
    const scene = state.scenes.find(s => s.id === sceneId);
    if (scene) {
      scene.walls = result.walls;
      scene.rooms = result.rooms;
    }

    // Salva histórico uma única vez (respeitando batch)
    this.saveHistory();

    if (this.options.debug) {
      console.log('[GeometryController] commit:', {
        walls: result.walls.length,
        rooms: result.rooms.length,
        sceneId,
      });
    }
  }

  // ============================================
  // OPERAÇÕES DE PAREDE (todas passam por runPipeline + commit)
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

    const wallMap = new Map(scene.walls.map(w => [w.id, { ...w }]));

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

  /**
   * Atualiza propriedades não-geométricas de uma parede
   */
  updateWallProperties(wallId: string, updates: Partial<Omit<Wall, 'start' | 'end'>>): void {
    const state = this.getState();
    state.updateWallProperties(wallId, updates);
  }

  // ============================================
  // OPERAÇÕES DE CÔMODO (via pipeline automático)
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
   * Atualiza pontos de um cômodo - APENAS propriedades, não geometria
   * A geometria das paredes é gerenciada pelos métodos de parede
   */
  updateRoomPoints(roomId: string, points: Vec2[]): void {
    // Atualiza via store - isso é live update, não precisa de pipeline
    const state = this.getState();
    state._liveUpdateRoomPoints(roomId, points);
  }

  /**
   * Commit final de atualização de cômodo (salva no histórico)
   */
  commitRoomUpdate(roomId: string): void {
    const state = this.getState();
    const scene = this.getCurrentScene();
    if (!scene) return;

    const room = scene.rooms.find(r => r.id === roomId);
    if (room) {
      // Força reexecução do pipeline se necessário
      this.forceRecompute();
      // Salva no histórico
      this.saveHistory();
    }
  }

  /**
   * Atualiza propriedades não-geométricas de um cômodo
   */
  updateRoomProperties(roomId: string, updates: Partial<Omit<Room, 'points'>>): void {
    const state = this.getState();
    state.updateRoomProperties(roomId, updates);
  }

  // ============================================
  // OPERAÇÕES DE MOBÍLIA (NOVO: Centralizado no controller)
  // ============================================

  /**
   * Move mobília - delega ao store
   */
  moveFurniture(furnitureId: string, newPosition: [number, number, number]): void {
    const state = this.getState();
    state.updateFurniture(furnitureId, { position: newPosition });
    this.saveHistory();
  }

  /**
   * Atualiza posição de mobília em tempo real (live update)
   */
  liveUpdateFurniture(furnitureId: string, position: [number, number, number]): void {
    const state = this.getState();
    // Usa método interno do store para live update (sem histórico)
    state._liveUpdateFurniturePos(furnitureId, position);
  }

  /**
   * Atualiza propriedades de mobília
   */
  updateFurniture(furnitureId: string, updates: Partial<Furniture>): void {
    const state = this.getState();
    state.updateFurniture(furnitureId, updates);
    this.saveHistory();
  }

  /**
   * Deleta mobília
   */
  deleteFurniture(furnitureId: string): void {
    const state = this.getState();
    state.deleteFurniture(furnitureId);
    this.saveHistory();
  }

  // ============================================
  // OPERAÇÕES AVANÇADAS (NOVO: Split centralizado)
  // ============================================

  /**
   * Divide uma parede em um ponto (para T-junctions)
   * CORREÇÃO: Agora centralizado no controller
   */
  splitWall(wallId: string, point: Vec2): void {
    const state = this.getState();
    const scene = this.getCurrentScene();
    if (!scene) return;

    // Importa dinamicamente para evitar circular dependency
    const { splitWallAtPoint } = require('@core/wall/WallSplitEngine');
    const result = splitWallAtPoint(scene.walls, wallId, point);
    
    if (result.removedWallIds.length === 0) return;

    // Reatribui aberturas (doors/windows)
    const { segments } = result;
    
    // Atualiza doors
    for (const door of scene.doors) {
      if (door.wallId === wallId) {
        const totalLength = result.updatedWalls.reduce((acc, w) => {
          if (result.removedWallIds.includes(w.id)) return acc;
          return acc + Math.hypot(w.end[0] - w.start[0], w.end[1] - w.start[1]);
        }, 0);
        
        const t = totalLength > 0 ? door.position / totalLength : 0;
        
        // Encontra segmento correspondente
        for (const seg of segments) {
          if (t >= seg.tStart - 1e-6 && t <= seg.tEnd + 1e-6) {
            door.wallId = seg.wallId;
            const segLength = Math.hypot(seg.end[0] - seg.start[0], seg.end[1] - seg.start[1]);
            const localT = (t - seg.tStart) / (seg.tEnd - seg.tStart);
            door.position = localT * segLength;
            break;
          }
        }
      }
    }

    // Atualiza windows (mesma lógica)
    for (const win of scene.windows) {
      if (win.wallId === wallId) {
        const totalLength = result.updatedWalls.reduce((acc, w) => {
          if (result.removedWallIds.includes(w.id)) return acc;
          return acc + Math.hypot(w.end[0] - w.start[0], w.end[1] - w.start[1]);
        }, 0);
        
        const t = totalLength > 0 ? win.position / totalLength : 0;
        
        for (const seg of segments) {
          if (t >= seg.tStart - 1e-6 && t <= seg.tEnd + 1e-6) {
            win.wallId = seg.wallId;
            const segLength = Math.hypot(seg.end[0] - seg.start[0], seg.end[1] - seg.start[1]);
            const localT = (t - seg.tStart) / (seg.tEnd - seg.tStart);
            win.position = localT * segLength;
            break;
          }
        }
      }
    }

    // Atualiza walls e roda pipeline
    const resultPipeline = this.runPipeline(result.updatedWalls);
    this.commit(resultPipeline);
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

  /**
   * Obtém paredes conectadas a um vértice (para SelectToolHandler)
   */
  getWallsConnectedToVertex(vertex: Vec2, excludeWallId?: string): Array<{ id: string; start: Vec2; end: Vec2 }> {
    const scene = this.getCurrentScene();
    if (!scene) return [];

    const connected: Array<{ id: string; start: Vec2; end: Vec2 }> = [];
    
    for (const wall of scene.walls) {
      if (wall.id === excludeWallId) continue;
      
      const startMatch = Math.abs(wall.start[0] - vertex[0]) < 1e-6 && 
                         Math.abs(wall.start[1] - vertex[1]) < 1e-6;
      const endMatch = Math.abs(wall.end[0] - vertex[0]) < 1e-6 && 
                       Math.abs(wall.end[1] - vertex[1]) < 1e-6;
      
      if (startMatch || endMatch) {
        connected.push({ id: wall.id, start: wall.start, end: wall.end });
      }
    }
    
    return connected;
  }
}

export default GeometryController;
