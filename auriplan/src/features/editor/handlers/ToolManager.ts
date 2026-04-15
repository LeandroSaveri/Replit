// ============================================================
// ToolManager — gerencia a ferramenta ativa e delega eventos
// ============================================================

import type { Tool } from '@auriplan-types';
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

    // Inicializa a topologia de paredes com as paredes atuais
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
      // Atualiza a topologia sempre que a cena mudar (ex: paredes adicionadas/removidas)
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
          this.wallTopology || undefined,
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
    this.currentHandler?.handleEvent(event);
  }

  /**
   * Retorna o handler atualmente ativo.
   * Útil para ações específicas da ferramenta que não são acionadas por eventos de interação.
   */
  getCurrentHandler(): ToolHandler | null {
    return this.currentHandler;
  }

  destroy(): void {
    this.unsubscribe?.();
    this.currentHandler?.reset();
    this.currentHandler = null;
  }
}
