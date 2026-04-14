// ============================================
// applyGeometryPipeline.ts – aplica o pipeline geométrico a uma cena
// ============================================

import type { Scene } from '@auriplan-types';
import { runGeometryPipeline } from './GeometryPipeline';

export function applyGeometryPipeline(scene: Scene): void {
  if (!scene) return;
  const result = runGeometryPipeline(scene.walls, { debug: false });
  scene.walls = result.walls;
  scene.rooms = result.rooms;
  // Se quiser armazenar o grafo na cena: scene.graph = result.graph;
}
