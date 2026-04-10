/**
 * NaturalLanguageInterpreter - Interpretador de Linguagem Natural
 * Responsável por interpretar o texto do usuário e extrair intenções e parâmetros
 */

import { EventEmitter } from '../utils/EventEmitter';
import type { InterpretedCommand } from './AIService';

export interface InterpretationResult {
  success: boolean;
  command?: InterpretedCommand;
  error?: string;
  confidence: number;
  alternativeInterpretations?: InterpretedCommand[];
}

export interface Entity {
  type: 'room' | 'furniture' | 'dimension' | 'quantity' | 'location' | 'action' | 'style' | 'color';
  value: string;
  position: { start: number; end: number };
  confidence: number;
}

export class NaturalLanguageInterpreter extends EventEmitter {
  // Dicionários de palavras-chave por idioma
  private readonly actionKeywords: Record<string, Record<string, string[]>> = {
    pt: {
      create: ['criar', 'fazer', 'construir', 'gerar', 'novo', 'nova'],
      add: ['adicionar', 'colocar', 'incluir', 'por', 'botar', 'inserir'],
      modify: ['mudar', 'alterar', 'modificar', 'ajustar', 'redimensionar', 'aumentar', 'diminuir'],
      delete: ['deletar', 'remover', 'excluir', 'apagar', 'tirar'],
      move: ['mover', 'deslocar', 'reposicionar', 'transferir'],
    },
    en: {
      create: ['create', 'make', 'build', 'generate', 'new'],
      add: ['add', 'place', 'put', 'include', 'insert'],
      modify: ['change', 'modify', 'alter', 'adjust', 'resize', 'increase', 'decrease'],
      delete: ['delete', 'remove', 'erase', 'clear', 'take out'],
      move: ['move', 'relocate', 'reposition', 'shift'],
    },
  };

  private readonly roomTypes: Record<string, Record<string, string[]>> = {
    pt: {
      living_room: ['sala', 'sala de estar', 'sala de visita', 'living'],
      bedroom: ['quarto', 'dormitório', 'suíte', 'suite'],
      kitchen: ['cozinha', 'cozinha americana', 'copinha'],
      bathroom: ['banheiro', 'banho', 'lavabo', 'wc', 'toalete'],
      dining_room: ['sala de jantar', 'copatória', 'comedor'],
      office: ['escritório', 'home office', 'escrivaninha'],
      garage: ['garagem', 'garagen'],
      garden: ['jardim', 'quintal', 'pátio', 'terraço'],
      hallway: ['corredor', 'hall', 'entrada'],
      balcony: ['varanda', 'sacada', 'terraço'],
    },
    en: {
      living_room: ['living room', 'lounge', 'family room'],
      bedroom: ['bedroom', 'bed room', 'master bedroom', 'guest room'],
      kitchen: ['kitchen', 'cookhouse'],
      bathroom: ['bathroom', 'bath', 'restroom', 'wc', 'toilet'],
      dining_room: ['dining room', 'dining area'],
      office: ['office', 'study', 'home office'],
      garage: ['garage', 'carport'],
      garden: ['garden', 'yard', 'backyard', 'patio'],
      hallway: ['hallway', 'hall', 'entry', 'foyer'],
      balcony: ['balcony', 'terrace', 'deck'],
    },
  };

