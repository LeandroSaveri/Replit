/**
 * Material Estimator for AuriPlan
 * Calculates materials and costs for construction projects
 */

export interface MaterialItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface MaterialCategory {
  name: string;
  items: MaterialItem[];
  subtotal: number;
}

export interface ProjectEstimation {
  id: string;
  name: string;
  totalArea: number;
  categories: MaterialCategory[];
  materialsTotal: number;
  laborTotal: number;
  grandTotal: number;
  currency: string;
}

export interface WallData {
  id: string;
  length: number;
  height: number;
  thickness: number;
  hasPlaster: boolean;
  hasPaint: boolean;
}

export interface FloorData {
  id: string;
  area: number;
  floorType: 'tile' | 'wood' | 'laminate' | 'vinyl' | 'carpet';
  hasSubfloor: boolean;
}

export interface RoomData {
  id: string;
  name: string;
  type: string;
  area: number;
  walls: WallData[];
  floor: FloorData;
  ceilingHeight: number;
}

export class MaterialEstimator {
  private prices: Record<string, number> = {
    // Wall materials
    'brick': 2.5,        // per unit
    'cement': 15,        // per kg
    'sand': 5,           // per kg
    'mortar': 25,        // per kg
    'plaster': 20,       // per kg
    'paint': 30,         // per liter
    'primer': 25,        // per liter
    
    // Floor materials
    'tile-60x60': 80,    // per m²
    'tile-80x80': 120,   // per m²
    'wood-flooring': 150, // per m²
    'laminate': 60,      // per m²
    'vinyl': 40,         // per m²
    'carpet': 50,        // per m²
    'subfloor': 30,      // per m²
    
    // Ceiling materials
    'gypsum-board': 35,  // per m²
    'ceiling-paint': 25, // per liter
    
    // Electrical
    'outlet': 15,        // per unit
    'switch': 12,        // per unit
    'light-fixture': 80, // per unit
    'wire-meter': 3,     // per meter
    
    // Plumbing
    'toilet': 400,       // per unit
    'sink': 300,         // per unit
    'shower': 600,       // per unit
    'faucet': 150,       // per unit
    'pipe-meter': 10,    // per meter
    
    // Doors and windows
    'door-interior': 350,  // per unit
    'door-exterior': 800,  // per unit
    'window-standard': 400, // per unit
  };

  private laborRates: Record<string, number> = {
    'wall-construction': 45,  // per m²
    'floor-installation': 35, // per m²
    'ceiling-installation': 30, // per m²
    'painting': 15,           // per m²
    'electrical': 50,         // per hour
    'plumbing': 55,           // per hour
    'carpentry': 40,          // per hour
  };

  /**
   * Estimate materials for a complete project
   */
  estimateProject(rooms: RoomData[]): ProjectEstimation {
    const categories: MaterialCategory[] = [];
    let materialsTotal = 0;
    let laborTotal = 0;
    let totalArea = 0;

    // Calculate wall materials
    const wallCategory = this.estimateWalls(rooms);
    categories.push(wallCategory);
    materialsTotal += wallCategory.subtotal;
    laborTotal += this.calculateWallLabor(rooms);

    // Calculate floor materials
    const floorCategory = this.estimateFloors(rooms);
    categories.push(floorCategory);
    materialsTotal += floorCategory.subtotal;
    laborTotal += this.calculateFloorLabor(rooms);

    // Calculate ceiling materials
    const ceilingCategory = this.estimateCeilings(rooms);
    categories.push(ceilingCategory);
    materialsTotal += ceilingCategory.subtotal;
    laborTotal += this.calculateCeilingLabor(rooms);

    // Calculate total area
    rooms.forEach(room => {
      totalArea += room.area;
    });

    return {
      id: `est-${Date.now()}`,
      name: 'Project Material Estimate',
      totalArea,
      categories,
      materialsTotal,
      laborTotal,
      grandTotal: materialsTotal + laborTotal,
      currency: 'USD',
    };
  }

