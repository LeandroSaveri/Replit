// src/features/editor/handlers/tools/WallToolHandler.ts
// ============================================
// CORRIGIDO: Batching semântico amarrado aos gestos pointer down/up
// ============================================

import { ToolHandler } from '../ToolHandler';
import { InteractionEvent } from '@/core/interaction/InteractionEngine';
import { GeometryController } from '@/core/geometry/GeometryController';
import { SnapEngine } from '@/core/snap/SnapEngine';
import { editorStore } from '@/store/editorStore';
import type { Point2D, Wall } from '@/types';

interface WallPreview {
  start: Point2D;
  end: Point2D;
  valid: boolean;
  length: number;
}

export class WallToolHandler extends ToolHandler {
  private geometryController: GeometryController;
  private snapEngine: SnapEngine;
  
  // Estado de desenho
  private isDrawing = false;
  private startPoint: Point2D | null = null;
  private currentPreview: WallPreview | null = null;
  private activeWallId: string | null = null;

  constructor() {
    super('wall');
    this.geometryController = new GeometryController();
    this.snapEngine = new SnapEngine();
  }

  // ============================================
  // CICLO DE VIDA DO GESTO - BATCHING AMARRADO
  // ============================================

  onPointerDown(event: InteractionEvent): void {
    // Inicia batch semântico no início do gesto
    this.geometryController.beginBatch('Draw wall');
    
    this.isDrawing = true;
    this.startPoint = this.snapEngine.snap(event.worldPosition);
    
    // Cria parede inicial (zero length, será atualizada no drag)
    try {
      const wall = this.geometryController.addWall({
        start: this.startPoint,
        end: this.startPoint, // Inicialmente zero
        thickness: this.getWallThickness(),
        height: this.getWallHeight()
      });
      
      this.activeWallId = wall.id;
      this.currentPreview = {
        start: this.startPoint,
        end: this.startPoint,
        valid: false,
        length: 0
      };
      
      this.emit('wallStarted', { wall, startPoint: this.startPoint });
      
    } catch (error) {
      // Falha na criação - cancela o batch
      this.geometryController.cancelBatch();
      this.resetState();
      this.emit('error', error);
    }
  }

  onPointerMove(event: InteractionEvent): void {
    if (!this.isDrawing || !this.startPoint || !this.activeWallId) return;

    const rawPoint = event.worldPosition;
    const snappedPoint = this.snapEngine.snap(rawPoint, {
      orthogonal: event.isShiftDown, // Shift = modo ortogonal
      fromPoint: this.startPoint
    });

    // Atualiza preview
    this.currentPreview = {
      start: this.startPoint,
      end: snappedPoint,
      valid: this.validateWall(this.startPoint, snappedPoint),
      length: this.calculateLength(this.startPoint, snappedPoint)
    };

    // Atualiza a parede no batch (ainda não commitado)
    this.geometryController.updateWall(this.activeWallId, {
      end: snappedPoint
    });

    this.emit('wallPreview', this.currentPreview);
  }

  onPointerUp(event: InteractionEvent): void {
    if (!this.isDrawing || !this.startPoint || !this.activeWallId) return;

    const finalPoint = this.snapEngine.snap(event.worldPosition, {
      orthogonal: event.isShiftDown,
      fromPoint: this.startPoint
    });

    const length = this.calculateLength(this.startPoint, finalPoint);

    // Validação final
    if (length < 0.05) { // Mínimo 5cm
      // Wall muito curta - cancela e remove
      this.geometryController.deleteWall(this.activeWallId);
      this.geometryController.cancelBatch(); // ❌ Descarta todo o batch
      
      this.emit('wallCancelled', { reason: 'Too short', length });
    } else {
      // Finaliza parede - commit do batch
      this.geometryController.updateWall(this.activeWallId, {
        end: finalPoint
      });
      
      this.geometryController.endBatch(); // ✅ Commita histórico único
      
      this.emit('wallCompleted', {
        wallId: this.activeWallId,
        start: this.startPoint,
        end: finalPoint,
        length
      });
    }

    this.resetState();
  }

  onPointerCancel(): void {
    // Gest cancelado (ex: toque com outro dedo, interrupção do sistema)
    if (this.isDrawing && this.activeWallId) {
      this.geometryController.deleteWall(this.activeWallId);
      this.geometryController.cancelBatch(); // ❌ Descarta alterações
    }
    this.resetState();
    this.emit('wallCancelled', { reason: 'Gesture cancelled' });
  }

  // ============================================
  // MÉTODOS PRIVADOS
  // ============================================

  private resetState(): void {
    this.isDrawing = false;
    this.startPoint = null;
    this.currentPreview = null;
    this.activeWallId = null;
  }

  private validateWall(start: Point2D, end: Point2D): boolean {
    const length = this.calculateLength(start, end);
    return length >= 0.05; // Mínimo 5cm
  }

  private calculateLength(a: Point2D, b: Point2D): number {
    return Math.hypot(b.x - a.x, b.y - a.y);
  }

  private getWallThickness(): number {
    return editorStore.getState().settings.defaultWallThickness ?? 0.15;
  }

  private getWallHeight(): number {
    return editorStore.getState().settings.defaultWallHeight ?? 2.8;
  }

  // ============================================
  // LIMPEZA
  // ============================================

  dispose(): void {
    if (this.isDrawing) {
      this.onPointerCancel();
    }
    this.geometryController.dispose();
    this.snapEngine.dispose();
    super.dispose();
  }
}
