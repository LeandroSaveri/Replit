// ============================================
// GeometryPipeline.ts
// Fase 2 – Corner adjustments com rebuild do grafo
// ============================================

import type { Wall } from '@auriplan-types';
import type { Room } from '@core/room/RoomDetectionEngine';
import type { WallGraph } from '@core/wall/WallGraph';
import { resolveTopology } from '@core/wall/TopologyResolver';
import { splitWallsAtIntersections } from '@core/wall/WallSplitEngine';
import { buildGraph, createEmptyWallGraph, computeCornerAdjustments } from '@core/wall/WallGraph';
import { RoomDetection } from '@core/room/RoomDetectionEngine';

export interface GeometryPipelineResult {
  walls: Wall[];
  rooms: Room[];
  graph: WallGraph;
}

export interface GeometryPipelineOptions {
  debug?: boolean;
  /** Se true, aplica ajustes de canto (esquadrias). Padrão: true */
  applyCornerAdjustments?: boolean;
}

/**
 * Aplica ajustes de canto nas paredes com base no grafo.
 * Modifica as paredes in-place.
 */
function applyAdjustmentsToWalls(walls: Wall[], adjustments: Map<number, any>): void {
  for (const [wallIdx, adj] of adjustments) {
    const wall = walls[wallIdx];
    if (!wall) continue;
    if (adj.start) {
      if (adj.start.left) wall.start = [...adj.start.left] as Vec2;
    }
    if (adj.end) {
      if (adj.end.left) wall.end = [...adj.end.left] as Vec2;
    }
  }
}

export function runGeometryPipeline(
  walls: Wall[],
  options: GeometryPipelineOptions = {}
): GeometryPipelineResult {
  const { debug = false, applyCornerAdjustments = true } = options;
  const log = (msg: string) => { if (debug) console.log(`[GeometryPipeline] ${msg}`); };

  try {
    log('Iniciando pipeline geométrico');
    log('Etapa 1: resolveTopology');
    const topo = resolveTopology(walls);
    log(`  - Paredes após topologia: ${topo.walls.length}`);

    log('Etapa 2: splitWallsAtIntersections');
    const split = splitWallsAtIntersections(topo.walls);
    log(`  - Paredes após divisão: ${split.length}`);

    log('Etapa 3: buildGraph (primeira passagem)');
    let graph = buildGraph(split);
    log(`  - Nós no grafo: ${graph.nodes.length}, junções: ${graph.junctions.size}`);

    // Fase 2: Corner adjustments (se ativado)
    if (applyCornerAdjustments && graph.junctions.size > 0) {
      log('Etapa 4: computeCornerAdjustments');
      const adjustments = computeCornerAdjustments(graph, split);
      if (adjustments.size > 0) {
        log(`  - Ajustes encontrados para ${adjustments.size} paredes. Aplicando...`);
        applyAdjustmentsToWalls(split, adjustments);

        log('Etapa 5: rebuildGraph após ajustes');
        graph = buildGraph(split);
        log(`  - Novo grafo: ${graph.nodes.length} nós, ${graph.junctions.size} junções`);
      } else {
        log('  - Nenhum ajuste de canto necessário.');
      }
    }

    log('Etapa 6: detectRooms');
    const rooms = RoomDetection.detectRooms(graph, split);
    log(`  - Cômodos detectados: ${rooms.length}`);

    return { walls: split, rooms, graph };
  } catch (err) {
    console.error('Geometry pipeline error', err);
    return { walls: walls, rooms: [], graph: createEmptyWallGraph() };
  }
}
