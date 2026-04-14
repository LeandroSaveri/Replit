// ============================================
// IGraphTopology.ts
// Contrato unificado para consulta de topologia de paredes.
// Fase 1 – Unificação da topologia (MagicPlan-like)
// ============================================

import type { Vec2 } from '@auriplan-types';

/**
 * Interface única para todas as operações topológicas no editor.
 * Tanto o pipeline geométrico quanto os handlers interativos (SelectToolHandler)
 * devem consumir esta mesma interface.
 * 
 * Decisão arquitetural: esta interface NÃO deve ser persistida na cena (scene._topology)
 * pois é dado derivado. Em vez disso, fica em cache no store ou em um serviço.
 */
export interface IGraphTopology {
  /**
   * Retorna todas as paredes que possuem um vértice igual a `vertex` (com tolerância).
   * @param vertex Ponto no espaço 2D
   * @param excludeWallId ID opcional para excluir uma parede (ex: a própria)
   */
  getWallsConnectedToVertex(vertex: Vec2, excludeWallId?: string): Array<{ id: string; start: Vec2; end: Vec2 }>;

  /**
   * Retorna todas as paredes que compartilham pelo menos um vértice com a parede `wallId`.
   */
  getWallsConnectedToWall(wallId: string): Array<{ id: string; start: Vec2; end: Vec2 }>;

  /**
   * Atualiza a geometria de uma parede no cache topológico.
   * Nota: este método é usado durante edição interativa (live update)
   * para manter o cache sincronizado antes do commit.
   */
  updateWallGeometry(wallId: string, newStart: Vec2, newEnd: Vec2): void;

  /**
   * Opcional: obtém o tipo de junção em um vértice (L, T, X, none)
   */
  getJunctionTypeAtVertex?(vertex: Vec2): 'L' | 'T' | 'X' | 'none';
}

/**
 * Tipo de fábrica para criar uma topologia a partir de uma lista de paredes.
 * Útil para recriar o cache quando as paredes mudam (ex: após pipeline).
 */
export type TopologyFactory = (walls: Array<{ id: string; start: Vec2; end: Vec2 }>) => IGraphTopology;
