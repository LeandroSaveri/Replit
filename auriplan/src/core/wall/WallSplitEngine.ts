// ============================================
// WALL SPLIT ENGINE - Divisão de Paredes
// ============================================

import type { Wall, Vec2 } from '@auriplan-types';
import { v4 as uuidv4 } from 'uuid';
import { EPS, GEOM_TOL, MIN_WALL_LENGTH } from '@core/geometry/geometryConstants';

// ============================================
// TIPOS
// ============================================

export interface SplitResult {
  /** Lista completa de paredes após a operação de divisão */
  updatedWalls: Wall[];
  /** IDs das paredes removidas durante a operação */
  removedWallIds: string[];
}

// ============================================
// FUNÇÕES AUXILIARES GEOMÉTRICAS
// ============================================

/**
 * Calcula a distância euclidiana entre dois pontos
 */
function distance(a: Vec2, b: Vec2): number {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return Math.hypot(dx, dy);
}

/**
 * Produto vetorial (z-component) entre dois vetores (a->b e a->c)
 * Usado para determinar orientação
 */
function cross(a: Vec2, b: Vec2, c: Vec2): number {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}

/**
 * Verifica se o ponto p está dentro do segmento de a até b (incluindo extremidades)
 * Usa EPS para decisões de alinhamento.
 */
