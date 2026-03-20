import { Controller, Get } from '@nestjs/common';
import type { CombineConfigs } from '@neststack/config';
import { ConfigService } from '@neststack/config';
import type { healthConfig } from './health.config';

type HealthConfigType = CombineConfigs<typeof healthConfig>;

@Controller('health')
export class HealthController {
  constructor(private readonly config: ConfigService<HealthConfigType>) {}

  @Get()
  check() {
    const health = this.config.namespace('health');
    return {
      status: 'ok',
      config: health,
    };
  }

  @Get('explain')
  explain() {
    return {
      intervalMs: this.config.explain('health.intervalMs'),
      timeout: this.config.explain('health.timeout'),
    };
  }
}
