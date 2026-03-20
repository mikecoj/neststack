import { BadRequestException, Controller, Get, Inject, Param } from '@nestjs/common';
import { CONFIG_STORE, ConfigService, type ConfigStore } from '@nestx/advanced-config';

const VALID_PATH_PATTERN = /^[a-zA-Z0-9._-]+$/;

@Controller('showcase')
export class ShowcaseController {
  constructor(
    private readonly config: ConfigService,
    @Inject(CONFIG_STORE) private readonly store: ConfigStore,
  ) {}

  private validatePath(path: string): void {
    if (!VALID_PATH_PATTERN.test(path)) {
      throw new BadRequestException('Invalid configuration path');
    }
  }

  @Get('get/:path')
  getValue(@Param('path') path: string) {
    this.validatePath(path);
    const explanation = this.config.explain(path);
    return {
      path,
      value: explanation.isSecret ? '********' : explanation.value,
    };
  }

  @Get('namespace/:name')
  getNamespace(@Param('name') name: string) {
    this.validatePath(name);
    return {
      namespace: name,
      config: this.config.namespace(name),
    };
  }

  @Get('explain/:path')
  explain(@Param('path') path: string) {
    this.validatePath(path);
    return this.config.explain(path);
  }

  @Get('safe')
  getSafe() {
    return this.store.getSafeAll();
  }

  @Get('all')
  getAll() {
    return this.store.getSafeAll();
  }

  @Get('overrides')
  getOverrides() {
    return {
      description:
        'Override values via forRoot({ overrides: { database: { poolSize: 50 } } }). ' +
        'Use explain to see which values come from overrides vs loaders vs defaults.',
      examples: {
        poolSize: this.config.explain('database.poolSize'),
        ssl: this.config.explain('database.ssl'),
        port: this.config.explain('app.port'),
      },
    };
  }
}
