import { defineConfig } from '@neststack/config';
import { z } from 'zod';

export const healthConfig = defineConfig({
  namespace: 'health',
  schema: z.object({
    intervalMs: z.number().default(30000),
    timeout: z.number().default(5000),
  }),
});
