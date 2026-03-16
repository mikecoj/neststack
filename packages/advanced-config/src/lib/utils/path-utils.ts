export function buildLookupMap(
  config: Record<string, unknown>,
  prefix = '',
): Map<string, unknown> {
  const map = new Map<string, unknown>();

  for (const key of Object.keys(config)) {
    const fullPath = prefix ? `${prefix}.${key}` : key;
    const value = config[key];

    map.set(fullPath, value);

    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      const nested = buildLookupMap(value as Record<string, unknown>, fullPath);
      for (const [nestedKey, nestedValue] of nested) {
        map.set(nestedKey, nestedValue);
      }
    }
  }

  return map;
}

export function getByPath(map: Map<string, unknown>, path: string): unknown {
  if (!map.has(path)) {
    throw new Error(`Configuration key "${path}" does not exist`);
  }
  return map.get(path);
}
