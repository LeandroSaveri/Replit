// ============================================
// FILE: src/core/pipeline/applyGeometryPipeline.ts
// ============================================
// SEM ERROS
// ============================================

import { runGeometryPipeline } from "@core/pipeline/GeometryPipeline";
import { createEmptyWallGraph } from "@core/wall/WallGraph";
import type { WallGraph } from "@core/wall/WallGraph";
import type { Scene } from "@auriplan-types";

export function applyGeometryPipeline(scene: Scene): WallGraph {
  try {
    const result = runGeometryPipeline(scene.walls);
    scene.walls = result.walls ?? scene.walls;
    scene.rooms = (result.rooms ?? []) as any;
    return result.graph;
  } catch (err) {
    console.error("Erro no pipeline geométrico:", err);
    scene.rooms = [];
    return createEmptyWallGraph();
  }
}
