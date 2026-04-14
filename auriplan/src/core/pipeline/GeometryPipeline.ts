// ============================================
// GeometryPipeline.ts – ordem corrigida (split → graph → topology → corners → rooms)
// ============================================

import type { Wall, Vec2 } from '@auriplan-types';
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
  applyCornerAdjustments?: boolean;
}

/**
 * Calcula um fingerprint simples das paredes para detecção de mudanças.
 * Não é criptográfico – apenas para comparar se a geometria mudou.
 * Ordena por ID para garantir consistência independente da ordem do array.
 */
export function computeWallsFingerprint(walls: Wall[]): string {
  const sorted = [...walls].sort((a, b) => a.id.localeCompare(b.id));
  const parts = sorted.map(w =>
    `${w.id}:${w.start[0].toFixed(6)},${w.start[1].toFixed(6)}-${w.end[0].toFixed(6)},${w.end[1].toFixed(6)}:${w.thickness.toFixed(6)}`
  );
  return parts.join('|');
}

/**
 * Clona profundamente uma parede para evitar mutação de objetos congelados.
 */
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
 * Aplica ajustes de canto criando NOVAS paredes (imutável).
 */
function applyAdjustmentsToWalls(walls: Wall[], adjustments: Map<number, any>): Wall[] {
  const newWalls = walls.map((wall, idx) => cloneWall(wall));
  for (const [wallIdx, adj] of adjustments) {
    const wall = newWalls[wallIdx];
    if (!wall) continue;
    if (adj.start?.left) {
      wall.start = [...adj.start.left] as Vec2;
    }
    if (adj.end?.left) {
      wall.end = [...adj.end.left] as Vec2;
    }
  }
  return newWalls;
}

export function runGeometryPipeline(
  walls: Wall[],
  options: GeometryPipelineOptions = {}
): GeometryPipelineResult {
  const { debug = false, applyCornerAdjustments = true } = options;
  const log = (msg: string) => { if (debug) console.log(`[GeometryPipeline] ${msg}`); };

  try {
    log('Iniciando pipeline geométrico (ordem corrigida)');

    // Etapa 1: Split de interseções (agora primeiro)
    log('Etapa 1: splitWallsAtIntersections');
    let split = splitWallsAtIntersections(walls);
    log(`  - Paredes após divisão: ${split.length}`);

    // Etapa 2: Construção do grafo
    log('Etapa 2: buildGraph');
    let graph = buildGraph(split);
    log(`  - Nós: ${graph.nodes.length}, junções: ${graph.junctions.size}`);

    // Etapa 3: Resolução de topologia (após grafo)
    log('Etapa 3: resolveTopology');
    const topo = resolveTopology(split);
    split = topo.walls;
    log(`  - Paredes após topologia: ${split.length}`);

    // Etapa 4: Corner adjustments (se ativado)
    if (applyCornerAdjustments && graph.junctions.size > 0) {
      log('Etapa 4: computeCornerAdjustments');
      try {
        const adjustments = computeCornerAdjustments(graph, split);
        if (adjustments && adjustments.size > 0) {
          log(`  - Ajustes para ${adjustments.size} paredes. Aplicando...`);
          split = applyAdjustmentsToWalls(split, adjustments);
          log('  - Reconstruindo grafo após ajustes');
          graph = buildGraph(split);
          log(`  - Novo grafo: ${graph.nodes.length} nós, ${graph.junctions.size} junções`);
        } else {
          log('  - Nenhum ajuste necessário.');
        }
      } catch (err) {
        console.error('Erro em computeCornerAdjustments, ignorando ajustes:', err);
      }
    }

    // Etapa 5: Detecção de cômodos
    log('Etapa 5: detectRooms');
    const rooms = RoomDetection.detectRooms(graph, split);
    log(`  - Cômodos detectados: ${rooms.length}`);

    return { walls: split, rooms, graph };
  } catch (err) {
    console.error('Geometry pipeline error:', err);
    return { walls: walls, rooms: [], graph: createEmptyWallGraph() };
  }
}
