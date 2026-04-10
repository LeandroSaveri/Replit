/**
 * Room Rules for Floor Plan Generator
 * Architectural constraints and best practices
 */

export type RoomType = 
  | 'living_room' 
  | 'bedroom' 
  | 'kitchen' 
  | 'bathroom' 
  | 'dining_room' 
  | 'office' 
  | 'hallway' 
  | 'entryway'
  | 'closet'
  | 'laundry'
  | 'garage'
  | 'balcony';

export interface RoomRule {
  type: RoomType;
  minWidth: number; // meters
  minDepth: number; // meters
  minArea: number; // square meters
  idealWidth: number;
  idealDepth: number;
  ceilingHeight: number;
  naturalLight: 'required' | 'preferred' | 'optional';
  ventilation: 'required' | 'preferred' | 'optional';
  adjacentRooms: RoomType[];
  avoidAdjacent: RoomType[];
}

export const roomRules: Record<RoomType, RoomRule> = {
  living_room: {
    type: 'living_room',
    minWidth: 3.0,
    minDepth: 3.5,
    minArea: 12.0,
    idealWidth: 4.5,
    idealDepth: 5.0,
    ceilingHeight: 2.7,
    naturalLight: 'required',
    ventilation: 'required',
    adjacentRooms: ['dining_room', 'kitchen', 'entryway', 'balcony'],
    avoidAdjacent: ['bathroom', 'laundry'],
  },
  
  bedroom: {
    type: 'bedroom',
    minWidth: 2.7,
    minDepth: 2.7,
    minArea: 7.0,
    idealWidth: 3.5,
    idealDepth: 4.0,
    ceilingHeight: 2.7,
    naturalLight: 'required',
    ventilation: 'required',
    adjacentRooms: ['bathroom', 'closet', 'hallway'],
    avoidAdjacent: ['kitchen', 'living_room'],
  },
  
  kitchen: {
    type: 'kitchen',
    minWidth: 2.4,
    minDepth: 2.4,
    minArea: 5.0,
    idealWidth: 3.0,
    idealDepth: 3.5,
    ceilingHeight: 2.7,
    naturalLight: 'preferred',
    ventilation: 'required',
    adjacentRooms: ['dining_room', 'living_room', 'laundry'],
    avoidAdjacent: ['bedroom', 'bathroom'],
  },
  
  bathroom: {
    type: 'bathroom',
    minWidth: 1.2,
    minDepth: 1.5,
    minArea: 1.8,
    idealWidth: 1.8,
    idealDepth: 2.5,
    ceilingHeight: 2.6,
    naturalLight: 'optional',
    ventilation: 'required',
    adjacentRooms: ['bedroom', 'hallway'],
    avoidAdjacent: ['kitchen', 'living_room', 'dining_room'],
  },
  
  dining_room: {
    type: 'dining_room',
    minWidth: 2.7,
    minDepth: 3.0,
    minArea: 8.0,
    idealWidth: 3.5,
    idealDepth: 4.0,
    ceilingHeight: 2.7,
    naturalLight: 'preferred',
    ventilation: 'preferred',
    adjacentRooms: ['kitchen', 'living_room'],
    avoidAdjacent: ['bathroom', 'laundry'],
  },
  
  office: {
    type: 'office',
    minWidth: 2.4,
    minDepth: 2.7,
    minArea: 6.0,
    idealWidth: 3.0,
    idealDepth: 3.5,
    ceilingHeight: 2.7,
    naturalLight: 'preferred',
    ventilation: 'required',
    adjacentRooms: ['hallway', 'living_room'],
    avoidAdjacent: ['bathroom', 'kitchen'],
  },
  
  hallway: {
    type: 'hallway',
    minWidth: 0.9,
    minDepth: 2.0,
    minArea: 1.8,
    idealWidth: 1.2,
    idealDepth: 3.0,
    ceilingHeight: 2.6,
    naturalLight: 'optional',
    ventilation: 'optional',
    adjacentRooms: ['bedroom', 'bathroom', 'living_room', 'entryway'],
    avoidAdjacent: [],
  },
  
  entryway: {
    type: 'entryway',
    minWidth: 1.2,
    minDepth: 1.5,
    minArea: 1.8,
    idealWidth: 1.5,
    idealDepth: 2.0,
    ceilingHeight: 2.7,
    naturalLight: 'preferred',
    ventilation: 'optional',
    adjacentRooms: ['living_room', 'hallway'],
    avoidAdjacent: ['bedroom', 'bathroom'],
  },
  
  closet: {
    type: 'closet',
    minWidth: 1.0,
    minDepth: 1.2,
    minArea: 1.2,
    idealWidth: 1.5,
    idealDepth: 2.0,
    ceilingHeight: 2.4,
    naturalLight: 'optional',
    ventilation: 'optional',
    adjacentRooms: ['bedroom', 'hallway'],
    avoidAdjacent: ['kitchen', 'bathroom'],
  },
  
  laundry: {
    type: 'laundry',
    minWidth: 1.5,
    minDepth: 1.8,
    minArea: 2.7,
    idealWidth: 2.0,
    idealDepth: 2.5,
    ceilingHeight: 2.6,
    naturalLight: 'optional',
    ventilation: 'required',
    adjacentRooms: ['kitchen', 'bathroom'],
    avoidAdjacent: ['living_room', 'bedroom', 'dining_room'],
  },
  
  garage: {
    type: 'garage',
    minWidth: 2.7,
    minDepth: 5.0,
    minArea: 13.5,
    idealWidth: 3.0,
    idealDepth: 6.0,
    ceilingHeight: 2.4,
    naturalLight: 'optional',
    ventilation: 'required',
    adjacentRooms: ['entryway', 'kitchen'],
    avoidAdjacent: ['bedroom', 'living_room'],
  },
  
  balcony: {
    type: 'balcony',
    minWidth: 1.2,
    minDepth: 2.0,
    minArea: 2.4,
    idealWidth: 1.5,
    idealDepth: 3.0,
    ceilingHeight: 2.4,
    naturalLight: 'required',
    ventilation: 'required',
    adjacentRooms: ['living_room', 'bedroom'],
    avoidAdjacent: ['bathroom', 'kitchen'],
  },
};

