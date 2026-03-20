import { Module } from '@nestjs/common';
import { NestStackConfigModule } from '@neststack/config';
import { healthConfig } from './health.config';
import { HealthController } from './health.controller';

@Module({
  imports: [NestStackConfigModule.forFeature(healthConfig)],
  controllers: [HealthController],
})
export class HealthModule {}
