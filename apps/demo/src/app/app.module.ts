import { Module } from '@nestjs/common';
import { AdvancedConfigModule } from '@nestx/advanced-config';
import { databaseConfig, redisConfig, appConfig } from '../config';
import { HealthModule } from '../modules/health/health.module';
import { ShowcaseModule } from '../modules/showcase/showcase.module';

@Module({
  imports: [
    AdvancedConfigModule.forRoot({
      configs: [databaseConfig, redisConfig, appConfig],
      isGlobal: true,
    }),
    HealthModule,
    ShowcaseModule,
  ],
})
export class AppModule {}
