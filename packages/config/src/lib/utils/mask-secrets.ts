const MASK = '********';

export function maskSecrets(
  config: Record<string, unknown>,
  secretKeys: ReadonlySet<string>,
  prefix = '',
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const key of Object.keys(config)) {
    const fullPath = prefix ? `${prefix}.${key}` : key;
    const value = config[key];

    if (secretKeys.has(fullPath)) {
      result[key] = MASK;
    } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = maskSecrets(value as Record<string, unknown>, secretKeys, fullPath);
    } else {
      result[key] = value;
    }
  }

  return result;
}
