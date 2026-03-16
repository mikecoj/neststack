import { ZodSchema, z } from 'zod';
import { LoadContext } from './load-context.interface';

export type ConfigLoader<S extends ZodSchema> = (ctx: LoadContext) => Partial<z.infer<S>>;

export interface ConfigDefinitionOptions<
  N extends string = string,
  S extends ZodSchema = ZodSchema,
> {
  namespace: N;
  schema: S;
  load?: ConfigLoader<S>;
  secretKeys?: string[];
}

export interface ConfigDefinition<N extends string = string, S extends ZodSchema = ZodSchema> {
  readonly namespace: N;
  readonly schema: S;
  readonly load?: ConfigLoader<S>;
  readonly secretKeys: ReadonlyArray<string>;
}

export type ConfigDefinitionInput<N extends string = string, S extends ZodSchema = ZodSchema> =
  | ConfigDefinition<N, S>
  | ConfigDefinitionOptions<N, S>;
