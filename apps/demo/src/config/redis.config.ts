import { defineConfig } from '@neststack/config';
import { z } from 'zod';

export const redisConfig = defineConfig({
  namespace: 'redis',
  schema: z.object({
    host: z.string().default('redis'),
    port: z.number().default(6379),
    password: z.string(),
    db: z.number().default(0),
    keyPrefix: z.string().optional(),
  }),
  load: ({ env }) => ({
    host: env.getString('REDIS_HOST', 'redis'),
    port: env.getNumber('REDIS_PORT', 6379),
    password: env.getString('REDIS_PASSWORD'),
    db: env.getNumber('REDIS_DB', 0),
    keyPrefix: env.getOptionalString('REDIS_KEY_PREFIX'),
  }),
  secretKeys: ['password'],
});
