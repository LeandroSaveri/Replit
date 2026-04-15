// ============================================
// GeometryPipeline.ts – ordem corrigida (split → graph → topology → corners → rooms)
// Fase 4: Ajuste de cantos idempotente e com única iteração
// ============================================

import type { Wall, Vec2 } from '@auriplan-types';
import type { Room } from '@core/room/RoomDetectionEngine';
import type { WallGraph } from '@core/wall/WallGraph';
import { resolveTopology } from '@core/wall/TopologyResolver';
import { splitWallsAtIntersections } from '@core/wall/WallSplitEngine';
import { buildGraph, createEmptyWallGraph, computeCornerAdjustments } from '@core/wall/WallGraph';
import { RoomDetection } from '@core/room/RoomDetectionEngine';
import { vec2 } from '@core/math/vector';
import { GEOM_TOL } from '@core/geometry/geometryConstants';

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
 * Aplica ajustes de canto diretamente nos pontos start/end das paredes.
 * Retorna novas paredes (imutável).
 */
function applyCornerAdjustmentsToWalls(
  walls: Wall[],
  adjustments: Map<number, { start?: Vec2; end?: Vec2 }>
): Wall[] {
  const newWalls = walls.map((wall, idx) => {
    const adj = adjustments.get(idx);
    if (!adj) return wall;
    const cloned = cloneWall(wall);
    if (adj.start) {
      cloned.start = adj.start;
    }
    if (adj.end) {
      cloned.end = adj.end;
    }
    return cloned;
  });
  return newWalls;
}

export function runGeometryPipeline(
  walls: Wall[],
  options: GeometryPipelineOptions = {}
): GeometryPipelineResult {
  const { debug = false, applyCornerAdjustments: enableCornerAdjustments = true } = options;
  const log = (msg: string) => { if (debug) console.log(`[GeometryPipeline] ${msg}`); };

  try {
    log('Iniciando pipeline geométrico (ordem corrigida)');

    // Etapa 1: Split de interseções (agora primeiro)
    log('Etapa 1: splitWallsAtIntersections');
    let currentWalls = splitWallsAtIntersections(walls);
    log(`  - Paredes após divisão: ${currentWalls.length}`);

    // Etapa 2: Construção do grafo
    log('Etapa 2: buildGraph');
    let graph = buildGraph(currentWalls);
    log(`  - Nós: ${graph.nodes.length}, junções: ${graph.junctions.size}`);

    // Etapa 3: Resolução de topologia (após grafo)
    log('Etapa 3: resolveTopology');
    const topo = resolveTopology(currentWalls);
    currentWalls = topo.walls;
    log(`  - Paredes após topologia: ${currentWalls.length}`);

    // Etapa 4: Corner adjustments (se ativado) - UMA ÚNICA ITERAÇÃO (FASE 4)
    if (enableCornerAdjustments && graph.junctions.size > 0) {
      log('Etapa 4: computeCornerAdjustments (Fase 4)');
      try {
        const adjustments = computeCornerAdjustments(graph, currentWalls);
        if (adjustments.size > 0) {
          const adjustedWalls = applyCornerAdjustmentsToWalls(currentWalls, adjustments);
          
          // Verifica convergência: mudou algo acima da tolerância?
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
            log(`  - Ajustes aplicados em ${adjustments.size} paredes.`);
            currentWalls = adjustedWalls;
            
            // Reconstrói grafo apenas se houve mudança
            log('  - Reconstruindo grafo após ajustes');
            graph = buildGraph(currentWalls);
            log(`  - Novo grafo: ${graph.nodes.length} nós, ${graph.junctions.size} junções`);
            // IMPORTANTE: não chama resolveTopology novamente para evitar loops
          } else {
            log('  - Ajustes insignificantes (convergência atingida), ignorando.');
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
