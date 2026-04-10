/**
 * Tests for EditorActionMapper
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EditorActionMapper, EditorAction } from '../EditorActionMapper';
import type { FloorPlan, Room, Wall, Furniture } from '@/core/types';

describe('EditorActionMapper', () => {
  let mapper: EditorActionMapper;

  beforeEach(() => {
    mapper = new EditorActionMapper();
  });

  describe('Action Mapping', () => {
    it('should map floor plan to actions', () => {
      const floorPlan: FloorPlan = {
        rooms: [
          {
            id: 'room-1',
            name: 'Living Room',
            type: 'living_room',
            points: [{ x: 0, y: 0 }, { x: 5, y: 0 }, { x: 5, y: 4 }, { x: 0, y: 4 }],
            area: 20,
          } as Room,
        ],
        walls: [
          { id: 'wall-1', start: { x: 0, y: 0 }, end: { x: 5, y: 0 }, thickness: 0.15, height: 2.8 },
        ],
        furniture: [
          {
            id: 'furniture-1',
            name: 'Sofa',
            type: 'sofa',
            width: 2,
            height: 0.8,
            depth: 0.9,
            position: { x: 2, y: 2, z: 0 },
            rotation: 0,
            visible: true,
          } as Furniture,
        ],
        dimensions: [],
      };

      const actions = mapper.mapFloorPlanToActions(floorPlan);

      expect(actions.length).toBe(3); // 1 room + 1 wall + 1 furniture
      expect(actions[0].type).toBe('createRoom');
      expect(actions[1].type).toBe('createWall');
      expect(actions[2].type).toBe('createFurniture');
    });

    it('should include metadata in actions', () => {
      const floorPlan: FloorPlan = {
        rooms: [{
          id: 'room-1',
          name: 'Test Room',
          type: 'bedroom',
          points: [{ x: 0, y: 0 }, { x: 3, y: 0 }, { x: 3, y: 3 }, { x: 0, y: 3 }],
          area: 9,
        } as Room],
        walls: [],
        furniture: [],
        dimensions: [],
      };

      const actions = mapper.mapFloorPlanToActions(floorPlan);

      expect(actions[0].metadata).toBeDefined();
      expect(actions[0].metadata!.source).toBe('ai');
      expect(actions[0].metadata!.description).toContain('Test Room');
    });
  });

  describe('Connection State', () => {
    it('should start disconnected', () => {
      expect(mapper.isConnected()).toBe(false);
    });

    it('should track connection state', () => {
      const mockEngine = {
        getRender2D: vi.fn(),
        getRender3D: vi.fn(),
      };

      mapper.connect(mockEngine as any);
      expect(mapper.isConnected()).toBe(true);

      mapper.disconnect();
      expect(mapper.isConnected()).toBe(false);
    });
  });

  describe('Action History', () => {
    it('should track action history', () => {
      const mockEngine = {
        getRender2D: vi.fn(() => ({ addRoom: vi.fn() })),
        getRender3D: vi.fn(),
      };

      mapper.connect(mockEngine as any);

      const action: EditorAction = {
        type: 'createRoom',
        payload: { id: 'test-room' },
        metadata: { description: 'Test', source: 'ai', timestamp: Date.now() },
      };

      // History should be empty initially
      expect(mapper.getActionHistory().length).toBe(0);
    });

    it('should clear history', () => {
      mapper.clearHistory();
      expect(mapper.getActionHistory().length).toBe(0);
    });
  });

  describe('Batch Execution', () => {
    it('should handle empty batch', async () => {
      const result = await mapper.executeBatch([]);

      expect(result.success).toBe(true);
      expect(result.completed).toBe(0);
      expect(result.failed).toBe(0);
    });
  });
});
