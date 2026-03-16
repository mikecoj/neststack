import { IEnvSource } from '../interfaces';

export class EnvSource implements IEnvSource {
  constructor(private readonly env: Record<string, string | undefined> = process.env) {}

  getString(key: string, defaultValue?: string): string {
    const value = this.env[key];
    if (value !== undefined && value !== '') {
      return value;
    }
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${key} is required but not set`);
  }

  getNumber(key: string, defaultValue?: number): number {
    const raw = this.env[key];
    if (raw !== undefined && raw !== '') {
      const parsed = Number(raw);
      if (Number.isNaN(parsed)) {
        throw new Error(
          `Environment variable ${key} must be a valid number, received: "${raw}"`,
        );
      }
      return parsed;
    }
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${key} is required but not set`);
  }

  getBoolean(key: string, defaultValue?: boolean): boolean {
    const raw = this.env[key];
    if (raw !== undefined && raw !== '') {
      return this.parseBoolean(key, raw);
    }
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${key} is required but not set`);
  }

  getOptionalString(key: string): string | undefined {
    const value = this.env[key];
    return value !== undefined && value !== '' ? value : undefined;
  }

  getOptionalNumber(key: string): number | undefined {
    const raw = this.env[key];
    if (raw === undefined || raw === '') {
      return undefined;
    }
    const parsed = Number(raw);
    if (Number.isNaN(parsed)) {
      throw new Error(
        `Environment variable ${key} must be a valid number, received: "${raw}"`,
      );
    }
    return parsed;
  }

  getOptionalBoolean(key: string): boolean | undefined {
    const raw = this.env[key];
    if (raw === undefined || raw === '') {
      return undefined;
    }
    return this.parseBoolean(key, raw);
  }

  private parseBoolean(key: string, raw: string): boolean {
    const lower = raw.toLowerCase();
    if (lower === 'true' || lower === '1' || lower === 'yes') {
      return true;
    }
    if (lower === 'false' || lower === '0' || lower === 'no') {
      return false;
    }
    throw new Error(
      `Environment variable ${key} must be a boolean (true/false/1/0/yes/no), received: "${raw}"`,
    );
  }
}
