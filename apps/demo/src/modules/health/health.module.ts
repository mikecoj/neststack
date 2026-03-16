import { Module } from '@nestjs/common';
import { AdvancedConfigModule } from '@nestx/advanced-config';
import { z } from 'zod';
import { HealthController } from './health.controller';

@Module({
  imports: [
    AdvancedConfigModule.forFeature({
      namespace: 'health',
      schema: z.object({
        intervalMs: z.number().default(30000),
        timeout: z.number().default(5000),
      }),
    }),
  ],
  controllers: [HealthController],
})
export class HealthModule {}
