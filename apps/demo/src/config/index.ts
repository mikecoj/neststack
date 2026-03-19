export { appConfig } from './app.config';
export { databaseConfig } from './database.config';
export { redisConfig } from './redis.config';

import type { CombineConfigs } from '@nestx/advanced-config';
import type { appConfig } from './app.config';
import type { databaseConfig } from './database.config';
import type { redisConfig } from './redis.config';

/**
 * Merged type of all root-level config definitions registered in AppModule.
 * Pass as the type parameter to ConfigService for fully-typed path access:
 *
 * @example
 * const config = app.get<ConfigService<AppConfig>>(ConfigService);
 * config.get('app.port');       // → number
 * config.get('database.host');  // → string
 */
export type AppConfig = CombineConfigs<
  typeof appConfig | typeof databaseConfig | typeof redisConfig
>;