  private readonly furnitureTypes: Record<string, Record<string, string[]>> = {
    pt: {
      sofa: ['sofá', 'sofa', 'couch', 'estofado'],
      bed: ['cama', 'beliche', 'cama de casal', 'cama de solteiro'],
      table: ['mesa', 'mesa de jantar', 'mesa de centro'],
      chair: ['cadeira', 'cadeiras', 'poltrona'],
      wardrobe: ['guarda-roupa', 'roupeiro', 'closet'],
      desk: ['escrivaninha', 'mesa de trabalho', 'mesa de escritório'],
      tv_stand: ['rack', 'estante de tv', 'painel de tv'],
      bookshelf: ['estante', 'prateleira', 'livreiro'],
      cabinet: ['armário', 'gabinete'],
      refrigerator: ['geladeira', 'refrigerador', 'frigobar'],
      stove: ['fogão', 'cooktop', 'cozinha'],
      sink: ['pia', 'lavatório', 'tanque'],
      shower: ['chuveiro', 'box', 'banheira'],
      toilet: ['vaso sanitário', 'privada', 'bacia'],
    },
    en: {
      sofa: ['sofa', 'couch', 'settee'],
      bed: ['bed', 'bunk bed', 'double bed', 'single bed'],
      table: ['table', 'dining table', 'coffee table'],
      chair: ['chair', 'armchair', 'seat'],
      wardrobe: ['wardrobe', 'closet', 'armoire'],
      desk: ['desk', 'work table', 'office desk'],
      tv_stand: ['tv stand', 'entertainment center', 'tv unit'],
      bookshelf: ['bookshelf', 'bookcase', 'shelf'],
      cabinet: ['cabinet', 'cupboard'],
      refrigerator: ['refrigerator', 'fridge', 'freezer'],
      stove: ['stove', 'cooktop', 'range'],
      sink: ['sink', 'basin'],
      shower: ['shower', 'bathtub', 'bath'],
      toilet: ['toilet', 'wc', 'commode'],
    },
  };

