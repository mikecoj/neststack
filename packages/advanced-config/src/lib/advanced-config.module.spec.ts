import { Injectable } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { AdvancedConfigModule } from './advanced-config.module';
import { ConfigService } from './config.service';
import type { ConfigStore } from './config-store';
import { CONFIG_STORE } from './constants';
import { defineConfig } from './define-config';
import type { AdvancedConfigModuleOptions, AdvancedConfigOptionsFactory } from './interfaces';

const dbConfig = defineConfig({
  namespace: 'database',
  schema: z.object({
    url: z.string(),
    port: z.number().default(5432),
  }),
  load: ({ env }) => ({
    url: env.getString('DB_URL'),
    port: env.getNumber('DB_PORT', 5432),
  }),
});

describe('AdvancedConfigModule', () => {
  beforeEach(() => {
    AdvancedConfigModule.reset();
  });

  describe('forRoot', () => {
    it('should register configs and provide ConfigService', async () => {
      const module = await Test.createTestingModule({
        imports: [
          AdvancedConfigModule.forRoot({
            configs: [dbConfig],
            envSource: { DB_URL: 'postgres://localhost' },
            isGlobal: true,
          }),
        ],
      }).compile();

      const service = module.get(ConfigService);
      expect(service).toBeInstanceOf(ConfigService);
      expect(service.get('database.url')).toBe('postgres://localhost');
      expect(service.get('database.port')).toBe(5432);
    });

    it('should apply overrides', async () => {
      const module = await Test.createTestingModule({
        imports: [
          AdvancedConfigModule.forRoot({
            configs: [dbConfig],
            envSource: { DB_URL: 'postgres://prod' },
            overrides: { database: { url: 'postgres://test' } },
          }),
        ],
      }).compile();

      const service = module.get(ConfigService);
      expect(service.get('database.url')).toBe('postgres://test');
    });

    it('should handle configs without a load function', async () => {
      const simpleConfig = defineConfig({
        namespace: 'simple',
        schema: z.object({ enabled: z.boolean().default(true), name: z.string().default('app') }),
      });

      const module = await Test.createTestingModule({
        imports: [
          AdvancedConfigModule.forRoot({
            configs: [simpleConfig],
            envSource: {},
          }),
        ],
      }).compile();

      const service = module.get(ConfigService);
      expect(service.get('simple.enabled')).toBe(true);
      expect(service.get('simple.name')).toBe('app');
    });

    it('should register multiple configs', async () => {
      const authConfig = defineConfig({
        namespace: 'auth',
        schema: z.object({ issuer: z.string(), clientId: z.string() }),
        load: ({ env }) => ({
          issuer: env.getString('ISSUER'),
          clientId: env.getString('CLIENT_ID'),
        }),
      });

      const module = await Test.createTestingModule({
        imports: [
          AdvancedConfigModule.forRoot({
            configs: [dbConfig, authConfig],
            envSource: {
              DB_URL: 'postgres://localhost',
              ISSUER: 'https://auth.example.com',
              CLIENT_ID: 'test-client',
            },
          }),
        ],
      }).compile();

      const store = module.get<ConfigStore>(CONFIG_STORE);
      expect(store.size).toBe(2);
    });
  });

  describe('forRootAsync', () => {
    it('should support useFactory', async () => {
      const module = await Test.createTestingModule({
        imports: [
          AdvancedConfigModule.forRootAsync({
            useFactory: () => ({
              configs: [dbConfig],
              envSource: { DB_URL: 'postgres://async' },
            }),
          }),
        ],
      }).compile();

      const service = module.get(ConfigService);
      expect(service.get('database.url')).toBe('postgres://async');
    });

    it('should support useClass', async () => {
      @Injectable()
      class TestConfigFactory implements AdvancedConfigOptionsFactory {
        createAdvancedConfigOptions(): AdvancedConfigModuleOptions {
          return {
            configs: [dbConfig],
            envSource: { DB_URL: 'postgres://from-class' },
          };
        }
      }

      const module = await Test.createTestingModule({
        imports: [
          AdvancedConfigModule.forRootAsync({
            useClass: TestConfigFactory,
          }),
        ],
      }).compile();

      const service = module.get(ConfigService);
      expect(service.get('database.url')).toBe('postgres://from-class');
    });

    it('should support useExisting', async () => {
      @Injectable()
      class ExistingConfigFactory implements AdvancedConfigOptionsFactory {
        createAdvancedConfigOptions(): AdvancedConfigModuleOptions {
          return {
            configs: [dbConfig],
            envSource: { DB_URL: 'postgres://from-existing' },
          };
        }
      }

      const { Module: NestModule } = await import('@nestjs/common');

      @NestModule({
        providers: [ExistingConfigFactory],
        exports: [ExistingConfigFactory],
      })
      class FactoryModule {}

      const module = await Test.createTestingModule({
        imports: [
          AdvancedConfigModule.forRootAsync({
            imports: [FactoryModule],
            useExisting: ExistingConfigFactory,
          }),
        ],
      }).compile();

      const service = module.get(ConfigService);
      expect(service.get('database.url')).toBe('postgres://from-existing');
    });

    it('should throw when no factory method is provided', () => {
      expect(() => AdvancedConfigModule.forRootAsync({} as any)).toThrow(
        'requires useFactory, useClass, or useExisting',
      );
    });
  });

  describe('forFeature', () => {
    it('should register feature configs created with defineConfig', async () => {
      const featureConfig = defineConfig({
        namespace: 'feature',
        schema: z.object({ enabled: z.boolean().default(true) }),
      });

      const module = await Test.createTestingModule({
        imports: [
          AdvancedConfigModule.forRoot({
            configs: [dbConfig],
            envSource: { DB_URL: 'postgres://localhost' },
          }),
          AdvancedConfigModule.forFeature(featureConfig),
        ],
      }).compile();

      const service = module.get(ConfigService);
      expect(service.get('feature.enabled')).toBe(true);
    });

    it('should accept plain options without calling defineConfig first', async () => {
      const module = await Test.createTestingModule({
        imports: [
          AdvancedConfigModule.forRoot({
            configs: [dbConfig],
            envSource: { DB_URL: 'postgres://localhost' },
          }),
          AdvancedConfigModule.forFeature({
            namespace: 'cache',
            schema: z.object({
              ttl: z.number().default(3600),
              maxItems: z.number().default(1000),
            }),
          }),
        ],
      }).compile();

      const service = module.get(ConfigService);
      expect(service.get('cache.ttl')).toBe(3600);
      expect(service.get('cache.maxItems')).toBe(1000);
    });

    it('should accept plain options with loader and secretKeys', async () => {
      const module = await Test.createTestingModule({
        imports: [
          AdvancedConfigModule.forRoot({
            configs: [dbConfig],
            envSource: {
              DB_URL: 'postgres://localhost',
              REDIS_URL: 'redis://localhost:6379',
              REDIS_PASSWORD: 'secret',
            },
          }),
          AdvancedConfigModule.forFeature({
            namespace: 'redis',
            schema: z.object({ url: z.string(), password: z.string() }),
            load: ({ env }) => ({
              url: env.getString('REDIS_URL'),
              password: env.getString('REDIS_PASSWORD'),
            }),
            secretKeys: ['password'],
          }),
        ],
      }).compile();

      const service = module.get(ConfigService);
      expect(service.get('redis.url')).toBe('redis://localhost:6379');
      expect(service.explain('redis.password').isSecret).toBe(true);
    });

    it('should accept a mix of defineConfig output and plain options', async () => {
      const featureConfig = defineConfig({
        namespace: 'feature',
        schema: z.object({ enabled: z.boolean().default(true) }),
      });

      const module = await Test.createTestingModule({
        imports: [
          AdvancedConfigModule.forRoot({
            configs: [dbConfig],
            envSource: { DB_URL: 'postgres://localhost' },
          }),
          AdvancedConfigModule.forFeature(featureConfig, {
            namespace: 'flags',
            schema: z.object({ darkMode: z.boolean().default(false) }),
          }),
        ],
      }).compile();

      const service = module.get(ConfigService);
      expect(service.get('feature.enabled')).toBe(true);
      expect(service.get('flags.darkMode')).toBe(false);
    });
  });
});
