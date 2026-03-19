import { Controller, Get, Inject, Param } from '@nestjs/common';
import { CONFIG_STORE, type ConfigService, type ConfigStore } from '@nestx/advanced-config';

@Controller('showcase')
export class ShowcaseController {
  constructor(
    private readonly config: ConfigService,
    @Inject(CONFIG_STORE) private readonly store: ConfigStore,
  ) {}

  @Get('get/:path')
  getValue(@Param('path') path: string) {
    return {
      path,
      value: this.config.get(path),
    };
  }

  @Get('namespace/:name')
  getNamespace(@Param('name') name: string) {
    return {
      namespace: name,
      config: this.config.namespace(name),
    };
  }

  @Get('explain/:path')
  explain(@Param('path') path: string) {
    return this.config.explain(path);
  }

  @Get('safe')
  getSafe() {
    return this.store.getSafeAll();
  }

  @Get('all')
  getAll() {
    return this.store.getAll();
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
