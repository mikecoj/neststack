import type {
  InjectionToken,
  ModuleMetadata,
  OptionalFactoryDependency,
  Type,
} from '@nestjs/common';
import type { ConfigDefinition } from './config-definition.interface';

export interface AdvancedConfigModuleOptions {
  configs: ConfigDefinition[];
  envSource?: Record<string, string | undefined>;
  strict?: boolean;
  cache?: boolean;
  overrides?: Record<string, Record<string, unknown>>;
  isGlobal?: boolean;
}

export interface AdvancedConfigModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  isGlobal?: boolean;
  useFactory?: (
    ...args: unknown[]
  ) => Promise<AdvancedConfigModuleOptions> | AdvancedConfigModuleOptions;
  inject?: (InjectionToken | OptionalFactoryDependency)[];
  useClass?: Type<AdvancedConfigOptionsFactory>;
  useExisting?: Type<AdvancedConfigOptionsFactory>;
}

export interface AdvancedConfigOptionsFactory {
  createAdvancedConfigOptions(): Promise<AdvancedConfigModuleOptions> | AdvancedConfigModuleOptions;
}
