import { describe, expect, it } from 'vitest';
import { maskSecrets } from './mask-secrets';

describe('maskSecrets', () => {
  it('should mask specified secret keys', () => {
    const config = { database: { url: 'postgres://localhost', password: 's3cret' } };
    const secrets = new Set(['database.password']);

    const masked = maskSecrets(config, secrets);

    expect(masked).toEqual({
      database: { url: 'postgres://localhost', password: '********' },
    });
  });

  it('should leave non-secret keys untouched', () => {
    const config = { app: { name: 'my-app', port: 3000 } };
    const secrets = new Set<string>();

    const masked = maskSecrets(config, secrets);

    expect(masked).toEqual({ app: { name: 'my-app', port: 3000 } });
  });

  it('should handle multiple namespaces', () => {
    const config = {
      database: { url: 'test', password: 'secret1' },
      auth: { apiKey: 'secret2', issuer: 'https://auth.example.com' },
    };
    const secrets = new Set(['database.password', 'auth.apiKey']);

    const masked = maskSecrets(config, secrets);

    expect(masked).toEqual({
      database: { url: 'test', password: '********' },
      auth: { apiKey: '********', issuer: 'https://auth.example.com' },
    });
  });

  it('should handle arrays as leaf values', () => {
    const config = { tags: ['a', 'b'] };
    const secrets = new Set<string>();

    const masked = maskSecrets(config, secrets);

    expect(masked).toEqual({ tags: ['a', 'b'] });
  });

  it('should handle null values', () => {
    const config = { value: null };
    const secrets = new Set<string>();

    const masked = maskSecrets(config, secrets);

    expect(masked).toEqual({ value: null });
  });

  it('should handle empty config', () => {
    const masked = maskSecrets({}, new Set());
    expect(masked).toEqual({});
  });

  it('should mask top-level secret keys', () => {
    const config = { apiKey: 'secret', name: 'app' };
    const secrets = new Set(['apiKey']);

    const masked = maskSecrets(config, secrets);

    expect(masked).toEqual({ apiKey: '********', name: 'app' });
  });
});
