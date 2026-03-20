import { defineConfig } from '@neststack/config';
import { z } from 'zod';

export const appConfig = defineConfig({
  namespace: 'app',
  schema: z.object({
    name: z.string().default('neststack-demo'),
    port: z.number().default(3000),
    environment: z.enum(['development', 'staging', 'production']).default('development'),
    debug: z.boolean().default(true),
  }),
});
