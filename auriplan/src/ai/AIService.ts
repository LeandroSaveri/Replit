/**
 * AIService - Serviço de Integração com LLM
 * Responsável por conectar com o modelo de linguagem e orquestrar o pipeline:
 * texto → intenção → ações.
 * NÃO faz parsing manual de linguagem.
 */

import { EventEmitter } from '../utils/EventEmitter';
import { naturalLanguageInterpreter, type DesignIntent } from './NaturalLanguageInterpreter';
import { editorActionMapper } from './EditorActionMapper';
import type { EditorActionWithMetadata, CommandProcessingResult } from './contracts/EditorActionContract';

export interface AIConfig {
  apiKey?: string;
  apiUrl?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  timeout?: number;
}

export interface AIRequest {
  prompt: string;
  context?: string;
  language?: 'pt' | 'en';
}

// Tipo legado mantido para compatibilidade
export interface InterpretedCommand {
  intent: 'create' | 'modify' | 'delete' | 'add' | 'change' | 'remove' | 'move';
  target: 'house' | 'room' | 'furniture' | 'wall' | 'door' | 'window' | 'floor';
  targetType?: string;
  specifications: {
    roomType?: string;
    size?: number;
    dimensions?: { width: number; height: number; depth?: number };
    position?: { x: number; y: number };
    count?: number;
    style?: string;
    color?: string;
    material?: string;
  };
  location?: string;
  constraints?: string[];
}

export class AIService extends EventEmitter {
  private config: AIConfig;
  private isInitialized = false;

  constructor(config: AIConfig = {}) {
    super();
    this.config = {
      apiUrl: import.meta.env.VITE_AI_API_URL || 'http://localhost:3001/api/ai',
      model: 'gpt-4o-mini',
      maxTokens: 2000,
      temperature: 0.3,
      timeout: 30000,
      ...config,
    };
  }

  public initialize(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;
    this.emit('initialized');
  }

  /**
   * Processa um comando em linguagem natural e retorna ações do editor.
   * Pipeline: interpretação → mapeamento → ações.
   */
  public async processCommand(request: AIRequest): Promise<CommandProcessingResult> {
    const startTime = Date.now();

    try {
      this.emit('processingStarted', request);

      // 1. Interpretação via NaturalLanguageInterpreter
      const interpretation = naturalLanguageInterpreter.interpret(
        request.prompt,
        request.language
      );

      if (!interpretation.success || !interpretation.intent) {
        return {
          success: false,
          error: interpretation.error || 'Failed to interpret command',
        };
      }

      // 2. Mapeamento para ações do editor
      const mapping = editorActionMapper.mapIntentToActions(
        interpretation.intent,
        interpretation.confidence
      );

      if (!mapping.success) {
        return {
          success: false,
          error: mapping.error || 'Failed to map intent to actions',
        };
      }

      const executionTime = Date.now() - startTime;

      this.emit('processingCompleted', {
        request,
        actions: mapping.actions,
        executionTime,
      });

      return {
        success: true,
        actions: mapping.actions,
        message: `Comando processado: ${interpretation.intent.intent} ${interpretation.intent.target}`,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.emit('processingError', { request, error: errorMessage, executionTime });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Preview de comando (sem gerar ações completas, apenas metadados)
   */
  public async previewCommand(request: AIRequest): Promise<CommandProcessingResult> {
    const interpretation = naturalLanguageInterpreter.interpret(request.prompt, request.language);
    if (!interpretation.success || !interpretation.intent) {
      return { success: false, error: interpretation.error };
    }

    // Preview simplificado
    return {
      success: true,
      message: `Preview: ${interpretation.intent.intent} ${interpretation.intent.target}`,
      preview: {
        roomsCount: interpretation.intent.target === 'room' ? 1 : 0,
        wallsCount: 0,
        furnitureCount: interpretation.intent.target === 'furniture' ? 1 : 0,
      },
    };
  }

  // Métodos legados mantidos para compatibilidade, mas delegando ao interpretador

  public async interpretCommand(request: AIRequest): Promise<{
    success: boolean;
    data?: InterpretedCommand;
    error?: string;
    executionTime: number;
  }> {
    const startTime = Date.now();
    const interpretation = naturalLanguageInterpreter.interpret(request.prompt, request.language);

    if (!interpretation.success || !interpretation.intent) {
      return {
        success: false,
        error: interpretation.error,
        executionTime: Date.now() - startTime,
      };
    }

    // Converter DesignIntent para o formato legado InterpretedCommand
    const legacyCommand: InterpretedCommand = {
      intent: interpretation.intent.intent,
      target: interpretation.intent.target as any,
      targetType: interpretation.intent.targetType,
      specifications: {
        roomType: interpretation.intent.specifications.roomType,
        size: interpretation.intent.specifications.area,
        count: interpretation.intent.specifications.count,
      },
      location: interpretation.intent.location,
    };

    return {
      success: true,
      data: legacyCommand,
      executionTime: Date.now() - startTime,
    };
  }

  public validateInterpretation(data: any): data is InterpretedCommand {
    if (!data || typeof data !== 'object') return false;
    const validIntents = ['create', 'modify', 'delete', 'add', 'change', 'remove', 'move'];
    const validTargets = ['house', 'room', 'furniture', 'wall', 'door', 'window', 'floor'];
    if (!validIntents.includes(data.intent)) return false;
    if (!validTargets.includes(data.target)) return false;
    if (!data.specifications || typeof data.specifications !== 'object') return false;
    return true;
  }

  public async generateSuggestions(context: string): Promise<string[]> {
    return this.getDefaultSuggestions();
  }

  private getDefaultSuggestions(): string[] {
    return [
      'criar uma casa com 2 quartos e sala',
      'adicionar cozinha de 12 metros',
      'colocar sofá na sala',
      'criar quarto principal com banheiro',
    ];
  }

  public async healthCheck(): Promise<boolean> {
    return true;
  }

  public getConfig(): AIConfig {
    return { ...this.config };
  }

  public setConfig(config: Partial<AIConfig>): void {
    Object.assign(this.config, config);
    this.emit('configChanged', this.config);
  }

  public dispose(): void {
    this.removeAllListeners();
  }
}

export const aiService = new AIService();
