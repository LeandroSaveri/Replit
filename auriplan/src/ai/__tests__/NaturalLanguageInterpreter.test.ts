/**
 * Tests for NaturalLanguageInterpreter
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { NaturalLanguageInterpreter } from '../NaturalLanguageInterpreter';

describe('NaturalLanguageInterpreter', () => {
  let interpreter: NaturalLanguageInterpreter;

  beforeEach(() => {
    interpreter = new NaturalLanguageInterpreter();
  });

  describe('Portuguese Commands', () => {
    it('should interpret "criar uma casa com 2 quartos"', () => {
      const result = interpreter.interpret('criar uma casa com 2 quartos', 'pt');

      expect(result.success).toBe(true);
      expect(result.command).toBeDefined();
      expect(result.command!.intent).toBe('create');
      expect(result.command!.target).toBe('house');
      expect(result.command!.specifications.count).toBe(2);
    });

    it('should interpret "adicionar cozinha de 12 metros"', () => {
      const result = interpreter.interpret('adicionar cozinha de 12 metros', 'pt');

      expect(result.success).toBe(true);
      expect(result.command!.intent).toBe('add');
      expect(result.command!.target).toBe('room');
      expect(result.command!.targetType).toBe('kitchen');
      expect(result.command!.specifications.size).toBe(12);
    });

    it('should interpret "colocar sofá na sala"', () => {
      const result = interpreter.interpret('colocar sofá na sala', 'pt');

      expect(result.success).toBe(true);
      expect(result.command!.intent).toBe('add');
      expect(result.command!.target).toBe('furniture');
      expect(result.command!.targetType).toBe('sofa');
      expect(result.command!.location).toContain('sala');
    });

    it('should interpret "criar quarto principal com banheiro"', () => {
      const result = interpreter.interpret('criar quarto principal com banheiro', 'pt');

      expect(result.success).toBe(true);
      expect(result.command!.intent).toBe('create');
      expect(result.command!.target).toBe('room');
    });

    it('should interpret "mudar o quarto para 15 metros quadrados"', () => {
      const result = interpreter.interpret('mudar o quarto para 15 metros quadrados', 'pt');

      expect(result.success).toBe(true);
      expect(result.command!.intent).toBe('modify');
      expect(result.command!.target).toBe('room');
      expect(result.command!.specifications.size).toBe(15);
    });

    it('should interpret "remover a parede"', () => {
      const result = interpreter.interpret('remover a parede', 'pt');

      expect(result.success).toBe(true);
      expect(result.command!.intent).toBe('delete');
      expect(result.command!.target).toBe('wall');
    });
  });

  describe('English Commands', () => {
    it('should interpret "create a house with 2 bedrooms"', () => {
      const result = interpreter.interpret('create a house with 2 bedrooms', 'en');

      expect(result.success).toBe(true);
      expect(result.command!.intent).toBe('create');
      expect(result.command!.target).toBe('house');
      expect(result.command!.specifications.count).toBe(2);
    });

    it('should interpret "add a kitchen of 12 square meters"', () => {
      const result = interpreter.interpret('add a kitchen of 12 square meters', 'en');

      expect(result.success).toBe(true);
      expect(result.command!.intent).toBe('add');
      expect(result.command!.target).toBe('room');
      expect(result.command!.targetType).toBe('kitchen');
    });

    it('should interpret "put a sofa in the living room"', () => {
      const result = interpreter.interpret('put a sofa in the living room', 'en');

      expect(result.success).toBe(true);
      expect(result.command!.intent).toBe('add');
      expect(result.command!.target).toBe('furniture');
      expect(result.command!.targetType).toBe('sofa');
    });
  });

  describe('Language Detection', () => {
    it('should detect Portuguese', () => {
      const result = interpreter.interpret('criar uma casa');
      expect(result.success).toBe(true);
    });

    it('should detect English', () => {
      const result = interpreter.interpret('create a house');
      expect(result.success).toBe(true);
    });
  });

  describe('Confidence Score', () => {
    it('should return confidence between 0 and 1', () => {
      const result = interpreter.interpret('criar quarto', 'pt');

      expect(result.success).toBe(true);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
  });
});