  /**
   * Estimate wall materials
   */
  private estimateWalls(rooms: RoomData[]): MaterialCategory {
    const items: MaterialItem[] = [];
    let totalWallArea = 0;
    let totalBrickCount = 0;
    let totalCement = 0;
    let totalSand = 0;
    let totalPlaster = 0;
    let totalPaint = 0;

    rooms.forEach(room => {
      room.walls.forEach(wall => {
        const wallArea = wall.length * wall.height;
        totalWallArea += wallArea;

        // Bricks (assuming 60 bricks per m² for single wall)
        const brickCount = Math.ceil(wallArea * 60 * (wall.thickness / 0.15));
        totalBrickCount += brickCount;

        // Cement mortar (15kg per m²)
        const cement = wallArea * 15;
        totalCement += cement;

        // Sand (30kg per m²)
        const sand = wallArea * 30;
        totalSand += sand;

        // Plaster (if needed)
        if (wall.hasPlaster) {
          const plaster = wallArea * 12;
          totalPlaster += plaster;
        }

        // Paint (if needed, 0.3L per m²)
        if (wall.hasPaint) {
          const paint = wallArea * 0.3;
          totalPaint += paint;
        }
      });
    });

    // Add items
    if (totalBrickCount > 0) {
      items.push({
        id: 'brick',
        name: 'Bricks',
        category: 'wall',
        unit: 'units',
        quantity: totalBrickCount,
        unitPrice: this.prices['brick'],
        totalPrice: totalBrickCount * this.prices['brick'],
      });
    }

    if (totalCement > 0) {
      items.push({
        id: 'cement',
        name: 'Cement',
        category: 'wall',
        unit: 'kg',
        quantity: Math.ceil(totalCement),
        unitPrice: this.prices['cement'],
        totalPrice: Math.ceil(totalCement) * this.prices['cement'],
      });
    }

    if (totalSand > 0) {
      items.push({
        id: 'sand',
        name: 'Sand',
        category: 'wall',
        unit: 'kg',
        quantity: Math.ceil(totalSand),
        unitPrice: this.prices['sand'],
        totalPrice: Math.ceil(totalSand) * this.prices['sand'],
      });
    }

    if (totalPlaster > 0) {
      items.push({
        id: 'plaster',
        name: 'Plaster',
        category: 'wall',
        unit: 'kg',
        quantity: Math.ceil(totalPlaster),
        unitPrice: this.prices['plaster'],
        totalPrice: Math.ceil(totalPlaster) * this.prices['plaster'],
      });
    }

    if (totalPaint > 0) {
      items.push({
        id: 'paint',
        name: 'Wall Paint',
        category: 'wall',
        unit: 'liters',
        quantity: Math.ceil(totalPaint),
        unitPrice: this.prices['paint'],
        totalPrice: Math.ceil(totalPaint) * this.prices['paint'],
      });
    }

    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);

