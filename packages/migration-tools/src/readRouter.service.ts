import { Injectable } from '@nestjs/common';
import { MigrationOptions, ReadSource } from './types';

@Injectable()
export class ReadRouterService {
  constructor(private readonly options: MigrationOptions) {}

  getSource(): ReadSource {
    return this.options.readSource;
  }

  shouldReadFromMonolith(): boolean {
    return this.options.readSource === 'monolith';
  }

  shouldReadFromMicro(): boolean {
    return this.options.readSource === 'micro';
  }

  isDualMode(): boolean {
    return this.options.readSource === 'dual';
  }
}



