import { Inject, Injectable, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { AdvancedConfigModule } from './advanced-config.module';
import { ConfigService } from './config.service';
import type { ConfigStore } from './config-store';
import { CONFIG_STORE } from './constants';
import { defineConfig } from './define-config';

const databaseConfig = defineConfig({
  namespace: 'database',
  schema: z.object({
    url: z.string().url(),
    poolSize: z.number().default(10),
    ssl: z.boolean().default(false),
    password: z.string(),
  }),
  load: ({ env }) => ({
    url: env.getString('DB_URL'),
    poolSize: env.getNumber('DB_POOL', 10),
    ssl: env.getBoolean('DB_SSL', false),
    password: env.getString('DB_PASSWORD'),
  }),
  secretKeys: ['password'],
});

const authConfig = defineConfig({
  namespace: 'auth',
  schema: z.object({
    issuer: z.string().url(),
    clientId: z.string(),
    audience: z.string().optional(),
  }),
  load: ({ env }) => ({
    issuer: env.getString('OIDC_ISSUER'),
    clientId: env.getString('OIDC_CLIENT_ID'),
    audience: env.getOptionalString('OIDC_AUDIENCE'),
  }),
});

describe('Integration Test', () => {
  beforeEach(() => {
    AdvancedConfigModule.reset();
  });

  it('should work end-to-end with loaders, validation, and service injection', async () => {
    @Injectable()
    class DatabaseService {
      constructor(@Inject(CONFIG_STORE) private readonly store: ConfigStore) {}

      getConnectionUrl(): string {
        return this.store.get<string>('database.url');
      }

      getPoolSize(): number {
        return this.store.get<number>('database.poolSize');
      }
    }

    @Module({
      providers: [DatabaseService],
      exports: [DatabaseService],
    })
    class DatabaseModule {}

    const module = await Test.createTestingModule({
      imports: [
        AdvancedConfigModule.forRoot({
          configs: [databaseConfig, authConfig],
          envSource: {
            DB_URL: 'postgres://localhost:5432/mydb',
            DB_PASSWORD: 'super-secret',
            OIDC_ISSUER: 'https://auth.example.com',
            OIDC_CLIENT_ID: 'client-123',
          },
        }),
        DatabaseModule,
      ],
    }).compile();

    const dbService = module.get(DatabaseService);
    const configService = module.get(ConfigService);

    expect(dbService.getConnectionUrl()).toBe('postgres://localhost:5432/mydb');
    expect(dbService.getPoolSize()).toBe(10);

    expect(configService.get('auth.issuer')).toBe('https://auth.example.com');
    expect(configService.get('auth.clientId')).toBe('client-123');

    const dbNamespace = configService.namespace('database');
    expect(Object.isFrozen(dbNamespace)).toBe(true);
    expect((dbNamespace as any).ssl).toBe(false);

    const explanation = configService.explain('database.password');
    expect(explanation.isSecret).toBe(true);
    expect(explanation.value).toBe('********');
    expect(explanation.source).toBe('loader');
  });

  it('should work with forFeature for modular config registration', async () => {
    const paymentsConfig = defineConfig({
      namespace: 'payments',
      schema: z.object({
        apiKey: z.string(),
        currency: z.string().default('USD'),
      }),
      load: ({ env }) => ({
        apiKey: env.getString('PAYMENTS_API_KEY'),
      }),
      secretKeys: ['apiKey'],
    });

    const module = await Test.createTestingModule({
      imports: [
        AdvancedConfigModule.forRoot({
          configs: [databaseConfig],
          envSource: {
            DB_URL: 'postgres://localhost:5432/mydb',
            DB_PASSWORD: 'pass',
            PAYMENTS_API_KEY: 'pk_test_123',
          },
        }),
        AdvancedConfigModule.forFeature(paymentsConfig),
      ],
    }).compile();

    const service = module.get(ConfigService);

    expect(service.get('database.url')).toBe('postgres://localhost:5432/mydb');
    expect(service.get('payments.apiKey')).toBe('pk_test_123');
    expect(service.get('payments.currency')).toBe('USD');

    const safeExplanation = service.explain('payments.apiKey');
    expect(safeExplanation.isSecret).toBe(true);
  });

  it('should support testing overrides', async () => {
    const module = await Test.createTestingModule({
      imports: [
        AdvancedConfigModule.forRoot({
          configs: [databaseConfig],
          envSource: {
            DB_URL: 'postgres://prod:5432/proddb',
            DB_PASSWORD: 'prod-secret',
          },
          overrides: {
            database: {
              url: 'postgres://localhost:5432/testdb',
              password: 'test-pass',
            },
          },
        }),
      ],
    }).compile();

    const service = module.get(ConfigService);
    expect(service.get('database.url')).toBe('postgres://localhost:5432/testdb');
    expect(service.get('database.password')).toBe('test-pass');
  });

  it('should reject invalid configuration at bootstrap', () => {
    expect(() =>
      AdvancedConfigModule.forRoot({
        configs: [databaseConfig],
        envSource: {
          DB_URL: 'not-a-valid-url',
          DB_PASSWORD: 'pass',
        },
      }),
    ).toThrow('Config validation failed');
  });
});
