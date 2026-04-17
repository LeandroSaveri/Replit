// src/core/geometry/GeometryController.ts

import type { Wall, Vec2, Scene } from '@auriplan-types';

import { SnapSolver } from '@core/snap/SnapSolver';
import { runGeometryPipeline } from '@core/pipeline/GeometryPipeline';

interface GeometryControllerOptions {
  debug?: boolean;
}

export class GeometryController {
  private scene: Scene;
  private options: GeometryControllerOptions;

  constructor(scene: Scene, options: GeometryControllerOptions = {}) {
    this.scene = scene;
    this.options = options;
  }

  // ============================================
  // SNAP + PIPELINE CENTRALIZADO
  // ============================================

  private applyPipeline(walls: Wall[]): { walls: Wall[]; rooms: any[] } {
    const result = runGeometryPipeline(walls, {
      debug: this.options.debug,
      mode: 'incremental',
      applyCornerAdjustments: true,
    });

    return result;
  }

  private snapPoint(point: Vec2, startPoint?: Vec2): Vec2 {
    const result = SnapSolver.computeSnap(point, this.scene.walls, {
      enableGrid: true,
      enableAngle: true,
      enableVertex: true,
      enableIntersection: true,
      enableMidpoint: true,
      enableWall: true,
    });

    return result.point;
  }

  // ============================================
  // COMANDOS GEOMÉTRICOS
  // ============================================

  addWall(start: Vec2, end: Vec2): void {
    const snappedStart = this.snapPoint(start);
    const snappedEnd = this.snapPoint(end, snappedStart);

    const newWall: Wall = {
      id: crypto.randomUUID(),
      start: snappedStart,
      end: snappedEnd,
      thickness: 0.15,
    };

    const newWalls = [...this.scene.walls, newWall];

    const result = this.applyPipeline(newWalls);

    this.commit(result);
  }

  moveVertex(wallId: string, vertex: 'start' | 'end', newPos: Vec2): void {
    const snapped = this.snapPoint(newPos);

    const newWalls = this.scene.walls.map(w => {
      if (w.id !== wallId) return w;

      return {
        ...w,
        [vertex]: snapped,
      };
    });

    const result = this.applyPipeline(newWalls);

    this.commit(result);
  }

  moveWall(wallId: string, delta: Vec2): void {
    const newWalls = this.scene.walls.map(w => {
      if (w.id !== wallId) return w;

      return {
        ...w,
        start: [w.start[0] + delta[0], w.start[1] + delta[1]],
        end: [w.end[0] + delta[0], w.end[1] + delta[1]],
      };
    });

    const result = this.applyPipeline(newWalls);

    this.commit(result);
  }

  replaceWalls(walls: Wall[]): void {
    const result = this.applyPipeline(walls);
    this.commit(result);
  }

  // ============================================
  // COMMIT (ÚNICO PONTO DE UPDATE)
  // ============================================

  private commit(result: { walls: Wall[]; rooms: any[] }) {
    this.scene.walls = result.walls;
    this.scene.rooms = result.rooms;

    if (this.options.debug) {
      console.log('[GeometryController] commit:', {
        walls: result.walls.length,
        rooms: result.rooms.length,
      });
    }
  }

  // ============================================
  // ACESSO
  // ============================================

  getScene(): Scene {
    return this.scene;
  }
}
