// src/core/pipeline/applyGeometryPipeline.ts

// ============================================
// applyGeometryPipeline.ts – aplica o pipeline geométrico a uma cena
// ============================================

import type { Scene } from '@auriplan-types';
import { runGeometryPipeline, computeWallsFingerprint } from './GeometryPipeline';

export interface ApplyPipelineOptions {
  /** Se true, exibe logs detalhados no console. */
  debug?: boolean;
  /** Se true, força execução mesmo que o fingerprint não tenha mudado. */
  force?: boolean;
  /** Se true, pula execução se o fingerprint das paredes for igual ao cache. */
  skipIfUnchanged?: boolean;
}

/**
 * Aplica o pipeline geométrico completo a uma cena.
 * 
 * **IMPORTANTE:** Esta função **modifica a cena in‑place**.
 * Se você precisa de imutabilidade, passe uma cópia da cena.
 * 
 * @param scene - Cena a ser processada. Será **mutada** (walls e rooms substituídos).
 * @param options - Opções de execução.
 * @returns `true` se a geometria foi alterada, `false` caso contrário.
 */
export function applyGeometryPipeline(
  scene: Scene,
  options: ApplyPipelineOptions = {}
): boolean {
  if (!scene) return false;

  const {
    debug = false,
    force = false,
    skipIfUnchanged = true,
  } = options;

  const currentFingerprint = computeWallsFingerprint(scene.walls);
  const cachedFingerprint = (scene as any)._pipelineFingerprint as string | undefined;

  if (!force && skipIfUnchanged && currentFingerprint === cachedFingerprint) {
    if (debug) console.log('[applyGeometryPipeline] Fingerprint inalterado, pulando pipeline.');
    return false;
  }

  if (debug) {
    console.log('[applyGeometryPipeline] Executando pipeline...');
  }

  const result = runGeometryPipeline(scene.walls, { debug, applyCornerAdjustments: true, mode: 'final' });

  scene.walls = result.walls;
  scene.rooms = result.rooms;

  // Fingerprint recalculado com o estado final (já atribuído)
  const finalFingerprint = computeWallsFingerprint(scene.walls);
  (scene as any)._pipelineFingerprint = finalFingerprint;

  if (debug) {
    console.log('[applyGeometryPipeline] Pipeline concluído. Paredes:', scene.walls.length, 'Cômodos:', scene.rooms.length);
  }

  return true;
}
