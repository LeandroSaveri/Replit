// ============================================================
// FloorPlanGenerator — Gerador Arquitetônico Automático
// Segue normas ABNT NBR 15575, NBR 9050 e boas práticas internacionais
// ============================================================

import type { Vec2, RoomType } from '@auriplan-types';

// ── Room layout unit (before converting to polygons) ─────────
export interface RoomLayout {
  id: string;
  name: string;
  type: RoomType | 'hallway' | 'balcony' | 'garage' | 'utility' | 'office';
  x: number;   // meters from plan origin (top-left)
  y: number;
  w: number;   // width (horizontal)
  d: number;   // depth (vertical)
  floorColor: string;
  wallColor: string;
  area: number;
}

export interface GeneratedFloorPlan {
  title: string;
  description: string;
  totalArea: number;
  footprintW: number;
  footprintD: number;
  rooms: RoomLayout[];
  warnings: string[];
}

// ── Parsed request ─────────────────────────────────────────────
interface ParsedRequest {
  bedrooms: number;
  suites: number;
  bathrooms: number;
  hasAmericanKitchen: boolean;
  hasDiningRoom: boolean;
  hasServiceArea: boolean;
  hasGarage: number;      // number of cars
  hasBalcony: boolean;
  hasOffice: boolean;
  isApartment: boolean;
  isStudio: boolean;
  hasLaundry: boolean;
}

// ── Color palette (architectural visualization) ────────────────
const COLORS = {
  sala:      { floorColor: '#f5e6d0', wallColor: '#d4b896' },
  jantar:    { floorColor: '#f0dfc0', wallColor: '#c9a97e' },
  cozinha:   { floorColor: '#e8e4de', wallColor: '#b8b4a8' },
  quarto:    { floorColor: '#fdf0e0', wallColor: '#e8c89a' },
  banheiro:  { floorColor: '#dceeff', wallColor: '#93c5fd' },
  corredor:  { floorColor: '#f0f0ee', wallColor: '#d1d5db' },
  varanda:   { floorColor: '#e8f5e0', wallColor: '#a8d8a0' },
  garagem:   { floorColor: '#e8e8e8', wallColor: '#b0b0b0' },
  servico:   { floorColor: '#ececec', wallColor: '#c0c0c0' },
  escritorio:{ floorColor: '#e8edf5', wallColor: '#b4c4d4' },
  lavanderia:{ floorColor: '#eff6ff', wallColor: '#bfdbfe' },
};

// ── NLP Parser ─────────────────────────────────────────────────
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ');
}

function extractNumber(text: string, patterns: string[]): number {
  const wordNums: Record<string, number> = {
    um: 1, uma: 1, dois: 2, duas: 2, tres: 3, quatro: 4,
    cinco: 5, seis: 6, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5,
  };
  for (const pat of patterns) {
    const regex = new RegExp(`(${Object.keys(wordNums).join('|')}|\\d+)\\s*${pat}`, 'i');
    const m = text.match(regex);
    if (m) return wordNums[m[1]] ?? parseInt(m[1]) ?? 1;
  }
  return 0;
}

export function parseDescription(text: string): ParsedRequest {
  const t = normalize(text);

  // Studio / kitnet
  const isStudio = /studio|kitnet|kit net|loft/.test(t);
  if (isStudio) {
    return {
      bedrooms: 1, suites: 0, bathrooms: 1,
      hasAmericanKitchen: true, hasDiningRoom: false,
      hasServiceArea: false, hasGarage: 0,
      hasBalcony: /varanda|sacada/.test(t),
      hasOffice: false, isApartment: true, isStudio: true, hasLaundry: false,
    };
  }

  const isApartment = /apart|flat|condomin/.test(t);

  // Bedrooms
  let bedrooms = extractNumber(t, ['quart', 'dormitor', 'suite']);
  if (bedrooms === 0) {
    if (/quart|dormitor/.test(t)) bedrooms = 2;
    else bedrooms = 2;
  }
  bedrooms = Math.min(Math.max(bedrooms, 1), 6);

  // Suites
  let suites = extractNumber(t, ['suit']);
  suites = Math.min(suites, bedrooms);

  // Bathrooms (not counting en-suite)
  let bathrooms = extractNumber(t, ['banheiro', 'wc', 'lavabo']);
  if (bathrooms === 0) bathrooms = suites > 0 ? 1 : 1;
  if (suites > 0 && bathrooms === suites) bathrooms = 1; // ensure at least 1 extra bath

  // Kitchen type
  const hasAmericanKitchen = /american|integrad|abert|gourmet|open.?plan/.test(t);
  const hasDiningRoom = /jantar/.test(t) && !hasAmericanKitchen;

  // Services
  const hasServiceArea = /servico|lavanderia|area de servic|areinha/.test(t);
  const hasLaundry = /lavanderia|area de lavagem/.test(t);

  // Garage
  const garageN = extractNumber(t, ['carro|vaga|garagem']);
  const hasGarage = garageN > 0 ? garageN : /garagem|carro|vaga/.test(t) ? 1 : 0;

  const hasBalcony = /varanda|sacada|terraco/.test(t);
  const hasOffice = /escrit|home.?office|homeoffice|escritorio/.test(t);

  return {
    bedrooms, suites, bathrooms,
    hasAmericanKitchen, hasDiningRoom, hasServiceArea,
    hasGarage, hasBalcony, hasOffice,
    isApartment, isStudio: false, hasLaundry,
  };
}

