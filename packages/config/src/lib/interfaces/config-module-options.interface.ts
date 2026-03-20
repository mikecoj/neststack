import type {
  InjectionToken,
  ModuleMetadata,
  OptionalFactoryDependency,
  Type,
} from '@nestjs/common';
import type { ConfigDefinition } from './config-definition.interface';

export interface NestStackConfigModuleOptions {
  configs: ConfigDefinition[];
  envSource?: Record<string, string | undefined>;
  overrides?: Record<string, Record<string, unknown>>;
  isGlobal?: boolean;
}

export interface NestStackConfigModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  isGlobal?: boolean;
  useFactory?: (
    ...args: unknown[]
  ) => Promise<NestStackConfigModuleOptions> | NestStackConfigModuleOptions;
  inject?: (InjectionToken | OptionalFactoryDependency)[];
  useClass?: Type<NestStackConfigOptionsFactory>;
  useExisting?: Type<NestStackConfigOptionsFactory>;
}

export interface NestStackConfigOptionsFactory {
  createNestStackConfigOptions():
    | Promise<NestStackConfigModuleOptions>
    | NestStackConfigModuleOptions;
}
