// src/core/pipeline/GeometryPipeline.ts
export interface GeometryPipelineOptions {
  debug?: boolean;
  applyCornerAdjustments?: boolean;
  preserveShortWalls?: boolean; // NOVO
}

export function runGeometryPipeline(
  walls: Wall[],
  options: GeometryPipelineOptions = {}
): GeometryPipelineResult {
  // ...
  const topo = resolveTopology(currentWalls, {
    aggressive: true,
    preserveShortWalls: options.preserveShortWalls, // REPASSAR
  });
  // ...
}
