// ============================================
// IMPORT ENGINE - Motor de Importação
// ============================================

import type { Project, Floor, Wall, Room, Furniture } from '@auriplan-types';
import { v4 as uuidv4 } from 'uuid';

export interface ImportResult {
  success: boolean;
  project?: Project;
  errors: string[];
}

export class ImportEngine {
  static importJSON(jsonString: string): ImportResult {
    const errors: string[] = [];

    try {
      const data = JSON.parse(jsonString);

      // Validate project structure
      if (!data.name) {
        errors.push('Project name is required');
      }

      if (!Array.isArray(data.floors)) {
        errors.push('Floors must be an array');
      }

      if (errors.length > 0) {
        return { success: false, errors };
      }

      // Migrate and validate project
      const project: Project = {
        ...data,
        id: data.id || uuidv4(),
        version: data.version || '1.0.0',
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        floors: data.floors.map((floor: any) => this.validateFloor(floor)),
      };

      return { success: true, project, errors };
    } catch (error) {
      return { 
        success: false, 
        errors: [`Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`] 
      };
    }
  }

  private static validateFloor(floor: any): Floor {
    return {
      id: floor.id || uuidv4(),
      name: floor.name || 'Floor',
      level: floor.level || 0,
      height: floor.height || 2.8,
      visible: floor.visible !== false,
      locked: floor.locked === true,
      walls: Array.isArray(floor.walls) ? floor.walls.map((w: any) => this.validateWall(w)) : [],
      rooms: Array.isArray(floor.rooms) ? floor.rooms.map((r: any) => this.validateRoom(r)) : [],
      furniture: Array.isArray(floor.furniture) ? floor.furniture.map((f: any) => this.validateFurniture(f)) : [],
      doors: Array.isArray(floor.doors) ? floor.doors : [],
      windows: Array.isArray(floor.windows) ? floor.windows : [],
      measurements: Array.isArray(floor.measurements) ? floor.measurements : [],
    };
  }

  private static validateWall(wall: any): Wall {
    return {
      id: wall.id || uuidv4(),
      start: wall.start || [0, 0],
      end: wall.end || [1, 0],
      thickness: wall.thickness || 0.15,
      height: wall.height || 2.8,
      color: wall.color || '#8B4513',
      visible: wall.visible !== false,
      locked: wall.locked === true,
      metadata: wall.metadata || {},
      material: wall.material || 'concrete',
    };
  }

  private static validateRoom(room: any): Room {
    return {
      id: room.id || uuidv4(),
      name: room.name || 'Room',
      points: room.points || [],
      wallColor: room.wallColor || '#F5F5DC',
      floorColor: room.floorColor || '#D2691E',
      height: room.height || 2.8,
      area: room.area || 0,
      perimeter: room.perimeter || 0,
      visible: room.visible !== false,
      locked: room.locked === true,
      metadata: room.metadata || {},
    };
  }

  private static validateFurniture(furniture: any): Furniture {
    return {
      id: furniture.id || uuidv4(),
      catalogId: furniture.catalogId || '',
      name: furniture.name || 'Furniture',
      category: furniture.category || 'general',
      type: furniture.type || 'generic',
      position: furniture.position || [0, 0, 0],
      rotation: furniture.rotation || [0, 0, 0],
      scale: furniture.scale || [1, 1, 1],
      dimensions: furniture.dimensions || { width: 1, height: 1, depth: 1 },
      color: furniture.color || '#808080',
      material: furniture.material || '',
      visible: furniture.visible !== false,
      locked: furniture.locked === true,
      castShadow: furniture.castShadow !== false,
      receiveShadow: furniture.receiveShadow !== false,
      metadata: furniture.metadata || {},
    };
  }

  static async importFromImage(file: File): Promise<ImportResult> {
    // Placeholder for AI-powered floor plan extraction
    return {
      success: false,
      errors: ['Image import not yet implemented'],
    };
  }

  static importFromSVG(svgString: string): ImportResult {
    const errors: string[] = [];

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgString, 'image/svg+xml');
      
      // Extract walls from lines
      const lines = doc.querySelectorAll('line');
      const walls: Wall[] = [];

      lines.forEach((line, index) => {
        const x1 = parseFloat(line.getAttribute('x1') || '0');
        const y1 = parseFloat(line.getAttribute('y1') || '0');
        const x2 = parseFloat(line.getAttribute('x2') || '0');
        const y2 = parseFloat(line.getAttribute('y2') || '0');
        const strokeWidth = parseFloat(line.getAttribute('stroke-width') || '2');

        walls.push({
          id: uuidv4(),
          start: [x1 / 100, y1 / 100], // Convert from pixels to meters
          end: [x2 / 100, y2 / 100],
          thickness: strokeWidth / 100,
          height: 2.8,
          color: line.getAttribute('stroke') || '#8B4513',
          visible: true,
          locked: false,
          metadata: {},
          material: 'concrete',
        });
      });

      const floor: Floor = {
        id: uuidv4(),
        name: 'Imported Floor',
        level: 0,
        height: 2.8,
        visible: true,
        locked: false,
        walls,
        rooms: [],
        furniture: [],
        doors: [],
        windows: [],
        measurements: [],
      };

      const project: Project = {
        id: uuidv4(),
        name: 'Imported Project',
        description: 'Imported from SVG',
        floors: [floor],
        currentFloorId: floor.id,
        settings: {
          units: 'metric',
          currency: 'BRL',
          gridSize: 0.5,
          snapToGrid: true,
        },
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        owner: { id: 'import', name: 'Import', email: '', role: 'owner' },
        collaborators: [],
      };

      return { success: true, project, errors };
    } catch (error) {
      return {
        success: false,
        errors: [`SVG parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      };
    }
  }
}
