import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestx/advanced-config';

@Controller('health')
export class HealthController {
  constructor(private readonly config: ConfigService) {}

  @Get()
  check() {
    const healthConfig = this.config.namespace('health');
    return {
      status: 'ok',
      config: healthConfig,
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
