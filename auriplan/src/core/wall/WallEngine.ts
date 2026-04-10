// ============================================
// Wall Engine - Pure geometric utilities
// ============================================

import type { Wall, Vec2 } from '@auriplan-types';
import { vec2, geometry } from '@core/math/vector';
import { v4 as uuidv4 } from 'uuid';

export class WallEngine {
  /**
   * Calcula o comprimento da parede.
   */
  static getWallLength(wall: Wall): number {
    return vec2.distance(wall.start, wall.end);
  }

  /**
   * Calcula o ângulo da parede em radianos (atan2).
   */
  static getWallAngle(wall: Wall): number {
    return Math.atan2(wall.end[1] - wall.start[1], wall.end[0] - wall.start[0]);
  }

  /**
   * Distância de um ponto até a linha da parede.
   */
  static distancePointToWall(point: Vec2, wall: Wall): number {
    return geometry.distanceToLine(point, wall.start, wall.end);
  }

  /**
   * Projeta um ponto sobre a linha da parede.
   */
  static projectPointOnWall(point: Vec2, wall: Wall): Vec2 {
    return geometry.projectPointOnLine(point, wall.start, wall.end);
  }

  /**
   * Divide uma parede em duas no ponto especificado.
   * Preserva metadata (cópia rasa) para evitar compartilhamento.
   */
  static splitWall(wall: Wall, point: Vec2): [Wall, Wall] {
    const projected = WallEngine.projectPointOnWall(point, wall);

    const wall1: Wall = {
      ...wall,
      id: uuidv4(),
      start: wall.start,
      end: projected,
      metadata: wall.metadata ? { ...wall.metadata } : undefined,
    };

    const wall2: Wall = {
      ...wall,
      id: uuidv4(),
      start: projected,
      end: wall.end,
      metadata: wall.metadata ? { ...wall.metadata } : undefined,
    };

    return [wall1, wall2];
  }

  /**
   * Move um dos vértices da parede para uma nova posição.
   */
  static moveWallVertex(
    wall: Wall,
    vertex: 'start' | 'end',
    newPosition: Vec2
  ): Wall {
    return {
      ...wall,
      [vertex]: newPosition,
    };
  }

  /**
   * Move a parede inteira por um vetor delta.
   */
  static moveEntireWall(wall: Wall, delta: Vec2): Wall {
    return {
      ...wall,
      start: vec2.add(wall.start, delta),
      end: vec2.add(wall.end, delta),
    };
  }

  /**
   * Detecta a interseção real entre duas paredes (segmentos).
   * Retorna o ponto de interseção ou null.
   */
  static intersectWalls(wallA: Wall, wallB: Wall): Vec2 | null {
    const point = geometry.lineIntersection(
      wallA.start,
      wallA.end,
      wallB.start,
      wallB.end
    );

    if (!point) return null;

    // Verifica se o ponto pertence a ambos os segmentos
    const onA = WallEngine.isPointOnSegment(point, wallA.start, wallA.end);
    const onB = WallEngine.isPointOnSegment(point, wallB.start, wallB.end);

    return onA && onB ? point : null;
  }

  /**
   * Aplica snapping de ângulo a um vetor (start → end).
   * angleStep em graus (ex: 45).
   * Retorna o novo ponto final ajustado.
   */
  static snapAngle(start: Vec2, end: Vec2, angleStep: number): Vec2 {
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const length = Math.hypot(dx, dy);

    if (length === 0) return end;

    let angle = Math.atan2(dy, dx);
    const stepRad = (angleStep * Math.PI) / 180;
    const snappedAngle = Math.round(angle / stepRad) * stepRad;

    const newDx = Math.cos(snappedAngle) * length;
    const newDy = Math.sin(snappedAngle) * length;

    return [start[0] + newDx, start[1] + newDy];
  }

  /**
   * Calcula os quatro vértices do retângulo que representa a parede
   * com espessura real. Se metadata.wallOffset existir, o polígono é
   * deslocado perpendicularmente por esse valor.
   */
  static getWallPolygon(wall: Wall): Vec2[] {
    const { start, end, thickness, metadata } = wall;
    const dir = vec2.sub(end, start);
    const length = vec2.length(dir);

    if (length === 0) {
      // Parede degenerada – retorna um retângulo de tamanho mínimo
      const half = thickness / 2;
      return [
        [start[0] - half, start[1] - half],
        [start[0] + half, start[1] - half],
        [start[0] + half, start[1] + half],
        [start[0] - half, start[1] + half],
      ];
    }

    // Vetor unitário da direção da parede
    const unitDir = vec2.normalize(dir);
    // Vetor perpendicular (normal) à parede
    const perp: Vec2 = [-unitDir[1], unitDir[0]];
    const halfThick = thickness / 2;

    // Pontos do centro da parede nas extremidades
    const centerStart = start;
    const centerEnd = end;

    // Expande nas direções perpendicular
    let p1 = vec2.add(centerStart, vec2.scale(perp, halfThick));
    let p2 = vec2.add(centerEnd, vec2.scale(perp, halfThick));
    let p3 = vec2.sub(centerEnd, vec2.scale(perp, halfThick));
    let p4 = vec2.sub(centerStart, vec2.scale(perp, halfThick));

    // Aplica offset perpendicular, se definido
    const offset = metadata?.wallOffset;
    if (typeof offset === 'number') {
      const offsetVec = vec2.scale(perp, offset);
      p1 = vec2.add(p1, offsetVec);
      p2 = vec2.add(p2, offsetVec);
      p3 = vec2.add(p3, offsetVec);
      p4 = vec2.add(p4, offsetVec);
    }

    return [p1, p2, p3, p4];
  }