// ── Unique ID ──────────────────────────────────────────────────
let _id = 0;
function uid() { return `room-${++_id}`; }

// ── Studio layout ─────────────────────────────────────────────
function generateStudioLayout(parsed: ParsedRequest): RoomLayout[] {
  const rooms: RoomLayout[] = [];
  const totalW = 7;
  const totalD = parsed.hasBalcony ? 7 : 5;

  if (parsed.hasBalcony) {
    rooms.push({ id: uid(), name: 'Varanda', type: 'balcony', x: 0, y: 0, w: totalW, d: 2, ...COLORS.varanda, area: 14 });
  }
  const offset = parsed.hasBalcony ? 2 : 0;
  rooms.push({ id: uid(), name: 'Área Principal', type: 'living', x: 0, y: offset, w: totalW, d: 3.5, ...COLORS.sala, area: 24.5 });
  rooms.push({ id: uid(), name: 'Banheiro', type: 'bathroom', x: 0, y: offset + 3.5, w: 2.5, d: 1.5, ...COLORS.banheiro, area: 3.75 });
  rooms.push({ id: uid(), name: 'Closet', type: 'custom' as RoomType, x: 2.5, y: offset + 3.5, w: totalW - 2.5, d: 1.5, ...COLORS.corredor, area: 6.75 });

  return rooms;
}

