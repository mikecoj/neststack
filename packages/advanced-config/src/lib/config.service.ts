import { Inject, Injectable } from '@nestjs/common';
import { CONFIG_STORE } from './constants';
import { ConfigStore } from './config-store';
import { ConfigExplanation } from './interfaces';
import type { Path, PathValue } from './types';

@Injectable()
export class ConfigService<TConfig extends Record<string, unknown> = Record<string, unknown>> {
  constructor(
    @Inject(CONFIG_STORE)
    private readonly store: ConfigStore,
  ) {}

  get<P extends string & Path<TConfig>>(path: P): PathValue<TConfig, P> {
    return this.store.get<PathValue<TConfig, P>>(path);
  }

  namespace<K extends string & keyof TConfig>(name: K): TConfig[K] {
    return this.store.getNamespace<TConfig[K]>(name);
  }

  explain(path: string): ConfigExplanation {
    return this.store.explain(path);
  }

  printSafe(): void {
    this.store.printSafe();
  }
}
