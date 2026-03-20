import { Module } from '@nestjs/common';
import { AdvancedConfigModule } from '@nestx/advanced-config';
import { healthConfig } from './health.config';
import { HealthController } from './health.controller';

@Module({
  imports: [AdvancedConfigModule.forFeature(healthConfig)],
  controllers: [HealthController],
})
export class HealthModule {}