  private readonly dimensionPatterns: Record<string, RegExp[]> = {
    pt: [
      /(\d+(?:[.,]\d+)?)\s*(?:metros?|m²|m2|m\s*quadrados?)/gi,
      /(\d+(?:[.,]\d+)?)\s*x\s*(\d+(?:[.,]\d+)?)\s*(?:metros?|m)/gi,
      /(\d+(?:[.,]\d+)?)\s*metros?\s*(?:de\s*)?(?:largura|comprimento|altura)/gi,
    ],
    en: [
      /(\d+(?:\.\d+)?)\s*(?:square\s*meters?|m²|m2|sq\s*m)/gi,
      /(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*(?:meters?|m|ft|feet)/gi,
      /(\d+(?:\.\d+)?)\s*(?:meters?|m)\s*(?:wide|long|high)/gi,
    ],
  };

  private readonly quantityPatterns: Record<string, RegExp[]> = {
    pt: [
      /(\d+)\s+(?:quartos?|salas?|cozinhas?|banheiros?)/gi,
      /(?:dois|três|quatro|cinco|seis|sete|oito|nove|dez)\s+(?:quartos?|salas?)/gi,
    ],
    en: [
      /(\d+)\s+(?:bedrooms?|rooms?|kitchens?|bathrooms?)/gi,
      /(?:two|three|four|five|six|seven|eight|nine|ten)\s+(?:bedrooms?|rooms?)/gi,
    ],
  };

  /**
   * Interpreta um comando em linguagem natural
   */
  public interpret(text: string, language?: 'pt' | 'en'): InterpretationResult {
    try {
      const detectedLang = language || this.detectLanguage(text);
      const normalizedText = this.normalizeText(text, detectedLang);

      // Extrair entidades
      const entities = this.extractEntities(normalizedText, detectedLang);

      // Identificar intenção principal
      const intent = this.identifyIntent(normalizedText, detectedLang);

      // Identificar alvo
      const target = this.identifyTarget(entities, normalizedText, detectedLang);

      // Extrair especificações
      const specifications = this.extractSpecifications(entities, normalizedText, detectedLang);

      // Extrair localização
      const location = this.extractLocation(normalizedText, detectedLang);

      // Calcular confiança
      const confidence = this.calculateConfidence(entities, intent, target);

      const command: InterpretedCommand = {
        intent,
        target,
        targetType: this.identifyTargetType(entities, detectedLang),
        specifications,
        location,
      };

      this.emit('interpreted', { text, command, confidence });

      return {
        success: true,
        command,
        confidence,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Interpretation failed';

      this.emit('error', { text, error: errorMessage });

      return {
        success: false,
        error: errorMessage,
        confidence: 0,
      };
    }
  }

  /**
   * Normaliza o texto para processamento
   */
  private normalizeText(text: string, language: string): string {
    let normalized = text.toLowerCase().trim();

    // Remover acentos para português
    if (language === 'pt') {
      normalized = normalized
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    }

    return normalized;
  }

  /**
   * Detecta o idioma do texto
   */
  private detectLanguage(text: string): 'pt' | 'en' {
    const ptWords = ['criar', 'adicionar', 'colocar', 'mudar', 'quarto', 'sala', 'cozinha', 'banheiro', 'casa', 'fazer'];
    const enWords = ['create', 'add', 'put', 'change', 'room', 'kitchen', 'bathroom', 'house', 'make'];

    const lowerText = text.toLowerCase();
    let ptCount = 0;
    let enCount = 0;

    for (const word of ptWords) {
      if (lowerText.includes(word)) ptCount++;
    }

    for (const word of enWords) {
      if (lowerText.includes(word)) enCount++;
    }

    return ptCount >= enCount ? 'pt' : 'en';
  }

  /**
   * Extrai entidades do texto
   */
  private extractEntities(text: string, language: string): Entity[] {
    const entities: Entity[] = [];

    // Extrair tipos de cômodos
    for (const [roomType, keywords] of Object.entries(this.roomTypes[language])) {
      for (const keyword of keywords) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        let match;
        while ((match = regex.exec(text)) !== null) {
          entities.push({
            type: 'room',
            value: roomType,
            position: { start: match.index, end: match.index + match[0].length },
            confidence: 0.9,
          });
        }
      }
    }

    // Extrair móveis
    for (const [furnitureType, keywords] of Object.entries(this.furnitureTypes[language])) {
      for (const keyword of keywords) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        let match;
        while ((match = regex.exec(text)) !== null) {
          entities.push({
            type: 'furniture',
            value: furnitureType,
            position: { start: match.index, end: match.index + match[0].length },
            confidence: 0.85,
          });
        }
      }
    }

    // Extrair dimensões
    const dimPatterns = this.dimensionPatterns[language];
    for (const pattern of dimPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        entities.push({
          type: 'dimension',
          value: match[0],
          position: { start: match.index, end: match.index + match[0].length },
          confidence: 0.8,
        });
      }
    }

