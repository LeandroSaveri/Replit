// ============================================
// applyGeometryPipeline.ts
// Fase 1 e 2 – aplica pipeline e retorna grafo para cache
// ============================================

import { runGeometryPipeline } from "@core/pipeline/GeometryPipeline";
import { createEmptyWallGraph } from "@core/wall/WallGraph";
import type { WallGraph } from "@core/wall/WallGraph";
import type { Scene } from "@auriplan-types";

/**
 * Aplica o pipeline geométrico completo em uma cena.
 * @param scene A cena a ser processada (mutável)
 * @returns O grafo topológico resultante (útil para cache)
 */
export function applyGeometryPipeline(scene: Scene): WallGraph {
  try {
    const result = runGeometryPipeline(scene.walls, { applyCornerAdjustments: true });
    // Atualiza as paredes e cômodos da cena
    scene.walls = result.walls ?? scene.walls;
    scene.rooms = (result.rooms ?? []) as any;
    return result.graph;
  } catch (err) {
    console.error("Erro no pipeline geométrico:", err);
    scene.rooms = [];
    return createEmptyWallGraph();
  }
}
