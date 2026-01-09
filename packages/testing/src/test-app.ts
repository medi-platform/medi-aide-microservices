import { INestApplication, ModuleMetadata, Type, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as request from 'supertest';
import { createTestTypeOrmConfig, TestDatabaseConfig } from './test-database';

/**
 * Options for creating a test application
 */
export interface TestAppOptions {
  imports?: ModuleMetadata['imports'];
  controllers?: ModuleMetadata['controllers'];
  providers?: ModuleMetadata['providers'];
  entities?: Function[];
  dbConfig?: TestDatabaseConfig;
}

/**
 * Test application wrapper
 */
export class TestApp {
  private app: INestApplication;
  private module: TestingModule;

  private constructor(app: INestApplication, module: TestingModule) {
    this.app = app;
    this.module = module;
  }

  /**
   * Create a test application
   */
  static async create(options: TestAppOptions): Promise<TestApp> {
    const { imports = [], controllers = [], providers = [], entities = [], dbConfig } = options;

    // Add TypeORM module if entities are provided
    const typeOrmImports = entities.length > 0
      ? [
          TypeOrmModule.forRoot(createTestTypeOrmConfig(entities, dbConfig)),
          TypeOrmModule.forFeature(entities),
        ]
      : [];

    const moduleBuilder = Test.createTestingModule({
      imports: [...typeOrmImports, ...imports],
      controllers,
      providers,
    });

    const module = await moduleBuilder.compile();
    const app = module.createNestApplication();

    // Apply global pipes
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    await app.init();

    return new TestApp(app, module);
  }

  /**
   * Get the NestJS application instance
   */
  getApp(): INestApplication {
    return this.app;
  }

  /**
   * Get the testing module
   */
  getModule(): TestingModule {
    return this.module;
  }

  /**
   * Get a provider from the module
   */
  get<T>(typeOrToken: Type<T> | string | symbol): T {
    return this.module.get<T>(typeOrToken);
  }

  /**
   * Make HTTP requests to the application
   */
  request(): request.SuperTest<request.Test> {
    return request(this.app.getHttpServer());
  }

  /**
   * Close the application
   */
  async close(): Promise<void> {
    await this.app.close();
  }
}

/**
 * Helper function to create a test app quickly
 */
export async function createTestApp(options: TestAppOptions): Promise<TestApp> {
  return TestApp.create(options);
}
