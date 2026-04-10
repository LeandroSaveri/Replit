// ============================================================
// Floor Plan Templates — 5 plantas 2D prontas
// Coordenadas em metros, eixo y para cima (padrão do editor)
// ============================================================

import type { Vec2 } from '@auriplan-types';

export interface TemplateWall {
  start: Vec2;
  end: Vec2;
}

export interface FloorPlanTemplate {
  id: string;
  name: string;
  description: string;
  area: number;
  roomCount: number;
  badge?: string;
  walls: TemplateWall[];
  defaultProjectName: string;
}

// Studio — 35m² (7x5m)
const studioWalls: TemplateWall[] = [
  // Outer perimeter
  { start: [0, 0], end: [7, 0] },
  { start: [7, 0], end: [7, 5] },
  { start: [7, 5], end: [0, 5] },
  { start: [0, 5], end: [0, 0] },
  // Bathroom partition (bottom-right, 2x2)
  { start: [5, 0], end: [5, 2] },
  { start: [5, 2], end: [7, 2] },
  // Kitchen counter zone
  { start: [0, 3.5], end: [3, 3.5] },
];

// Apartamento 1 Quarto — 50m² (10x5m)
const apt1BRWalls: TemplateWall[] = [
  // Outer
  { start: [0, 0], end: [10, 0] },
  { start: [10, 0], end: [10, 5] },
  { start: [10, 5], end: [0, 5] },
  { start: [0, 5], end: [0, 0] },
  // Bedroom divider
  { start: [6, 0], end: [6, 5] },
  // Bathroom inside bedroom (bottom section)
  { start: [6, 2.5], end: [10, 2.5] },
  // Kitchen divider inside living
  { start: [0, 3.2], end: [4, 3.2] },
];

// Apartamento 2 Quartos — 65m² (10x6.5m)
const apt2BRWalls: TemplateWall[] = [
  // Outer
  { start: [0, 0], end: [10, 0] },
  { start: [10, 0], end: [10, 6.5] },
  { start: [10, 6.5], end: [0, 6.5] },
  { start: [0, 6.5], end: [0, 0] },
  // Main left/right divider
  { start: [6, 0], end: [6, 6.5] },
  // Living / kitchen divider
  { start: [0, 3.8], end: [6, 3.8] },
  // Bedroom separator
  { start: [6, 3.2], end: [10, 3.2] },
  // Bathroom between bedrooms
  { start: [6, 1.5], end: [8.5, 1.5] },
  { start: [8.5, 0], end: [8.5, 1.5] },
];

// Casa 2 Quartos — 80m² (10x8m)
const house2BRWalls: TemplateWall[] = [
  // Outer
  { start: [0, 0], end: [10, 0] },
  { start: [10, 0], end: [10, 8] },
  { start: [10, 8], end: [0, 8] },
  { start: [0, 8], end: [0, 0] },
  // Main horizontal floor divider
  { start: [0, 5], end: [10, 5] },
  // Kitchen / Living separator (ground floor)
  { start: [5, 0], end: [5, 5] },
  // Bedroom separator (upper floor)
  { start: [5, 5], end: [5, 8] },
  // Bathroom (upper left, 2x2.5)
  { start: [0, 6.5], end: [2.5, 6.5] },
  { start: [2.5, 5], end: [2.5, 6.5] },
  // Bathroom (upper right, 2x1.5)
  { start: [8, 5], end: [8, 6.5] },
  { start: [8, 6.5], end: [10, 6.5] },
];

// Casa 3 Quartos — 120m² (12x10m)
const house3BRWalls: TemplateWall[] = [
  // Outer
  { start: [0, 0], end: [12, 0] },
  { start: [12, 0], end: [12, 10] },
  { start: [12, 10], end: [0, 10] },
  { start: [0, 10], end: [0, 0] },
  // Main floor divider (ground / upper)
  { start: [0, 6], end: [12, 6] },
  // Ground floor: Kitchen/Living separator
  { start: [7, 0], end: [7, 6] },
  // Ground floor: Dining/Kitchen separator
  { start: [7, 3.5], end: [12, 3.5] },
  // Upper floor: bedroom dividers
  { start: [4, 6], end: [4, 10] },
  { start: [8, 6], end: [8, 10] },
  // Upper floor: bathroom/hall separator
  { start: [4, 8], end: [8, 8] },
  // Service corridor
  { start: [0, 8], end: [4, 8] },
];

