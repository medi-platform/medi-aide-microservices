/**
 * Jest Test Setup
 * Runs before each test file
 */

// Set test environment
process.env.NODE_ENV = 'test';
process.env.DB_HOST = process.env.TEST_DB_HOST || 'localhost';
process.env.DB_PORT = process.env.TEST_DB_PORT || '5432';
process.env.DB_USER = process.env.TEST_DB_USER || 'postgres';
process.env.DB_PASSWORD = process.env.TEST_DB_PASSWORD || 'postgres';
process.env.DB_DATABASE = process.env.TEST_DB_DATABASE || 'agency_db_test';

// Increase timeout for database operations
jest.setTimeout(30000);

// Global teardown
afterAll(async () => {
  // Allow time for connections to close
  await new Promise((resolve) => setTimeout(resolve, 500));
});
