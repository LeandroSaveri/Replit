// src/features/editor/handlers/tools/WallToolHandler.ts
// ============================================
// WallToolHandler - Desenho interativo de paredes
// Suporte a modo contínuo (sequência) e fechamento automático
// ============================================

import { ToolHandler } from '../ToolHandler';
import { InteractionEvent } from '@/core/interaction/InteractionEngine';
import { GeometryController } from '@/core/controllers/GeometryController';
import { useEditorStore } from '@/store/editorStore';
import type { Vec2, Wall } from '@auriplan-types';

// Constantes
const MIN_WALL_LENGTH = 0.05; // 5 cm
const CLOSE_DISTANCE_THRESHOLD = 0.3; // 30 cm para fechamento de cômodo

export interface WallDrawingState {
  mode: 'idle' | 'drawing';
  points: Vec2[];               // Pontos já fixados (vértices)
  currentPreviewEnd: Vec2 | null; // Ponto atual do mouse (snapped)
  activeWallIds: string[];      // IDs das paredes criadas neste ciclo
  firstPoint: Vec2 | null;      // Guardado para detecção de fechamento
}

export class WallToolHandler extends ToolHandler {
  private controller: GeometryController;
  
  // Estado de desenho contínuo
  private drawingState: WallDrawingState = {
    mode: 'idle',
    points: [],
    currentPreviewEnd: null,
    activeWallIds: [],
    firstPoint: null,
  };

  constructor() {
    super('wall');
    // Obtém o controller como singleton (use sua implementação real)
    this.controller = new GeometryController(() => useEditorStore.getState());
  }

  // ============================================
  // CICLO DE VIDA DO GESTO
  // ============================================

  onPointerDown(event: InteractionEvent): void {
    const point = this.getSnappedPoint(event.worldPosition);

    if (this.drawingState.mode === 'idle') {
      // Inicia nova sequência de desenho
      this.startDrawingSequence(point);
    } else {
      // Adiciona próximo vértice na sequência
      this.addNextVertex(point);
    }
  }

  onPointerMove(event: InteractionEvent): void {
    if (this.drawingState.mode !== 'drawing') return;

    const rawPoint = event.worldPosition;
    const snapped = this.getSnappedPoint(rawPoint, this.getLastFixedPoint());

    // Atualiza preview
    this.drawingState.currentPreviewEnd = snapped;

    // Se há uma parede "fantasma" ativa (última parede em edição), atualiza-a
    if (this.drawingState.activeWallIds.length > 0) {
      const lastWallId = this.drawingState.activeWallIds[this.drawingState.activeWallIds.length - 1];
      const lastFixedPoint = this.getLastFixedPoint();
      if (lastFixedPoint) {
        this.controller.updateWallGeometry(lastWallId, lastFixedPoint, snapped);
      }
    }

    this.emitPreview();
  }

  onPointerUp(event: InteractionEvent): void {
    // Em modo contínuo, a ação já foi executada no pointerDown.
    // Aqui podemos apenas confirmar que o gesto terminou.
  }

  onDoubleTap(event: InteractionEvent): void {
    // Duplo toque finaliza a sequência sem fechar o polígono
    if (this.drawingState.mode === 'drawing') {
      this.finishDrawingSequence(false);
    }
  }

  // ============================================
  // MÉTODOS DE DESENHO CONTÍNUO
  // ============================================

  private startDrawingSequence(firstPoint: Vec2): void {
    // Inicia batch no controller
    this.controller.beginBatch();

    this.drawingState = {
      mode: 'drawing',
      points: [firstPoint],
      currentPreviewEnd: firstPoint, // inicialmente mesmo ponto
      activeWallIds: [],
      firstPoint: firstPoint,
    };

    // Não cria parede ainda; aguarda o próximo ponto.
    this.emit('drawingStarted', { firstPoint });
    this.emitPreview();
  }

