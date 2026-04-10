/**
 * Utilitários geométricos para cálculos CAD
 */

export interface Point2D {
  x: number;
  y: number;
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface Line2D {
  start: Point2D;
  end: Point2D;
}

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Circle {
  center: Point2D;
  radius: number;
}

/**
 * Calcula a distância entre dois pontos 2D
 */
export function distance2D(p1: Point2D, p2: Point2D): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calcula a distância entre dois pontos 3D
 */
export function distance3D(p1: Point3D, p2: Point3D): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dz = p2.z - p1.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Calcula o ponto médio entre dois pontos
 */
export function midpoint(p1: Point2D, p2: Point2D): Point2D {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  };
}

/**
 * Calcula o ângulo entre dois pontos em radianos
 */
export function angleBetween(p1: Point2D, p2: Point2D): number {
  return Math.atan2(p2.y - p1.y, p2.x - p1.x);
}

/**
 * Converte graus para radianos
 */
export function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Converte radianos para graus
 */
export function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

/**
 * Rotaciona um ponto em torno de um centro
 */
export function rotatePoint(
  point: Point2D,
  center: Point2D,
  angle: number
): Point2D {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dx = point.x - center.x;
  const dy = point.y - center.y;

  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
}

/**
 * Escala um ponto em relação a um centro
 */
export function scalePoint(
  point: Point2D,
  center: Point2D,
  scale: number
): Point2D {
  return {
    x: center.x + (point.x - center.x) * scale,
    y: center.y + (point.y - center.y) * scale,
  };
}

/**
 * Translada um ponto
 */
export function translatePoint(point: Point2D, dx: number, dy: number): Point2D {
  return {
    x: point.x + dx,
    y: point.y + dy,
  };
}

/**
 * Verifica se um ponto está dentro de um retângulo
 */
export function pointInRect(point: Point2D, rect: Rectangle): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

/**
 * Verifica se um ponto está dentro de um círculo
 */
export function pointInCircle(point: Point2D, circle: Circle): boolean {
  return distance2D(point, circle.center) <= circle.radius;
}

/**
 * Verifica se dois retângulos se intersectam
 */
export function rectIntersect(r1: Rectangle, r2: Rectangle): boolean {
  return !(
    r2.x > r1.x + r1.width ||
    r2.x + r2.width < r1.x ||
    r2.y > r1.y + r1.height ||
    r2.y + r2.height < r1.y
  );
}

/**
 * Calcula a área de um retângulo
 */
export function rectArea(rect: Rectangle): number {
  return rect.width * rect.height;
}

/**
 * Calcula a área de um círculo
 */
export function circleArea(circle: Circle): number {
  return Math.PI * circle.radius * circle.radius;
}

/**
 * Calcula o comprimento de uma linha
 */
export function lineLength(line: Line2D): number {
  return distance2D(line.start, line.end);
}

/**
 * Verifica se um ponto está em uma linha
 */
export function pointOnLine(
  point: Point2D,
  line: Line2D,
  tolerance: number = 0.001
): boolean {
  const d1 = distance2D(point, line.start);
  const d2 = distance2D(point, line.end);
  const lineLen = lineLength(line);
  return Math.abs(d1 + d2 - lineLen) < tolerance;
}

/**
 * Encontra a projeção de um ponto em uma linha
 */
export function projectPointOnLine(point: Point2D, line: Line2D): Point2D {
  const dx = line.end.x - line.start.x;
  const dy = line.end.y - line.start.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  
  if (len === 0) return line.start;
  
  const t = ((point.x - line.start.x) * dx + (point.y - line.start.y) * dy) / (len * len);
  const clampedT = Math.max(0, Math.min(1, t));
  
  return {
    x: line.start.x + clampedT * dx,
    y: line.start.y + clampedT * dy,
  };
}

/**
 * Calcula a distância de um ponto a uma linha
 */
export function distancePointToLine(point: Point2D, line: Line2D): number {
  const projected = projectPointOnLine(point, line);
  return distance2D(point, projected);
}

/**
 * Calcula o centro de um retângulo
 */