// Circulation rules
export const circulationRules = {
  minDoorWidth: 0.8,
  minDoorHeight: 2.1,
  minHallwayWidth: 0.9,
  minStairWidth: 1.0,
  doorSwingClearance: 0.9,
  furnitureClearance: 0.6,
};

// Window rules
export const windowRules = {
  minWindowWidth: 0.6,
  minWindowHeight: 0.9,
  sillHeight: 0.9,
  headerHeight: 2.1,
  minWindowAreaRatio: 0.1, // 10% of floor area
};

// Validation functions
export function validateRoomDimensions(
  type: RoomType,
  width: number,
  depth: number
): { valid: boolean; errors: string[] } {
  const rule = roomRules[type];
  const errors: string[] = [];

  if (width < rule.minWidth) {
    errors.push(`Width ${width}m is less than minimum ${rule.minWidth}m`);
  }
  if (depth < rule.minDepth) {
    errors.push(`Depth ${depth}m is less than minimum ${rule.minDepth}m`);
  }
  if (width * depth < rule.minArea) {
    errors.push(`Area ${width * depth}m² is less than minimum ${rule.minArea}m²`);
  }

  return { valid: errors.length === 0, errors };
}

export function checkRoomAdjacency(
  room1: RoomType,
  room2: RoomType
): { compatible: boolean; reason?: string } {
  const rule1 = roomRules[room1];
  const rule2 = roomRules[room2];

  if (rule1.avoidAdjacent.includes(room2)) {
    return { compatible: false, reason: `${room1} should not be adjacent to ${room2}` };
  }
  if (rule2.avoidAdjacent.includes(room1)) {
    return { compatible: false, reason: `${room2} should not be adjacent to ${room1}` };
  }

  return { compatible: true };
}

export default roomRules;
