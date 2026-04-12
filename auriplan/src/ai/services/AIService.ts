/**
 * AI Service for AuriPlan
 * Serviço legado mantido para compatibilidade com features existentes.
 * Delega a lógica de comando para o AIService principal.
 */

import { aiService as mainAIService } from '../AIService';
import type { CommandProcessingResult } from '../contracts/EditorActionContract';
import FloorPlanGenerator from '../generators/floorplan/FloorPlanGenerator';

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
  private isProcessing = false;

  private constructor() {}

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  async generateFloorPlans(request: FloorPlanGenerationRequest): Promise<AIGenerationResult> {
    if (this.isProcessing) {
      return { success: false, error: 'AI is already processing a request' };
    }
    this.isProcessing = true;

    try {
      const floorPlanRequest = {
        plotWidth: request.plotWidth,
        plotDepth: request.plotDepth,
        roomTypes: this.determineRoomTypes(request.numBedrooms, request.numBathrooms) as any[],
        numBedrooms: request.numBedrooms,
        numBathrooms: request.numBathrooms,
        style: request.style,
      };

      const generator = new FloorPlanGenerator(floorPlanRequest);
      const plans = generator.generateVariants(3);

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

  async autoFurnish(request: FurnishingRequest): Promise<AIGenerationResult> {
    try {
      const suggestions = this.generateFurnitureSuggestions(request);
      return { success: true, data: suggestions };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async improveLayout(currentLayout: any): Promise<AIGenerationResult> {
    try {
      const improvements = this.analyzeAndSuggestImprovements(currentLayout);
      return { success: true, data: improvements };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async addLighting(request: LightingRequest): Promise<AIGenerationResult> {
    try {
      const lightingPlan = this.generateLightingPlan(request);
      return { success: true, data: lightingPlan };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async estimateMaterials(projectData: any): Promise<AIGenerationResult> {
    try {
      const estimation = this.calculateMaterialEstimation(projectData);
      return { success: true, data: estimation };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private determineRoomTypes(numBedrooms: number, numBathrooms: number): string[] {
    const rooms: string[] = ['living_room', 'kitchen'];
    for (let i = 0; i < numBedrooms; i++) rooms.push('bedroom');
    for (let i = 0; i < numBathrooms; i++) rooms.push('bathroom');
    rooms.push('dining_room', 'hallway', 'entryway');
    return rooms;
  }

  private generateFurnitureSuggestions(request: FurnishingRequest): any[] {
    const suggestions: any[] = [];
    const { roomType, roomWidth, roomDepth } = request;

    switch (roomType) {
      case 'living_room':
        suggestions.push(
          { type: 'sofa', position: { x: roomWidth / 2, y: roomDepth * 0.3 }, rotation: 0 },
          { type: 'coffee_table', position: { x: roomWidth / 2, y: roomDepth * 0.5 }, rotation: 0 },
          { type: 'tv_stand', position: { x: roomWidth / 2, y: roomDepth * 0.8 }, rotation: 180 }
        );
        break;
      case 'bedroom':
        suggestions.push(
          { type: 'bed', position: { x: roomWidth / 2, y: roomDepth * 0.4 }, rotation: 0 },
          { type: 'nightstand', position: { x: roomWidth * 0.2, y: roomDepth * 0.4 }, rotation: 0 },
          { type: 'wardrobe', position: { x: roomWidth * 0.8, y: roomDepth * 0.2 }, rotation: 90 }
        );
        break;
      case 'kitchen':
        suggestions.push(
          { type: 'kitchen_cabinet', position: { x: 0.5, y: roomDepth / 2 }, rotation: 0 },
          { type: 'countertop', position: { x: roomWidth / 2, y: 0.5 }, rotation: 0 },
          { type: 'refrigerator', position: { x: roomWidth - 0.5, y: 0.5 }, rotation: 0 }
        );
        break;
    }
    return suggestions;
  }

  private analyzeAndSuggestImprovements(currentLayout: any): any {
    const improvements: any[] = [];
    if (currentLayout.rooms) {
      currentLayout.rooms.forEach((room: any) => {
        const area = room.width * room.depth;
        if (room.type === 'bedroom' && area < 7) {
          improvements.push({
            type: 'size_warning',
            room: room.id,
            message: 'Bedroom is smaller than recommended minimum (7m²)',
          });
        }
      });
    }
    return improvements;
  }

  private generateLightingPlan(request: LightingRequest): any {
    const { roomWidth, roomDepth, naturalLight } = request;
    const lights: any[] = [];
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
    return { lights };
  }

  private calculateMaterialEstimation(projectData: any): any {
    const walls = projectData.walls || [];
    let totalWallArea = 0;
    walls.forEach((wall: any) => {
      const length = Math.sqrt(Math.pow(wall.x2 - wall.x1, 2) + Math.pow(wall.y2 - wall.y1, 2));
      totalWallArea += length * 2.7;
    });
    return {
      walls: { area: totalWallArea, bricks: Math.ceil(totalWallArea * 60) },
      estimatedCost: { total: Math.ceil(totalWallArea * 80) },
    };
  }

  async getSuggestions(): Promise<string[]> {
    return mainAIService.generateSuggestions('');
  }

  /**
   * Processa comando delegando ao AIService principal.
   */
  async processCommand(command: string): Promise<CommandProcessingResult> {
    return mainAIService.processCommand({ prompt: command });
  }

  async previewCommand(command: string): Promise<CommandProcessingResult> {
    return mainAIService.previewCommand({ prompt: command });
  }
}

export const aiService = AIService.getInstance();
export default aiService;
