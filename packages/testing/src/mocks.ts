import { v4 as uuid } from 'uuid';

/**
 * Mock ConfigService
 */
export const mockConfigService = {
  get: jest.fn((key: string, defaultValue?: any) => {
    const config: Record<string, any> = {
      NODE_ENV: 'test',
      PORT: 3000,
      DB_HOST: 'localhost',
      DB_PORT: 5432,
      DB_USER: 'postgres',
      DB_PASSWORD: 'postgres',
      DB_DATABASE: 'test_db',
      JWT_SECRET: 'test-secret',
      SERVICE_JWT_SECRET: 'service-test-secret',
      KAFKA_BROKERS: 'localhost:9092',
      REDIS_HOST: 'localhost',
      REDIS_PORT: 6379,
    };
    return config[key] ?? defaultValue;
  }),
  getOrThrow: jest.fn((key: string) => {
    const value = mockConfigService.get(key);
    if (value === undefined) {
      throw new Error(`Configuration key "${key}" not found`);
    }
    return value;
  }),
};

/**
 * Mock Repository base
 */
export function createMockRepository<T = any>() {
  return {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    findOneBy: jest.fn().mockResolvedValue(null),
    findAndCount: jest.fn().mockResolvedValue([[], 0]),
    save: jest.fn().mockImplementation((entity) => 
      Promise.resolve({ id: uuid(), ...entity })
    ),
    create: jest.fn().mockImplementation((entity) => entity),
    update: jest.fn().mockResolvedValue({ affected: 1 }),
    delete: jest.fn().mockResolvedValue({ affected: 1 }),
    remove: jest.fn().mockResolvedValue(undefined),
    count: jest.fn().mockResolvedValue(0),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orWhere: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      innerJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
      getMany: jest.fn().mockResolvedValue([]),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      getRawOne: jest.fn().mockResolvedValue(null),
      getRawMany: jest.fn().mockResolvedValue([]),
      execute: jest.fn().mockResolvedValue(undefined),
    })),
    query: jest.fn().mockResolvedValue([]),
    manager: {
      transaction: jest.fn().mockImplementation((cb) => cb({
        save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
        find: jest.fn().mockResolvedValue([]),
        findOne: jest.fn().mockResolvedValue(null),
      })),
    },
  };
}

/**
 * Mock Kafka producer
 */
export const mockKafkaProducer = {
  connect: jest.fn().mockResolvedValue(undefined),
  disconnect: jest.fn().mockResolvedValue(undefined),
  send: jest.fn().mockResolvedValue(undefined),
  sendBatch: jest.fn().mockResolvedValue(undefined),
};

/**
 * Mock Kafka consumer
 */
export const mockKafkaConsumer = {
  connect: jest.fn().mockResolvedValue(undefined),
  disconnect: jest.fn().mockResolvedValue(undefined),
  subscribe: jest.fn().mockResolvedValue(undefined),
  run: jest.fn().mockResolvedValue(undefined),
  pause: jest.fn(),
  resume: jest.fn(),
};

/**
 * Mock Redis client
 */
export const mockRedisClient = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue('OK'),
  setex: jest.fn().mockResolvedValue('OK'),
  del: jest.fn().mockResolvedValue(1),
  exists: jest.fn().mockResolvedValue(0),
  expire: jest.fn().mockResolvedValue(1),
  ttl: jest.fn().mockResolvedValue(-1),
  keys: jest.fn().mockResolvedValue([]),
  hget: jest.fn().mockResolvedValue(null),
  hset: jest.fn().mockResolvedValue(1),
  hdel: jest.fn().mockResolvedValue(1),
  hgetall: jest.fn().mockResolvedValue({}),
  publish: jest.fn().mockResolvedValue(1),
  subscribe: jest.fn().mockResolvedValue(undefined),
  quit: jest.fn().mockResolvedValue('OK'),
};

/**
 * Mock HTTP service
 */
export const mockHttpService = {
  get: jest.fn().mockReturnValue({
    toPromise: () => Promise.resolve({ data: {} }),
    pipe: jest.fn().mockReturnThis(),
  }),
  post: jest.fn().mockReturnValue({
    toPromise: () => Promise.resolve({ data: {} }),
    pipe: jest.fn().mockReturnThis(),
  }),
  put: jest.fn().mockReturnValue({
    toPromise: () => Promise.resolve({ data: {} }),
    pipe: jest.fn().mockReturnThis(),
  }),
  delete: jest.fn().mockReturnValue({
    toPromise: () => Promise.resolve({ data: {} }),
    pipe: jest.fn().mockReturnThis(),
  }),
  axiosRef: {
    get: jest.fn().mockResolvedValue({ data: {} }),
    post: jest.fn().mockResolvedValue({ data: {} }),
    put: jest.fn().mockResolvedValue({ data: {} }),
    delete: jest.fn().mockResolvedValue({ data: {} }),
  },
};

/**
 * Mock JWT service
 */
export const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
  signAsync: jest.fn().mockResolvedValue('mock-jwt-token'),
  verify: jest.fn().mockReturnValue({ sub: uuid(), email: 'test@test.com' }),
  verifyAsync: jest.fn().mockResolvedValue({ sub: uuid(), email: 'test@test.com' }),
  decode: jest.fn().mockReturnValue({ sub: uuid(), email: 'test@test.com' }),
};

/**
 * Create mock request object
 */
export function createMockRequest(overrides: Partial<any> = {}): any {
  return {
    user: { id: uuid(), email: 'test@test.com', role: 'admin' },
    headers: {},
    query: {},
    params: {},
    body: {},
    ip: '127.0.0.1',
    ...overrides,
  };
}

/**
 * Create mock response object
 */
export function createMockResponse(): any {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.header = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  return res;
}