    return {
      name: 'Wall Materials',
      items,
      subtotal,
    };
  }

  /**
   * Estimate floor materials
   */
  private estimateFloors(rooms: RoomData[]): MaterialCategory {
    const items: MaterialItem[] = [];
    const floorAreas: Record<string, number> = {};

    rooms.forEach(room => {
      const floorType = room.floor.floorType;
      if (!floorAreas[floorType]) {
        floorAreas[floorType] = 0;
      }
      floorAreas[floorType] += room.floor.area;
    });

    // Add items for each floor type
    Object.entries(floorAreas).forEach(([type, area]) => {
      const priceKey = `${type}-flooring`;
      const price = this.prices[priceKey] || this.prices['tile-60x60'];

      items.push({
        id: `floor-${type}`,
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} Flooring`,
        category: 'floor',
        unit: 'm²',
        quantity: Math.ceil(area),
        unitPrice: price,
        totalPrice: Math.ceil(area) * price,
      });

      // Subfloor if needed
      if (rooms.some(r => r.floor.hasSubfloor)) {
        items.push({
          id: 'subfloor',
          name: 'Subfloor',
          category: 'floor',
          unit: 'm²',
          quantity: Math.ceil(area),
          unitPrice: this.prices['subfloor'],
          totalPrice: Math.ceil(area) * this.prices['subfloor'],
        });
      }
    });

    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);

    return {
      name: 'Floor Materials',
      items,
      subtotal,
    };
  }

  /**
   * Estimate ceiling materials
   */
  private estimateCeilings(rooms: RoomData[]): MaterialCategory {
    const items: MaterialItem[] = [];
    let totalCeilingArea = 0;

    rooms.forEach(room => {
      totalCeilingArea += room.area;
    });

    // Gypsum boards
    items.push({
      id: 'gypsum-board',
      name: 'Gypsum Board',
      category: 'ceiling',
      unit: 'm²',
      quantity: Math.ceil(totalCeilingArea),
      unitPrice: this.prices['gypsum-board'],
      totalPrice: Math.ceil(totalCeilingArea) * this.prices['gypsum-board'],
    });

    // Ceiling paint
    const paintNeeded = totalCeilingArea * 0.25; // 0.25L per m²
    items.push({
      id: 'ceiling-paint',
      name: 'Ceiling Paint',
      category: 'ceiling',
      unit: 'liters',
      quantity: Math.ceil(paintNeeded),
      unitPrice: this.prices['ceiling-paint'],
      totalPrice: Math.ceil(paintNeeded) * this.prices['ceiling-paint'],
    });

    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);

    return {
      name: 'Ceiling Materials',
      items,
      subtotal,
    };
  }

  /**
   * Calculate wall labor cost
   */
  private calculateWallLabor(rooms: RoomData[]): number {
    let totalWallArea = 0;

    rooms.forEach(room => {
      room.walls.forEach(wall => {
        totalWallArea += wall.length * wall.height;
      });
    });

    return totalWallArea * this.laborRates['wall-construction'];
  }

  /**
   * Calculate floor labor cost
   */
  private calculateFloorLabor(rooms: RoomData[]): number {
    let totalFloorArea = 0;

    rooms.forEach(room => {
      totalFloorArea += room.floor.area;
    });

    return totalFloorArea * this.laborRates['floor-installation'];
  }

  /**
   * Calculate ceiling labor cost
   */
  private calculateCeilingLabor(rooms: RoomData[]): number {
    let totalCeilingArea = 0;

    rooms.forEach(room => {
      totalCeilingArea += room.area;
    });

    return totalCeilingArea * this.laborRates['ceiling-installation'];
  }

  /**
   * Export estimation to CSV
   */
  exportToCSV(estimation: ProjectEstimation): string {
    let csv = 'Category,Item,Unit,Quantity,Unit Price,Total Price\n';

    estimation.categories.forEach(category => {
      category.items.forEach(item => {
        csv += `${category.name},${item.name},${item.unit},${item.quantity},${item.unitPrice},${item.totalPrice}\n`;
      });
    });

    csv += `,,,,Materials Total,${estimation.materialsTotal}\n`;
    csv += `,,,,Labor Total,${estimation.laborTotal}\n`;
    csv += `,,,,Grand Total,${estimation.grandTotal}\n`;

    return csv;
  }

  /**
   * Get estimation summary
   */
  getSummary(estimation: ProjectEstimation): string {
    return `
Project: ${estimation.name}
Total Area: ${estimation.totalArea.toFixed(2)} m²

Materials: $${estimation.materialsTotal.toFixed(2)}
Labor: $${estimation.laborTotal.toFixed(2)}
Grand Total: $${estimation.grandTotal.toFixed(2)}

Breakdown:
${estimation.categories.map(c => `  ${c.name}: $${c.subtotal.toFixed(2)}`).join('\n')}
    `.trim();
  }
}

// Singleton instance
export const materialEstimator = new MaterialEstimator();
export default materialEstimator;