    // Extrair quantidades
    const qtyPatterns = this.quantityPatterns[language];
    for (const pattern of qtyPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        entities.push({
          type: 'quantity',
          value: match[1] || match[0],
          position: { start: match.index, end: match.index + match[0].length },
          confidence: 0.85,
        });
      }
    }

    return entities.sort((a, b) => a.position.start - b.position.start);
  }

  /**
   * Identifica a intenção do comando
   */
  private identifyIntent(text: string, language: string): InterpretedCommand['intent'] {
    const actions = this.actionKeywords[language];

    for (const [intent, keywords] of Object.entries(actions)) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          return intent as InterpretedCommand['intent'];
        }
      }
    }

    // Default intent
    return 'create';
  }

  /**
   * Identifica o alvo da ação
   */
  private identifyTarget(
    entities: Entity[],
    text: string,
    language: string
  ): InterpretedCommand['target'] {
    // Verificar entidades primeiro
    for (const entity of entities) {
      if (entity.type === 'room') return 'room';
      if (entity.type === 'furniture') return 'furniture';
    }

    // Verificar palavras-chave
    const roomKeywords = [...Object.values(this.roomTypes[language]).flat()];
    const furnitureKeywords = [...Object.values(this.furnitureTypes[language]).flat()];

    for (const keyword of roomKeywords) {
      if (text.includes(keyword)) return 'room';
    }

    for (const keyword of furnitureKeywords) {
      if (text.includes(keyword)) return 'furniture';
    }

    // Verificar palavras genéricas
    if (text.includes('casa') || text.includes('house')) return 'house';
    if (text.includes('parede') || text.includes('wall')) return 'wall';
    if (text.includes('porta') || text.includes('door')) return 'door';
    if (text.includes('janela') || text.includes('window')) return 'window';

    return 'room';
  }

  /**
   * Identifica o tipo específico do alvo
   */
  private identifyTargetType(entities: Entity[], language: string): string | undefined {
    for (const entity of entities) {
      if (entity.type === 'room' || entity.type === 'furniture') {
        return entity.value;
      }
    }
    return undefined;
  }

  /**
   * Extrai especificações do comando
   */
  private extractSpecifications(
    entities: Entity[],
    text: string,
    language: string
  ): InterpretedCommand['specifications'] {
    const specs: InterpretedCommand['specifications'] = {};

    // Extrair tamanho/dimensões
    for (const entity of entities) {
      if (entity.type === 'dimension') {
        const size = this.parseDimension(entity.value, language);
        if (size) {
          specs.size = size;
        }
      }
      if (entity.type === 'quantity') {
        specs.count = parseInt(entity.value) || 1;
      }
    }

    // Extrair tipo de cômodo
    for (const entity of entities) {
      if (entity.type === 'room') {
        specs.roomType = entity.value;
        break;
      }
    }

    return specs;
  }

  /**
   * Extrai a localização mencionada
   */
  private extractLocation(text: string, language: string): string | undefined {
    const locationPatterns: Record<string, RegExp[]> = {
      pt: [
        /(?:na|no)\s+([\w\s]+?)(?:\s|$)/i,
        /(?:em\s+)?(?:a|o)\s+([\w\s]+?)(?:\s|$)/i,
      ],
      en: [
        /(?:in\s+(?:the\s+)?)([\w\s]+?)(?:\s|$)/i,
        /(?:at\s+(?:the\s+)?)([\w\s]+?)(?:\s|$)/i,
      ],
    };

    const patterns = locationPatterns[language];
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const location = match[1].trim();
        // Verificar se é um cômodo válido
        const roomTypes = Object.values(this.roomTypes[language]).flat();
        if (roomTypes.some(r => location.includes(r))) {
          return location;
        }
      }
    }

    return undefined;
  }

  /**
   * Parse de dimensões
   */
  private parseDimension(value: string, language: string): number | undefined {
    // Extrair número da string
    const match = value.match(/(\d+(?:[.,]\d+)?)/);
    if (match) {
      return parseFloat(match[1].replace(',', '.'));
    }
    return undefined;
  }

  /**
   * Calcula a confiança da interpretação
   */
  private calculateConfidence(
    entities: Entity[],
    intent: string,
    target: string
  ): number {
    let confidence = 0.5;

    // Mais entidades = mais confiança
    confidence += Math.min(entities.length * 0.1, 0.3);

    // Intenção clara
    if (intent !== 'create') {
      confidence += 0.1;
    }

    // Alvo claro
    if (target !== 'room') {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Gera interpretações alternativas
   */
  public generateAlternatives(
    text: string,
    primaryResult: InterpretedCommand
  ): InterpretedCommand[] {
    const alternatives: InterpretedCommand[] = [];

    // Alternativa: mudar intenção
    if (primaryResult.intent === 'create') {
      alternatives.push({
        ...primaryResult,
        intent: 'add',
      });
    }

    // Alternativa: mudar alvo
    if (primaryResult.target === 'room' && primaryResult.specifications.roomType) {
      alternatives.push({
        ...primaryResult,
        target: 'furniture',
      });
    }

    return alternatives;
  }
}

// Singleton instance
export const naturalLanguageInterpreter = new NaturalLanguageInterpreter();
