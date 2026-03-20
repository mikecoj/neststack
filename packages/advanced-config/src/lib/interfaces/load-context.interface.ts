import type { IEnvSource } from './env-source.interface';

export interface SecretSource {
  get(key: string): Promise<string>;
  getOptional(key: string): Promise<string | undefined>;
}

export interface FileSource {
  json(path: string): unknown;
  yaml(path: string): unknown;
  text(path: string): string;
}

export interface LoadContext {
  env: IEnvSource;
  secrets?: SecretSource;
  files?: FileSource;
}
