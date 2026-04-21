// ============================================
// GeometryPipeline.ts – ordem corrigida (split → graph → topology → corners → rooms)
// Fase 4: Ajuste de cantos com validação de comprimento
// ============================================

import type { Wall, Vec2 } from '@auriplan-types';
import type { Room } from '@auriplan-types';
import type { WallGraph } from '@core/wall/WallGraph';
import { resolveTopology } from '@core/wall/TopologyResolver';
import { splitWallsAtIntersections } from '@core/wall/WallSplitEngine';
import { buildGraph, createEmptyWallGraph, computeCornerAdjustments } from '@core/wall/WallGraph';
import { RoomDetection } from '@core/room/RoomDetectionEngine';
import { vec2 } from '@core/math/vector';
import { GEOM_TOL, MIN_WALL_LENGTH, EPS } from '@core/geometry/geometryConstants';

export interface GeometryPipelineResult {
  walls: Wall[];
  rooms: Room[];
  graph: WallGraph;
}

export interface GeometryPipelineOptions {
  debug?: boolean;
  applyCornerAdjustments?: boolean;
  mode?: 'incremental' | 'final';
  /** Se true, preserva paredes curtas durante a resolução de topologia. */
  preserveShortWalls?: boolean;
}

export function computeWallsFingerprint(walls: Wall[]): string {
  const sorted = [...walls].sort((a, b) => a.id.localeCompare(b.id));
  const parts = sorted.map(w =>
    `${w.id}:${w.start[0].toFixed(6)},${w.start[1].toFixed(6)}-${w.end[0].toFixed(6)},${w.end[1].toFixed(6)}:${w.thickness.toFixed(6)}`
  );
  return parts.join('|');
}

function cloneWall(wall: Wall): Wall {
  return {
    ...wall,
    start: [...wall.start] as Vec2,
    end: [...wall.end] as Vec2,
    connections: wall.connections ? { start: [...wall.connections.start], end: [...wall.connections.end] } : undefined,
    roomIds: wall.roomIds ? [...wall.roomIds] : undefined,
    openingIds: wall.openingIds ? [...wall.openingIds] : undefined,
    metadata: wall.metadata ? { ...wall.metadata } : undefined,
  };
}

/**
 * Aplica ajustes de canto, rejeitando aqueles que resultariam em parede inválida.
 */
function applyCornerAdjustmentsToWalls(
  walls: Wall[],
  adjustments: Map<number, { start?: Vec2; end?: Vec2 }>
): Wall[] {
  const newWalls = walls.map((wall, idx) => {
    const adj = adjustments.get(idx);
    if (!adj) return wall;

    const cloned = cloneWall(wall);
    let modified = false;

    if (adj.start) {
      const testEnd = adj.end ?? cloned.end;
      if (vec2.distance(adj.start, testEnd) >= MIN_WALL_LENGTH - EPS) {
        cloned.start = adj.start;
        modified = true;
      } else {
        console.warn(`[GeometryPipeline] Ajuste start rejeitado para parede ${wall.id}: comprimento resultante ${vec2.distance(adj.start, testEnd).toFixed(4)} < ${MIN_WALL_LENGTH}`);
      }
    }
    if (adj.end) {
      const testStart = adj.start ?? cloned.start;
      if (vec2.distance(testStart, adj.end) >= MIN_WALL_LENGTH - EPS) {
        cloned.end = adj.end;
        modified = true;
      } else {
        console.warn(`[GeometryPipeline] Ajuste end rejeitado para parede ${wall.id}: comprimento resultante ${vec2.distance(testStart, adj.end).toFixed(4)} < ${MIN_WALL_LENGTH}`);
      }
    }

    return modified ? cloned : wall;
  });
  return newWalls;
}

export function runGeometryPipeline(
  walls: Wall[],
  options: GeometryPipelineOptions = {}
): GeometryPipelineResult {
  const { 
    debug = false, 
    applyCornerAdjustments: enableCornerAdjustments = true, 
    mode = 'final',
    preserveShortWalls = false 
  } = options;
  const log = (msg: string) => { if (debug) console.log(`[GeometryPipeline] ${msg}`); };

  try {
    log('Iniciando pipeline geométrico (ordem corrigida)');

    // Etapa 1: Split de interseções
    log('Etapa 1: splitWallsAtIntersections');
    let currentWalls = splitWallsAtIntersections(walls);
    log(`  - Paredes após divisão: ${currentWalls.length}`);

    // Etapa 2: Construção do grafo
    log('Etapa 2: buildGraph');
    let graph = buildGraph(currentWalls);
    log(`  - Nós: ${graph.nodes.length}, junções: ${graph.junctions.size}`);

    // Etapa 3: Resolução de topologia (repassa preserveShortWalls)
    log('Etapa 3: resolveTopology');
    const isIncremental = mode === 'incremental';
    const topo = resolveTopology(currentWalls, { 
      aggressive: !isIncremental,
      preserveShortWalls: preserveShortWalls || isIncremental // preserva curtas no modo incremental
    });
    currentWalls = topo.walls;
    log(`  - Paredes após topologia: ${currentWalls.length}`);

    // Etapa 4: Corner adjustments (com validação)
    if (enableCornerAdjustments && graph.junctions.size > 0) {
      log('Etapa 4: computeCornerAdjustments (com validação de comprimento)');
      try {
        const adjustments = computeCornerAdjustments(graph, currentWalls);
        if (adjustments.size > 0) {
          const adjustedWalls = applyCornerAdjustmentsToWalls(currentWalls, adjustments);
          
          let changed = false;
          for (let i = 0; i < currentWalls.length; i++) {
            const oldW = currentWalls[i];
            const newW = adjustedWalls[i];
            if (!oldW || !newW) continue;
            if (vec2.distance(oldW.start, newW.start) > GEOM_TOL || vec2.distance(oldW.end, newW.end) > GEOM_TOL) {
              changed = true;
              break;
            }
          }
          
          if (changed) {
            // Validação pós-ajuste: garantir que todas as paredes ajustadas mantêm comprimento mínimo
            const validWalls = adjustedWalls.filter(w => vec2.distance(w.start, w.end) >= MIN_WALL_LENGTH - EPS);
            if (validWalls.length === adjustedWalls.length) {
              log(`  - Ajustes válidos aplicados.`);
              currentWalls = adjustedWalls;
              log('  - Reconstruindo grafo após ajustes');
              graph = buildGraph(currentWalls);
              log(`  - Novo grafo: ${graph.nodes.length} nós, ${graph.junctions.size} junções`);
            } else {
              log('  - Ajustes rejeitados por violação de comprimento mínimo.');
            }
          } else {
            log('  - Ajustes insignificantes ou rejeitados, ignorando.');
          }
        } else {
          log('  - Nenhum ajuste necessário.');
        }
      } catch (err) {
        console.error('Erro em computeCornerAdjustments, ignorando ajustes:', err);
      }
    }

    // Etapa 5: Detecção de cômodos
    log('Etapa 5: detectRooms');
    const rooms = RoomDetection.detectRooms(graph, currentWalls);
    log(`  - Cômodos detectados: ${rooms.length}`);

    return { walls: currentWalls, rooms, graph };
  } catch (err) {
    console.error('Geometry pipeline error:', err);
    return { walls: walls, rooms: [], graph: createEmptyWallGraph() };
  }
}
