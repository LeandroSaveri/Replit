/**
 * Floor Plan Generator for AuriPlan
 * AI-powered automatic floor plan generation
 */

import { RoomType, roomRules, validateRoomDimensions, circulationRules } from './RoomRules';

export interface RoomPlacement {
  id: string;
  type: RoomType;
  name: string;
  x: number;
  y: number;
  width: number;
  depth: number;
  rotation: number;
  windows: WindowPlacement[];
  doors: DoorPlacement[];
}

export interface WindowPlacement {
  id: string;
  wall: 'north' | 'south' | 'east' | 'west';
  position: number; // 0-1 along wall
  width: number;
  height: number;
}

export interface DoorPlacement {
  id: string;
  wall: 'north' | 'south' | 'east' | 'west';
  position: number;
  width: number;
  type: 'interior' | 'exterior';
  connectsTo?: string;
}

export interface FloorPlan {
  id: string;
  name: string;
  totalArea: number;
  rooms: RoomPlacement[];
  walls: WallPlacement[];
  score: number;
}

export interface WallPlacement {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  thickness: number;
}

export interface FloorPlanRequest {
  plotWidth: number;
  plotDepth: number;
  roomTypes: RoomType[];
  numBedrooms: number;
  numBathrooms: number;
  style: 'modern' | 'traditional' | 'minimalist' | 'open-concept';
  constraints?: {
    maxArea?: number;
    minArea?: number;
    preferredOrientation?: 'north' | 'south' | 'east' | 'west';
    existingWalls?: WallPlacement[];
  };
}

class FloorPlanGenerator {
  private request: FloorPlanRequest;
  private generatedPlans: FloorPlan[] = [];

  constructor(request: FloorPlanRequest) {
    this.request = request;
  }

  /**
   * Generate multiple floor plan variants
   */
  generateVariants(count: number = 3): FloorPlan[] {
    this.generatedPlans = [];

    for (let i = 0; i < count; i++) {
      const plan = this.generateSinglePlan(i);
      this.generatedPlans.push(plan);
    }

    // Sort by score (highest first)
    return this.generatedPlans.sort((a, b) => b.score - a.score);
  }

  /**
   * Generate a single floor plan
   */
  private generateSinglePlan(variantIndex: number): FloorPlan {
    const rooms: RoomPlacement[] = [];
    const walls: WallPlacement[] = [];
    
    // Calculate available space
    const availableWidth = this.request.plotWidth - 0.3; // Account for exterior walls
    const availableDepth = this.request.plotDepth - 0.3;

    // Generate room layout based on style
    switch (this.request.style) {
      case 'open-concept':
        this.generateOpenConceptLayout(rooms, availableWidth, availableDepth, variantIndex);
        break;
      case 'traditional':
        this.generateTraditionalLayout(rooms, availableWidth, availableDepth, variantIndex);
        break;
      case 'minimalist':
        this.generateMinimalistLayout(rooms, availableWidth, availableDepth, variantIndex);
        break;
      default:
        this.generateModernLayout(rooms, availableWidth, availableDepth, variantIndex);
    }

    // Generate walls from room placements
    this.generateWallsFromRooms(rooms, walls);

    // Calculate total area
    const totalArea = rooms.reduce((sum, room) => sum + (room.width * room.depth), 0);

    // Calculate plan score
    const score = this.calculatePlanScore(rooms, totalArea);

    return {
      id: `plan-${Date.now()}-${variantIndex}`,
      name: `Layout ${String.fromCharCode(65 + variantIndex)}`,
      totalArea,
      rooms,
      walls,
      score,
    };
  }

