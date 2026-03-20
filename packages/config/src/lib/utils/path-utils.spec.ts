import { describe, expect, it } from 'vitest';
import { buildLookupMap, getByPath } from './path-utils';

describe('buildLookupMap', () => {
  it('should flatten a simple object', () => {
    const config = { database: { url: 'postgres://localhost', port: 5432 } };
    const map = buildLookupMap(config);

    expect(map.get('database')).toEqual({ url: 'postgres://localhost', port: 5432 });
    expect(map.get('database.url')).toBe('postgres://localhost');
    expect(map.get('database.port')).toBe(5432);
  });

  it('should handle deeply nested objects', () => {
    const config = { a: { b: { c: { d: 'deep' } } } };
    const map = buildLookupMap(config);

    expect(map.get('a.b.c.d')).toBe('deep');
    expect(map.get('a.b.c')).toEqual({ d: 'deep' });
    expect(map.get('a.b')).toEqual({ c: { d: 'deep' } });
  });

  it('should handle arrays as leaf values', () => {
    const config = { tags: ['a', 'b', 'c'] };
    const map = buildLookupMap(config);

    expect(map.get('tags')).toEqual(['a', 'b', 'c']);
  });

  it('should handle multiple top-level keys', () => {
    const config = { database: { url: 'test' }, auth: { secret: 'abc' } };
    const map = buildLookupMap(config);

    expect(map.get('database.url')).toBe('test');
    expect(map.get('auth.secret')).toBe('abc');
  });

  it('should handle null values', () => {
    const config = { value: null };
    const map = buildLookupMap(config);

    expect(map.get('value')).toBeNull();
  });

  it('should handle boolean and number values', () => {
    const config = { enabled: true, count: 0 };
    const map = buildLookupMap(config);

    expect(map.get('enabled')).toBe(true);
    expect(map.get('count')).toBe(0);
  });

  it('should handle empty objects', () => {
    const map = buildLookupMap({});
    expect(map.size).toBe(0);
  });
});

describe('getByPath', () => {
  it('should retrieve a value by path', () => {
    const map = new Map<string, unknown>([['database.url', 'test']]);
    expect(getByPath(map, 'database.url')).toBe('test');
  });

  it('should throw for non-existent paths', () => {
    const map = new Map<string, unknown>();
    expect(() => getByPath(map, 'missing.key')).toThrow(
      'Configuration key "missing.key" does not exist',
    );
  });
});
