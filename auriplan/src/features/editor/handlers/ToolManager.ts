// ============================================================
// ToolManager — gerencia a ferramenta ativa e delega eventos
// Suporte a pan/zoom integrado (pan com ferramenta 'pan' ou tecla espaço)
// ============================================================

import type { Tool, Vec2 } from '@auriplan-types';
import type { InteractionEvent } from '@core/interaction/InteractionEngine';
import type { ToolHandler } from './ToolHandler';
import type { PreviewState } from './ToolContext';
import type { EditorStore } from '@store/editorStore';
import { WallToolHandler } from './tools/WallToolHandler';
import { SelectToolHandler } from './tools/SelectToolHandler';
import { RoomToolHandler } from './tools/RoomToolHandler';
import { WallGraphTopology } from '@core/wall/WallGraph';

export class ToolManager {
  private currentHandler: ToolHandler | null = null;
  private currentTool: Tool | null = null;
  private onPreviewChange: (state: PreviewState) => void;
  private onHoverChange: (id: string | null) => void;
  private onCursorChange: (cursor: string) => void;
  private store: EditorStore;
  private unsubscribe?: () => void;
  private wallTopology: WallGraphTopology | null = null;

  // Estado interno para pan
  private cameraPanStart: Vec2 | null = null;

  constructor(
    store: EditorStore,
    onPreviewChange: (state: PreviewState) => void,
    onHoverChange: (id: string | null) => void = () => {},
    onCursorChange: (cursor: string) => void = () => {},
  ) {
    this.store = store;
    this.onPreviewChange = onPreviewChange;
    this.onHoverChange = onHoverChange;
    this.onCursorChange = onCursorChange;

    const scene = store.getState().scenes.find(s => s.id === store.getState().currentSceneId);
    if (scene) {
      this.wallTopology = new WallGraphTopology(scene.walls);
    }

    this.setTool(store.getState().tool);
    this.unsubscribe = store.subscribe(() => {
      const newTool = store.getState().tool;
      if (newTool !== this.currentTool) {
        this.setTool(newTool);
      }
      const currentScene = store.getState().scenes.find(s => s.id === store.getState().currentSceneId);
      if (currentScene && this.wallTopology) {
        this.wallTopology.updateWalls(currentScene.walls);
      }
    });
  }

  setTool(tool: Tool): void {
    if (this.currentTool === tool && this.currentHandler) return;
    this.currentTool = tool;

    switch (tool) {
      case 'wall':
        this.currentHandler = new WallToolHandler(this.store, this.onPreviewChange);
        break;
      case 'select':
        this.currentHandler = new SelectToolHandler(
          this.store,
          this.onPreviewChange,
          this.onHoverChange,
          this.onCursorChange,
          () => this.wallTopology || undefined,
        );
        break;
      case 'room':
        this.currentHandler = new RoomToolHandler(this.store, this.onPreviewChange);
        break;
      default:
        this.currentHandler = null;
    }
    this.currentHandler?.reset();
    this.onPreviewChange(null);
    this.onHoverChange(null);
  }

  handleEvent(event: InteractionEvent): void {
    // Tenta delegar ao handler da ferramenta ativa
    let consumed = false;
    if (this.currentHandler) {
      // Assumimos que o handler possui um método handleEvent que retorna boolean indicando se consumiu
      // Caso contrário, tratamos como consumido sempre.
      const result = this.currentHandler.handleEvent(event);
      consumed = result !== false; // se retornar false explicitamente, não consumiu
    }

    if (consumed) return;

    // Se não foi consumido, verifica se deve ativar o pan
    const state = this.store.getState();
    const isPanTool = state.tool === 'pan';
    // Verifica se a tecla espaço está pressionada (assumindo que foi adicionada aos modificadores no evento)
    const isSpacePressed = event.modifiers?.includes('space') ?? false;

    if (isPanTool || isSpacePressed) {
      this.handlePan(event);
    }
  }

  private handlePan(event: InteractionEvent): void {
    switch (event.type) {
      case 'mousedown':
        this.cameraPanStart = event.position;
        break;
      case 'mousemove':
        if (this.cameraPanStart) {
          const dx = event.position[0] - this.cameraPanStart[0];
          const dy = event.position[1] - this.cameraPanStart[1];
          // A store possui o método panCamera(dx, dy)
          this.store.getState().panCamera?.(dx, dy);
          this.cameraPanStart = event.position;
        }
        break;
      case 'mouseup':
        this.cameraPanStart = null;
        break;
    }
  }

  getCurrentHandler(): ToolHandler | null {
    return this.currentHandler;
  }

  destroy(): void {
    this.unsubscribe?.();
    this.currentHandler?.reset();
    this.currentHandler = null;
  }
}