// ── Main layout generator ─────────────────────────────────────
export function generateFloorPlan(parsed: ParsedRequest): GeneratedFloorPlan {
  if (parsed.isStudio) {
    const rooms = generateStudioLayout(parsed);
    const total = rooms.reduce((s, r) => s + r.area, 0);
    return {
      title: 'Studio',
      description: 'Estúdio open-plan moderno',
      totalArea: Math.round(total),
      footprintW: 7, footprintD: parsed.hasBalcony ? 7 : 5,
      rooms, warnings: [],
    };
  }

  const rooms: RoomLayout[] = [];
  const warnings: string[] = [];

  // ── ABNT minimum dimensions ─────────────────────────────────
  // NBR 15575: quarto ≥ 8m², largura ≥ 2.4m; sala ≥ 10m²; cozinha ≥ 5m²; banheiro ≥ 1.71m²

  // SOCIAL ZONE dimensions
  const socialDepth = parsed.hasAmericanKitchen ? 4.5 : 4.0;

  // Sala width depends on kitchen integration
  let salaW: number;
  if (parsed.hasAmericanKitchen) {
    salaW = 4.5; // open-plan: larger sala
  } else if (parsed.hasDiningRoom) {
    salaW = 4.0;
  } else {
    salaW = 5.0;
  }
  // Ensure minimum 10m²
  if (salaW * socialDepth < 10) salaW = Math.ceil(10 / socialDepth * 10) / 10;

  // Dining room width
  const jantarW = parsed.hasDiningRoom ? 3.0 : 0;

  // Kitchen width (ABNT min 5m²)
  let cozW: number;
  if (parsed.hasAmericanKitchen) {
    cozW = 3.5; // integrated with sala
  } else {
    cozW = 3.0;
    if (cozW * socialDepth < 5) cozW = Math.ceil(5 / socialDepth * 10) / 10;
  }

  // Service area
  const servicoW = parsed.hasServiceArea ? 2.0 : 0;
  const lavanderiaW = parsed.hasLaundry ? 1.8 : 0;

  // Total social width
  const socialW = salaW + jantarW + cozW + servicoW + lavanderiaW;

  // PRIVATE ZONE dimensions
  // Bathroom (ABNT min 1.5m × 1.9m = 2.85m²)
  const bathW = 1.8;
  const bathDepth = 2.2;

  // Bedroom dimensions per type
  const bedroomDepth = 3.5;

  // Suite dimensions
  const suiteW = 3.8;
  const suiteBathW = 1.8;

  // Regular bedroom width
  const bedroomW = 3.2;

  // Extra bathroom (stacked)
  const extraBathW = bathW;

  // Private zone total width
  let privateW = 0;
  // Bathrooms (before bedrooms, or stacked)
  const extraBathrooms = parsed.bathrooms;
  privateW += extraBathrooms * extraBathW;

  // Suites
  privateW += parsed.suites * (suiteW + suiteBathW);

  // Regular bedrooms
  const regularBedrooms = parsed.bedrooms - parsed.suites;
  privateW += regularBedrooms * bedroomW;

  if (parsed.hasOffice) privateW += 3.0;

  // Total width = max of social or private zone
  let totalW = Math.max(socialW, privateW);

  // If private zone wider, expand social rooms proportionally
  const socialScale = totalW / socialW;

  // CORRIDOR
  const corridorH = 1.2;

  // GARAGE — placed as separate wing (left side)
  const garageW = parsed.hasGarage > 0 ? parsed.hasGarage * 2.8 : 0;
  const garageD = parsed.hasGarage > 0 ? 5.5 : 0;

  if (garageW > 0) totalW += garageW;

  // BALCONY (front, if any)
  const balconyD = parsed.hasBalcony ? 2.0 : 0;
  const balconyW = Math.min(totalW, salaW * socialScale + jantarW * socialScale);

  // ── Y positions ─────────────────────────────────────────────
  const balconyY = 0;
  const socialY = balconyD;
  const corridorY = socialY + socialDepth;
  const privateY = corridorY + corridorH;

  // ── PLACE ROOMS ─────────────────────────────────────────────
  let curX = garageW; // start after garage (if any)

  // BALCONY
  if (parsed.hasBalcony) {
    rooms.push({
      id: uid(), name: 'Varanda', type: 'balcony',
      x: garageW, y: balconyY, w: balconyW, d: balconyD,
      ...COLORS.varanda, area: balconyW * balconyD,
    });
  }

  // SALA DE ESTAR
  const finalSalaW = salaW * socialScale;
  rooms.push({
    id: uid(), name: 'Sala de Estar', type: 'living',
    x: curX, y: socialY, w: finalSalaW, d: socialDepth,
    ...COLORS.sala, area: Math.round(finalSalaW * socialDepth * 100) / 100,
  });
  curX += finalSalaW;

  // SALA DE JANTAR (if separate)
  if (parsed.hasDiningRoom && jantarW > 0) {
    const finalJantarW = jantarW * socialScale;
    rooms.push({
      id: uid(), name: 'Sala de Jantar', type: 'dining',
      x: curX, y: socialY, w: finalJantarW, d: socialDepth,
      ...COLORS.jantar, area: Math.round(finalJantarW * socialDepth * 100) / 100,
    });
    curX += finalJantarW;
  }

  // COZINHA
  const finalCozW = cozW * socialScale;
  rooms.push({
    id: uid(), name: 'Cozinha', type: 'kitchen',
    x: curX, y: socialY, w: finalCozW, d: socialDepth,
    ...COLORS.cozinha, area: Math.round(finalCozW * socialDepth * 100) / 100,
  });
  curX += finalCozW;

  // ÁREA DE SERVIÇO / LAVANDERIA
  if (parsed.hasServiceArea && servicoW > 0) {
    const finalServW = servicoW * socialScale;
    rooms.push({
      id: uid(), name: 'Área de Serviço', type: 'utility',
      x: curX, y: socialY, w: finalServW, d: socialDepth,
      ...COLORS.servico, area: Math.round(finalServW * socialDepth * 100) / 100,
    });
    curX += finalServW;
  } else if (parsed.hasLaundry && lavanderiaW > 0) {
    const finalLavW = lavanderiaW * socialScale;
    rooms.push({
      id: uid(), name: 'Lavanderia', type: 'utility',
      x: curX, y: socialY, w: finalLavW, d: socialDepth,
      ...COLORS.lavanderia, area: Math.round(finalLavW * socialDepth * 100) / 100,
    });
    curX += finalLavW;
  }

  // GARAGE (separate wing, left side)
  if (garageW > 0) {
    const label = parsed.hasGarage === 1 ? 'Garagem' : `Garagem (${parsed.hasGarage} vagas)`;
    rooms.push({
      id: uid(), name: label, type: 'garage',
      x: 0, y: socialY, w: garageW, d: garageD,
      ...COLORS.garagem, area: garageW * garageD,
    });
  }

  // CORRIDOR (full width of house)
  rooms.push({
    id: uid(), name: 'Corredor', type: 'hallway',
    x: garageW, y: corridorY, w: totalW - garageW, d: corridorH,
    ...COLORS.corredor, area: Math.round((totalW - garageW) * corridorH * 10) / 10,
  });

  // ── PRIVATE ZONE ──────────────────────────────────────────
  curX = garageW;
  const pvtW = totalW - garageW;

  // Calculate bedrooms to fill pvtW evenly
  // Arrange: [bathrooms stacked] [suites+baths] [bedrooms] [office?]
  // Bathrooms stacked vertically at start

  const halfD = bedroomDepth / Math.max(extraBathrooms, 1);

  // BATHROOMS (stacked vertically at start of private zone)
  if (extraBathrooms > 0) {
    for (let i = 0; i < extraBathrooms; i++) {
      rooms.push({
        id: uid(),
        name: extraBathrooms === 1 ? 'Banheiro' : `Banheiro ${i + 1}`,
        type: 'bathroom',
        x: curX, y: privateY + i * halfD,
        w: bathW, d: halfD,
        ...COLORS.banheiro,
        area: Math.round(bathW * halfD * 100) / 100,
      });
    }
    curX += bathW;
  }

  // SUÍTE(S) + EN-SUITE BATHROOM
  for (let i = 0; i < parsed.suites; i++) {
    const sName = parsed.suites === 1
      ? (i === 0 ? 'Suíte Master' : 'Suíte')
      : (i === 0 ? 'Suíte Master' : `Suíte ${i + 1}`);

    rooms.push({
      id: uid(), name: sName, type: 'bedroom',
      x: curX, y: privateY, w: suiteW, d: bedroomDepth,
      ...COLORS.quarto, area: suiteW * bedroomDepth,
    });
    curX += suiteW;

    rooms.push({
      id: uid(), name: `Banheiro ${sName.includes('Master') ? 'Suíte' : `Suíte ${i + 1}`}`,
      type: 'bathroom',
      x: curX, y: privateY, w: suiteBathW, d: bedroomDepth,
      ...COLORS.banheiro, area: suiteBathW * bedroomDepth,
    });
    curX += suiteBathW;
  }

  // REGULAR BEDROOMS (fill remaining space)
  const remainingW = (totalW - garageW) - (curX - garageW);
  const nbReg = regularBedrooms + (parsed.hasOffice ? 1 : 0);
  const regBedroomW = nbReg > 0
    ? Math.max(bedroomW, remainingW / nbReg)
    : bedroomW;

  for (let i = 0; i < regularBedrooms; i++) {
    const label = regularBedrooms === 1
      ? (parsed.bedrooms === 1 ? 'Quarto' : `Quarto ${i + parsed.suites + 1}`)
      : `Quarto ${i + parsed.suites + 1}`;

    rooms.push({
      id: uid(), name: label, type: 'bedroom',
      x: curX, y: privateY, w: regBedroomW, d: bedroomDepth,
      ...COLORS.quarto, area: Math.round(regBedroomW * bedroomDepth * 100) / 100,
    });
    curX += regBedroomW;
  }

  // ESCRITÓRIO / HOME-OFFICE
  if (parsed.hasOffice) {
    rooms.push({
      id: uid(), name: 'Escritório', type: 'office',
      x: curX, y: privateY, w: regBedroomW, d: bedroomDepth,
      ...COLORS.escritorio, area: Math.round(regBedroomW * bedroomDepth * 100) / 100,
    });
    curX += regBedroomW;
  }

  // Validate minimum dimensions
  for (const room of rooms) {
    if (room.type === 'bedroom' && room.area < 8) {
      warnings.push(`${room.name}: área abaixo do mínimo ABNT (8m²). Considere ampliar.`);
    }
    if (room.type === 'bathroom' && room.area < 2.5) {
      warnings.push(`${room.name}: área abaixo do mínimo recomendado. Considere ampliar.`);
    }
  }

  if (parsed.bedrooms >= 4 && parsed.bathrooms < 2) {
    warnings.push('Para 4+ quartos, recomenda-se pelo menos 2 banheiros (ABNT/boas práticas).');
  }

  const totalArea = rooms.reduce((s, r) => s + r.area, 0);
  const footprintD = balconyD + socialDepth + corridorH + bedroomDepth;

  // ── Generate title ─────────────────────────────────────────
  const parts: string[] = [];
  if (parsed.bedrooms === 1) parts.push('1 Quarto');
  else if (parsed.suites === parsed.bedrooms) parts.push(`${parsed.bedrooms} Suítes`);
  else {
    if (parsed.suites > 0) parts.push(`${parsed.suites} Suíte${parsed.suites > 1 ? 's' : ''}`);
    const reg = parsed.bedrooms - parsed.suites;
    if (reg > 0) parts.push(`${reg} Quarto${reg > 1 ? 's' : ''}`);
  }
  if (parsed.hasAmericanKitchen) parts.push('Cozinha Americana');
  if (parsed.hasGarage) parts.push(`Garagem`);
  if (parsed.isApartment) parts.push('Apartamento');

  return {
    title: `Planta ${parts.slice(0, 2).join(' + ')}`,
    description: generateDescription(parsed),
    totalArea: Math.round(totalArea),
    footprintW: Math.round(totalW * 10) / 10,
    footprintD: Math.round(footprintD * 10) / 10,
    rooms,
    warnings,
  };
}

