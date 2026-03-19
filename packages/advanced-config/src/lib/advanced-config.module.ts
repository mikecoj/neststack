import { type DynamicModule, Module, type Provider } from '@nestjs/common';
import { ConfigService } from './config.service';
import { ConfigStore } from './config-store';
import { ADVANCED_CONFIG_OPTIONS, CONFIG_STORE } from './constants';
import { defineConfig } from './define-config';
import type {
  AdvancedConfigModuleAsyncOptions,
  AdvancedConfigModuleOptions,
  AdvancedConfigOptionsFactory,
  ConfigDefinition,
  ConfigDefinitionInput,
} from './interfaces';
import { EnvSource } from './loaders';

@Module({})
// biome-ignore lint/complexity/noStaticOnlyClass: NestJS @Module() requires a class; static members are the DynamicModule factory pattern
export class AdvancedConfigModule {
  private static readonly globalStore = new ConfigStore();
  private static envSourceInstance: EnvSource = new EnvSource();

  static forRoot(options: AdvancedConfigModuleOptions): DynamicModule {
    AdvancedConfigModule.processConfigs(options);

    return {
      module: AdvancedConfigModule,
      global: options.isGlobal ?? true,
      providers: [
        { provide: ADVANCED_CONFIG_OPTIONS, useValue: options },
        { provide: CONFIG_STORE, useValue: AdvancedConfigModule.globalStore },
        ConfigService,
      ],
      exports: [ConfigService, CONFIG_STORE],
    };
  }

  static forRootAsync(options: AdvancedConfigModuleAsyncOptions): DynamicModule {
    const asyncProviders = AdvancedConfigModule.createAsyncProviders(options);

    return {
      module: AdvancedConfigModule,
      global: options.isGlobal ?? true,
      imports: options.imports ?? [],
      providers: [
        ...asyncProviders,
        { provide: CONFIG_STORE, useValue: AdvancedConfigModule.globalStore },
        ConfigService,
        {
          provide: 'ADVANCED_CONFIG_INIT',
          useFactory: (moduleOptions: AdvancedConfigModuleOptions) => {
            AdvancedConfigModule.processConfigs(moduleOptions);
            return true;
          },
          inject: [ADVANCED_CONFIG_OPTIONS],
        },
      ],
      exports: [ConfigService, CONFIG_STORE],
    };
  }

  static forFeature(...configs: ConfigDefinitionInput[]): DynamicModule {
    for (const input of configs) {
      const config = AdvancedConfigModule.normalizeConfig(input);
      const rawData = config.load
        ? config.load({ env: AdvancedConfigModule.envSourceInstance })
        : {};
      AdvancedConfigModule.globalStore.register(config, rawData as Record<string, unknown>);
    }

    return {
      module: AdvancedConfigModule,
      providers: [
        { provide: CONFIG_STORE, useValue: AdvancedConfigModule.globalStore },
        ConfigService,
      ],
      exports: [ConfigService, CONFIG_STORE],
    };
  }

  /**
   * Resets internal state. Intended for testing only.
   */
  static reset(): void {
    const freshStore = new ConfigStore();

    for (const key of Object.getOwnPropertyNames(freshStore)) {
      (AdvancedConfigModule.globalStore as unknown as Record<string, unknown>)[key] = (
        freshStore as unknown as Record<string, unknown>
      )[key];
    }

    AdvancedConfigModule.envSourceInstance = new EnvSource();
  }

  private static normalizeConfig(input: ConfigDefinitionInput): ConfigDefinition {
    if (AdvancedConfigModule.isConfigDefinition(input)) {
      return input;
    }
    return defineConfig(input);
  }

  private static isConfigDefinition(input: ConfigDefinitionInput): input is ConfigDefinition {
    return Object.isFrozen(input) && 'secretKeys' in input && Array.isArray(input.secretKeys);
  }

  private static processConfigs(options: AdvancedConfigModuleOptions): void {
    AdvancedConfigModule.envSourceInstance = new EnvSource(options.envSource);

    for (const config of options.configs) {
      const rawData = config.load
        ? config.load({ env: AdvancedConfigModule.envSourceInstance })
        : {};
      const overrides = options.overrides?.[config.namespace];
      AdvancedConfigModule.globalStore.register(
        config,
        rawData as Record<string, unknown>,
        overrides as Record<string, unknown> | undefined,
      );
    }
  }

  private static createAsyncProviders(options: AdvancedConfigModuleAsyncOptions): Provider[] {
    if (options.useFactory) {
      return [
        {
          provide: ADVANCED_CONFIG_OPTIONS,
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
          provide: ADVANCED_CONFIG_OPTIONS,
          useFactory: async (factory: AdvancedConfigOptionsFactory) =>
            factory.createAdvancedConfigOptions(),
          inject: [options.useClass],
        },
      ];
    }

    if (options.useExisting) {
      return [
        {
          provide: ADVANCED_CONFIG_OPTIONS,
          useFactory: async (factory: AdvancedConfigOptionsFactory) =>
            factory.createAdvancedConfigOptions(),
          inject: [options.useExisting],
        },
      ];
    }

    throw new Error(
      'AdvancedConfigModule.forRootAsync() requires useFactory, useClass, or useExisting',
    );
  }
}
