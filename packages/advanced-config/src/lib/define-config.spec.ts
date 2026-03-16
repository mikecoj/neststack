import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { defineConfig } from './define-config';

describe('defineConfig', () => {
  it('should create a frozen config definition', () => {
    const schema = z.object({ url: z.string() });
    const config = defineConfig({ namespace: 'database', schema });

    expect(config.namespace).toBe('database');
    expect(config.schema).toBe(schema);
    expect(config.load).toBeUndefined();
    expect(config.secretKeys).toEqual([]);
    expect(Object.isFrozen(config)).toBe(true);
  });

  it('should include loader when provided', () => {
    const schema = z.object({ url: z.string() });
    const loader = ({ env }: any) => ({ url: env.getString('DB_URL') });
    const config = defineConfig({ namespace: 'db', schema, load: loader });

    expect(config.load).toBe(loader);
  });

  it('should include secret keys when provided', () => {
    const schema = z.object({ password: z.string() });
    const config = defineConfig({
      namespace: 'db',
      schema,
      secretKeys: ['password'],
    });

    expect(config.secretKeys).toEqual(['password']);
    expect(Object.isFrozen(config.secretKeys)).toBe(true);
  });

  it('should throw when namespace is empty', () => {
    const schema = z.object({ url: z.string() });
    expect(() => defineConfig({ namespace: '' as any, schema })).toThrow(
      'defineConfig: namespace must be a non-empty string',
    );
  });

  it('should throw when schema is not provided', () => {
    expect(() => defineConfig({ namespace: 'test', schema: undefined as any })).toThrow(
      'defineConfig: schema is required',
    );
  });
});
