import type { DeepReadonly } from '../types';

export function deepFreeze<T extends Record<string, unknown>>(obj: T): DeepReadonly<T> {
  Object.freeze(obj);

  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
      deepFreeze(value as Record<string, unknown>);
    }
  }

  return obj as DeepReadonly<T>;
}
