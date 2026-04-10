// ============================================
// VECTOR TESTS - Testes de Vetores Matemáticos
// ============================================

import { describe, it, expect } from 'vitest';
import { vec2, vec3, lineIntersection, pointInPolygon, polygonArea } from '@core/math/vector';

describe('vec2', () => {
  it('creates a vector', () => {
    const v = vec2.create(1, 2);
    expect(v).toEqual([1, 2]);
  });

  it('adds vectors', () => {
    const a = vec2.create(1, 2);
    const b = vec2.create(3, 4);
    expect(vec2.add(a, b)).toEqual([4, 6]);
  });

  it('subtracts vectors', () => {
    const a = vec2.create(5, 5);
    const b = vec2.create(2, 3);
    expect(vec2.sub(a, b)).toEqual([3, 2]);
  });

  it('multiplies by scalar', () => {
    const v = vec2.create(2, 3);
    expect(vec2.scale(v, 2)).toEqual([4, 6]);
  });

  it('calculates dot product', () => {
    const a = vec2.create(1, 2);
    const b = vec2.create(3, 4);
    expect(vec2.dot(a, b)).toBe(11);
  });

  it('calculates length', () => {
    const v = vec2.create(3, 4);
    expect(vec2.length(v)).toBe(5);
  });

  it('normalizes vector', () => {
    const v = vec2.create(3, 4);
    const normalized = vec2.normalize(v);
    expect(vec2.length(normalized)).toBeCloseTo(1);
  });

  it('calculates distance', () => {
    const a = vec2.create(0, 0);
    const b = vec2.create(3, 4);
    expect(vec2.distance(a, b)).toBe(5);
  });

  it('calculates angle', () => {
    const a = vec2.create(1, 0);
    const b = vec2.create(0, 1);
    expect(vec2.angle(a, b)).toBeCloseTo(Math.PI / 2);
  });

  it('linearly interpolates', () => {
    const a = vec2.create(0, 0);
    const b = vec2.create(10, 10);
    expect(vec2.lerp(a, b, 0.5)).toEqual([5, 5]);
  });
});

describe('vec3', () => {
  it('creates a vector', () => {
    const v = vec3.create(1, 2, 3);
    expect(v).toEqual([1, 2, 3]);
  });

  it('adds vectors', () => {
    const a = vec3.create(1, 2, 3);
    const b = vec3.create(4, 5, 6);
    expect(vec3.add(a, b)).toEqual([5, 7, 9]);
  });

  it('calculates cross product', () => {
    const a = vec3.create(1, 0, 0);
    const b = vec3.create(0, 1, 0);
    expect(vec3.cross(a, b)).toEqual([0, 0, 1]);
  });
});

describe('lineIntersection', () => {
  it('finds intersection of two lines', () => {
    const p1 = vec2.create(0, 0);
    const p2 = vec2.create(10, 10);
    const p3 = vec2.create(0, 10);
    const p4 = vec2.create(10, 0);

    const intersection = lineIntersection(p1, p2, p3, p4);
    expect(intersection).toEqual([5, 5]);
  });

  it('returns null for parallel lines', () => {
    const p1 = vec2.create(0, 0);
    const p2 = vec2.create(10, 10);
    const p3 = vec2.create(0, 1);
    const p4 = vec2.create(10, 11);

    const intersection = lineIntersection(p1, p2, p3, p4);
    expect(intersection).toBeNull();
  });
});

describe('pointInPolygon', () => {
  it('detects point inside polygon', () => {
    const polygon = [
      vec2.create(0, 0),
      vec2.create(10, 0),
      vec2.create(10, 10),
      vec2.create(0, 10),
    ];
    const point = vec2.create(5, 5);

    expect(pointInPolygon(point, polygon)).toBe(true);
  });

  it('detects point outside polygon', () => {
    const polygon = [
      vec2.create(0, 0),
      vec2.create(10, 0),
      vec2.create(10, 10),
      vec2.create(0, 10),
    ];
    const point = vec2.create(15, 15);

    expect(pointInPolygon(point, polygon)).toBe(false);
  });
});

describe('polygonArea', () => {
  it('calculates area of square', () => {
    const polygon = [
      vec2.create(0, 0),
      vec2.create(10, 0),
      vec2.create(10, 10),
      vec2.create(0, 10),
    ];

    expect(polygonArea(polygon)).toBe(100);
  });

  it('calculates area of triangle', () => {
    const polygon = [
      vec2.create(0, 0),
      vec2.create(10, 0),
      vec2.create(5, 10),
    ];

    expect(polygonArea(polygon)).toBe(50);
  });
});
