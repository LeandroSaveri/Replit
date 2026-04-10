// ============================================
// FILE: src/core/pipeline/GeometryPipeline.ts
// ============================================
// SEM ERROS, apenas referências corrigidas
// ============================================

import type { Wall } from '@auriplan-types';
import type { Room } from '@core/room/RoomDetectionEngine';
import type { WallGraph } from '@core/wall/WallGraph';
import { resolveTopology } from '@core/wall/TopologyResolver';
import { splitWallsAtIntersections } from '@core/wall/WallSplitEngine';
import { buildGraph, createEmptyWallGraph } from '@core/wall/WallGraph';
import { RoomDetection } from '@core/room/RoomDetectionEngine';

export interface GeometryPipelineResult {
  walls: Wall[];
  rooms: Room[];
  graph: WallGraph;
}

export interface GeometryPipelineOptions {
  debug?: boolean;
}

export function runGeometryPipeline(
  walls: Wall[],
  options: GeometryPipelineOptions = {}
): GeometryPipelineResult {
  const { debug = false } = options;
  const log = (msg: string) => { if (debug) console.log(`[GeometryPipeline] ${msg}`); };

  try {
    log('Iniciando pipeline geométrico');
    log('Etapa 1: resolveTopology');
    const topo = resolveTopology(walls);
    log(`  - Paredes após topologia: ${topo.walls.length}`);

    log('Etapa 2: splitWallsAtIntersections');
    const split = splitWallsAtIntersections(topo.walls);
    log(`  - Paredes após divisão: ${split.length}`);

    log('Etapa 3: buildGraph');
    const graph = buildGraph(split);
    log(`  - Nós no grafo: ${graph.nodes.length}, junções: ${graph.junctions.size}`);

    log('Etapa 4: detectRooms');
    const rooms = RoomDetection.detectRooms(graph, split);
    log(`  - Cômodos detectados: ${rooms.length}`);

    return { walls: split, rooms, graph };
  } catch (err) {
    console.error('Geometry pipeline error', err);
    return { walls: walls, rooms: [], graph: createEmptyWallGraph() };
  }
}
