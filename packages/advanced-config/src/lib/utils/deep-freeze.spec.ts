import { describe, it, expect } from 'vitest';
import { deepFreeze } from './deep-freeze';

describe('deepFreeze', () => {
  it('should freeze a flat object', () => {
    const obj = { a: 1, b: 'hello' };
    const frozen = deepFreeze(obj);

    expect(Object.isFrozen(frozen)).toBe(true);
    expect(frozen.a).toBe(1);
  });

  it('should freeze nested objects recursively', () => {
    const obj = { a: { b: { c: 42 } } };
    const frozen = deepFreeze(obj);

    expect(Object.isFrozen(frozen)).toBe(true);
    expect(Object.isFrozen(frozen.a)).toBe(true);
    expect(Object.isFrozen(frozen.a.b)).toBe(true);
  });

  it('should freeze arrays within objects', () => {
    const obj = { items: [1, 2, 3] };
    const frozen = deepFreeze(obj);

    expect(Object.isFrozen(frozen)).toBe(true);
    expect(Object.isFrozen(frozen.items)).toBe(true);
  });

  it('should handle null values without error', () => {
    const obj = { a: null, b: 'test' };
    const frozen = deepFreeze(obj as Record<string, unknown>);

    expect(Object.isFrozen(frozen)).toBe(true);
    expect(frozen.a).toBeNull();
  });

  it('should throw when attempting to mutate a frozen object', () => {
    const obj = { a: 1 };
    const frozen = deepFreeze(obj);

    expect(() => {
      (frozen as any).a = 2;
    }).toThrow();
  });

  it('should throw when attempting to mutate a nested frozen object', () => {
    const obj = { nested: { value: 'original' } };
    const frozen = deepFreeze(obj);

    expect(() => {
      (frozen.nested as any).value = 'modified';
    }).toThrow();
  });

  it('should return the same object reference', () => {
    const obj = { a: 1 };
    const frozen = deepFreeze(obj);

    expect(frozen).toBe(obj);
  });

  it('should not re-freeze already frozen nested objects', () => {
    const inner = Object.freeze({ x: 1 });
    const obj = { inner };
    const frozen = deepFreeze(obj);

    expect(Object.isFrozen(frozen.inner)).toBe(true);
  });
});
