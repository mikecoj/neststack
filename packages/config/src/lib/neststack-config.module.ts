import { type DynamicModule, Module, type Provider } from '@nestjs/common';
import { ConfigService } from './config.service';
import { ConfigStore } from './config-store';
import { CONFIG_STORE, NESTSTACK_CONFIG_OPTIONS } from './constants';
import { defineConfig } from './define-config';
import type {
  ConfigDefinition,
  ConfigDefinitionInput,
  NestStackConfigModuleAsyncOptions,
  NestStackConfigModuleOptions,
  NestStackConfigOptionsFactory,
} from './interfaces';
import { EnvSource } from './loaders';

@Module({})
// biome-ignore lint/complexity/noStaticOnlyClass: NestJS @Module() requires a class; static members are the DynamicModule factory pattern
export class NestStackConfigModule {
  private static readonly globalStore = new ConfigStore();
  private static envSourceInstance: EnvSource = new EnvSource();
  private static initialized = false;

  static forRoot(options: NestStackConfigModuleOptions): DynamicModule {
    NestStackConfigModule.processConfigs(options);

    return {
      module: NestStackConfigModule,
      global: options.isGlobal ?? true,
      providers: [
        { provide: NESTSTACK_CONFIG_OPTIONS, useValue: options },
        { provide: CONFIG_STORE, useValue: NestStackConfigModule.globalStore },
        ConfigService,
      ],
      exports: [ConfigService, CONFIG_STORE],
    };
  }

  static forRootAsync(options: NestStackConfigModuleAsyncOptions): DynamicModule {
    const asyncProviders = NestStackConfigModule.createAsyncProviders(options);

    return {
      module: NestStackConfigModule,
      global: options.isGlobal ?? true,
      imports: options.imports ?? [],
      providers: [
        ...asyncProviders,
        { provide: CONFIG_STORE, useValue: NestStackConfigModule.globalStore },
        ConfigService,
        {
          provide: 'NESTSTACK_CONFIG_INIT',
          useFactory: (moduleOptions: NestStackConfigModuleOptions) => {
            NestStackConfigModule.processConfigs(moduleOptions);
            return true;
          },
          inject: [NESTSTACK_CONFIG_OPTIONS],
        },
      ],
      exports: [ConfigService, CONFIG_STORE],
    };
  }

  static forFeature(...configs: ConfigDefinitionInput[]): DynamicModule {
    const featureInitToken = Symbol('NESTSTACK_CONFIG_FEATURE_INIT');

    return {
      module: NestStackConfigModule,
      providers: [
        {
          provide: featureInitToken,
          useFactory: () => {
            if (!NestStackConfigModule.initialized) {
              throw new Error(
                'NestStackConfigModule.forFeature() called before forRoot(). Register forRoot() first.',
              );
            }
            for (const input of configs) {
              const config = NestStackConfigModule.normalizeConfig(input);
              const rawData = config.load
                ? config.load({ env: NestStackConfigModule.envSourceInstance })
                : {};
              NestStackConfigModule.globalStore.register(
                config,
                rawData as Record<string, unknown>,
              );
            }
          },
        },
        {
          provide: CONFIG_STORE,
          useFactory: (_init: unknown) => NestStackConfigModule.globalStore,
          inject: [featureInitToken],
        },
        ConfigService,
      ],
      exports: [ConfigService, CONFIG_STORE],
    };
  }

  /**
   * Resets internal state. Intended for testing only.
   */
  static reset(): void {
    NestStackConfigModule.globalStore.clear();
    NestStackConfigModule.envSourceInstance = new EnvSource();
    NestStackConfigModule.initialized = false;
  }

  private static normalizeConfig(input: ConfigDefinitionInput): ConfigDefinition {
    if (NestStackConfigModule.isConfigDefinition(input)) {
      return input;
    }
    return defineConfig(input);
  }

  private static isConfigDefinition(input: ConfigDefinitionInput): input is ConfigDefinition {
    return Object.isFrozen(input) && 'secretKeys' in input && Array.isArray(input.secretKeys);
  }

  private static processConfigs(options: NestStackConfigModuleOptions): void {
    NestStackConfigModule.envSourceInstance = new EnvSource(options.envSource);
    NestStackConfigModule.initialized = true;

    for (const config of options.configs) {
      const rawData = config.load
        ? config.load({ env: NestStackConfigModule.envSourceInstance })
        : {};
      const overrides = options.overrides?.[config.namespace];
      NestStackConfigModule.globalStore.register(
        config,
        rawData as Record<string, unknown>,
        overrides,
      );
    }
  }

  private static createAsyncProviders(options: NestStackConfigModuleAsyncOptions): Provider[] {
    if (options.useFactory) {
      return [
        {
          provide: NESTSTACK_CONFIG_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject ?? [],
        },
      ];
    }

    if (options.useClass) {
      return [
        {
          provide: options.useClass,
          useClass: options.useClass,
        },
        {
          provide: NESTSTACK_CONFIG_OPTIONS,
          useFactory: async (factory: NestStackConfigOptionsFactory) =>
            factory.createNestStackConfigOptions(),
          inject: [options.useClass],
        },
      ];
    }

    if (options.useExisting) {
      return [
        {
          provide: NESTSTACK_CONFIG_OPTIONS,
          useFactory: async (factory: NestStackConfigOptionsFactory) =>
            factory.createNestStackConfigOptions(),
          inject: [options.useExisting],
        },
      ];
    }

    throw new Error(
      'NestStackConfigModule.forRootAsync() requires useFactory, useClass, or useExisting',
    );
  }
}
