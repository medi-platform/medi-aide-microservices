import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Pagination metadata
 */
export class PaginationMeta {
  @ApiProperty({ example: 100, description: 'Total number of items' })
  total!: number;

  @ApiProperty({ example: 1, description: 'Current page number' })
  page!: number;

  @ApiProperty({ example: 20, description: 'Items per page' })
  limit!: number;

  @ApiProperty({ example: 5, description: 'Total number of pages' })
  totalPages!: number;

  @ApiProperty({ example: true, description: 'Whether there is a next page' })
  hasNextPage!: boolean;

  @ApiProperty({ example: false, description: 'Whether there is a previous page' })
  hasPreviousPage!: boolean;
}

/**
 * Base paginated response
 */
export class PaginatedResponse<T> {
  @ApiProperty({ type: [Object], description: 'Array of items' })
  data!: T[];

  @ApiProperty({ type: PaginationMeta, description: 'Pagination metadata' })
  meta!: PaginationMeta;
}

/**
 * Success response
 */
export class SuccessResponse {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'Operation completed successfully' })
  message!: string;
}

/**
 * Delete response
 */
export class DeleteResponse extends SuccessResponse {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id!: string;
}

/**
 * Error response
 */
export class ErrorResponse {
  @ApiProperty({ example: 400 })
  statusCode!: number;

  @ApiProperty({ example: 'Bad Request' })
  error!: string;

  @ApiProperty({ example: ['email must be an email'], type: [String] })
  message!: string[];

  @ApiPropertyOptional({ example: '2024-01-01T00:00:00Z' })
  timestamp?: string;

  @ApiPropertyOptional({ example: '/api/v1/resource' })
  path?: string;
}

/**
 * Validation error response
 */
export class ValidationErrorResponse {
  @ApiProperty({ example: 422 })
  statusCode!: number;

  @ApiProperty({ example: 'Validation failed' })
  error!: string;

  @ApiProperty({
    example: [
      { field: 'email', message: 'email must be an email' },
      { field: 'name', message: 'name should not be empty' },
    ],
    type: [Object],
  })
  errors!: Array<{ field: string; message: string }>;
}

/**
 * Authentication response
 */
export class AuthResponse {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken!: string;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  refreshToken!: string;

  @ApiProperty({ example: 'Bearer' })
  tokenType!: string;

  @ApiProperty({ example: 3600, description: 'Token expiration in seconds' })
  expiresIn!: number;
}

/**
 * Health check response
 */
export class HealthResponse {
  @ApiProperty({ example: 'ok', enum: ['ok', 'error'] })
  status!: string;

  @ApiPropertyOptional({
    example: {
      database: { status: 'up', latency: 5 },
      redis: { status: 'up', latency: 2 },
    },
  })
  info?: Record<string, any>;

  @ApiPropertyOptional({
    example: {
      kafka: { status: 'down', error: 'Connection refused' },
    },
  })
  error?: Record<string, any>;

  @ApiPropertyOptional({
    example: {
      database: { status: 'up', latency: 5 },
      redis: { status: 'up', latency: 2 },
    },
  })
  details?: Record<string, any>;
}

/**
 * File upload response
 */
export class FileUploadResponse {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id!: string;

  @ApiProperty({ example: 'document.pdf' })
  filename!: string;

  @ApiProperty({ example: 'application/pdf' })
  mimeType!: string;

  @ApiProperty({ example: 1024000, description: 'File size in bytes' })
  size!: number;

  @ApiProperty({ example: 'https://storage.medi-aide.com/files/document.pdf' })
  url!: string;
}

/**
 * Bulk operation response
 */
export class BulkOperationResponse {
  @ApiProperty({ example: 10, description: 'Number of items processed' })
  processed!: number;

  @ApiProperty({ example: 8, description: 'Number of successful operations' })
  successful!: number;

  @ApiProperty({ example: 2, description: 'Number of failed operations' })
  failed!: number;

  @ApiProperty({
    example: [
      { id: '123', error: 'Validation failed' },
      { id: '456', error: 'Duplicate entry' },
    ],
    type: [Object],
  })
  errors!: Array<{ id: string; error: string }>;
}
