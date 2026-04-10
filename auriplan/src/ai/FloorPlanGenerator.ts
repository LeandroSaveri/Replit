/**
 * FloorPlanGenerator - Gerador de Estrutura de Planta
 * Responsável por converter a interpretação em estrutura de planta baixa
 */

import { EventEmitter } from '../utils/EventEmitter';
import type { InterpretedCommand } from './AIService';

// Types
interface Point { x: number; y: number; }
interface Room {
  id: string;
  name: string;
  type: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  points?: Point[];
  area?: number;
  material?: { id: string; name: string; color: string };
  [key: string]: any;
}
interface Wall {
  id: string;
  start: Point;
  end: Point;
  thickness: number;
  height?: number;
  roomId?: string;
  [key: string]: any;
}
interface Furniture {
  id: string;
  type: string;
  name?: string;
  category?: string;
  x?: number;
  y?: number;
  rotation?: number;
  scale?: number;
  width?: number;
  height?: number;
  depth?: number;
  color?: string;
  [key: string]: any;
}
interface FloorPlan { id: string; name: string; rooms: Room[]; walls: Wall[]; furniture: Furniture[]; }

export interface GeneratedFloorPlan {
  success: boolean;
  floorPlan?: FloorPlan;
  error?: string;
  warnings?: string[];
}

export interface RoomTemplate {
  type: string;
  defaultWidth: number;
  defaultHeight: number;
  minSize: number;
  maxSize: number;
  wallThickness: number;
  doorPositions?: { x: number; y: number; width: number }[];
  windowPositions?: { x: number; y: number; width: number }[];
}

export interface FurnitureTemplate {
  type: string;
  width: number;
  height: number;
  depth: number;
  defaultColor: string;
  category: string;
}

export class FloorPlanGenerator extends EventEmitter {
  // Templates de cômodos padrão (em metros)
  private readonly roomTemplates: Map<string, RoomTemplate> = new Map([
    ['living_room', {
      type: 'living_room',
      defaultWidth: 5,
      defaultHeight: 4,
      minSize: 12,
      maxSize: 50,
      wallThickness: 0.15,
    }],
    ['bedroom', {
      type: 'bedroom',
      defaultWidth: 3.5,
      defaultHeight: 3.5,
      minSize: 9,
      maxSize: 25,
      wallThickness: 0.15,
    }],
    ['kitchen', {
      type: 'kitchen',
      defaultWidth: 3,
      defaultHeight: 3,
      minSize: 6,
      maxSize: 20,
      wallThickness: 0.15,
    }],
    ['bathroom', {
      type: 'bathroom',
      defaultWidth: 2,
      defaultHeight: 2,
      minSize: 3,
      maxSize: 10,
      wallThickness: 0.15,
    }],
    ['dining_room', {
      type: 'dining_room',
      defaultWidth: 4,
      defaultHeight: 4,
      minSize: 12,
      maxSize: 30,
      wallThickness: 0.15,
    }],
    ['office', {
      type: 'office',
      defaultWidth: 3,
      defaultHeight: 3,
      minSize: 8,
      maxSize: 20,
      wallThickness: 0.15,
    }],
    ['garage', {
      type: 'garage',
      defaultWidth: 6,
      defaultHeight: 6,
      minSize: 30,
      maxSize: 60,
      wallThickness: 0.2,
    }],
    ['hallway', {
      type: 'hallway',
      defaultWidth: 1.5,
      defaultHeight: 4,
      minSize: 4,
      maxSize: 15,
      wallThickness: 0.15,
    }],
    ['balcony', {
      type: 'balcony',
      defaultWidth: 2,
      defaultHeight: 3,
      minSize: 5,
      maxSize: 15,
      wallThickness: 0.1,
    }],
  ]);

