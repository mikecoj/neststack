import type { ZodSchema, z } from 'zod';
import type { UnionToIntersection } from '../types';
import type { LoadContext } from './load-context.interface';

export type ConfigLoader<S extends ZodSchema> = (ctx: LoadContext) => Partial<z.infer<S>>;

export interface ConfigDefinitionOptions<
  N extends string = string,
  S extends ZodSchema = ZodSchema,
> {
  namespace: N;
  schema: S;
  load?: ConfigLoader<S>;
  /** Only keys that exist in the schema can be marked as secrets. */
  secretKeys?: (keyof z.infer<S> & string)[];
}

export interface ConfigDefinition<N extends string = string, S extends ZodSchema = ZodSchema> {
  readonly namespace: N;
  readonly schema: S;
  readonly load?: ConfigLoader<S>;
  /** Only keys that exist in the schema can be marked as secrets. */
  readonly secretKeys: ReadonlyArray<keyof z.infer<S> & string>;
}

export type ConfigDefinitionInput<N extends string = string, S extends ZodSchema = ZodSchema> =
  | ConfigDefinition<N, S>
  | ConfigDefinitionOptions<N, S>;

/**
 * Derives `{ [namespace]: z.infer<Schema> }` from a single `ConfigDefinition`.
 *
 * @example
 * type DatabaseMap = InferConfigMap<typeof databaseConfig>;
 * // → { database: { host: string; port: number; ... } }
 */
export type InferConfigMap<T extends ConfigDefinition> =
  T extends ConfigDefinition<infer N, infer S> ? { [K in N]: z.infer<S> } : never;

/**
 * Merges multiple `ConfigDefinition` types into a single config map suitable
 * for use as the `TConfig` type parameter of `ConfigService<TConfig>`.
 *
 * @example
 * type AppConfig = CombineConfigs<typeof appConfig | typeof dbConfig | typeof redisConfig>;
 * const config = app.get<ConfigService<AppConfig>>(ConfigService);
 * config.get('database.host'); // → string  (no cast needed)
 */
export type CombineConfigs<T extends ConfigDefinition> = UnionToIntersection<InferConfigMap<T>>;
