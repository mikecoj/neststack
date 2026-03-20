import { type ChildProcess, execSync, spawn } from 'node:child_process';

let serverProcess: ChildProcess | undefined;

async function waitForServer(url: string, timeoutMs = 60_000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // server not ready yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Server at ${url} did not start within ${timeoutMs}ms`);
}

export async function setup() {
  const host = process.env.HOST ?? 'localhost';
  const port = process.env.PORT ?? '3000';
  const baseUrl = `http://${host}:${port}`;

  // Build the demo app first
  execSync('pnpm nx build demo --skip-nx-cache', {
    stdio: 'inherit',
    cwd: process.env.NX_WORKSPACE_ROOT ?? process.cwd(),
    env: { ...process.env, DB_PASSWORD: 'test-secret', REDIS_PASSWORD: 'redis-secret' },
  });

  // Start the built app
  serverProcess = spawn('node', ['dist/apps/demo/main.js'], {
    cwd: process.env.NX_WORKSPACE_ROOT ?? process.cwd(),
    stdio: 'pipe',
    env: {
      ...process.env,
      PORT: port,
      NODE_ENV: 'test',
      DB_HOST: 'localhost',
      DB_PORT: '5432',
      DB_NAME: 'neststack_test',
      DB_USER: 'neststack',
      DB_PASSWORD: 'test-secret',
      REDIS_HOST: 'localhost',
      REDIS_PORT: '6379',
      REDIS_PASSWORD: 'redis-secret',
    },
  });

  serverProcess.stdout?.on('data', (data: Buffer) => {
    process.stdout.write(`[demo] ${data.toString()}`);
  });
  serverProcess.stderr?.on('data', (data: Buffer) => {
    process.stderr.write(`[demo:err] ${data.toString()}`);
  });

  await waitForServer(`${baseUrl}/health`);
}

export async function teardown() {
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
    await new Promise((r) => setTimeout(r, 1000));
    if (!serverProcess.killed) {
      serverProcess.kill('SIGKILL');
    }
  }
}
