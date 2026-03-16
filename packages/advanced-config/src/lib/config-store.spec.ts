import { describe, it, expect, beforeEach, vi } from 'vitest';
import { z } from 'zod';
import { ConfigStore } from './config-store';
import { defineConfig } from './define-config';

describe('ConfigStore', () => {
  let store: ConfigStore;

  beforeEach(() => {
    store = new ConfigStore();
  });

  describe('register', () => {
    it('should register a valid config namespace', () => {
      const config = defineConfig({
        namespace: 'database',
        schema: z.object({ url: z.string(), port: z.number().default(5432) }),
      });

      store.register(config, { url: 'postgres://localhost' });

      expect(store.size).toBe(1);
      expect(store.get('database.url')).toBe('postgres://localhost');
      expect(store.get('database.port')).toBe(5432);
    });

    it('should throw on duplicate namespace registration', () => {
      const config = defineConfig({
        namespace: 'app',
        schema: z.object({ name: z.string() }),
      });

      store.register(config, { name: 'test' });

      expect(() => store.register(config, { name: 'test2' })).toThrow(
        'Configuration namespace "app" is already registered',
      );
    });

    it('should throw on validation failure', () => {
      const config = defineConfig({
        namespace: 'database',
        schema: z.object({ url: z.string().url(), port: z.number() }),
      });

      expect(() => store.register(config, { url: 'not-a-url', port: 'bad' })).toThrow(
        'Config validation failed for namespace "database"',
      );
    });

    it('should apply overrides', () => {
      const config = defineConfig({
        namespace: 'database',
        schema: z.object({ url: z.string(), poolSize: z.number().default(10) }),
      });

      store.register(config, { url: 'postgres://prod' }, { url: 'postgres://test' });

      expect(store.get('database.url')).toBe('postgres://test');
    });

    it('should freeze registered config data', () => {
      const config = defineConfig({
        namespace: 'app',
        schema: z.object({ name: z.string() }),
      });

      store.register(config, { name: 'test' });

      const ns = store.getNamespace<{ name: string }>('app');
      expect(Object.isFrozen(ns)).toBe(true);
      expect(() => {
        (ns as any).name = 'mutated';
      }).toThrow();
    });

    it('should track secret keys', () => {
      const config = defineConfig({
        namespace: 'database',
        schema: z.object({ url: z.string(), password: z.string() }),
        secretKeys: ['password'],
      });

      store.register(config, { url: 'postgres://localhost', password: 's3cret' });

      const explanation = store.explain('database.password');
      expect(explanation.isSecret).toBe(true);
    });
  });

  describe('get', () => {
    it('should retrieve values by dot-path', () => {
      const config = defineConfig({
        namespace: 'auth',
        schema: z.object({ issuer: z.string(), clientId: z.string() }),
      });

      store.register(config, { issuer: 'https://auth.example.com', clientId: 'my-client' });

      expect(store.get('auth.issuer')).toBe('https://auth.example.com');
      expect(store.get('auth.clientId')).toBe('my-client');
    });

    it('should throw for non-existent keys', () => {
      expect(() => store.get('missing.key')).toThrow(
        'Configuration key "missing.key" does not exist',
      );
    });
  });

  describe('getNamespace', () => {
    it('should return the full namespace object', () => {
      const config = defineConfig({
        namespace: 'app',
        schema: z.object({ name: z.string(), port: z.number() }),
      });

      store.register(config, { name: 'my-app', port: 3000 });

      expect(store.getNamespace('app')).toEqual({ name: 'my-app', port: 3000 });
    });

    it('should throw for non-existent namespace', () => {
      expect(() => store.getNamespace('missing')).toThrow(
        'Configuration namespace "missing" is not registered',
      );
    });
  });

  describe('explain', () => {
    it('should explain a loader-sourced value', () => {
      const config = defineConfig({
        namespace: 'db',
        schema: z.object({ url: z.string() }),
      });

      store.register(config, { url: 'postgres://localhost' });

      const explanation = store.explain('db.url');
      expect(explanation).toEqual({
        path: 'db.url',
        namespace: 'db',
        key: 'url',
        value: 'postgres://localhost',
        source: 'loader',
        isSecret: false,
      });
    });

    it('should explain an overridden value', () => {
      const config = defineConfig({
        namespace: 'db',
        schema: z.object({ url: z.string() }),
      });

      store.register(config, { url: 'postgres://prod' }, { url: 'postgres://test' });

      const explanation = store.explain('db.url');
      expect(explanation.source).toBe('override');
    });

    it('should explain a default value', () => {
      const config = defineConfig({
        namespace: 'db',
        schema: z.object({ url: z.string(), poolSize: z.number().default(10) }),
      });

      store.register(config, { url: 'postgres://localhost' });

      const explanation = store.explain('db.poolSize');
      expect(explanation.source).toBe('default');
      expect(explanation.value).toBe(10);
    });

    it('should fallback to default source for deep nested paths not in source map', () => {
      const config = defineConfig({
        namespace: 'db',
        schema: z.object({
          conn: z.object({ host: z.string(), port: z.number() }),
        }),
      });

      store.register(config, { conn: { host: 'localhost', port: 5432 } });

      const explanation = store.explain('db.conn.host');
      expect(explanation.namespace).toBe('db');
      expect(explanation.key).toBe('conn.host');
      expect(explanation.source).toBe('default');
    });

    it('should explain a namespace-level path (no dot)', () => {
      const config = defineConfig({
        namespace: 'app',
        schema: z.object({ name: z.string() }),
      });

      store.register(config, { name: 'my-app' });

      const explanation = store.explain('app');
      expect(explanation.namespace).toBe('app');
      expect(explanation.key).toBe('');
      expect(explanation.source).toBe('loader');
    });

    it('should throw for non-existent namespace', () => {
      expect(() => store.explain('missing.key')).toThrow(
        'Configuration namespace "missing" is not registered',
      );
    });
  });

  describe('printSafe', () => {
    it('should log config with secrets masked', () => {
      const logSpy = vi.spyOn((store as any).logger, 'log').mockImplementation(() => {});

      const config = defineConfig({
        namespace: 'db',
        schema: z.object({ url: z.string(), password: z.string() }),
        secretKeys: ['password'],
      });

      store.register(config, { url: 'postgres://localhost', password: 's3cret' });
      store.printSafe();

      expect(logSpy).toHaveBeenCalledTimes(1);
      const loggedMessage = logSpy.mock.calls[0][0] as string;
      expect(loggedMessage).toContain('********');
      expect(loggedMessage).not.toContain('s3cret');
      expect(loggedMessage).toContain('postgres://localhost');
    });
  });

  describe('getSafeAll', () => {
    it('should return all config with secrets masked', () => {
      const config = defineConfig({
        namespace: 'db',
        schema: z.object({ url: z.string(), password: z.string() }),
        secretKeys: ['password'],
      });

      store.register(config, { url: 'postgres://localhost', password: 's3cret' });

      const safe = store.getSafeAll();
      expect(safe).toEqual({
        db: { url: 'postgres://localhost', password: '********' },
      });
    });
  });
});
