// ============================================
// EXPORT ENGINE - Motor de Exportação
// ============================================

import type { Project, Floor, Wall, Room, Furniture } from '@auriplan-types';

export interface ExportOptions {
  format: 'json' | 'obj' | 'png' | 'pdf' | 'svg';
  quality?: 'low' | 'medium' | 'high';
  includeFurniture?: boolean;
  includeMaterials?: boolean;
  scale?: number;
}

export class ExportEngine {
  static exportToJSON(project: Project): string {
    return JSON.stringify(project, null, 2);
  }

  static exportFloorToSVG(floor: Floor, options: { width?: number; height?: number } = {}): string {
    const { width = 800, height = 600 } = options;
    
    let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e0e0e0" stroke-width="0.5"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#grid)"/>`;

    // Render rooms
    floor.rooms.forEach(room => {
      const points = room.points.map(p => `${p[0]},${p[1]}`).join(' ');
      svg += `
  <polygon points="${points}" fill="${room.floorColor}" stroke="${room.wallColor}" stroke-width="2"/>`;
    });

    // Render walls
    floor.walls.forEach(wall => {
      svg += `
  <line x1="${wall.start[0]}" y1="${wall.start[1]}" x2="${wall.end[0]}" y2="${wall.end[1]}" 
        stroke="${wall.color}" stroke-width="${wall.thickness * 10}" stroke-linecap="round"/>`;
    });

    svg += '\n</svg>';
    return svg;
  }

  static generateOBJ(project: Project): string {
    let obj = '# AuriPlan Export\n';
    obj += `# Project: ${project.name}\n`;
    obj += `# Generated: ${new Date().toISOString()}\n\n`;

    let vertexOffset = 1;

    (project.floors ?? []).forEach(floor => {
      obj += `# Floor: ${floor.name}\n`;

      // Walls as boxes
      floor.walls.forEach(wall => {
        const dx = wall.end[0] - wall.start[0];
        const dy = wall.end[1] - wall.start[1];
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        const halfThick = wall.thickness / 2;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        // Wall vertices
        const vertices = [
          [wall.start[0] - halfThick * sin, 0, wall.start[1] + halfThick * cos],
          [wall.start[0] + halfThick * sin, 0, wall.start[1] - halfThick * cos],
          [wall.end[0] + halfThick * sin, 0, wall.end[1] - halfThick * cos],
          [wall.end[0] - halfThick * sin, 0, wall.end[1] + halfThick * cos],
          [wall.start[0] - halfThick * sin, wall.height, wall.start[1] + halfThick * cos],
          [wall.start[0] + halfThick * sin, wall.height, wall.start[1] - halfThick * cos],
          [wall.end[0] + halfThick * sin, wall.height, wall.end[1] - halfThick * cos],
          [wall.end[0] - halfThick * sin, wall.height, wall.end[1] + halfThick * cos],
        ];

        vertices.forEach(v => {
          obj += `v ${v[0].toFixed(4)} ${v[1].toFixed(4)} ${v[2].toFixed(4)}\n`;
        });

        // Faces
        const faces = [
          [1, 2, 3, 4], // bottom
          [5, 8, 7, 6], // top
          [1, 5, 6, 2], // side
          [2, 6, 7, 3], // side
          [3, 7, 8, 4], // side
          [4, 8, 5, 1], // side
        ];

        faces.forEach(face => {
          obj += `f ${face.map(f => f + vertexOffset - 1).join(' ')}\n`;
        });

        vertexOffset += 8;
      });

      // Floor planes for rooms
      floor.rooms.forEach(room => {
        if (room.points.length >= 3) {
          room.points.forEach(p => {
            obj += `v ${p[0].toFixed(4)} 0 ${p[1].toFixed(4)}\n`;
          });

          // Simple triangulation for convex polygons
          for (let i = 2; i < room.points.length; i++) {
            obj += `f ${vertexOffset} ${vertexOffset + i - 1} ${vertexOffset + i}\n`;
          }

          vertexOffset += room.points.length;
        }
      });
    });

    return obj;
  }

  static async exportToPNG(canvas: HTMLCanvasElement, options: { quality?: number } = {}): Promise<Blob> {
    const { quality = 0.9 } = options;
    
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to export PNG'));
        },
        'image/png',
        quality
      );
    });
  }

  static calculateProjectStatistics(project: Project) {
    let totalWallLength = 0;
    let totalRoomArea = 0;
    let totalFurniture = 0;

    (project.floors ?? []).forEach(floor => {
      floor.walls.forEach(wall => {
        const dx = wall.end[0] - wall.start[0];
        const dy = wall.end[1] - wall.start[1];
        totalWallLength += Math.sqrt(dx * dx + dy * dy);
      });

      floor.rooms.forEach(room => {
        totalRoomArea += room.area ?? 0;
      });

      totalFurniture += floor.furniture.length;
    });

    return {
      totalWallLength: Math.round(totalWallLength * 100) / 100,
      totalRoomArea: Math.round(totalRoomArea * 100) / 100,
      totalFurniture,
      floorCount: (project.floors ?? []).length,
    };
  }
}
