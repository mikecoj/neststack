import { defineConfig } from '@nestx/advanced-config';
import { z } from 'zod';

export const appConfig = defineConfig({
  namespace: 'app',
  schema: z.object({
    name: z.string().default('nestx-demo'),
    port: z.number().default(3000),
    environment: z
      .enum(['development', 'staging', 'production'])
      .default('development'),
    debug: z.boolean().default(true),
  }),
});
