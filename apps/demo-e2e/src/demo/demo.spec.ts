import axios from 'axios';
import { describe, expect, it } from 'vitest';

describe('Health endpoints', () => {
  it('GET /health — should return status ok with config', async () => {
    const res = await axios.get('/health');

    expect(res.status).toBe(200);
    expect(res.data).toMatchObject({
      status: 'ok',
      config: {
        intervalMs: 30000,
        timeout: 5000,
      },
    });
  });

  it('GET /health/explain — should explain health config keys', async () => {
    const res = await axios.get('/health/explain');

    expect(res.status).toBe(200);
    expect(res.data.intervalMs).toMatchObject({
      path: 'health.intervalMs',
      namespace: 'health',
      key: 'intervalMs',
      value: 30000,
      source: 'default',
      isSecret: false,
    });
    expect(res.data.timeout).toMatchObject({
      path: 'health.timeout',
      namespace: 'health',
      key: 'timeout',
      value: 5000,
      source: 'default',
      isSecret: false,
    });
  });
});

describe('Showcase endpoints', () => {
  it('GET /showcase/safe — should return all config with secrets masked', async () => {
    const res = await axios.get('/showcase/safe');

    expect(res.status).toBe(200);

    // Verify all registered namespaces are present
    expect(res.data).toHaveProperty('app');
    expect(res.data).toHaveProperty('database');
    expect(res.data).toHaveProperty('redis');
    expect(res.data).toHaveProperty('health');

    // Verify app config defaults
    expect(res.data.app).toMatchObject({
      name: 'neststack-demo',
      port: 3000,
      environment: 'development',
      debug: true,
    });

    // Verify secrets are masked
    expect(res.data.database.password).toBe('********');
    expect(res.data.redis.password).toBe('********');

    // Verify database config loaded from env
    expect(res.data.database.host).toBe('localhost');
    expect(res.data.database.port).toBe(5432);
    expect(res.data.database.name).toBe('neststack_test');
    expect(res.data.database.user).toBe('neststack');
  });

  it('GET /showcase/all — should also return safe config (no raw secrets)', async () => {
    const res = await axios.get('/showcase/all');

    expect(res.status).toBe(200);
    expect(res.data.database.password).toBe('********');
    expect(res.data.redis.password).toBe('********');
  });

  it('GET /showcase/get/:path — should return a single config value', async () => {
    const res = await axios.get('/showcase/get/app.port');

    expect(res.status).toBe(200);
    expect(res.data).toEqual({
      path: 'app.port',
      value: 3000,
    });
  });

  it('GET /showcase/get/:path — should mask secret values', async () => {
    const res = await axios.get('/showcase/get/database.password');

    expect(res.status).toBe(200);
    expect(res.data).toEqual({
      path: 'database.password',
      value: '********',
    });
  });

  it('GET /showcase/get/:path — should reject invalid path patterns', async () => {
    const res = await axios.get('/showcase/get/no_such_key!@#', {
      validateStatus: () => true,
    });

    expect(res.status).toBe(400);
  });

  it('GET /showcase/namespace/:name — should return full namespace', async () => {
    const res = await axios.get('/showcase/namespace/app');

    expect(res.status).toBe(200);
    expect(res.data).toEqual({
      namespace: 'app',
      config: {
        name: 'neststack-demo',
        port: 3000,
        environment: 'development',
        debug: true,
      },
    });
  });

  it('GET /showcase/namespace/:name — should return redis namespace with secrets visible (namespace returns raw)', async () => {
    const res = await axios.get('/showcase/namespace/redis');

    expect(res.status).toBe(200);
    expect(res.data.namespace).toBe('redis');
    expect(res.data.config).toHaveProperty('host');
    expect(res.data.config).toHaveProperty('port');
    expect(res.data.config).toHaveProperty('password');
  });

  it('GET /showcase/explain/:path — should explain a loader-sourced value', async () => {
    const res = await axios.get('/showcase/explain/database.host');

    expect(res.status).toBe(200);
    expect(res.data).toMatchObject({
      path: 'database.host',
      namespace: 'database',
      key: 'host',
      value: 'localhost',
      source: 'loader',
      isSecret: false,
    });
  });

  it('GET /showcase/explain/:path — should explain a default-sourced value', async () => {
    const res = await axios.get('/showcase/explain/app.name');

    expect(res.status).toBe(200);
    expect(res.data).toMatchObject({
      path: 'app.name',
      namespace: 'app',
      key: 'name',
      value: 'neststack-demo',
      source: 'default',
      isSecret: false,
    });
  });

  it('GET /showcase/explain/:path — should explain a secret and mask value', async () => {
    const res = await axios.get('/showcase/explain/database.password');

    expect(res.status).toBe(200);
    expect(res.data).toMatchObject({
      path: 'database.password',
      namespace: 'database',
      key: 'password',
      source: 'loader',
      isSecret: true,
      value: '********',
    });
  });

  it('GET /showcase/overrides — should show override explanation', async () => {
    const res = await axios.get('/showcase/overrides');

    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty('description');
    expect(res.data).toHaveProperty('examples');
    expect(res.data.examples.poolSize).toMatchObject({
      path: 'database.poolSize',
      source: 'loader',
    });
    expect(res.data.examples.port).toMatchObject({
      path: 'app.port',
      source: 'default',
    });
  });
});

describe('Config data integrity', () => {
  it('should have consistent data between safe and individual get', async () => {
    const [safeRes, portRes, nameRes] = await Promise.all([
      axios.get('/showcase/safe'),
      axios.get('/showcase/get/app.port'),
      axios.get('/showcase/get/app.name'),
    ]);

    expect(safeRes.data.app.port).toBe(portRes.data.value);
    expect(safeRes.data.app.name).toBe(nameRes.data.value);
  });

  it('should reflect environment variables in database config', async () => {
    const res = await axios.get('/showcase/namespace/database');

    // These were set via env vars in global-setup
    expect(res.data.config.host).toBe('localhost');
    expect(res.data.config.name).toBe('neststack_test');
    expect(res.data.config.user).toBe('neststack');
    expect(res.data.config.port).toBe(5432);
    expect(res.data.config.ssl).toBe(false);
    expect(res.data.config.poolSize).toBe(10);
  });

  it('should have redis config loaded from env', async () => {
    const res = await axios.get('/showcase/namespace/redis');

    expect(res.data.config.host).toBe('localhost');
    expect(res.data.config.port).toBe(6379);
    expect(res.data.config.db).toBe(0);
  });

  it('forFeature health module should register independently', async () => {
    // Health was registered via forFeature (not forRoot), test it works
    const res = await axios.get('/health');
    expect(res.status).toBe(200);
    expect(res.data.config.intervalMs).toBe(30000);

    // And it should also be visible in the global safe config
    const safeRes = await axios.get('/showcase/safe');
    expect(safeRes.data.health).toEqual({
      intervalMs: 30000,
      timeout: 5000,
    });
  });
});
