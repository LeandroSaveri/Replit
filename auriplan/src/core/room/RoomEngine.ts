// ============================================
// Room Engine - Room detection and management
// ============================================
// NOTA: A detecção de cômodos foi delegada para RoomDetectionEngine (pipeline canônico).
// Esta classe mantém apenas gerenciamento de estado (compatibilidade).

import type { Room, Wall, Vec2 } from '@auriplan-types';
import { vec2, geometry } from '@core/math/vector';
import { v4 as uuidv4 } from 'uuid';
import { RoomDetection } from '@core/room/RoomDetectionEngine';
import { buildGraph } from '@core/wall/WallGraph';

export interface RoomCreateOptions {
  points: Vec2[];
  name?: string;
  metadata?: Record<string, any>;
}

export interface RoomDetectionResult {
  rooms: Room[];
}

export class RoomEngine {
  private rooms: Map<string, Room> = new Map();
  private tolerance: number = 0.01;

  constructor(rooms: Room[] = []) {
    rooms.forEach(room => this.rooms.set(room.id, room));
  }

  // ==================== MÉTODOS ESTÁTICOS (Puros) ====================

  /**
   * Constrói um grafo de adjacência entre vértices únicos a partir das paredes.
   * Mantido para compatibilidade, mas não é mais usado internamente.
   */
  static buildGraphFromWalls(walls: Wall[]): Map<string, Vec2[]> {
    const tolerance = 1e-6;
    const pointMap = new Map<string, Vec2>();
    const getKey = (p: Vec2) => {
      const x = Math.round(p[0] / tolerance) * tolerance;
      const y = Math.round(p[1] / tolerance) * tolerance;
      return `${x},${y}`;
    };

    for (const wall of walls) {
      const keyStart = getKey(wall.start);
      const keyEnd = getKey(wall.end);
      if (!pointMap.has(keyStart)) pointMap.set(keyStart, [wall.start[0], wall.start[1]]);
      if (!pointMap.has(keyEnd)) pointMap.set(keyEnd, [wall.end[0], wall.end[1]]);
    }

    const graph = new Map<string, Vec2[]>();
    for (const wall of walls) {
      const startKey = getKey(wall.start);
      const endKey = getKey(wall.end);
      const startPoint = pointMap.get(startKey)!;
      const endPoint = pointMap.get(endKey)!;

      if (!graph.has(startKey)) graph.set(startKey, []);
      if (!graph.has(endKey)) graph.set(endKey, []);

      const startNeighbors = graph.get(startKey)!;
      if (!startNeighbors.some(p => vec2.distance(p, endPoint) < tolerance)) {
        startNeighbors.push(endPoint);
      }
      const endNeighbors = graph.get(endKey)!;
      if (!endNeighbors.some(p => vec2.distance(p, startPoint) < tolerance)) {
        endNeighbors.push(startPoint);
      }
    }
    return graph;
  }

  /**
   * Encontra todos os loops fechados (polígonos) no grafo de paredes.
   * @deprecated Use RoomDetectionEngine diretamente.
   */
  static findClosedLoops(walls: Wall[]): Vec2[][] {
    // Delega para a implementação canônica (via grafo)
    const graph = buildGraph(walls);
    const rooms = RoomDetection.detectRooms(graph, walls);
    return rooms.map(r => r.points);
  }

  /**
   * Normaliza um loop: garante ordem anti‑horária e ponto de início consistente.
   */
  static normalizeLoop(points: Vec2[]): Vec2[] {
    if (points.length < 3) return points;

    let normalized = RoomEngine.isClockwise(points) ? [...points].reverse() : [...points];

    let minIndex = 0;
    for (let i = 1; i < normalized.length; i++) {
      const current = normalized[i];
      const candidate = normalized[minIndex];
      if (
        current[1] < candidate[1] ||
        (Math.abs(current[1] - candidate[1]) < 1e-6 && current[0] < candidate[0])
      ) {
        minIndex = i;
      }
    }
    if (minIndex !== 0) {
      normalized = [...normalized.slice(minIndex), ...normalized.slice(0, minIndex)];
    }
    return normalized;
  }

