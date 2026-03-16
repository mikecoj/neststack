import { ZodSchema } from 'zod';
import { ConfigDefinition, ConfigDefinitionOptions } from './interfaces';

export function defineConfig<N extends string, S extends ZodSchema>(
  options: ConfigDefinitionOptions<N, S>,
): ConfigDefinition<N, S> {
  if (!options.namespace || typeof options.namespace !== 'string') {
    throw new Error('defineConfig: namespace must be a non-empty string');
  }

  if (!options.schema) {
    throw new Error('defineConfig: schema is required');
  }

  return Object.freeze({
    namespace: options.namespace,
    schema: options.schema,
    load: options.load,
    secretKeys: Object.freeze(options.secretKeys ?? []),
  });
}