function generateDescription(parsed: ParsedRequest): string {
  const parts: string[] = [];
  if (parsed.isStudio) return 'Estúdio open-plan moderno com banheiro e closet';
  if (parsed.bedrooms > 0) {
    const s = parsed.suites > 0 ? ` (${parsed.suites} suíte${parsed.suites > 1 ? 's' : ''})` : '';
    parts.push(`${parsed.bedrooms} quarto${parsed.bedrooms > 1 ? 's' : ''}${s}`);
  }
  if (parsed.hasAmericanKitchen) parts.push('sala americana');
  else {
    parts.push('sala de estar');
    if (parsed.hasDiningRoom) parts.push('sala de jantar');
    parts.push('cozinha');
  }
  if (parsed.bathrooms > 0) parts.push(`${parsed.bathrooms} banheiro${parsed.bathrooms > 1 ? 's' : ''}`);
  if (parsed.hasServiceArea) parts.push('área de serviço');
  if (parsed.hasGarage > 0) parts.push(`garagem ${parsed.hasGarage > 1 ? `(${parsed.hasGarage} vagas)` : ''}`);
  if (parsed.hasBalcony) parts.push('varanda');
  if (parsed.hasOffice) parts.push('escritório');
  return parts.join(', ');
}

// ── Apply plan to store ─────────────────────────────────────────
import { useEditorStore } from '@store/editorStore';

