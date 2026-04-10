/**
 * AI Service for AuriPlan
 * Main service for AI-powered design features
 */

import FloorPlanGenerator, { FloorPlanRequest, FloorPlan } from '../generators/floorplan/FloorPlanGenerator';

export type AIFeature = 
  | 'generate-floorplan'
  | 'auto-furnish'
  | 'improve-layout'
  | 'add-lighting'
  | 'estimate-materials';

export interface AIGenerationResult {
  success: boolean;
  data?: any;
  error?: string;
  alternatives?: any[];
}

export interface FloorPlanGenerationRequest {
  plotWidth: number;
  plotDepth: number;
  numBedrooms: number;
  numBathrooms: number;
  style: 'modern' | 'traditional' | 'minimalist' | 'open-concept';
}

export interface FurnishingRequest {
  roomType: string;
  roomWidth: number;
  roomDepth: number;
  style: string;
  budget: 'low' | 'medium' | 'high';
}

export interface LightingRequest {
  roomType: string;
  roomWidth: number;
  roomDepth: number;
  naturalLight: 'low' | 'medium' | 'high';
}

class AIService {
  private static instance: AIService;
  private floorPlanGenerator: FloorPlanGenerator | null = null;
  private isProcessing = false;

  private constructor() {}

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  /**
   * Generate floor plans using AI
   */
  async generateFloorPlans(request: FloorPlanGenerationRequest): Promise<AIGenerationResult> {
    if (this.isProcessing) {
      return { success: false, error: 'AI is already processing a request' };
    }

    this.isProcessing = true;

    try {
      const floorPlanRequest: FloorPlanRequest = {
        plotWidth: request.plotWidth,
        plotDepth: request.plotDepth,
        roomTypes: this.determineRoomTypes(request.numBedrooms, request.numBathrooms) as any[],
        numBedrooms: request.numBedrooms,
        numBathrooms: request.numBathrooms,
        style: request.style,
      };

      this.floorPlanGenerator = new FloorPlanGenerator(floorPlanRequest);
      const plans = this.floorPlanGenerator.generateVariants(3);

      this.isProcessing = false;

      return {
        success: true,
        data: plans[0],
        alternatives: plans.slice(1),
      };
    } catch (error) {
      this.isProcessing = false;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Auto-furnish a room
   */
  async autoFurnish(request: FurnishingRequest): Promise<AIGenerationResult> {
    try {
      // This would use the furniture catalog to suggest placements
      const suggestions = this.generateFurnitureSuggestions(request);
      
      return {
        success: true,
        data: suggestions,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Improve existing layout
   */
  async improveLayout(currentLayout: any): Promise<AIGenerationResult> {
    try {
      // Analyze current layout and suggest improvements
      const improvements = this.analyzeAndSuggestImprovements(currentLayout);
      
      return {
        success: true,
        data: improvements,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Add lighting recommendations
   */
  async addLighting(request: LightingRequest): Promise<AIGenerationResult> {
    try {
      const lightingPlan = this.generateLightingPlan(request);
      
      return {
        success: true,
        data: lightingPlan,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Estimate materials for construction
   */
  async estimateMaterials(projectData: any): Promise<AIGenerationResult> {
    try {
      const estimation = this.calculateMaterialEstimation(projectData);
      
      return {
        success: true,
        data: estimation,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Determine room types based on requirements
   */
  private determineRoomTypes(numBedrooms: number, numBathrooms: number): string[] {
    const rooms: string[] = ['living_room', 'kitchen'];
    
    for (let i = 0; i < numBedrooms; i++) {
      rooms.push('bedroom');
    }
    
    for (let i = 0; i < numBathrooms; i++) {
      rooms.push('bathroom');
    }
    
    // Add common rooms
    rooms.push('dining_room', 'hallway', 'entryway');
    
    return rooms;
  }

  /**
   * Generate furniture suggestions for a room
   */
  private generateFurnitureSuggestions(request: FurnishingRequest): any[] {
    const suggestions: any[] = [];
    const { roomType, roomWidth, roomDepth, style, budget } = request;

    // Basic furniture placement logic based on room type
    switch (roomType) {
      case 'living_room':
        suggestions.push(
          { type: 'sofa', position: { x: roomWidth / 2, y: roomDepth * 0.3 }, rotation: 0 },
          { type: 'coffee_table', position: { x: roomWidth / 2, y: roomDepth * 0.5 }, rotation: 0 },
          { type: 'tv_stand', position: { x: roomWidth / 2, y: roomDepth * 0.8 }, rotation: 180 },
        );
        break;
      case 'bedroom':
        suggestions.push(
          { type: 'bed', position: { x: roomWidth / 2, y: roomDepth * 0.4 }, rotation: 0 },
          { type: 'nightstand', position: { x: roomWidth * 0.2, y: roomDepth * 0.4 }, rotation: 0 },
          { type: 'wardrobe', position: { x: roomWidth * 0.8, y: roomDepth * 0.2 }, rotation: 90 },
        );
        break;
      case 'kitchen':
        suggestions.push(
          { type: 'kitchen_cabinet', position: { x: 0.5, y: roomDepth / 2 }, rotation: 0 },
          { type: 'countertop', position: { x: roomWidth / 2, y: 0.5 }, rotation: 0 },
          { type: 'refrigerator', position: { x: roomWidth - 0.5, y: 0.5 }, rotation: 0 },
        );
        break;
    }

    return suggestions;
  }

  /**
   * Analyze layout and suggest improvements
   */
  private analyzeAndSuggestImprovements(currentLayout: any): any {
    const improvements: any[] = [];
    
    // Check room sizes
    if (currentLayout.rooms) {
      currentLayout.rooms.forEach((room: any) => {
        const area = room.width * room.depth;
        
        if (room.type === 'bedroom' && area < 7) {
          improvements.push({
            type: 'size_warning',
            room: room.id,
            message: 'Bedroom is smaller than recommended minimum (7m²)',
            suggestion: 'Consider increasing bedroom size or combining with adjacent room',
          });
        }
        
        if (room.type === 'bathroom' && area < 1.8) {
          improvements.push({
            type: 'size_warning',
            room: room.id,
            message: 'Bathroom is smaller than recommended minimum (1.8m²)',
            suggestion: 'Consider increasing bathroom size',
          });
        }
      });
    }
    
    // Check circulation
    improvements.push({
      type: 'general',
      message: 'Ensure minimum 0.9m hallway width for comfortable circulation',
    });
    
    return improvements;
  }

  /**
   * Generate lighting plan for a room
   */
  private generateLightingPlan(request: LightingRequest): any {
    const { roomType, roomWidth, roomDepth, naturalLight } = request;
    const lights: any[] = [];
    
    // Ceiling lights
    const numLightsX = Math.ceil(roomWidth / 4);
    const numLightsY = Math.ceil(roomDepth / 4);
    
    for (let x = 0; x < numLightsX; x++) {
      for (let y = 0; y < numLightsY; y++) {
        lights.push({
          type: 'ceiling',
          position: {
            x: (roomWidth / (numLightsX + 1)) * (x + 1),
            y: (roomDepth / (numLightsY + 1)) * (y + 1),
          },
          intensity: naturalLight === 'low' ? 1.0 : 0.7,
        });
      }
    }
    
    // Add task lighting for specific rooms
    if (roomType === 'kitchen') {
      lights.push({
        type: 'under_cabinet',
        position: { x: roomWidth / 2, y: 0.5 },
        intensity: 0.8,
      });
    }
    
    if (roomType === 'living_room') {
      lights.push({
        type: 'floor_lamp',
        position: { x: roomWidth * 0.8, y: roomDepth * 0.7 },
        intensity: 0.5,
      });
    }
    
    return { lights, naturalLightRecommendation: naturalLight };
  }

  /**
   * Calculate material estimation for construction
   */
  private calculateMaterialEstimation(projectData: any): any {
    const walls = projectData.walls || [];
    const floors = projectData.floors || [];
    
    let totalWallArea = 0;
    let totalFloorArea = 0;
    
    walls.forEach((wall: any) => {
      const length = Math.sqrt(
        Math.pow(wall.x2 - wall.x1, 2) + Math.pow(wall.y2 - wall.y1, 2)
      );
      totalWallArea += length * 2.7; // Standard ceiling height
    });
    
    floors.forEach((floor: any) => {
      totalFloorArea += floor.width * floor.depth;
    });
    
    return {
      walls: {
        area: totalWallArea,
        bricks: Math.ceil(totalWallArea * 60), // ~60 bricks per m²
        cement: Math.ceil(totalWallArea * 0.015 * 1000), // kg
        sand: Math.ceil(totalWallArea * 0.03 * 1000), // kg
      },
      floors: {
        area: totalFloorArea,
        tiles: Math.ceil(totalFloorArea / 0.36), // 60x60cm tiles
        cement: Math.ceil(totalFloorArea * 0.02 * 1000), // kg
        sand: Math.ceil(totalFloorArea * 0.04 * 1000), // kg
      },
      paint: {
        liters: Math.ceil(totalWallArea * 0.3), // ~0.3L per m²
        coats: 2,
      },
      estimatedCost: {
        materials: Math.ceil(totalWallArea * 50 + totalFloorArea * 80),
        labor: Math.ceil(totalWallArea * 30 + totalFloorArea * 40),
        total: Math.ceil(totalWallArea * 80 + totalFloorArea * 120),
      },
    };
  }

  /**
   * Get AI command suggestions
   */
  async getSuggestions(): Promise<string[]> {
    return [
      'Criar uma casa com 3 quartos e sala de estar',
      'Adicionar cozinha americana integrada com sala',
      'Colocar um quarto principal com suíte de 15m²',
      'Criar escritório home office com 2 estações',
      'Adicionar banheiro social ao lado da sala',
      'Colocar sofá de 3 lugares na sala de estar',
      'Criar área gourmet com churrasqueira',
    ];
  }

  /**
   * Process a natural language design command
   */
  async processCommand(command: string): Promise<{ success: boolean; message?: string; actions?: any[]; error?: string }> {
    const lower = command.toLowerCase();

    try {
      // Detect intent
      if (lower.includes('casa') || lower.includes('apartamento') || lower.includes('quarto') || lower.includes('planta')) {
        // Floor plan generation
        const numBedrooms = (lower.match(/(\d+)\s*quarto/)?.[1] || '2');
        const numBathrooms = (lower.match(/(\d+)\s*banheiro/)?.[1] || '1');
        const result = await this.generateFloorPlans({
          plotWidth: 10,
          plotDepth: 12,
          numBedrooms: parseInt(numBedrooms),
          numBathrooms: parseInt(numBathrooms),
          style: lower.includes('moderno') ? 'modern' : lower.includes('minimalista') ? 'minimalist' : 'open-concept',
        });
        return {
          success: result.success,
          message: result.success ? `Planta gerada com ${numBedrooms} quartos e ${numBathrooms} banheiros` : result.error,
          actions: result.success ? [{ type: 'loadFloorPlan', payload: result.data }] : [],
        };
      }

      if (lower.includes('sofá') || lower.includes('mesa') || lower.includes('cama') || lower.includes('móvel') || lower.includes('movel')) {
        const roomType = lower.includes('sala') ? 'living' : lower.includes('quarto') ? 'bedroom' : lower.includes('cozinha') ? 'kitchen' : 'living';
        const result = await this.autoFurnish({
          roomType,
          roomWidth: 4,
          roomDepth: 5,
          style: 'modern',
          budget: 'medium',
        });
        return {
          success: result.success,
          message: result.success ? 'Móveis sugeridos para o ambiente' : result.error,
          actions: result.success ? [{ type: 'addFurniture', payload: result.data }] : [],
        };
      }

      return {
        success: true,
        message: `Comando interpretado: "${command}". Para melhores resultados, descreva ambientes como "criar sala com 20m²" ou "adicionar quarto com suíte".`,
        actions: [],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao processar comando',
      };
    }
  }

  /**
   * Preview a command without executing
   */
  async previewCommand(command: string): Promise<{ success: boolean; preview?: any; message?: string; error?: string }> {
    const result = await this.processCommand(command);
    return {
      success: result.success,
      preview: result.actions,
      message: result.message,
      error: result.error,
    };
  }
}

export const aiService = AIService.getInstance();
export default aiService;