  /**
   * Generate open-concept layout
   */
  private generateOpenConceptLayout(
    rooms: RoomPlacement[],
    width: number,
    depth: number,
    variant: number
  ): void {
    // Open concept combines living, dining, and kitchen
    const commonAreaWidth = width * 0.6;
    const commonAreaDepth = depth;
    
    // Living/Dining/Kitchen combined
    rooms.push({
      id: 'room-common',
      type: 'living_room',
      name: 'Living/Dining/Cozinha',
      x: 0.15,
      y: 0.15,
      width: commonAreaWidth,
      depth: commonAreaDepth - 0.3,
      rotation: 0,
      windows: this.generateWindows('living_room', commonAreaWidth, commonAreaDepth, 0.15, 0.15),
      doors: [],
    });

    // Bedrooms on the side
    const bedroomWidth = (width - commonAreaWidth - 0.3) / this.request.numBedrooms;
    for (let i = 0; i < this.request.numBedrooms; i++) {
      rooms.push({
        id: `room-bedroom-${i}`,
        type: 'bedroom',
        name: `Quarto ${i + 1}`,
        x: commonAreaWidth + 0.3,
        y: 0.15 + (i * (depth / this.request.numBedrooms)),
        width: bedroomWidth - 0.15,
        depth: (depth / this.request.numBedrooms) - 0.15,
        rotation: 0,
        windows: this.generateWindows('bedroom', bedroomWidth, depth / this.request.numBedrooms, 
          commonAreaWidth + 0.3, 0.15 + (i * (depth / this.request.numBedrooms))),
        doors: [],
      });
    }

    // Bathrooms
    for (let i = 0; i < this.request.numBathrooms; i++) {
      const bathWidth = 1.8;
      const bathDepth = 2.5;
      rooms.push({
        id: `room-bathroom-${i}`,
        type: 'bathroom',
        name: `Banheiro ${i + 1}`,
        x: 0.15 + (i * (bathWidth + 0.1)),
        y: depth - bathDepth - 0.15,
        width: bathWidth,
        depth: bathDepth,
        rotation: 0,
        windows: this.generateWindows('bathroom', bathWidth, bathDepth, 
          0.15 + (i * (bathWidth + 0.1)), depth - bathDepth - 0.15),
        doors: [],
      });
    }

    // Generate doors
    this.generateDoors(rooms);
  }

  /**
   * Generate traditional layout
   */
  private generateTraditionalLayout(
    rooms: RoomPlacement[],
    width: number,
    depth: number,
    variant: number
  ): void {
    // Separate rooms with clear divisions
    const livingWidth = width * 0.5;
    const livingDepth = depth * 0.5;
    
    // Living room
    rooms.push({
      id: 'room-living',
      type: 'living_room',
      name: 'Sala de Estar',
      x: 0.15,
      y: 0.15,
      width: livingWidth,
      depth: livingDepth,
      rotation: 0,
      windows: this.generateWindows('living_room', livingWidth, livingDepth, 0.15, 0.15),
      doors: [],
    });

    // Dining room
    rooms.push({
      id: 'room-dining',
      type: 'dining_room',
      name: 'Sala de Jantar',
      x: livingWidth + 0.15,
      y: 0.15,
      width: width - livingWidth - 0.3,
      depth: livingDepth,
      rotation: 0,
      windows: this.generateWindows('dining_room', width - livingWidth - 0.3, livingDepth, 
        livingWidth + 0.15, 0.15),
      doors: [],
    });

    // Kitchen
    rooms.push({
      id: 'room-kitchen',
      type: 'kitchen',
      name: 'Cozinha',
      x: 0.15,
      y: livingDepth + 0.15,
      width: width * 0.4,
      depth: depth - livingDepth - 0.3,
      rotation: 0,
      windows: this.generateWindows('kitchen', width * 0.4, depth - livingDepth - 0.3, 
        0.15, livingDepth + 0.15),
      doors: [],
    });

    // Bedrooms
    const bedroomAreaWidth = width * 0.6;
    const bedroomAreaDepth = depth - livingDepth - 0.3;
    const bedroomWidth = (bedroomAreaWidth - 0.15) / this.request.numBedrooms;
    
    for (let i = 0; i < this.request.numBedrooms; i++) {
      rooms.push({
        id: `room-bedroom-${i}`,
        type: 'bedroom',
        name: `Quarto ${i + 1}`,
        x: width * 0.4 + 0.15 + (i * bedroomWidth),
        y: livingDepth + 0.15,
        width: bedroomWidth - 0.15,
        depth: bedroomAreaDepth,
        rotation: 0,
        windows: this.generateWindows('bedroom', bedroomWidth - 0.15, bedroomAreaDepth,
          width * 0.4 + 0.15 + (i * bedroomWidth), livingDepth + 0.15),
        doors: [],
      });
    }

    // Bathrooms
    for (let i = 0; i < this.request.numBathrooms; i++) {
      rooms.push({
        id: `room-bathroom-${i}`,
        type: 'bathroom',
        name: `Banheiro ${i + 1}`,
        x: 0.15 + (i * 2.0),
        y: depth - 1.5 - 0.15,
        width: 1.8,
        depth: 2.5,
        rotation: 0,
        windows: [],
        doors: [],
      });
    }

    this.generateDoors(rooms);
  }

