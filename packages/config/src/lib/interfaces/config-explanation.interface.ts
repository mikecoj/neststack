export interface ConfigExplanation {
  path: string;
  namespace: string;
  key: string;
  value: unknown;
  source: 'loader' | 'default' | 'override';
  isSecret: boolean;
}