  // Templates de móveis padrão (em metros)
  private readonly furnitureTemplates: Map<string, FurnitureTemplate> = new Map([
    ['sofa', {
      type: 'sofa',
      width: 2,
      height: 0.8,
      depth: 0.9,
      defaultColor: '#8B4513',
      category: 'living_room',
    }],
    ['bed', {
      type: 'bed',
      width: 1.6,
      height: 0.5,
      depth: 2,
      defaultColor: '#F5F5DC',
      category: 'bedroom',
    }],
    ['bed_single', {
      type: 'bed_single',
      width: 1,
      height: 0.5,
      depth: 2,
      defaultColor: '#F5F5DC',
      category: 'bedroom',
    }],
    ['table', {
      type: 'table',
      width: 1.5,
      height: 0.75,
      depth: 0.9,
      defaultColor: '#8B4513',
      category: 'dining_room',
    }],
    ['chair', {
      type: 'chair',
      width: 0.5,
      height: 0.9,
      depth: 0.5,
      defaultColor: '#8B4513',
      category: 'dining_room',
    }],
    ['wardrobe', {
      type: 'wardrobe',
      width: 1.5,
      height: 2.2,
      depth: 0.6,
      defaultColor: '#D2691E',
      category: 'bedroom',
    }],
    ['desk', {
      type: 'desk',
      width: 1.2,
      height: 0.75,
      depth: 0.6,
      defaultColor: '#8B4513',
      category: 'office',
    }],
    ['tv_stand', {
      type: 'tv_stand',
      width: 1.5,
      height: 0.5,
      depth: 0.4,
      defaultColor: '#2F4F4F',
      category: 'living_room',
    }],
    ['bookshelf', {
      type: 'bookshelf',
      width: 0.8,
      height: 2,
      depth: 0.3,
      defaultColor: '#8B4513',
      category: 'office',
    }],
    ['refrigerator', {
      type: 'refrigerator',
      width: 0.7,
      height: 1.8,
      depth: 0.7,
      defaultColor: '#C0C0C0',
      category: 'kitchen',
    }],
    ['stove', {
      type: 'stove',
      width: 0.6,
      height: 0.9,
      depth: 0.6,
      defaultColor: '#2F4F4F',
      category: 'kitchen',
    }],
    ['sink', {
      type: 'sink',
      width: 0.6,
      height: 0.9,
      depth: 0.6,
      defaultColor: '#C0C0C0',
      category: 'kitchen',
    }],
  ]);

