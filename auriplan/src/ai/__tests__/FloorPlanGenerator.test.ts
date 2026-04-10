/**
 * Tests for FloorPlanGenerator
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { FloorPlanGenerator } from '../FloorPlanGenerator';
import type { InterpretedCommand } from '../AIService';

describe('FloorPlanGenerator', () => {
  let generator: FloorPlanGenerator;

  beforeEach(() => {
    generator = new FloorPlanGenerator();
  });

  describe('Create House', () => {
    it('should generate a house with multiple rooms', () => {
      const command: InterpretedCommand = {
        intent: 'create',
        target: 'house',
        specifications: {
          count: 2,
          roomType: 'bedroom',
        },
      };

      const result = generator.generateFloorPlan(command);

      expect(result.success).toBe(true);
      expect(result.floorPlan).toBeDefined();
      expect(result.floorPlan!.rooms.length).toBeGreaterThan(0);
      expect(result.floorPlan!.walls.length).toBeGreaterThan(0);
    });
  });

  describe('Create Room', () => {
    it('should generate a living room', () => {
      const command: InterpretedCommand = {
        intent: 'create',
        target: 'room',
        targetType: 'living_room',
        specifications: {
          size: 20,
        },
      };

      const result = generator.generateFloorPlan(command);

      expect(result.success).toBe(true);
      expect(result.floorPlan!.rooms.length).toBe(1);
      expect(result.floorPlan!.rooms[0].type).toBe('living_room');
    });

    it('should generate a kitchen with specified size', () => {
      const command: InterpretedCommand = {
        intent: 'add',
        target: 'room',
        targetType: 'kitchen',
        specifications: {
          size: 12,
        },
      };

      const result = generator.generateFloorPlan(command);

      expect(result.success).toBe(true);
      expect(result.floorPlan!.rooms[0].type).toBe('kitchen');
      expect(result.floorPlan!.rooms[0].area).toBeCloseTo(12, 0);
    });

    it('should generate a bedroom', () => {
      const command: InterpretedCommand = {
        intent: 'create',
        target: 'room',
        targetType: 'bedroom',
        specifications: {},
      };

      const result = generator.generateFloorPlan(command);

      expect(result.success).toBe(true);
      expect(result.floorPlan!.rooms[0].type).toBe('bedroom');
    });
  });

  describe('Create Furniture', () => {
    it('should generate furniture', () => {
      const command: InterpretedCommand = {
        intent: 'add',
        target: 'furniture',
        targetType: 'sofa',
        location: 'sala',
        specifications: {},
      };

      const result = generator.generateFloorPlan(command);

      expect(result.success).toBe(true);
      expect(result.floorPlan!.furniture.length).toBeGreaterThan(0);
    });
  });

  describe('Room Structure', () => {
    it('should generate rooms with 4 points', () => {
      const command: InterpretedCommand = {
        intent: 'create',
        target: 'room',
        targetType: 'bedroom',
        specifications: {},
      };

      const result = generator.generateFloorPlan(command);

      expect(result.success).toBe(true);
      expect(result.floorPlan!.rooms[0].points.length).toBe(4);
    });

    it('should generate walls for each room', () => {
      const command: InterpretedCommand = {
        intent: 'create',
        target: 'room',
        targetType: 'bedroom',
        specifications: {},
      };

      const result = generator.generateFloorPlan(command);

      expect(result.success).toBe(true);
      // Should have 4 walls for a rectangular room
      expect(result.floorPlan!.walls.length).toBe(4);
    });

    it('should assign area to rooms', () => {
      const command: InterpretedCommand = {
        intent: 'create',
        target: 'room',
        targetType: 'living_room',
        specifications: {
          size: 25,
        },
      };

      const result = generator.generateFloorPlan(command);

      expect(result.success).toBe(true);
      expect(result.floorPlan!.rooms[0].area).toBeGreaterThan(0);
    });
  });

  describe('Floor Plan Validation', () => {
    it('should generate valid floor plan structure', () => {
      const command: InterpretedCommand = {
        intent: 'create',
        target: 'house',
        specifications: {
          count: 3,
        },
      };

      const result = generator.generateFloorPlan(command);

      expect(result.success).toBe(true);
      expect(result.floorPlan).toBeDefined();
      expect(Array.isArray(result.floorPlan!.rooms)).toBe(true);
      expect(Array.isArray(result.floorPlan!.walls)).toBe(true);
      expect(Array.isArray(result.floorPlan!.furniture)).toBe(true);
      expect(Array.isArray(result.floorPlan!.dimensions)).toBe(true);
    });
  });
});
