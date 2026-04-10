// src/core/geometry/geometryConstants.ts

/**
 * Constantes geométricas centralizadas para o motor CAD do AuriPlan.
 * Todas as unidades estão em METROS (exceto ângulos em radianos).
 * Segue padrões de tolerância semelhantes ao MagicPlan e AutoCAD.
 */

// ============================================
// TOLERÂNCIAS LINEARES
// ============================================

/** Tolerância geométrica geral para comparação de coordenadas (1 mm) */
export const GEOM_TOL = 0.001;

/** Tolerância para snap de extremidades (25 cm) – usada durante edição interativa */
export const SNAP_TOL = 0.25;

/** Tolerância para fusão de nós no grafo de paredes (1 mm) */
export const NODE_TOL = 0.001;

/** Epsilon muito pequeno para verificações de comprimento zero e operações críticas */
export const EPS = 1e-6;

/** Tolerância para snap ao grid (10 cm) – valor padrão para alinhamento */
export const GRID_SNAP_TOL = 0.10;

// ============================================
// TOLERÂNCIAS ANGULARES
// ============================================

/** Tolerância angular para detecção de paralelismo/perpendicularidade (~1 grau em radianos) */
export const ANGLE_TOL = Math.PI / 180; // 1 grau

/** Tolerância para considerar ângulos opostos (π rad) – usada na classificação de junções */
export const OPPOSITE_ANGLE_TOL = 0.15; // ~8.6 graus

// ============================================
// RESTRIÇÕES GEOMÉTRICAS
// ============================================

/** Comprimento mínimo para uma parede válida (5 cm) */
export const MIN_WALL_LENGTH = 0.05;

/** Fator máximo de extensão para miters em cantos (limitado para evitar artefatos) */
export const MAX_MITER_FACTOR = 3;

/** Área mínima para considerar um cômodo válido (0.5 m²) */
export const MIN_ROOM_AREA = 0.5;

/** Área máxima para ignorar a face externa infinita (1e6 m²) */
export const MAX_AREA_THRESHOLD = 1e6;

// ============================================
// UTILITÁRIOS DE CONVERSÃO
// ============================================

/** Converte graus para radianos */
export const degToRad = (deg: number): number => (deg * Math.PI) / 180;

/** Converte radianos para graus */
export const radToDeg = (rad: number): number => (rad * 180) / Math.PI;

/** Verifica se dois valores estão dentro da tolerância linear */
export const approxEqual = (a: number, b: number, tol: number = GEOM_TOL): boolean =>
  Math.abs(a - b) <= tol;

/** Verifica se dois ângulos estão dentro da tolerância angular (considerando wrap-around) */
export const angleApproxEqual = (a: number, b: number, tol: number = ANGLE_TOL): boolean => {
  const diff = Math.abs(a - b);
  return diff <= tol || Math.abs(diff - 2 * Math.PI) <= tol;
};
