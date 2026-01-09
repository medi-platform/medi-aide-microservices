import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiHeader,
  ApiQuery,
  ApiParam,
  ApiBody,
  ApiTags,
  ApiExtraModels,
  getSchemaPath,
} from '@nestjs/swagger';

/**
 * Standard API endpoint decorator
 */
export function ApiEndpoint(options: {
  summary: string;
  description?: string;
  operationId?: string;
}) {
  return applyDecorators(
    ApiOperation({
      summary: options.summary,
      description: options.description,
      operationId: options.operationId,
    }),
  );
}

/**
 * Paginated response decorator
 */
export function ApiPaginatedResponse<T extends Type<any>>(model: T) {
  return applyDecorators(
    ApiExtraModels(model),
    ApiResponse({
      status: 200,
      description: 'Paginated results',
      schema: {
        properties: {
          data: {
            type: 'array',
            items: { $ref: getSchemaPath(model) },
          },
          meta: {
            type: 'object',
            properties: {
              total: { type: 'number', example: 100 },
              page: { type: 'number', example: 1 },
              limit: { type: 'number', example: 20 },
              totalPages: { type: 'number', example: 5 },
              hasNextPage: { type: 'boolean', example: true },
              hasPreviousPage: { type: 'boolean', example: false },
            },
          },
        },
      },
    }),
  );
}

/**
 * Standard CRUD responses
 */
export function ApiCreateResponse<T extends Type<any>>(model: T, description?: string) {
  return applyDecorators(
    ApiExtraModels(model),
    ApiResponse({
      status: 201,
      description: description || 'Resource created successfully',
      type: model,
    }),
  );
}

export function ApiReadResponse<T extends Type<any>>(model: T, description?: string) {
  return applyDecorators(
    ApiExtraModels(model),
    ApiResponse({
      status: 200,
      description: description || 'Resource retrieved successfully',
      type: model,
    }),
  );
}

export function ApiUpdateResponse<T extends Type<any>>(model: T, description?: string) {
  return applyDecorators(
    ApiExtraModels(model),
    ApiResponse({
      status: 200,
      description: description || 'Resource updated successfully',
      type: model,
    }),
  );
}

export function ApiDeleteResponse(description?: string) {
  return applyDecorators(
    ApiResponse({
      status: 200,
      description: description || 'Resource deleted successfully',
      schema: {
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Resource deleted successfully' },
        },
      },
    }),
  );
}

/**
 * Common error responses
 */
export function ApiCommonErrors() {
  return applyDecorators(
    ApiResponse({
      status: 400,
      description: 'Bad Request - Invalid input data',
      schema: {
        properties: {
          statusCode: { type: 'number', example: 400 },
          message: { type: 'array', items: { type: 'string' }, example: ['email must be an email'] },
          error: { type: 'string', example: 'Bad Request' },
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Authentication required',
      schema: {
        properties: {
          statusCode: { type: 'number', example: 401 },
          message: { type: 'string', example: 'Unauthorized' },
        },
      },
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Insufficient permissions',
      schema: {
        properties: {
          statusCode: { type: 'number', example: 403 },
          message: { type: 'string', example: 'Forbidden resource' },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Not Found - Resource does not exist',
      schema: {
        properties: {
          statusCode: { type: 'number', example: 404 },
          message: { type: 'string', example: 'Resource not found' },
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: 'Internal Server Error',
      schema: {
        properties: {
          statusCode: { type: 'number', example: 500 },
          message: { type: 'string', example: 'Internal server error' },
        },
      },
    }),
  );
}

/**
 * PHI Access decorator - for endpoints accessing protected health information
 */
export function ApiPHIAccess() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiHeader({
      name: 'X-Access-Reason',
      description: 'Reason for accessing PHI (HIPAA requirement)',
      required: true,
      example: 'treatment',
      enum: ['treatment', 'payment', 'operations', 'emergency', 'patient_request'],
    }),
    ApiResponse({
      status: 403,
      description: 'PHI access denied - Missing or invalid access reason',
    }),
  );
}

/**
 * Standard pagination query params
 */
export function ApiPagination() {
  return applyDecorators(
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      description: 'Page number (1-based)',
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      description: 'Items per page (max 100)',
      example: 20,
    }),
    ApiQuery({
      name: 'sortBy',
      required: false,
      type: String,
      description: 'Field to sort by',
      example: 'createdAt',
    }),
    ApiQuery({
      name: 'sortOrder',
      required: false,
      enum: ['asc', 'desc'],
      description: 'Sort order',
      example: 'desc',
    }),
  );
}

/**
 * UUID path parameter
 */
export function ApiUuidParam(name: string = 'id', description?: string) {
  return applyDecorators(
    ApiParam({
      name,
      type: String,
      format: 'uuid',
      description: description || `${name} (UUID)`,
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
  );
}

/**
 * Date range query params
 */
export function ApiDateRange() {
  return applyDecorators(
    ApiQuery({
      name: 'startDate',
      required: false,
      type: String,
      description: 'Start date (ISO 8601)',
      example: '2024-01-01T00:00:00Z',
    }),
    ApiQuery({
      name: 'endDate',
      required: false,
      type: String,
      description: 'End date (ISO 8601)',
      example: '2024-12-31T23:59:59Z',
    }),
  );
}

/**
 * Search query param
 */
export function ApiSearch() {
  return applyDecorators(
    ApiQuery({
      name: 'search',
      required: false,
      type: String,
      description: 'Search term (searches across multiple fields)',
      example: 'John Doe',
    }),
  );
}

/**
 * Full CRUD endpoint decorators
 */
export function ApiList<T extends Type<any>>(model: T, resourceName: string) {
  return applyDecorators(
    ApiEndpoint({ summary: `List all ${resourceName}` }),
    ApiPagination(),
    ApiSearch(),
    ApiPaginatedResponse(model),
    ApiCommonErrors(),
  );
}

export function ApiCreate<T extends Type<any>>(model: T, resourceName: string) {
  return applyDecorators(
    ApiEndpoint({ summary: `Create a new ${resourceName}` }),
    ApiCreateResponse(model),
    ApiCommonErrors(),
  );
}

export function ApiRead<T extends Type<any>>(model: T, resourceName: string) {
  return applyDecorators(
    ApiEndpoint({ summary: `Get ${resourceName} by ID` }),
    ApiUuidParam('id'),
    ApiReadResponse(model),
    ApiCommonErrors(),
  );
}

export function ApiUpdate<T extends Type<any>>(model: T, resourceName: string) {
  return applyDecorators(
    ApiEndpoint({ summary: `Update ${resourceName}` }),
    ApiUuidParam('id'),
    ApiUpdateResponse(model),
    ApiCommonErrors(),
  );
}

export function ApiDelete(resourceName: string) {
  return applyDecorators(
    ApiEndpoint({ summary: `Delete ${resourceName}` }),
    ApiUuidParam('id'),
    ApiDeleteResponse(),
    ApiCommonErrors(),
  );
}
