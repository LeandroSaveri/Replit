/**
 * AIService - Serviço de Integração com LLM
 * Responsável por conectar com o modelo de linguagem (OpenAI ou equivalente)
 */

import { EventEmitter } from '../utils/EventEmitter';

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

export interface AIResponse {
  success: boolean;
  data?: any;
  error?: string;
  tokensUsed?: number;
  executionTime: number;
}

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
   * Interpreta um comando em linguagem natural
   */
  public async interpretCommand(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();

    try {
      this.emit('interpretationStarted', request);

      // Chamar API do backend
      const response = await this.callBackendAPI(request);

      const executionTime = Date.now() - startTime;

      if (response.success) {
        this.emit('interpretationCompleted', {
          request,
          result: response.data,
          executionTime,
        });
      } else {
        this.emit('interpretationError', {
          request,
          error: response.error,
          executionTime,
        });
      }

      return {
        ...response,
        executionTime,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.emit('interpretationError', {
        request,
        error: errorMessage,
        executionTime,
      });

      return {
        success: false,
        error: errorMessage,
        executionTime,
      };
    }
  }

  /**
   * Chama a API do backend para interpretação
   */
  private async callBackendAPI(request: AIRequest): Promise<AIResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(`${this.config.apiUrl}/interpret`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
        },
        body: JSON.stringify({
          prompt: request.prompt,
          context: request.context,
          language: request.language || this.detectLanguage(request.prompt),
          model: this.config.model,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      return {
        success: true,
        data: data.result,
        tokensUsed: data.tokensUsed,
        executionTime: 0,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          error: 'Request timeout',
          executionTime: this.config.timeout!,
        };
      }

      throw error;
    }
  }

  /**
   * Detecta o idioma do texto
   */
  private detectLanguage(text: string): 'pt' | 'en' {
    const portugueseWords = ['criar', 'adicionar', 'colocar', 'mudar', 'quarto', 'sala', 'cozinha', 'banheiro', 'casa'];
    const lowerText = text.toLowerCase();

    for (const word of portugueseWords) {
      if (lowerText.includes(word)) {
        return 'pt';
      }
    }

    return 'en';
  }

  /**
   * Valida se a resposta da IA está no formato correto
   */
  public validateInterpretation(data: any): data is InterpretedCommand {
    if (!data || typeof data !== 'object') return false;

    const validIntents = ['create', 'modify', 'delete', 'add', 'change', 'remove', 'move'];
    const validTargets = ['house', 'room', 'furniture', 'wall', 'door', 'window', 'floor'];

    if (!validIntents.includes(data.intent)) return false;
    if (!validTargets.includes(data.target)) return false;
    if (!data.specifications || typeof data.specifications !== 'object') return false;

    return true;
  }

  /**
   * Gera sugestões de comandos baseadas no contexto atual
   */
  public async generateSuggestions(context: string): Promise<string[]> {
    try {
      const response = await fetch(`${this.config.apiUrl}/suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ context }),
      });

      if (!response.ok) {
        return this.getDefaultSuggestions();
      }

      const data = await response.json();
      return data.suggestions || this.getDefaultSuggestions();
    } catch {
      return this.getDefaultSuggestions();
    }
  }

  /**
   * Retorna sugestões padrão
   */
  private getDefaultSuggestions(): string[] {
    return [
      'criar uma casa com 2 quartos e sala',
      'adicionar cozinha de 12 metros',
      'colocar sofá na sala',
      'criar quarto principal com banheiro',
    ];
  }

  /**
   * Verifica se o serviço está disponível
   */
  public async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.apiUrl}/health`, {
        method: 'GET',
        timeout: 5000,
      } as any);
      return response.ok;
    } catch {
      return false;
    }
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

// Singleton instance
export const aiService = new AIService();
