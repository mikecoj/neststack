import { DynamicModule, Module, Provider, Type } from '@nestjs/common';
import { ADVANCED_CONFIG_OPTIONS, CONFIG_STORE } from './constants';
import { ConfigStore } from './config-store';
import { ConfigService } from './config.service';
import { EnvSource } from './loaders';
import {
  AdvancedConfigModuleOptions,
  AdvancedConfigModuleAsyncOptions,
  AdvancedConfigOptionsFactory,
  ConfigDefinition,
  ConfigDefinitionInput,
} from './interfaces';
import { defineConfig } from './define-config';

@Module({})
export class AdvancedConfigModule {
  private static readonly globalStore = new ConfigStore();
  private static envSourceInstance: EnvSource = new EnvSource();

  static forRoot(options: AdvancedConfigModuleOptions): DynamicModule {
    this.processConfigs(options);

    return {
      module: AdvancedConfigModule,
      global: options.isGlobal ?? true,
      providers: [
        { provide: ADVANCED_CONFIG_OPTIONS, useValue: options },
        { provide: CONFIG_STORE, useValue: this.globalStore },
        ConfigService,
      ],
      exports: [ConfigService, CONFIG_STORE],
    };
  }

  static forRootAsync(options: AdvancedConfigModuleAsyncOptions): DynamicModule {
    const asyncProviders = this.createAsyncProviders(options);

    return {
      module: AdvancedConfigModule,
      global: options.isGlobal ?? true,
      imports: options.imports ?? [],
      providers: [
        ...asyncProviders,
        { provide: CONFIG_STORE, useValue: this.globalStore },
        ConfigService,
        {
          provide: 'ADVANCED_CONFIG_INIT',
          useFactory: (moduleOptions: AdvancedConfigModuleOptions) => {
            this.processConfigs(moduleOptions);
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
      const config = this.normalizeConfig(input);
      const rawData = config.load ? config.load({ env: this.envSourceInstance }) : {};
      this.globalStore.register(config, rawData as Record<string, unknown>);
    }

    return {
      module: AdvancedConfigModule,
      providers: [
        { provide: CONFIG_STORE, useValue: this.globalStore },
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
    const storeProto = Object.getPrototypeOf(this.globalStore);
    const freshProto = Object.getPrototypeOf(freshStore);

    for (const key of Object.getOwnPropertyNames(freshStore)) {
      (this.globalStore as any)[key] = (freshStore as any)[key];
    }

    this.envSourceInstance = new EnvSource();
  }

  private static normalizeConfig(input: ConfigDefinitionInput): ConfigDefinition {
    if (this.isConfigDefinition(input)) {
      return input;
    }
    return defineConfig(input);
  }

  private static isConfigDefinition(input: ConfigDefinitionInput): input is ConfigDefinition {
    return Object.isFrozen(input) && 'secretKeys' in input && Array.isArray(input.secretKeys);
  }

  private static processConfigs(options: AdvancedConfigModuleOptions): void {
    this.envSourceInstance = new EnvSource(options.envSource);

    for (const config of options.configs) {
      const rawData = config.load
        ? config.load({ env: this.envSourceInstance })
        : {};
      const overrides = options.overrides?.[config.namespace];
      this.globalStore.register(
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