  /**
   * Generate modern layout
   */
  private generateModernLayout(
    rooms: RoomPlacement[],
    width: number,
    depth: number,
    variant: number
  ): void {
    // Balanced mix of open and defined spaces
    this.generateOpenConceptLayout(rooms, width, depth, variant);
  }

  /**
   * Generate minimalist layout
   */
  private generateMinimalistLayout(
    rooms: RoomPlacement[],
    width: number,
    depth: number,
    variant: number
  ): void {
    // Compact, efficient layout
    const roomSize = Math.min(width, depth) / 2;
    
    // Living area
    rooms.push({
      id: 'room-living',
      type: 'living_room',
      name: 'Sala',
      x: 0.15,
      y: 0.15,
      width: roomSize,
      depth: roomSize,
      rotation: 0,
      windows: this.generateWindows('living_room', roomSize, roomSize, 0.15, 0.15),
      doors: [],
    });

    // Kitchen
    rooms.push({
      id: 'room-kitchen',
      type: 'kitchen',
      name: 'Cozinha',
      x: roomSize + 0.15,
      y: 0.15,
      width: width - roomSize - 0.3,
      depth: roomSize * 0.6,
      rotation: 0,
      windows: this.generateWindows('kitchen', width - roomSize - 0.3, roomSize * 0.6,
        roomSize + 0.15, 0.15),
      doors: [],
    });

    // Bedrooms (compact)
    for (let i = 0; i < this.request.numBedrooms; i++) {
      rooms.push({
        id: `room-bedroom-${i}`,
        type: 'bedroom',
        name: `Quarto ${i + 1}`,
        x: 0.15 + (i * (width / this.request.numBedrooms)),
        y: roomSize + 0.15,
        width: (width / this.request.numBedrooms) - 0.15,
        depth: depth - roomSize - 0.3,
        rotation: 0,
        windows: this.generateWindows('bedroom', (width / this.request.numBedrooms) - 0.15,
          depth - roomSize - 0.3, 0.15 + (i * (width / this.request.numBedrooms)), roomSize + 0.15),
        doors: [],
      });
    }

    this.generateDoors(rooms);
  }

  /**
   * Generate windows for a room
   */
  private generateWindows(
    roomType: RoomType,
    width: number,
    depth: number,
    x: number,
    y: number
  ): WindowPlacement[] {
    const rule = roomRules[roomType];
    const windows: WindowPlacement[] = [];

    if (rule.naturalLight === 'required' || rule.naturalLight === 'preferred') {
      // Add window on the longest exterior wall
      const isWide = width >= depth;
      const windowWidth = Math.min(1.5, isWide ? width * 0.4 : depth * 0.4);
      
      windows.push({
        id: `window-${Math.random().toString(36).substr(2, 9)}`,
        wall: isWide ? 'north' : 'east',
        position: 0.5,
        width: windowWidth,
        height: 1.2,
      });

      // Add second window for larger rooms
      if (width * depth > 15) {
        windows.push({
          id: `window-${Math.random().toString(36).substr(2, 9)}`,
          wall: isWide ? 'south' : 'west',
          position: 0.5,
          width: windowWidth * 0.8,
          height: 1.2,
        });
      }
    }

    return windows;
  }