export function rectCenter(rect: Rectangle): Point2D {
  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2,
  };
}

/**
 * Cria um retângulo a partir de dois pontos
 */
export function rectFromPoints(p1: Point2D, p2: Point2D): Rectangle {
  const x = Math.min(p1.x, p2.x);
  const y = Math.min(p1.y, p2.y);
  const width = Math.abs(p2.x - p1.x);
  const height = Math.abs(p2.y - p1.y);
  return { x, y, width, height };
}

/**
 * Normaliza um ângulo para o intervalo [0, 2π)
 */
export function normalizeAngle(angle: number): number {
  const twoPi = 2 * Math.PI;
  return ((angle % twoPi) + twoPi) % twoPi;
}

/**
 * Arredonda um número para um número específico de casas decimais
 */
export function roundTo(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Arredonda um ponto para um número específico de casas decimais
 */
export function roundPoint(point: Point2D, decimals: number = 2): Point2D {
  return {
    x: roundTo(point.x, decimals),
    y: roundTo(point.y, decimals),
  };
}

/**
 * Verifica se dois pontos são iguais (dentro de uma tolerância)
 */
export function pointsEqual(
  p1: Point2D,
  p2: Point2D,
  tolerance: number = 0.001
): boolean {
  return Math.abs(p1.x - p2.x) < tolerance && Math.abs(p1.y - p2.y) < tolerance;
}

/**
 * Calcula o bounding box de um conjunto de pontos
 */
export function boundingBox(points: Point2D[]): Rectangle | null {
  if (points.length === 0) return null;
  
  let minX = points[0].x;
  let maxX = points[0].x;
  let minY = points[0].y;
  let maxY = points[0].y;
  
  for (const point of points) {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
  }
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Calcula o polígono de convex hull de um conjunto de pontos
 */
export function convexHull(points: Point2D[]): Point2D[] {
  if (points.length <= 3) return [...points];
  
  // Ordenar pontos por x, depois por y
  const sorted = [...points].sort((a, b) => {
    if (a.x !== b.x) return a.x - b.x;
    return a.y - b.y;
  });
  
  // Função para calcular a orientação
  const orientation = (p: Point2D, q: Point2D, r: Point2D): number => {
    return (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
  };
  
  // Construir hull inferior
  const lower: Point2D[] = [];
  for (const point of sorted) {
    while (lower.length >= 2 && orientation(lower[lower.length - 2], lower[lower.length - 1], point) <= 0) {
      lower.pop();
    }
    lower.push(point);
  }
  
  // Construir hull superior
  const upper: Point2D[] = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const point = sorted[i];
    while (upper.length >= 2 && orientation(upper[upper.length - 2], upper[upper.length - 1], point) <= 0) {
      upper.pop();
    }
    upper.push(point);
  }
  
  // Remover último ponto de cada metade (pois é repetido)
  lower.pop();
  upper.pop();
  
  return [...lower, ...upper];
}

/**
 * Calcula a área de um polígono
 */
export function polygonArea(points: Point2D[]): number {
  if (points.length < 3) return 0;
  
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  
  return Math.abs(area) / 2;
}

/**
 * Verifica se um ponto está dentro de um polígono
 */
export function pointInPolygon(point: Point2D, polygon: Point2D[]): boolean {
  if (polygon.length < 3) return false;
  
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;
    
    if (((yi > point.y) !== (yj > point.y)) &&
        (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  
  return inside;
}

/**
 * Escala um polígono em relação a um centro
 */
export function scalePolygon(
  polygon: Point2D[],
  center: Point2D,
  scale: number
): Point2D[] {
  return polygon.map(point => scalePoint(point, center, scale));
}

/**
 * Translada um polígono
 */
export function translatePolygon(polygon: Point2D[], dx: number, dy: number): Point2D[] {
  return polygon.map(point => translatePoint(point, dx, dy));
}

/**
 * Rotaciona um polígono em torno de um centro
 */
export function rotatePolygon(
  polygon: Point2D[],
  center: Point2D,
  angle: number
): Point2D[] {
  return polygon.map(point => rotatePoint(point, center, angle));
}