export const FLOOR_PLAN_TEMPLATES: FloorPlanTemplate[] = [
  {
    id: 'studio',
    name: 'Studio',
    description: 'Espaço open-plan moderno com zona de estar, cozinha integrada e banheiro',
    area: 35,
    roomCount: 1,
    badge: 'Popular',
    walls: studioWalls,
    defaultProjectName: 'Studio Moderno',
  },
  {
    id: 'apt-1br',
    name: 'Apartamento 1 Quarto',
    description: 'Layout funcional com sala/cozinha integrada, 1 suíte e banheiro',
    area: 50,
    roomCount: 2,
    walls: apt1BRWalls,
    defaultProjectName: 'Apartamento 1 Quarto',
  },
  {
    id: 'apt-2br',
    name: 'Apartamento 2 Quartos',
    description: 'Apartamento espaçoso com 2 quartos, sala ampla e cozinha separada',
    area: 65,
    roomCount: 4,
    badge: 'Mais Vendido',
    walls: apt2BRWalls,
    defaultProjectName: 'Apartamento 2 Quartos',
  },
  {
    id: 'house-2br',
    name: 'Casa 2 Quartos',
    description: 'Casa térrea com sala/cozinha integrada, 2 quartos e 2 banheiros',
    area: 80,
    roomCount: 5,
    walls: house2BRWalls,
    defaultProjectName: 'Casa 2 Quartos',
  },
  {
    id: 'house-3br',
    name: 'Casa 3 Quartos',
    description: 'Casa espaçosa com living, cozinha/área de serviço, 3 quartos e dependências',
    area: 120,
    roomCount: 7,
    walls: house3BRWalls,
    defaultProjectName: 'Casa 3 Quartos',
  },
];

// ── SVG Floor Plan Preview ─────────────────────────────────
// Gera um SVG miniatura a partir das paredes do template
export function generateFloorPlanSVG(
  walls: TemplateWall[],
  width = 200,
  height = 140,
  padding = 12,
): string {
  if (walls.length === 0) return '';

  const allX = walls.flatMap(w => [w.start[0], w.end[0]]);
  const allY = walls.flatMap(w => [w.start[1], w.end[1]]);
  const minX = Math.min(...allX);
  const maxX = Math.max(...allX);
  const minY = Math.min(...allY);
  const maxY = Math.max(...allY);

  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;

  const drawW = width - padding * 2;
  const drawH = height - padding * 2;
  const scaleX = drawW / rangeX;
  const scaleY = drawH / rangeY;
  const s = Math.min(scaleX, scaleY);

  // Center the drawing
  const offsetX = padding + (drawW - rangeX * s) / 2;
  const offsetY = padding + (drawH - rangeY * s) / 2;

  const toSVG = (wx: number, wy: number) => ({
    x: offsetX + (wx - minX) * s,
    y: height - offsetY - (wy - minY) * s, // flip y
  });

  // Fill the outer polygon (first 4 walls = outer rectangle)
  const outerPts = [
    toSVG(walls[0].start[0], walls[0].start[1]),
    toSVG(walls[1].start[0], walls[1].start[1]),
    toSVG(walls[2].start[0], walls[2].start[1]),
    toSVG(walls[3].start[0], walls[3].start[1]),
  ];
  const polyPoints = outerPts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  const lines = walls.map((w, i) => {
    const p1 = toSVG(w.start[0], w.start[1]);
    const p2 = toSVG(w.end[0], w.end[1]);
    const isOuter = i < 4;
    return `<line x1="${p1.x.toFixed(1)}" y1="${p1.y.toFixed(1)}" x2="${p2.x.toFixed(1)}" y2="${p2.y.toFixed(1)}" stroke="${isOuter ? '#94a3b8' : '#64748b'}" stroke-width="${isOuter ? 2.5 : 1.5}" stroke-linecap="round"/>`;
  }).join('\n  ');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <polygon points="${polyPoints}" fill="#1e293b" opacity="0.6"/>
  ${lines}
</svg>`;
}
