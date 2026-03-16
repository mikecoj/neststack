import { describe, it, expect } from 'vitest';
import { EnvSource } from './env-source';

describe('EnvSource', () => {
  describe('getString', () => {
    it('should return the environment variable value', () => {
      const env = new EnvSource({ DB_URL: 'postgres://localhost' });
      expect(env.getString('DB_URL')).toBe('postgres://localhost');
    });

    it('should return the default value when variable is not set', () => {
      const env = new EnvSource({});
      expect(env.getString('MISSING', 'default')).toBe('default');
    });

    it('should throw when variable is not set and no default', () => {
      const env = new EnvSource({});
      expect(() => env.getString('MISSING')).toThrow(
        'Environment variable MISSING is required but not set',
      );
    });

    it('should use default when value is empty string', () => {
      const env = new EnvSource({ EMPTY: '' });
      expect(env.getString('EMPTY', 'fallback')).toBe('fallback');
    });

    it('should throw when value is empty and no default', () => {
      const env = new EnvSource({ EMPTY: '' });
      expect(() => env.getString('EMPTY')).toThrow(
        'Environment variable EMPTY is required but not set',
      );
    });
  });

  describe('getNumber', () => {
    it('should parse a valid integer', () => {
      const env = new EnvSource({ PORT: '3000' });
      expect(env.getNumber('PORT')).toBe(3000);
    });

    it('should parse a valid float', () => {
      const env = new EnvSource({ RATE: '0.75' });
      expect(env.getNumber('RATE')).toBe(0.75);
    });

    it('should return the default value when variable is not set', () => {
      const env = new EnvSource({});
      expect(env.getNumber('MISSING', 8080)).toBe(8080);
    });

    it('should throw for non-numeric values', () => {
      const env = new EnvSource({ BAD: 'not-a-number' });
      expect(() => env.getNumber('BAD')).toThrow(
        'Environment variable BAD must be a valid number, received: "not-a-number"',
      );
    });

    it('should throw when variable is not set and no default', () => {
      const env = new EnvSource({});
      expect(() => env.getNumber('MISSING')).toThrow(
        'Environment variable MISSING is required but not set',
      );
    });

    it('should use default when value is empty string', () => {
      const env = new EnvSource({ EMPTY: '' });
      expect(env.getNumber('EMPTY', 42)).toBe(42);
    });
  });

  describe('getBoolean', () => {
    it.each([
      ['true', true],
      ['TRUE', true],
      ['1', true],
      ['yes', true],
      ['YES', true],
      ['false', false],
      ['FALSE', false],
      ['0', false],
      ['no', false],
      ['NO', false],
    ])('should parse "%s" as %s', (input, expected) => {
      const env = new EnvSource({ FLAG: input });
      expect(env.getBoolean('FLAG')).toBe(expected);
    });

    it('should return the default value when variable is not set', () => {
      const env = new EnvSource({});
      expect(env.getBoolean('MISSING', false)).toBe(false);
    });

    it('should throw for invalid boolean values', () => {
      const env = new EnvSource({ BAD: 'maybe' });
      expect(() => env.getBoolean('BAD')).toThrow(
        'Environment variable BAD must be a boolean (true/false/1/0/yes/no), received: "maybe"',
      );
    });

    it('should throw when variable is not set and no default', () => {
      const env = new EnvSource({});
      expect(() => env.getBoolean('MISSING')).toThrow(
        'Environment variable MISSING is required but not set',
      );
    });

    it('should use default when value is empty string', () => {
      const env = new EnvSource({ EMPTY: '' });
      expect(env.getBoolean('EMPTY', true)).toBe(true);
    });
  });

  describe('getOptionalString', () => {
    it('should return the value when set', () => {
      const env = new EnvSource({ KEY: 'value' });
      expect(env.getOptionalString('KEY')).toBe('value');
    });

    it('should return undefined when not set', () => {
      const env = new EnvSource({});
      expect(env.getOptionalString('MISSING')).toBeUndefined();
    });

    it('should return undefined for empty strings', () => {
      const env = new EnvSource({ EMPTY: '' });
      expect(env.getOptionalString('EMPTY')).toBeUndefined();
    });
  });

  describe('getOptionalNumber', () => {
    it('should return the parsed number when set', () => {
      const env = new EnvSource({ NUM: '42' });
      expect(env.getOptionalNumber('NUM')).toBe(42);
    });

    it('should return undefined when not set', () => {
      const env = new EnvSource({});
      expect(env.getOptionalNumber('MISSING')).toBeUndefined();
    });

    it('should return undefined for empty strings', () => {
      const env = new EnvSource({ EMPTY: '' });
      expect(env.getOptionalNumber('EMPTY')).toBeUndefined();
    });

    it('should throw for non-numeric values', () => {
      const env = new EnvSource({ BAD: 'abc' });
      expect(() => env.getOptionalNumber('BAD')).toThrow(
        'Environment variable BAD must be a valid number, received: "abc"',
      );
    });
  });

  describe('getOptionalBoolean', () => {
    it('should return the parsed boolean when set', () => {
      const env = new EnvSource({ FLAG: 'true' });
      expect(env.getOptionalBoolean('FLAG')).toBe(true);
    });

    it('should return undefined when not set', () => {
      const env = new EnvSource({});
      expect(env.getOptionalBoolean('MISSING')).toBeUndefined();
    });

    it('should return undefined for empty strings', () => {
      const env = new EnvSource({ EMPTY: '' });
      expect(env.getOptionalBoolean('EMPTY')).toBeUndefined();
    });

    it('should throw for invalid boolean values', () => {
      const env = new EnvSource({ BAD: 'invalid' });
      expect(() => env.getOptionalBoolean('BAD')).toThrow(
        'Environment variable BAD must be a boolean (true/false/1/0/yes/no), received: "invalid"',
      );
    });
  });
});
