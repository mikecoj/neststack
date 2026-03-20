export { ConfigService } from './lib/config.service';
export { ConfigStore } from './lib/config-store';
export { CONFIG_STORE, NESTSTACK_CONFIG_OPTIONS } from './lib/constants';
export { defineConfig } from './lib/define-config';
export type {
  CombineConfigs,
  ConfigDefinition,
  ConfigDefinitionInput,
  ConfigDefinitionOptions,
  ConfigExplanation,
  ConfigLoader,
  FileSource,
  IEnvSource,
  InferConfigMap,
  LoadContext,
  NestStackConfigModuleAsyncOptions,
  NestStackConfigModuleOptions,
  NestStackConfigOptionsFactory,
  SecretSource,
} from './lib/interfaces';
export { EnvSource } from './lib/loaders';
export { NestStackConfigModule } from './lib/neststack-config.module';

export type { DeepReadonly, Path, PathValue, UnionToIntersection } from './lib/types';