  /**
   * Gera uma planta baixa completa a partir de um comando interpretado
   */
  public generateFloorPlan(command: InterpretedCommand): GeneratedFloorPlan {
    try {
      this.emit('generationStarted', command);

      const warnings: string[] = [];
      const floorPlan: FloorPlan = {
        id: `floorplan-${Date.now()}`,
        name: 'Generated Floor Plan',
        walls: [],
        rooms: [],
        furniture: [],
      };

      switch (command.intent) {
        case 'create':
          this.handleCreateIntent(command, floorPlan, warnings);
          break;
        case 'add':
          this.handleAddIntent(command, floorPlan, warnings);
          break;
        case 'modify':
          this.handleModifyIntent(command, floorPlan, warnings);
          break;
        case 'delete':
          this.handleDeleteIntent(command, floorPlan, warnings);
          break;
        case 'move':
          this.handleMoveIntent(command, floorPlan, warnings);
          break;
        default:
          warnings.push(`Intent '${command.intent}' not fully implemented`);
      }

      this.emit('generationCompleted', { floorPlan, warnings });

      return {
        success: true,
        floorPlan,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Generation failed';

      this.emit('generationError', { command, error: errorMessage });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Manipula intenção de criação
   */
  private handleCreateIntent(
    command: InterpretedCommand,
    floorPlan: FloorPlan,
    warnings: string[]
  ): void {
    if (command.target === 'house') {
      // Criar casa completa
      this.generateHouse(command, floorPlan, warnings);
    } else if (command.target === 'room') {
      // Criar cômodo único
      this.generateRoom(command, floorPlan, warnings);
    } else if (command.target === 'furniture') {
      // Adicionar móvel
      this.generateFurniture(command, floorPlan, warnings);
    }
  }

  /**
   * Manipula intenção de adição
   */
  private handleAddIntent(
    command: InterpretedCommand,
    floorPlan: FloorPlan,
    warnings: string[]
  ): void {
    if (command.target === 'room') {
      this.generateRoom(command, floorPlan, warnings);
    } else if (command.target === 'furniture') {
      this.generateFurniture(command, floorPlan, warnings);
    } else if (command.target === 'wall') {
      this.generateWall(command, floorPlan, warnings);
    }
  }

  /**
   * Manipula intenção de modificação
   */
  private handleModifyIntent(
    command: InterpretedCommand,
    floorPlan: FloorPlan,
    warnings: string[]
  ): void {
    // Implementar modificação de elementos existentes
    warnings.push('Modify intent requires existing floor plan context');
  }

  /**
   * Manipula intenção de exclusão
   */
  private handleDeleteIntent(
    command: InterpretedCommand,
    floorPlan: FloorPlan,
    warnings: string[]
  ): void {
    warnings.push('Delete intent requires existing floor plan context');
  }

  /**
   * Manipula intenção de movimentação
   */
  private handleMoveIntent(
    command: InterpretedCommand,
    floorPlan: FloorPlan,
    warnings: string[]
  ): void {
    warnings.push('Move intent requires existing floor plan context');
  }

  /**
   * Gera uma casa completa com múltiplos cômodos
   */
  private generateHouse(
    command: InterpretedCommand,
    floorPlan: FloorPlan,
    warnings: string[]
  ): void {
    const roomCount = command.specifications.count || 1;
    const roomType = command.specifications.roomType || 'bedroom';

    // Layout básico de casa
    const layout = this.calculateHouseLayout(roomCount, roomType);

    // Gerar cômodos
    for (let i = 0; i < layout.rooms.length; i++) {
      const roomLayout = layout.rooms[i];
      const room = this.createRoomFromLayout(roomLayout, i);
      floorPlan.rooms.push(room);

      // Gerar paredes do cômodo
      const walls = this.createWallsForRoom(room);
      floorPlan.walls.push(...walls);
    }

    // Adicionar móveis padrão
    this.addDefaultFurniture(floorPlan);
  }

  /**
   * Calcula o layout de uma casa
   */
  private calculateHouseLayout(
    roomCount: number,
    primaryRoomType: string
  ): { rooms: RoomLayout[] } {
    const rooms: RoomLayout[] = [];
    let currentX = 0;
    let currentY = 0;

    // Sala principal
    const livingRoomTemplate = this.roomTemplates.get('living_room')!;
    rooms.push({
      type: 'living_room',
      x: currentX,
      y: currentY,
      width: livingRoomTemplate.defaultWidth,
      height: livingRoomTemplate.defaultHeight,
    });

    currentX += livingRoomTemplate.defaultWidth;

    // Cozinha
    const kitchenTemplate = this.roomTemplates.get('kitchen')!;
    rooms.push({
      type: 'kitchen',
      x: currentX,
      y: currentY,
      width: kitchenTemplate.defaultWidth,
      height: kitchenTemplate.defaultHeight,
    });

    currentY += Math.max(livingRoomTemplate.defaultHeight, kitchenTemplate.defaultHeight);
    currentX = 0;

    // Quartos
    const bedroomTemplate = this.roomTemplates.get(primaryRoomType) || this.roomTemplates.get('bedroom')!;
    for (let i = 0; i < roomCount; i++) {
      rooms.push({
        type: primaryRoomType,
        x: currentX,
        y: currentY,
        width: bedroomTemplate.defaultWidth,
        height: bedroomTemplate.defaultHeight,
      });

      currentX += bedroomTemplate.defaultWidth;

      // Nova linha após 2 quartos
      if ((i + 1) % 2 === 0) {
        currentX = 0;
        currentY += bedroomTemplate.defaultHeight;
      }
    }

    // Banheiro
    const bathroomTemplate = this.roomTemplates.get('bathroom')!;
    rooms.push({
      type: 'bathroom',
      x: currentX,
      y: currentY,
      width: bathroomTemplate.defaultWidth,
      height: bathroomTemplate.defaultHeight,
    });

    return { rooms };
  }

  /**
   * Gera um cômodo individual
   */
  private generateRoom(
    command: InterpretedCommand,
    floorPlan: FloorPlan,
    warnings: string[]
  ): void {
    const roomType = command.targetType || command.specifications.roomType || 'room';
    const template = this.roomTemplates.get(roomType);

    if (!template) {
      warnings.push(`Unknown room type: ${roomType}`);
      return;
    }

    // Calcular dimensões
    let width = template.defaultWidth;
    let height = template.defaultHeight;

    if (command.specifications.size) {
      // Ajustar dimensões baseado no tamanho especificado
      const area = command.specifications.size;
      const ratio = width / height;
      height = Math.sqrt(area / ratio);
      width = area / height;
    }

    if (command.specifications.dimensions) {
      width = command.specifications.dimensions.width;
      height = command.specifications.dimensions.height;
    }

    // Encontrar posição disponível
    const position = this.findAvailablePosition(floorPlan, width, height);

    const room: Room = {
      id: `room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: this.getRoomName(roomType),
      type: roomType,
      points: [
        { x: position.x, y: position.y },
        { x: position.x + width, y: position.y },
        { x: position.x + width, y: position.y + height },
        { x: position.x, y: position.y + height },
      ],
      area: width * height,
      material: {
        id: `mat-${roomType}`,
        name: 'Default Floor',
        color: this.getRoomDefaultColor(roomType),
      },
    };

    floorPlan.rooms.push(room);

    // Criar paredes
    const walls = this.createWallsForRoom(room);
    floorPlan.walls.push(...walls);
  }

  /**
   * Gera um móvel
   */
  private generateFurniture(
    command: InterpretedCommand,
    floorPlan: FloorPlan,
    warnings: string[]
  ): void {
    const furnitureType = command.targetType || 'sofa';
    const template = this.furnitureTemplates.get(furnitureType);

    if (!template) {
      warnings.push(`Unknown furniture type: ${furnitureType}`);
      return;
    }

    // Encontrar cômodo de destino
    let targetRoom: Room | undefined;

    if (command.location) {
      targetRoom = floorPlan.rooms.find(r =>
        r.name.toLowerCase().includes(command.location!.toLowerCase())
      );
    }

    if (!targetRoom) {
      // Encontrar cômodo apropriado para o móvel
      targetRoom = floorPlan.rooms.find(r => r.type === template.category);
    }

    if (!targetRoom) {
      warnings.push(`No suitable room found for furniture: ${furnitureType}`);
      return;
    }

    // Calcular posição dentro do cômodo
    const position = this.calculateFurniturePosition(template, targetRoom);

    const furniture: Furniture = {
      id: `furniture-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: this.getFurnitureName(furnitureType),
      type: furnitureType,
      category: template.category,
      width: template.width,
      height: template.height,
      depth: template.depth,
      position: {
        x: position.x,
        y: position.y,
        z: 0,
      },
      rotation: 0,
      color: template.defaultColor,
      visible: true,
    };

    floorPlan.furniture.push(furniture);
  }

  /**
   * Gera uma parede
   */
  private generateWall(
    command: InterpretedCommand,
    floorPlan: FloorPlan,
    warnings: string[]
  ): void {
    // Implementar criação de paredes individuais
    warnings.push('Individual wall creation not yet implemented');
  }

  /**
   * Cria paredes para um cômodo
   */
  private createWallsForRoom(room: Room): Wall[] {
    const walls: Wall[] = [];
    const points = room.points;
    if (!points || points.length < 2) return walls;

    for (let i = 0; i < points.length; i++) {
      const start = points[i];
      const end = points[(i + 1) % points.length];

      walls.push({
        id: `wall-${room.id}-${i}`,
        start,
        end,
        thickness: 0.15,
        height: 2.8,
        roomId: room.id,
      });
    }

    return walls;
  }

  /**
   * Cria um cômodo a partir de um layout
   */
  private createRoomFromLayout(layout: RoomLayout, index: number): Room {
    const template = this.roomTemplates.get(layout.type)!;

    return {
      id: `room-${Date.now()}-${index}`,
      name: this.getRoomName(layout.type),
      type: layout.type,
      points: [
        { x: layout.x, y: layout.y },
        { x: layout.x + layout.width, y: layout.y },
        { x: layout.x + layout.width, y: layout.y + layout.height },
        { x: layout.x, y: layout.y + layout.height },
      ],
      area: layout.width * layout.height,
      material: {
        id: `mat-${layout.type}`,
        name: 'Default Floor',
        color: this.getRoomDefaultColor(layout.type),
      },
    };
  }

  /**
   * Encontra uma posição disponível para um novo cômodo
   */
  private findAvailablePosition(
    floorPlan: FloorPlan,
    width: number,
    height: number
  ): { x: number; y: number } {
    if (floorPlan.rooms.length === 0) {
      return { x: 0, y: 0 };
    }

    // Encontrar o ponto mais à direita
    let maxX = 0;
    for (const room of floorPlan.rooms) {
      for (const point of (room.points ?? [])) {
        maxX = Math.max(maxX, point.x);
      }
    }

    return { x: maxX + 1, y: 0 };
  }

  /**
   * Calcula a posição de um móvel dentro de um cômodo
   */
  private calculateFurniturePosition(
    template: FurnitureTemplate,
    room: Room
  ): { x: number; y: number } {
    // Calcular centro do cômodo
    let centerX = 0;
    let centerY = 0;
    const pts = room.points ?? [];

    for (const point of pts) {
      centerX += point.x;
      centerY += point.y;
    }

    if (pts.length > 0) {
      centerX /= pts.length;
      centerY /= pts.length;
    }

    // Posicionar móvel no centro
    return {
      x: centerX - template.width / 2,
      y: centerY - template.depth / 2,
    };
  }

  /**
   * Adiciona móveis padrão aos cômodos
   */
  private addDefaultFurniture(floorPlan: FloorPlan): void {
    for (const room of floorPlan.rooms) {
      const furnitureTypes = this.getDefaultFurnitureForRoom(room.type);

      for (const furnitureType of furnitureTypes) {
        const template = this.furnitureTemplates.get(furnitureType);
        if (!template) continue;

        const position = this.calculateFurniturePosition(template, room);

        const furniture: Furniture = {
          id: `furniture-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: this.getFurnitureName(furnitureType),
          type: furnitureType,
          category: template.category,
          width: template.width,
          height: template.height,
          depth: template.depth,
          position: {
            x: position.x,
            y: position.y,
            z: 0,
          },
          rotation: 0,
          color: template.defaultColor,
          visible: true,
        };

        floorPlan.furniture.push(furniture);
      }
    }
  }

  /**
   * Retorna móveis padrão para um tipo de cômodo
   */
  private getDefaultFurnitureForRoom(roomType: string): string[] {
    const defaults: Record<string, string[]> = {
      living_room: ['sofa', 'tv_stand'],
      bedroom: ['bed', 'wardrobe'],
      kitchen: ['refrigerator', 'stove', 'sink'],
      dining_room: ['table', 'chair'],
      office: ['desk', 'bookshelf', 'chair'],
    };

    return defaults[roomType] || [];
  }

  /**
   * Retorna o nome de exibição de um cômodo
   */
  private getRoomName(roomType: string): string {
    const names: Record<string, string> = {
      living_room: 'Sala de Estar',
      bedroom: 'Quarto',
      kitchen: 'Cozinha',
      bathroom: 'Banheiro',
      dining_room: 'Sala de Jantar',
      office: 'Escritório',
      garage: 'Garagem',
      hallway: 'Corredor',
      balcony: 'Varanda',
    };

    return names[roomType] || roomType;
  }

  /**
   * Retorna o nome de exibição de um móvel
   */
  private getFurnitureName(furnitureType: string): string {
    const names: Record<string, string> = {
      sofa: 'Sofá',
      bed: 'Cama de Casal',
      bed_single: 'Cama de Solteiro',
      table: 'Mesa',
      chair: 'Cadeira',
      wardrobe: 'Guarda-Roupa',
      desk: 'Escrivaninha',
      tv_stand: 'Rack',
      bookshelf: 'Estante',
      refrigerator: 'Geladeira',
      stove: 'Fogão',
      sink: 'Pia',
    };

    return names[furnitureType] || furnitureType;
  }

  /**
   * Retorna a cor padrão de piso para um tipo de cômodo
   */
  private getRoomDefaultColor(roomType: string): string {
    const colors: Record<string, string> = {
      living_room: '#D2B48C',
      bedroom: '#F5DEB3',
      kitchen: '#E6E6FA',
      bathroom: '#B0E0E6',
      dining_room: '#DEB887',
      office: '#F0E68C',
      garage: '#A9A9A9',
      hallway: '#D3D3D3',
      balcony: '#BC8F8F',
    };

    return colors[roomType] || '#CCCCCC';
  }
}

interface RoomLayout {
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

// Singleton instance
export const floorPlanGenerator = new FloorPlanGenerator();
