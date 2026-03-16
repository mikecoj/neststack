export { AdvancedConfigModule } from './lib/advanced-config.module';
export { ConfigService } from './lib/config.service';
export { ConfigStore } from './lib/config-store';
export { defineConfig } from './lib/define-config';
export { EnvSource } from './lib/loaders';
export { ADVANCED_CONFIG_OPTIONS, CONFIG_STORE } from './lib/constants';

export type {
  IEnvSource,
  LoadContext,
  SecretSource,
  FileSource,
  ConfigLoader,
  ConfigDefinitionOptions,
  ConfigDefinition,
  ConfigDefinitionInput,
  ConfigExplanation,
  AdvancedConfigModuleOptions,
  AdvancedConfigModuleAsyncOptions,
  AdvancedConfigOptionsFactory,
} from './lib/interfaces';

export type { Path, PathValue } from './lib/types';
