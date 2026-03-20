export interface IEnvSource {
  getString(key: string, defaultValue?: string): string;
  getNumber(key: string, defaultValue?: number): number;
  getBoolean(key: string, defaultValue?: boolean): boolean;
  getOptionalString(key: string): string | undefined;
  getOptionalNumber(key: string): number | undefined;
  getOptionalBoolean(key: string): boolean | undefined;
}
