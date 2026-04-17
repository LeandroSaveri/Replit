// src/features/editor/handlers/tools/SelectToolHandler.ts
// ============================================
// CORRIGIDO: Batching para operações de drag de seleção
// ============================================

import { ToolHandler } from '../ToolHandler';
import { InteractionEvent } from '@/core/interaction/InteractionEngine';
import { GeometryController } from '@/core/geometry/GeometryController';
import { SnapEngine } from '@/core/snap/SnapEngine';
import { editorStore } from '@/store/editorStore';
import type { Point2D, Wall, Furniture } from '@/types';

interface DragOperation {
  type: 'wall' | 'furniture' | 'node';
  id: string;
  startPosition: Point2D;
  currentOffset: Point2D;
}

export class SelectToolHandler extends ToolHandler {
  private geometryController: GeometryController;
  private snapEngine: SnapEngine;
  
  private isDragging = false;
  private dragOperation: DragOperation | null = null;
  private selectionBox: { start: Point2D; end: Point2D } | null = null;

  constructor() {
    super('select');
    this.geometryController = new GeometryController();
    this.snapEngine = new SnapEngine();
  }

  // ============================================
  // SELEÇÃO E DRAG - COM BATCHING
  // ============================================

  onPointerDown(event: InteractionEvent): void {
    const hit = this.hitTest(event.worldPosition);
    
    if (hit) {
      // Inicia drag de elemento
      this.startDrag(hit, event.worldPosition);
    } else {
      // Inicia box selection
      this.startSelectionBox(event.worldPosition);
    }
  }

  private startDrag(hit: { type: string; id: string }, startPos: Point2D): void {
    this.isDragging = true;
    
    // Inicia batch semântico
    const batchDescription = hit.type === 'wall' ? 'Move wall' : 
                             hit.type === 'furniture' ? 'Move furniture' : 
                             'Move node';
    this.geometryController.beginBatch(batchDescription);

    this.dragOperation = {
      type: hit.type as any,
      id: hit.id,
      startPosition: startPos,
      currentOffset: { x: 0, y: 0 }
    };

    // Seleciona o elemento
    editorStore.setState(state => ({
      ...state,
      selection: { type: hit.type, id: hit.id, ids: [hit.id] }
    }));

    this.emit('dragStarted', this.dragOperation);
  }

  onPointerMove(event: InteractionEvent): void {
    if (!this.isDragging) {
      if (this.selectionBox) {
        this.updateSelectionBox(event.worldPosition);
      }
      return;
    }

    if (!this.dragOperation) return;

    const currentPos = this.snapEngine.snap(event.worldPosition);
    const offset = {
      x: currentPos.x - this.dragOperation.startPosition.x,
      y: currentPos.y - this.dragOperation.startPosition.y
    };

    this.dragOperation.currentOffset = offset;

    // Aplica transformação no batch (ainda não commitado)
    this.applyDragTransform(this.dragOperation, currentPos);

    this.emit('dragging', {
      operation: this.dragOperation,
      currentPosition: currentPos
    });
  }

  onPointerUp(event: InteractionEvent): void {
    if (this.isDragging && this.dragOperation) {
      // Finaliza drag - commita o batch
      this.geometryController.endBatch();
      
      this.emit('dragCompleted', this.dragOperation);
    } else if (this.selectionBox) {
      this.finalizeSelectionBox();
    }

    this.resetState();
  }

  onPointerCancel(): void {
    if (this.isDragging) {
      // Cancela drag - reverte alterações
      this.geometryController.cancelBatch();
      this.emit('dragCancelled', this.dragOperation);
    }
    this.resetState();
  }

  // ============================================
  // APLICAÇÃO DE TRANSFORMAÇÕES
  // ============================================

  private applyDragTransform(op: DragOperation, currentPos: Point2D): void {
    switch (op.type) {
      case 'wall':
        this.moveWall(op.id, op.currentOffset);
        break;
      case 'furniture':
        this.moveFurniture(op.id, currentPos);
        break;
      case 'node':
        this.moveNode(op.id, currentPos);
        break;
    }
  }

  private moveWall(wallId: string, offset: Point2D): void {
    const wall = this.getWall(wallId);
    if (!wall) return;

    const newStart = {
      x: wall.start.x + offset.x,
      y: wall.start.y + offset.y
    };
    const newEnd = {
      x: wall.end.x + offset.x,
      y: wall.end.y + offset.y
    };

    this.geometryController.updateWall(wallId, {
      start: newStart,
      end: newEnd
    });
  }

  private moveFurniture(furnitureId: string, position: Point2D): void {
    // Usa store direto para furniture (não é geometria estrutural)
    editorStore.setState(state => ({
      ...state,
      project: {
        ...state.project,
        floors: state.project.floors.map(floor => ({
          ...floor,
          furniture: floor.furniture.map(f => 
            f.id === furnitureId 
              ? { ...f, position: { ...f.position, x: position.x, z: position.y } }
              : f
          )
        }))
      }
    }));
  }

  private moveNode(nodeId: string, position: Point2D): void {
    // Nós são atualizados via GeometryController
    this.geometryController.updateNode(nodeId, position);
  }

  // ============================================
  // SELECTION BOX
  // ============================================

  private startSelectionBox(startPos: Point2D): void {
    this.selectionBox = { start: startPos, end: startPos };
  }

  private updateSelectionBox(currentPos: Point2D): void {
    if (!this.selectionBox) return;
    this.selectionBox.end = currentPos;
    this.emit('selectionBox', this.selectionBox);
  }

  private finalizeSelectionBox(): void {
    if (!this.selectionBox) return;
    
    const selectedIds = this.getElementsInBox(this.selectionBox);
    
    editorStore.setState(state => ({
      ...state,
      selection: {
        type: 'multi',
        ids: selectedIds
      }
    }));

    this.emit('selectionChanged', selectedIds);
  }

  // ============================================
  // UTILITÁRIOS
  // ============================================

  private hitTest(pos: Point2D): { type: string; id: string } | null {
    // Implementação de hit test
    // (omitida para brevidade)
    return null;
  }

  private getWall(id: string): Wall | undefined {
    return editorStore.getState().project.floors
      .flatMap(f => f.walls)
      .find(w => w.id === id);
  }

  private getElementsInBox(box: { start: Point2D; end: Point2D }): string[] {
    // Implementação de seleção por box
    // (omitida para brevidade)
    return [];
  }

  private resetState(): void {
    this.isDragging = false;
    this.dragOperation = null;
    this.selectionBox = null;
  }

  // ============================================
  // LIMPEZA
  // ============================================

  dispose(): void {
    if (this.isDragging) {
      this.onPointerCancel();
    }
    this.geometryController.dispose();
    this.snapEngine.dispose();
    super.dispose();
  }
}