  /**
   * Detecta todas as paredes conectadas por vértice à parede fornecida.
   * @param walls Lista de todas as paredes
   * @param wall Parede de referência
   * @param tolerance Tolerância para considerar vértices coincidentes
   * @returns Paredes conectadas (excluindo a própria)
   */
  static getConnectedWalls(
    walls: Wall[],
    wall: Wall,
    tolerance: number = 1e-4
  ): Wall[] {
    const result: Wall[] = [];

    for (const other of walls) {
      if (other.id === wall.id) continue;

      // Verifica todas as combinações de vértices
      if (
        vec2.distance(wall.start, other.start) < tolerance ||
        vec2.distance(wall.start, other.end) < tolerance ||
        vec2.distance(wall.end, other.start) < tolerance ||
        vec2.distance(wall.end, other.end) < tolerance
      ) {
        result.push(other);
      }
    }

    return result;
  }

  /**
   * Se o ponto estiver próximo de um endpoint de qualquer parede,
   * retorna esse endpoint. Útil para snap.
   * @param point Ponto a ser testado
   * @param walls Lista de paredes
   * @param tolerance Distância máxima para considerar o snap
   * @returns O endpoint mais próximo (coordenadas) ou null
   */
  static snapToWallEndpoint(
    point: Vec2,
    walls: Wall[],
    tolerance: number
  ): Vec2 | null {
    let bestDist = tolerance;
    let bestPoint: Vec2 | null = null;

    for (const wall of walls) {
      const endpoints: Vec2[] = [wall.start, wall.end];
      for (const ep of endpoints) {
        const dist = vec2.distance(point, ep);
        if (dist < bestDist) {
          bestDist = dist;
          bestPoint = ep;
        }
      }
    }

    return bestPoint;
  }

  /**
   * Força o vetor (start → end) a ser ortogonal (0°, 90°, 180°, 270°).
   * Retorna o novo ponto final ajustado.
   */
  static constrainOrthogonal(start: Vec2, end: Vec2): Vec2 {
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];

    // Se uma das diferenças for muito pequena, força a zero
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (absDx < absDy) {
      // Alinha horizontalmente (dx = 0)
      return [start[0], end[1]];
    } else {
      // Alinha verticalmente (dy = 0)
      return [end[0], start[1]];
    }
  }

  // -------------------------------------------------------------------------
  // Funções auxiliares privadas
  // -------------------------------------------------------------------------

  /**
   * Verifica se um ponto está sobre um segmento de reta.
   */
  private static isPointOnSegment(
    point: Vec2,
    a: Vec2,
    b: Vec2,
    tolerance: number = 1e-6
  ): boolean {
    const cross = (point[0] - a[0]) * (b[1] - a[1]) - (point[1] - a[1]) * (b[0] - a[0]);
    if (Math.abs(cross) > tolerance) return false;

    const dot = (point[0] - a[0]) * (b[0] - a[0]) + (point[1] - a[1]) * (b[1] - a[1]);
    if (dot < -tolerance) return false;

    const squaredLength = (b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2;
    if (dot > squaredLength + tolerance) return false;

    return true;
  }

  // -------------------------------------------------------------------------
  // Novas funções para propagação de junções
  // -------------------------------------------------------------------------

  /**
   * Encontra todas as paredes conectadas a um determinado vértice.
   * @param walls Lista de todas as paredes
   * @param vertex Ponto do vértice
   * @param tolerance Tolerância para considerar coincidência
   * @returns Lista de objetos contendo a parede e qual endpoint (start/end) coincide com o vértice
   */
  static getWallsConnectedToVertex(
    walls: Wall[],
    vertex: Vec2,
    tolerance: number = 0.001
  ): { wall: Wall; endpoint: 'start' | 'end' }[] {
    const result: { wall: Wall; endpoint: 'start' | 'end' }[] = [];

    for (const wall of walls) {
      if (vec2.distance(wall.start, vertex) < tolerance) {
        result.push({ wall, endpoint: 'start' });
      } else if (vec2.distance(wall.end, vertex) < tolerance) {
        result.push({ wall, endpoint: 'end' });
      }
    }

    return result;
  }

  /**
   * Move um vértice de uma parede e propaga a mudança para todas as paredes conectadas naquele vértice.
   * @param walls Lista atual de paredes
   * @param wallId ID da parede cujo vértice está sendo movido
   * @param vertex Qual vértice da parede está sendo movido ('start' ou 'end')
   * @param newPosition Nova posição para o vértice
   * @param tolerance Tolerância para detectar conexões
   * @returns Nova lista de paredes com as alterações aplicadas
   */
  static moveVertexAndPropagate(
    walls: Wall[],
    wallId: string,
    vertex: 'start' | 'end',
    newPosition: Vec2,
    tolerance: number = 0.001
  ): Wall[] {
    // Cria uma cópia para evitar mutação direta
    const updatedWalls = walls.map(w => ({ ...w }));

    const targetWall = updatedWalls.find(w => w.id === wallId);
    if (!targetWall) return walls;

    const originalVertex =
      vertex === 'start' ? targetWall.start : targetWall.end;

    // Encontra todas as paredes conectadas neste vértice
    const connected = WallEngine.getWallsConnectedToVertex(
      updatedWalls,
      originalVertex,
      tolerance
    );

    const visited = new Set<string>();

    for (const connection of connected) {
      const wall = updatedWalls.find(w => w.id === connection.wall.id);
      if (!wall) continue;

      if (visited.has(wall.id)) continue;
      visited.add(wall.id);

      if (connection.endpoint === 'start') {
        wall.start = newPosition;
      } else {
        wall.end = newPosition;
      }
    }

    return updatedWalls;
  }
}
