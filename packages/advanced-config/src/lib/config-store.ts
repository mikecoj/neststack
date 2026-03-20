import { Injectable, Logger } from '@nestjs/common';
import type { ConfigDefinition, ConfigExplanation } from './interfaces';
import type { DeepReadonly } from './types';
import { buildLookupMap, deepFreeze, maskSecrets } from './utils';

interface NamespaceEntry {
  definition: ConfigDefinition;
  data: DeepReadonly<Record<string, unknown>>;
  source: Map<string, 'loader' | 'default' | 'override'>;
}

@Injectable()
export class ConfigStore {
  private readonly logger = new Logger(ConfigStore.name);
  private readonly namespaces = new Map<string, NamespaceEntry>();
  private lookupMap = new Map<string, unknown>();
  private readonly allSecretKeys = new Set<string>();

  register(
    definition: ConfigDefinition,
    rawData: Record<string, unknown>,
    overrides?: Record<string, unknown>,
  ): void {
    const { namespace, schema, secretKeys } = definition;

    if (this.namespaces.has(namespace)) {
      throw new Error(
        `Configuration namespace "${namespace}" is already registered. ` +
          `Each namespace must be unique.`,
      );
    }

    const merged = { ...rawData, ...overrides };

    const result = schema.safeParse(merged);
    if (!result.success) {
      const zodError = result.error;
      const details = zodError.issues
        .map((issue) => {
          const path = issue.path.join('.');
          return `  ${namespace}.${path}: ${issue.message}`;
        })
        .join('\n');

      throw new Error(`Config validation failed for namespace "${namespace}":\n${details}`);
    }

    const validated = result.data as Record<string, unknown>;
    const frozen = deepFreeze({ ...validated });

    const sourceMap = new Map<string, 'loader' | 'default' | 'override'>();
    classifySource(sourceMap, validated, rawData, overrides, '');

    for (const sk of secretKeys) {
      this.allSecretKeys.add(`${namespace}.${sk}`);
    }

    this.namespaces.set(namespace, { definition, data: frozen, source: sourceMap });
    this.rebuildLookupMap();
  }

  get<T = unknown>(path: string): T {
    if (!this.lookupMap.has(path)) {
      throw new Error(`Configuration key "${path}" does not exist`);
    }
    return this.lookupMap.get(path) as T;
  }

  getNamespace<T = Record<string, unknown>>(name: string): T {
    const entry = this.namespaces.get(name);
    if (!entry) {
      throw new Error(`Configuration namespace "${name}" is not registered`);
    }
    return entry.data as T;
  }

  explain(path: string): ConfigExplanation {
    const dotIndex = path.indexOf('.');
    const namespace = dotIndex === -1 ? path : path.substring(0, dotIndex);
    const key = dotIndex === -1 ? '' : path.substring(dotIndex + 1);

    const entry = this.namespaces.get(namespace);
    if (!entry) {
      throw new Error(`Configuration namespace "${namespace}" is not registered`);
    }

    const value = this.lookupMap.get(path);
    const rawSource = key ? entry.source.get(key) : undefined;
    const source = key ? /* c8 ignore next */ (rawSource ?? 'default') : 'loader';
    const isSecret = this.allSecretKeys.has(path);

    return { path, namespace, key, value: isSecret ? '********' : value, source, isSecret };
  }

  getAll(): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [namespace, entry] of this.namespaces) {
      result[namespace] = entry.data;
    }
    return result;
  }

  getSafeAll(): Record<string, unknown> {
    return maskSecrets(this.getAll(), this.allSecretKeys);
  }

  printSafe(): void {
    const safe = this.getSafeAll();
    this.logger.log(`Configuration:\n${JSON.stringify(safe, null, 2)}`);
  }

  get size(): number {
    return this.namespaces.size;
  }

  clear(): void {
    this.namespaces.clear();
    this.lookupMap.clear();
    this.allSecretKeys.clear();
  }

  private rebuildLookupMap(): void {
    const all = this.getAll();
    this.lookupMap = buildLookupMap(all);
  }
}

type SourceType = 'loader' | 'default' | 'override';

function resolveKeySource(
  key: string,
  raw: Record<string, unknown>,
  over: Record<string, unknown> | undefined,
): SourceType {
  if (over && key in over) return 'override';
  if (key in raw) return 'loader';
  return 'default';
}

function asRecord(
  parent: Record<string, unknown>,
  key: string,
): Record<string, unknown> | undefined {
  const val = parent[key];
  return key in parent && typeof val === 'object' && val !== null
    ? (val as Record<string, unknown>)
    : undefined;
}

function classifySource(
  sourceMap: Map<string, SourceType>,
  obj: Record<string, unknown>,
  raw: Record<string, unknown>,
  over: Record<string, unknown> | undefined,
  prefix: string,
): void {
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    sourceMap.set(fullKey, resolveKeySource(key, raw, over));

    const val = obj[key];
    if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      classifySource(
        sourceMap,
        val as Record<string, unknown>,
        asRecord(raw, key) ?? {},
        over ? asRecord(over, key) : undefined,
        fullKey,
      );
    }
  }
}
