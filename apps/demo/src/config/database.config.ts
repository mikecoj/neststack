import { defineConfig } from '@nestx/advanced-config';
import { z } from 'zod';

export const databaseConfig = defineConfig({
  namespace: 'database',
  schema: z.object({
    host: z.string(),
    port: z.number().int().min(1).max(65535).default(5432),
    name: z.string(),
    user: z.string(),
    password: z.string(),
    ssl: z.boolean().default(false),
    poolSize: z.number().min(1).max(100).default(10),
  }),
  load: ({ env }) => ({
    host: env.getString('DB_HOST', 'db'),
    port: env.getNumber('DB_PORT', 5432),
    name: env.getString('DB_NAME', 'nestx_demo'),
    user: env.getString('DB_USER', 'nestx'),
    password: env.getString('DB_PASSWORD'),
    ssl: env.getBoolean('DB_SSL', false),
    poolSize: env.getNumber('DB_POOL_SIZE', 10),
  }),
  secretKeys: ['password'],
});
