import { describe, it, expect, beforeEach } from 'vitest';
import { z } from 'zod';
import { ConfigStore } from './config-store';
import { ConfigService } from './config.service';
import { defineConfig } from './define-config';

describe('ConfigService', () => {
  let store: ConfigStore;
  let service: ConfigService;

  beforeEach(() => {
    store = new ConfigStore();

    const dbConfig = defineConfig({
      namespace: 'database',
      schema: z.object({
        url: z.string(),
        port: z.number().default(5432),
        password: z.string(),
      }),
      secretKeys: ['password'],
    });

    const authConfig = defineConfig({
      namespace: 'auth',
      schema: z.object({
        issuer: z.string(),
        clientId: z.string(),
      }),
    });

    store.register(dbConfig, { url: 'postgres://localhost', password: 's3cret' });
    store.register(authConfig, { issuer: 'https://auth.example.com', clientId: 'client-123' });

    service = new ConfigService(store);
  });

  describe('get', () => {
    it('should retrieve a config value by dot-path', () => {
      expect(service.get('database.url' as any)).toBe('postgres://localhost');
    });

    it('should retrieve a default value', () => {
      expect(service.get('database.port' as any)).toBe(5432);
    });

    it('should retrieve from different namespaces', () => {
      expect(service.get('auth.issuer' as any)).toBe('https://auth.example.com');
    });

    it('should throw for non-existent keys', () => {
      expect(() => service.get('missing.key' as any)).toThrow();
    });
  });

  describe('namespace', () => {
    it('should return a full namespace object', () => {
      const db = service.namespace('database' as any);
      expect(db).toEqual({
        url: 'postgres://localhost',
        port: 5432,
        password: 's3cret',
      });
    });

    it('should return a frozen namespace object', () => {
      const db = service.namespace('database' as any);
      expect(Object.isFrozen(db)).toBe(true);
    });

    it('should throw for non-existent namespace', () => {
      expect(() => service.namespace('missing' as any)).toThrow();
    });
  });

  describe('explain', () => {
    it('should explain a config value', () => {
      const explanation = service.explain('database.url');
      expect(explanation.path).toBe('database.url');
      expect(explanation.namespace).toBe('database');
      expect(explanation.key).toBe('url');
      expect(explanation.value).toBe('postgres://localhost');
      expect(explanation.source).toBe('loader');
      expect(explanation.isSecret).toBe(false);
    });

    it('should identify secret keys', () => {
      const explanation = service.explain('database.password');
      expect(explanation.isSecret).toBe(true);
    });
  });

  describe('printSafe', () => {
    it('should not throw', () => {
      expect(() => service.printSafe()).not.toThrow();
    });
  });
});