function isPointOnSegment(p: Vec2, a: Vec2, b: Vec2): boolean {
  const crossVal = cross(a, b, p);
  if (Math.abs(crossVal) > EPS) return false;

  const dot = (p[0] - a[0]) * (b[0] - a[0]) + (p[1] - a[1]) * (b[1] - a[1]);
  if (dot < -EPS) return false;

  const squaredLen = (b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2;
  if (dot > squaredLen + EPS) return false;

  return true;
}

/**
 * Calcula o ponto de interseção entre dois segmentos (a1-a2 e b1-b2)
 * Retorna null se não houver interseção ou se forem colineares (incluindo sobreposição).
 * Interseções apenas em extremidades NÃO são consideradas (pois já são nós do grafo).
 */
function segmentIntersection(a1: Vec2, a2: Vec2, b1: Vec2, b2: Vec2): Vec2 | null {
  const d1 = cross(b1, b2, a1);
  const d2 = cross(b1, b2, a2);
  const d3 = cross(a1, a2, b1);
  const d4 = cross(a1, a2, b2);

  // Verifica se os segmentos se cruzam internamente (não nas extremidades)
  const crosses = ((d1 > EPS && d2 < -EPS) || (d1 < -EPS && d2 > EPS)) &&
                  ((d3 > EPS && d4 < -EPS) || (d3 < -EPS && d4 > EPS));

  if (!crosses) return null;

  // Calcula o ponto de interseção usando interpolação linear
  const t = d1 / (d1 - d2);
  const ix = a1[0] + t * (a2[0] - a1[0]);
  const iy = a1[1] + t * (a2[1] - a1[1]);
  const point: Vec2 = [ix, iy];

  // Verifica se o ponto é finito
  if (!Number.isFinite(ix) || !Number.isFinite(iy)) return null;

  return point;
}

/**
 * Cria uma nova parede copiando propriedades da original, mas com start/end fornecidos.
 * Garante que a nova parede tenha comprimento >= MIN_WALL_LENGTH.
 * Realiza clonagem profunda dos objetos aninhados para evitar efeitos colaterais.
 */
function createWallFromSegment(original: Wall, start: Vec2, end: Vec2): Wall {
  const len = distance(start, end);
  if (len < MIN_WALL_LENGTH) {
    throw new Error(`Cannot create wall with length ${len} < MIN_WALL_LENGTH (${MIN_WALL_LENGTH})`);
  }

  // Clonagem profunda de objetos aninhados
  const clonedConnections = original.connections
    ? { start: [...original.connections.start], end: [...original.connections.end] }
    : undefined;

  return {
    ...original,
    id: uuidv4(),
    start: [start[0], start[1]],
    end: [end[0], end[1]],
    connections: clonedConnections,
    roomIds: original.roomIds ? [...original.roomIds] : undefined,
    openingIds: original.openingIds ? [...original.openingIds] : undefined,
    metadata: original.metadata ? { ...original.metadata } : undefined,
  };
}

// ============================================
// FUNÇÃO PRINCIPAL: splitWallAtPoint
// ============================================

/**
 * Divide uma parede em duas no ponto especificado.
 *
 * @param walls - Lista atual de paredes
 * @param wallId - ID da parede a ser dividida
 * @param point - Ponto de divisão (deve estar sobre a parede)
 * @returns Resultado contendo as paredes atualizadas e o ID da parede removida
 */
export function splitWallAtPoint(
  walls: Wall[],
  wallId: string,
  point: Vec2
): SplitResult {
  const wallIndex = walls.findIndex(w => w.id === wallId);
  if (wallIndex === -1) {
    return { updatedWalls: walls, removedWallIds: [] };
  }

  const originalWall = walls[wallIndex];

  // Verifica se o ponto está realmente sobre a parede (com tolerância)
  if (!isPointOnSegment(point, originalWall.start, originalWall.end)) {
    return { updatedWalls: walls, removedWallIds: [] };
  }

  const distToStart = distance(point, originalWall.start);
  const distToEnd = distance(point, originalWall.end);
  const wallLength = distance(originalWall.start, originalWall.end);

  // Não divide se o ponto estiver muito próximo das extremidades (já conectado)
  if (distToStart < GEOM_TOL || distToEnd < GEOM_TOL || distToStart > wallLength - GEOM_TOL) {
    return { updatedWalls: walls, removedWallIds: [] };
  }

  // Não divide se algum dos novos segmentos for menor que MIN_WALL_LENGTH
  if (distToStart < MIN_WALL_LENGTH || distToEnd < MIN_WALL_LENGTH) {
    return { updatedWalls: walls, removedWallIds: [] };
  }

  try {
    const newWall1 = createWallFromSegment(originalWall, originalWall.start, point);
    const newWall2 = createWallFromSegment(originalWall, point, originalWall.end);

    const newWalls = [...walls];
    newWalls.splice(wallIndex, 1, newWall1, newWall2);

    return {
      updatedWalls: newWalls,
      removedWallIds: [originalWall.id],
    };
  } catch (err) {
    // Se a criação falhar (ex: comprimento muito pequeno), retorna sem divisão
    console.warn(`splitWallAtPoint failed for wall ${wallId}:`, err);
    return { updatedWalls: walls, removedWallIds: [] };
  }
}

// ============================================
// FUNÇÃO AVANÇADA: splitWallsAtIntersections
// ============================================

/**
 * Divide automaticamente todas as paredes que se cruzam (apenas interseções internas).
 * Para cada interseção entre duas paredes, ambas são divididas no ponto de interseção.
 * Isso garante que, após a operação, não existam cruzamentos não tratados.
 *
 * @param walls - Lista inicial de paredes
 * @returns Lista de paredes após todas as divisões
 */
export function splitWallsAtIntersections(walls: Wall[]): Wall[] {
  let currentWalls = [...walls];
  let anySplit = true;
  let iterations = 0;
  const MAX_ITERATIONS = 100; // Evita loops infinitos

  while (anySplit && iterations < MAX_ITERATIONS) {
    anySplit = false;
    iterations++;

    // Para cada par de paredes
    for (let i = 0; i < currentWalls.length; i++) {
      const wallA = currentWalls[i];
      if (!wallA) continue;

      for (let j = i + 1; j < currentWalls.length; j++) {
        const wallB = currentWalls[j];
        if (!wallB) continue;

        // Calcula interseção (apenas cruzamentos internos)
        const intersection = segmentIntersection(
          wallA.start, wallA.end,
          wallB.start, wallB.end
        );
        if (!intersection) continue;

        // Verifica novamente se o ponto está no interior de ambas (redundante, mas seguro)
        const onA = isPointOnSegment(intersection, wallA.start, wallA.end);
        const onB = isPointOnSegment(intersection, wallB.start, wallB.end);
        if (!onA || !onB) continue;

        // Verifica se o ponto está longe das extremidades (evita divisões desnecessárias)
        const distAStart = distance(intersection, wallA.start);
        const distAEnd = distance(intersection, wallA.end);
        const distBStart = distance(intersection, wallB.start);
        const distBEnd = distance(intersection, wallB.end);

        if (distAStart < GEOM_TOL || distAEnd < GEOM_TOL ||
            distBStart < GEOM_TOL || distBEnd < GEOM_TOL) {
          continue;
        }

        // Divide a primeira parede
        const splitA = splitWallAtPoint(currentWalls, wallA.id, intersection);
        if (splitA.removedWallIds.length > 0) {
          currentWalls = splitA.updatedWalls;
          anySplit = true;
          break; // reinicia o loop externo
        }

        // Reencontra a parede B (pode ter sido modificada indiretamente? não, mas por segurança)
        const updatedWallB = currentWalls.find(w => w.id === wallB.id);
        if (!updatedWallB) {
          anySplit = true;
          break;
        }

        // Divide a segunda parede
        const splitB = splitWallAtPoint(currentWalls, updatedWallB.id, intersection);
        if (splitB.removedWallIds.length > 0) {
          currentWalls = splitB.updatedWalls;
          anySplit = true;
          break;
        }
      }
      if (anySplit) break;
    }
  }

  if (iterations >= MAX_ITERATIONS) {
    console.warn('splitWallsAtIntersections: max iterations reached, possible infinite loop');
  }

  return currentWalls;
}

// ============================================
// EXPORTAÇÃO FINAL
// ============================================

export const WallSplit = {
  splitWallAtPoint,
  splitWallsAtIntersections,
};