  /**
   * Generate doors between rooms
   */
  private generateDoors(rooms: RoomPlacement[]): void {
    for (let i = 0; i < rooms.length; i++) {
      for (let j = i + 1; j < rooms.length; j++) {
        const room1 = rooms[i];
        const room2 = rooms[j];

        // Check if rooms are adjacent
        const adjacency = this.checkRoomAdjacency(room1, room2);
        
        if (adjacency.adjacent && adjacency.wall) {
          // Add door
          const door: DoorPlacement = {
            id: `door-${Math.random().toString(36).substr(2, 9)}`,
            wall: adjacency.wall,
            position: 0.5,
            width: circulationRules.minDoorWidth,
            type: 'interior',
            connectsTo: room2.id,
          };
          room1.doors.push(door);
        }
      }
    }
  }

  /**
   * Check if two rooms are adjacent
   */
  private checkRoomAdjacency(
    room1: RoomPlacement,
    room2: RoomPlacement
  ): { adjacent: boolean; wall?: 'north' | 'south' | 'east' | 'west' } {
    const tolerance = 0.1;

    // Check north/south adjacency
    if (Math.abs(room1.y + room1.depth - room2.y) < tolerance ||
        Math.abs(room2.y + room2.depth - room1.y) < tolerance) {
      // Check horizontal overlap
      const xOverlap = Math.max(0, Math.min(room1.x + room1.width, room2.x + room2.width) -
        Math.max(room1.x, room2.x));
      if (xOverlap > 0.8) {
        return { adjacent: true, wall: room1.y < room2.y ? 'south' : 'north' };
      }
    }

    // Check east/west adjacency
    if (Math.abs(room1.x + room1.width - room2.x) < tolerance ||
        Math.abs(room2.x + room2.width - room1.x) < tolerance) {
      // Check vertical overlap
      const yOverlap = Math.max(0, Math.min(room1.y + room1.depth, room2.y + room2.depth) -
        Math.max(room1.y, room2.y));
      if (yOverlap > 0.8) {
        return { adjacent: true, wall: room1.x < room2.x ? 'east' : 'west' };
      }
    }

    return { adjacent: false };
  }

  /**
   * Generate walls from room placements
   */
  private generateWallsFromRooms(rooms: RoomPlacement[], walls: WallPlacement[]): void {
    // This would generate the actual wall geometry from room boundaries
    // For now, we'll create simplified walls
    rooms.forEach(room => {
      const thickness = 0.15;
      
      // North wall
      walls.push({
        id: `wall-${room.id}-n`,
        x1: room.x,
        y1: room.y,
        x2: room.x + room.width,
        y2: room.y,
        thickness,
      });
      
      // South wall
      walls.push({
        id: `wall-${room.id}-s`,
        x1: room.x,
        y1: room.y + room.depth,
        x2: room.x + room.width,
        y2: room.y + room.depth,
        thickness,
      });
      
      // East wall
      walls.push({
        id: `wall-${room.id}-e`,
        x1: room.x + room.width,
        y1: room.y,
        x2: room.x + room.width,
        y2: room.y + room.depth,
        thickness,
      });
      
      // West wall
      walls.push({
        id: `wall-${room.id}-w`,
        x1: room.x,
        y1: room.y,
        x2: room.x,
        y2: room.y + room.depth,
        thickness,
      });
    });
  }

  /**
   * Calculate plan score based on architectural best practices
   */
  private calculatePlanScore(rooms: RoomPlacement[], totalArea: number): number {
    let score = 100;

    // Penalize for rooms not meeting minimum dimensions
    rooms.forEach(room => {
      const validation = validateRoomDimensions(room.type, room.width, room.depth);
      if (!validation.valid) {
        score -= validation.errors.length * 10;
      }
    });

    // Penalize for inefficient space usage
    const plotArea = this.request.plotWidth * this.request.plotDepth;
    const efficiency = totalArea / plotArea;
    if (efficiency < 0.6) {
      score -= (0.6 - efficiency) * 100;
    }

    // Bonus for natural light in required rooms
    rooms.forEach(room => {
      const rule = roomRules[room.type];
      if (rule.naturalLight === 'required' && room.windows.length === 0) {
        score -= 15;
      }
    });

    return Math.max(0, score);
  }
}

export default FloorPlanGenerator;
