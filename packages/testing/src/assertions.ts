import * as request from 'supertest';

/**
 * Assert successful response
 */
export function expectSuccess(response: request.Response): void {
  expect(response.status).toBeGreaterThanOrEqual(200);
  expect(response.status).toBeLessThan(300);
}

/**
 * Assert created response
 */
export function expectCreated(response: request.Response): void {
  expect(response.status).toBe(201);
}

/**
 * Assert no content response
 */
export function expectNoContent(response: request.Response): void {
  expect(response.status).toBe(204);
}

/**
 * Assert bad request response
 */
export function expectBadRequest(response: request.Response): void {
  expect(response.status).toBe(400);
}

/**
 * Assert unauthorized response
 */
export function expectUnauthorized(response: request.Response): void {
  expect(response.status).toBe(401);
}

/**
 * Assert forbidden response
 */
export function expectForbidden(response: request.Response): void {
  expect(response.status).toBe(403);
}

/**
 * Assert not found response
 */
export function expectNotFound(response: request.Response): void {
  expect(response.status).toBe(404);
}

/**
 * Assert conflict response
 */
export function expectConflict(response: request.Response): void {
  expect(response.status).toBe(409);
}

/**
 * Assert internal server error
 */
export function expectServerError(response: request.Response): void {
  expect(response.status).toBe(500);
}

/**
 * Assert paginated response structure
 */
export function expectPaginatedResponse(response: request.Response): void {
  expect(response.body).toHaveProperty('data');
  expect(response.body).toHaveProperty('meta');
  expect(response.body.meta).toHaveProperty('total');
  expect(response.body.meta).toHaveProperty('page');
  expect(response.body.meta).toHaveProperty('limit');
  expect(Array.isArray(response.body.data)).toBe(true);
}

/**
 * Assert entity has standard fields
 */
export function expectStandardEntity(entity: any): void {
  expect(entity).toHaveProperty('id');
  expect(entity).toHaveProperty('createdAt');
  expect(entity).toHaveProperty('updatedAt');
}

/**
 * Assert validation error response
 */
export function expectValidationError(
  response: request.Response,
  field?: string,
): void {
  expect(response.status).toBe(400);
  expect(response.body).toHaveProperty('message');
  
  if (field) {
    const messages = Array.isArray(response.body.message)
      ? response.body.message
      : [response.body.message];
    
    const hasFieldError = messages.some(
      (msg: string) => msg.toLowerCase().includes(field.toLowerCase()),
    );
    expect(hasFieldError).toBe(true);
  }
}

/**
 * Assert array contains item with property
 */
export function expectArrayContainsItem<T>(
  array: T[],
  property: keyof T,
  value: any,
): void {
  const found = array.find((item) => item[property] === value);
  expect(found).toBeDefined();
}

/**
 * Assert date is recent (within last N minutes)
 */
export function expectRecentDate(
  date: string | Date,
  withinMinutes: number = 5,
): void {
  const dateObj = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffMinutes = diffMs / (1000 * 60);
  
  expect(diffMinutes).toBeLessThanOrEqual(withinMinutes);
}

/**
 * Assert UUID format
 */
export function expectUUID(value: string): void {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  expect(value).toMatch(uuidRegex);
}
