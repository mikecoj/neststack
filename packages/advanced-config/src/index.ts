export { AdvancedConfigModule } from './lib/advanced-config.module';
export { ConfigService } from './lib/config.service';
export { ConfigStore } from './lib/config-store';
export { ADVANCED_CONFIG_OPTIONS, CONFIG_STORE } from './lib/constants';
export { defineConfig } from './lib/define-config';
export type {
  AdvancedConfigModuleAsyncOptions,
  AdvancedConfigModuleOptions,
  AdvancedConfigOptionsFactory,
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
  SecretSource,
} from './lib/interfaces';
export { EnvSource } from './lib/loaders';

export type { DeepReadonly, Path, PathValue, UnionToIntersection } from './lib/types';
