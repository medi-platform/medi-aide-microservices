export type ReadSource = 'monolith' | 'micro' | 'dual';

export interface MigrationOptions {
  serviceName: string;
  readSource: ReadSource;
  dualWriteEnabled: boolean;
  secondaryApiBase?: string; // monolith base URL, e.g. http://host.docker.internal:3000
  requestTimeoutMs?: number;
}

export interface DualWriteResult<TPrimary, TSecondary> {
  primaryResult?: TPrimary;
  secondaryResult?: TSecondary;
  primaryError?: Error;
  secondaryError?: Error;
}

export interface WriteActions<TPrimary, TSecondary> {
  primary: () => Promise<TPrimary>;
  secondary?: () => Promise<TSecondary>;
}



