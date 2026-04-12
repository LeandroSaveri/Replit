/**
 * NaturalLanguageInterpreter - Interpretador de Linguagem Natural
 * Responsável por interpretar o texto do usuário e extrair intenções estruturadas.
 * NÃO gera ações do editor - apenas produz intenções.
 */

import { EventEmitter } from '../utils/EventEmitter';

// Intenção estruturada (não é ação do editor)
export interface DesignIntent {
  intent: 'create' | 'add' | 'modify' | 'delete' | 'move';
  target: 'house' | 'room' | 'wall' | 'furniture' | 'door' | 'window';
  targetType?: string;
  specifications: {
    roomType?: string;
    area?: number;
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

export interface InterpretationResult {
  success: boolean;
  intent?: DesignIntent;
  error?: string;
  confidence: number;
  alternativeIntents?: DesignIntent[];
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

  private readonly numberWords: Record<string, number> = {
    um: 1, dois: 2, três: 3, quatro: 4, cinco: 5,
    seis: 6, sete: 7, oito: 8, nove: 9, dez: 10,
    one: 1, two: 2, three: 3, four: 4, five: 5,
    six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  };

  /**
   * Interpreta um comando em linguagem natural e retorna uma intenção estruturada.
   * NÃO gera ações do editor.
   */
  public interpret(text: string, language?: 'pt' | 'en'): InterpretationResult {
    try {
      const detectedLang = language || this.detectLanguage(text);
      const normalizedText = this.normalizeText(text, detectedLang);

      const entities = this.extractEntities(normalizedText, detectedLang);
      const intentAction = this.identifyIntent(normalizedText, detectedLang);
      const target = this.identifyTarget(entities, normalizedText, detectedLang);
      const specifications = this.extractSpecifications(entities, normalizedText, detectedLang);
      const location = this.extractLocation(normalizedText, detectedLang);
      const confidence = this.calculateConfidence(entities, intentAction, target);

      const designIntent: DesignIntent = {
        intent: intentAction,
        target,
        targetType: this.identifyTargetType(entities, detectedLang),
        specifications,
        location,
      };

      this.emit('interpreted', { text, intent: designIntent, confidence });

      const alternatives = this.generateAlternatives(text, designIntent);

      return {
        success: true,
        intent: designIntent,
        confidence,
        alternativeIntents: alternatives.length > 0 ? alternatives : undefined,
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

  private normalizeText(text: string, language: string): string {
    let normalized = text.toLowerCase().trim();
    if (language === 'pt') {
      normalized = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }
    return normalized;
  }

  private detectLanguage(text: string): 'pt' | 'en' {
    const ptWords = ['criar', 'adicionar', 'colocar', 'mudar', 'quarto', 'sala', 'cozinha', 'banheiro', 'casa', 'fazer'];
    const enWords = ['create', 'add', 'put', 'change', 'room', 'kitchen', 'bathroom', 'house', 'make'];
    const lowerText = text.toLowerCase();
    let ptCount = 0;
    let enCount = 0;
    for (const word of ptWords) if (lowerText.includes(word)) ptCount++;
    for (const word of enWords) if (lowerText.includes(word)) enCount++;
    return ptCount >= enCount ? 'pt' : 'en';
  }

  private extractEntities(text: string, language: string): Entity[] {
    const entities: Entity[] = [];

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

    for (const pattern of this.dimensionPatterns[language]) {
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

    for (const pattern of this.quantityPatterns[language]) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        let numValue = match[1];
        if (!numValue) {
          const wordNum = Object.keys(this.numberWords).find(w => match[0].toLowerCase().includes(w));
          numValue = wordNum ? this.numberWords[wordNum].toString() : '1';
        }
        entities.push({
          type: 'quantity',
          value: numValue,
          position: { start: match.index, end: match.index + match[0].length },
          confidence: 0.85,
        });
      }
    }

    return entities.sort((a, b) => a.position.start - b.position.start);
  }

  private identifyIntent(text: string, language: string): DesignIntent['intent'] {
    const actions = this.actionKeywords[language];
    for (const [intent, keywords] of Object.entries(actions)) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          return intent as DesignIntent['intent'];
        }
      }
    }
    return 'create';
  }

  private identifyTarget(entities: Entity[], text: string, language: string): DesignIntent['target'] {
    for (const entity of entities) {
      if (entity.type === 'room') return 'room';
      if (entity.type === 'furniture') return 'furniture';
    }
    const roomKeywords = Object.values(this.roomTypes[language]).flat();
    const furnitureKeywords = Object.values(this.furnitureTypes[language]).flat();
    for (const keyword of roomKeywords) if (text.includes(keyword)) return 'room';
    for (const keyword of furnitureKeywords) if (text.includes(keyword)) return 'furniture';
    if (text.includes('casa') || text.includes('house')) return 'house';
    if (text.includes('parede') || text.includes('wall')) return 'wall';
    if (text.includes('porta') || text.includes('door')) return 'door';
    if (text.includes('janela') || text.includes('window')) return 'window';
    return 'room';
  }

  private identifyTargetType(entities: Entity[], language: string): string | undefined {
    for (const entity of entities) {
      if (entity.type === 'room' || entity.type === 'furniture') {
        return entity.value;
      }
    }
    return undefined;
  }

  private extractSpecifications(entities: Entity[], text: string, language: string): DesignIntent['specifications'] {
    const specs: DesignIntent['specifications'] = {};
    for (const entity of entities) {
      if (entity.type === 'dimension') {
        const size = this.parseDimension(entity.value, language);
        if (size) specs.area = size;
      }
      if (entity.type === 'quantity') {
        specs.count = parseInt(entity.value) || 1;
      }
      if (entity.type === 'room') {
        specs.roomType = entity.value;
      }
    }
    return specs;
  }

  private extractLocation(text: string, language: string): string | undefined {
    const locationPatterns: Record<string, RegExp[]> = {
      pt: [/(?:na|no)\s+([\w\s]+?)(?:\s|$)/i, /(?:em\s+)?(?:a|o)\s+([\w\s]+?)(?:\s|$)/i],
      en: [/(?:in\s+(?:the\s+)?)([\w\s]+?)(?:\s|$)/i, /(?:at\s+(?:the\s+)?)([\w\s]+?)(?:\s|$)/i],
    };
    const patterns = locationPatterns[language];
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const loc = match[1].trim();
        const roomTypes = Object.values(this.roomTypes[language]).flat();
        if (roomTypes.some(r => loc.includes(r))) return loc;
      }
    }
    return undefined;
  }

  private parseDimension(value: string, language: string): number | undefined {
    const match = value.match(/(\d+(?:[.,]\d+)?)/);
    if (match) return parseFloat(match[1].replace(',', '.'));
    return undefined;
  }

  private calculateConfidence(entities: Entity[], intent: string, target: string): number {
    let confidence = 0.5;
    confidence += Math.min(entities.length * 0.1, 0.3);
    if (intent !== 'create') confidence += 0.1;
    if (target !== 'room') confidence += 0.1;
    return Math.min(confidence, 1.0);
  }

  public generateAlternatives(text: string, primaryIntent: DesignIntent): DesignIntent[] {
    const alternatives: DesignIntent[] = [];
    if (primaryIntent.intent === 'create') {
      alternatives.push({ ...primaryIntent, intent: 'add' });
    }
    if (primaryIntent.target === 'room' && primaryIntent.specifications.roomType) {
      alternatives.push({ ...primaryIntent, target: 'furniture' });
    }
    return alternatives;
  }
}

export const naturalLanguageInterpreter = new NaturalLanguageInterpreter();