  private addNextVertex(point: Vec2): void {
    const lastPoint = this.getLastFixedPoint();
    if (!lastPoint) return;

    // Verifica se estamos fechando o polígono (próximo ao primeiro ponto)
    const distanceToFirst = this.drawingState.firstPoint 
      ? Math.hypot(point[0] - this.drawingState.firstPoint[0], point[1] - this.drawingState.firstPoint[1])
      : Infinity;

    const shouldClose = distanceToFirst < CLOSE_DISTANCE_THRESHOLD && this.drawingState.points.length >= 3;

    if (shouldClose) {
      // Fecha o polígono: cria parede final ligando ao primeiro ponto
      this.createWallBetween(lastPoint, this.drawingState.firstPoint!);
      // Finaliza a sequência e executa pipeline para criar cômodos
      this.finishDrawingSequence(true);
      return;
    }

    // Cria parede entre o último ponto fixo e o novo ponto
    this.createWallBetween(lastPoint, point);

    // Adiciona o novo ponto à lista de pontos fixos
    this.drawingState.points.push(point);

    // Atualiza preview: agora o preview sai do novo ponto
    this.drawingState.currentPreviewEnd = point;

    this.emit('vertexAdded', { point, index: this.drawingState.points.length - 1 });
  }

  private createWallBetween(start: Vec2, end: Vec2): Wall | null {
    const length = Math.hypot(end[0] - start[0], end[1] - start[1]);
    if (length < MIN_WALL_LENGTH) {
      this.emit('wallTooShort', { start, end, length });
      return null;
    }

    const wall = this.controller.addWall(start, end, this.getWallThickness());
    this.drawingState.activeWallIds.push(wall.id);
    return wall;
  }

  private finishDrawingSequence(closed: boolean): void {
    if (this.drawingState.mode !== 'drawing') return;

    // Finaliza batch e commita histórico
    this.controller.endBatch();

    if (closed) {
      this.emit('roomClosed', { points: this.drawingState.points });
    } else {
      this.emit('sequenceFinished', { points: this.drawingState.points });
    }

    this.resetDrawingState();
  }

  private cancelDrawing(): void {
    if (this.drawingState.mode !== 'drawing') return;

    // Remove todas as paredes criadas nesta sequência
    this.drawingState.activeWallIds.forEach(id => {
      this.controller.deleteWall(id);
    });
    this.controller.cancelBatch();

    this.emit('drawingCancelled');
    this.resetDrawingState();
  }

  private resetDrawingState(): void {
    this.drawingState = {
      mode: 'idle',
      points: [],
      currentPreviewEnd: null,
      activeWallIds: [],
      firstPoint: null,
    };
    this.emitPreview();
  }

  // ============================================
  // HELPERS
  // ============================================

  private getSnappedPoint(point: Vec2, startPoint?: Vec2): Vec2 {
    // Usa o snap do GeometryController (que já considera configurações da store)
    return this.controller.snapPoint(point, startPoint);
  }

  private getLastFixedPoint(): Vec2 | null {
    return this.drawingState.points.length > 0 
      ? this.drawingState.points[this.drawingState.points.length - 1] 
      : null;
  }

  private emitPreview(): void {
    this.emit('preview', {
      points: this.drawingState.points,
      previewEnd: this.drawingState.currentPreviewEnd,
    });
  }

  private getWallThickness(): number {
    // Pode vir da store ou de configuração
    return 0.15;
  }

  // ============================================
  // INTERFACE PÚBLICA ADICIONAL
  // ============================================

  /**
   * Força o término da sequência atual (chamado por botão "Concluir")
   */
  public completeDrawing(): void {
    if (this.drawingState.mode === 'drawing') {
      this.finishDrawingSequence(false);
    }
  }

  /**
   * Cancela a sequência atual
   */
  public cancel(): void {
    this.cancelDrawing();
  }

  // ============================================
  // LIFECYCLE
  // ============================================

  dispose(): void {
    this.cancelDrawing();
    super.dispose();
  }
}
