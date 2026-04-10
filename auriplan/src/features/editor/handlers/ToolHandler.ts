// ============================================================
// CAMINHO: src/features/editor/handlers/ToolHandler.ts
// FUNCIONALIDADE: Define o contrato (interface) que todas as
// ferramentas do editor devem implementar.
// OBJETO: Garantir que cada ferramenta trate eventos, resete
// estado e forneça estado de pré-visualização.
// ============================================================

import type { InteractionEvent } from '@core/interaction/InteractionEngine';
import type { PreviewState } from './ToolContext';

export interface ToolHandler {
  /** Processa um evento de interação (mouse, teclado, toque) */
  handleEvent(event: InteractionEvent): void;
  /** Reseta o estado interno da ferramenta (ex: ao trocar de ferramenta) */
  reset(): void;
  /** Retorna o estado atual de pré-visualização para o Canvas renderizar */
  getPreviewState(): PreviewState | null;
}