export function applyFloorPlan(plan: GeneratedFloorPlan): void {
  // Center plan at origin
  const cx = plan.footprintW / 2;
  const cy = plan.footprintD / 2;

  plan.rooms.forEach(room => {
    const pts: Vec2[] = [
      [room.x - cx, -(room.y - cy)],
      [room.x + room.w - cx, -(room.y - cy)],
      [room.x + room.w - cx, -(room.y + room.d - cy)],
      [room.x - cx, -(room.y + room.d - cy)],
    ];

    const s1 = useEditorStore.getState();
    const scene1 = s1.scenes.find(sc => sc.id === s1.currentSceneId);
    const prevCount = scene1?.rooms.length ?? 0;

    s1.addRoom(pts);

    const s2 = useEditorStore.getState();
    const scene2 = s2.scenes.find(sc => sc.id === s2.currentSceneId);
    const newRoom = scene2?.rooms[prevCount];
    if (newRoom) {
      s2.updateRoom(newRoom.id, {
        name: room.name,
        type: room.type as RoomType,
        wallColor: room.wallColor,
        floorColor: room.floorColor,
      });
    }
  });

  // Generate walls for all rooms
  plan.rooms.forEach(room => {
    const cx = plan.footprintW / 2;
    const cy = plan.footprintD / 2;
    const pts: Vec2[] = [
      [room.x - cx, -(room.y - cy)],
      [room.x + room.w - cx, -(room.y - cy)],
      [room.x + room.w - cx, -(room.y + room.d - cy)],
      [room.x - cx, -(room.y + room.d - cy)],
    ];
    useEditorStore.getState().createWallsFromPolygon(pts);
  });
}