  /**
   * Calcula a área de um polígono (Shoelace).
   */
  static calculateArea(points: Vec2[]): number {
    if (points.length < 3) return 0;
    let sum = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      sum += points[i][0] * points[j][1] - points[j][0] * points[i][1];
    }
    return Math.abs(sum) / 2;
  }

  /**
   * Calcula o perímetro de um polígono.
   */
  static calculatePerimeter(points: Vec2[]): number {
    if (points.length < 2) return 0;
    let perimeter = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      perimeter += vec2.distance(points[i], points[j]);
    }
    return perimeter;
  }

  /**
   * Função principal: constrói cômodos a partir das paredes.
   * Agora delega para RoomDetectionEngine (fonte canônica).
   */
  static buildRoomsFromWalls(walls: Wall[]): Room[] {
    const graph = buildGraph(walls);
    return RoomDetection.detectRooms(graph, walls);
  }

  /**
   * Determina se um polígono está orientado no sentido horário.
   */
  static isClockwise(points: Vec2[]): boolean {
    let sum = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      sum += (points[j][0] - points[i][0]) * (points[j][1] + points[i][1]);
    }
    return sum > 0;
  }

  /**
   * Remove loops duplicados após normalização.
   */
  static removeDuplicateLoops(loops: Vec2[][]): Vec2[][] {
    const seen = new Set<string>();
    const unique: Vec2[][] = [];
    for (const loop of loops) {
      const normalized = RoomEngine.normalizeLoop(loop);
      const key = normalized.map(p => `${p[0]},${p[1]}`).join('|');
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(normalized);
      }
    }
    return unique;
  }

  // ==================== MÉTODOS PRIVADOS AUXILIARES ====================

  /**
   * Normaliza paredes para vértices únicos e arestas (índices).
   * Retorna: vértices (Vec2[]), arestas ([u,v][]), e mapeamento vértice -> componente.
   */
  private static normalizeWallsToGraph(
    walls: Wall[],
    tolerance: number
  ): { vertices: Vec2[]; edges: [number, number][]; componentMap: Map<number, number> } {
    const pointMap = new Map<string, number>();
    const vertices: Vec2[] = [];
    const edges: [number, number][] = [];

    const getKey = (p: Vec2) => {
      const x = Math.round(p[0] / tolerance) * tolerance;
      const y = Math.round(p[1] / tolerance) * tolerance;
      return `${x},${y}`;
    };

    for (const wall of walls) {
      const startKey = getKey(wall.start);
      const endKey = getKey(wall.end);
      let u: number, v: number;

      if (pointMap.has(startKey)) {
        u = pointMap.get(startKey)!;
      } else {
        u = vertices.length;
        pointMap.set(startKey, u);
        vertices.push([wall.start[0], wall.start[1]]);
      }

      if (pointMap.has(endKey)) {
        v = pointMap.get(endKey)!;
      } else {
        v = vertices.length;
        pointMap.set(endKey, v);
        vertices.push([wall.end[0], wall.end[1]]);
      }

      if (u !== v) {
        edges.push([u, v]);
      }
    }

    const parent = Array.from({ length: vertices.length }, (_, i) => i);
    const find = (x: number): number => {
      if (parent[x] !== x) parent[x] = find(parent[x]);
      return parent[x];
    };
    const union = (a: number, b: number) => {
      const ra = find(a);
      const rb = find(b);
      if (ra !== rb) parent[rb] = ra;
    };
    for (const [u, v] of edges) union(u, v);
    const componentMap = new Map<number, number>();
    for (let i = 0; i < vertices.length; i++) {
      componentMap.set(i, find(i));
    }

    return { vertices, edges, componentMap };
  }

  /**
   * Ordena os vizinhos de cada vértice por ângulo polar (anti‑horário).
   */
  private static sortNeighborsByAngle(adj: number[][], vertices: Vec2[]): number[][] {
    const sorted = adj.map((neighbors, i) => {
      const origin = vertices[i];
      return [...neighbors].sort((a, b) => {
        const angleA = Math.atan2(vertices[a][1] - origin[1], vertices[a][0] - origin[0]);
        const angleB = Math.atan2(vertices[b][1] - origin[1], vertices[b][0] - origin[0]);
        return angleA - angleB;
      });
    });
    return sorted;
  }

  // ==================== MÉTODOS DE INSTÂNCIA (Gerenciamento) ====================

  create(options: RoomCreateOptions): Room {
    const area = RoomEngine.calculateArea(options.points);
    const perimeter = RoomEngine.calculatePerimeter(options.points);
    const room: Room = {
      id: uuidv4(),
      points: options.points.map(p => [...p]),
      area,
      perimeter,
      name: options.name ?? 'Room',
      metadata: options.metadata || {},
    };
    this.rooms.set(room.id, room);
    return room;
  }

  get(id: string): Room | undefined {
    return this.rooms.get(id);
  }

  getAll(): Room[] {
    return Array.from(this.rooms.values());
  }

  update(id: string, updates: Partial<Room>): Room | null {
    const room = this.rooms.get(id);
    if (!room) return null;
    const updated = { ...room, ...updates };
    if (updates.points) {
      updated.area = RoomEngine.calculateArea(updated.points);
      updated.perimeter = RoomEngine.calculatePerimeter(updated.points);
    }
    this.rooms.set(id, updated);
    return updated;
  }

  delete(id: string): boolean {
    return this.rooms.delete(id);
  }

  detectRooms(walls: Wall[]): RoomDetectionResult {
    const rooms = RoomEngine.buildRoomsFromWalls(walls);
    return { rooms };
  }

  autoDetect(walls: Wall[]): Room[] {
    const { rooms } = this.detectRooms(walls);
    this.rooms.clear();
    rooms.forEach(room => this.rooms.set(room.id, room));
    return rooms;
  }

  findRoomAtPoint(point: Vec2): Room | undefined {
    return this.getAll().find(room => geometry.pointInPolygon(point, room.points));
  }

  clear(): void {
    this.rooms.clear();
  }

  toArray(): Room[] {
    return this.getAll();
  }

  fromArray(rooms: Room[]): void {
    this.rooms.clear();
    rooms.forEach(room => this.rooms.set(room.id, room));
  }
}
