import { applyDecorators } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsUUID, IsOptional, IsEnum, IsNumber, IsBoolean, IsDate, IsArray, Min, Max, MinLength, MaxLength, IsPhoneNumber, Matches } from 'class-validator';
import { Transform, Type } from 'class-transformer';

/**
 * UUID field
 */
export function ApiUuid(description?: string) {
  return applyDecorators(
    ApiProperty({
      description: description || 'Unique identifier',
      format: 'uuid',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    IsUUID(),
  );
}

export function ApiUuidOptional(description?: string) {
  return applyDecorators(
    ApiPropertyOptional({
      description: description || 'Unique identifier',
      format: 'uuid',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    IsOptional(),
    IsUUID(),
  );
}

/**
 * Email field
 */
export function ApiEmail(description?: string) {
  return applyDecorators(
    ApiProperty({
      description: description || 'Email address',
      format: 'email',
      example: 'user@example.com',
    }),
    IsEmail(),
  );
}

export function ApiEmailOptional(description?: string) {
  return applyDecorators(
    ApiPropertyOptional({
      description: description || 'Email address',
      format: 'email',
      example: 'user@example.com',
    }),
    IsOptional(),
    IsEmail(),
  );
}

/**
 * Phone number field
 */
export function ApiPhone(description?: string) {
  return applyDecorators(
    ApiProperty({
      description: description || 'Phone number',
      example: '+1-555-123-4567',
    }),
    IsString(),
    Matches(/^[\d\s\-\+\(\)]+$/, { message: 'Invalid phone number format' }),
  );
}

export function ApiPhoneOptional(description?: string) {
  return applyDecorators(
    ApiPropertyOptional({
      description: description || 'Phone number',
      example: '+1-555-123-4567',
    }),
    IsOptional(),
    IsString(),
  );
}

/**
 * String field with length constraints
 */
export function ApiString(options: {
  description?: string;
  example?: string;
  minLength?: number;
  maxLength?: number;
}) {
  const decorators = [
    ApiProperty({
      description: options.description,
      example: options.example,
      minLength: options.minLength,
      maxLength: options.maxLength,
    }),
    IsString(),
  ];

  if (options.minLength) decorators.push(MinLength(options.minLength));
  if (options.maxLength) decorators.push(MaxLength(options.maxLength));

  return applyDecorators(...decorators);
}

export function ApiStringOptional(options: {
  description?: string;
  example?: string;
  minLength?: number;
  maxLength?: number;
}) {
  const decorators = [
    ApiPropertyOptional({
      description: options.description,
      example: options.example,
    }),
    IsOptional(),
    IsString(),
  ];

  if (options.minLength) decorators.push(MinLength(options.minLength));
  if (options.maxLength) decorators.push(MaxLength(options.maxLength));

  return applyDecorators(...decorators);
}

/**
 * Number field
 */
export function ApiNumber(options?: {
  description?: string;
  example?: number;
  minimum?: number;
  maximum?: number;
}) {
  const decorators = [
    ApiProperty({
      description: options?.description,
      example: options?.example ?? 0,
      minimum: options?.minimum,
      maximum: options?.maximum,
    }),
    IsNumber(),
    Type(() => Number),
  ];

  if (options?.minimum !== undefined) decorators.push(Min(options.minimum));
  if (options?.maximum !== undefined) decorators.push(Max(options.maximum));

  return applyDecorators(...decorators);
}

export function ApiNumberOptional(options?: {
  description?: string;
  example?: number;
  minimum?: number;
  maximum?: number;
}) {
  return applyDecorators(
    ApiPropertyOptional({
      description: options?.description,
      example: options?.example ?? 0,
    }),
    IsOptional(),
    IsNumber(),
    Type(() => Number),
  );
}

/**
 * Boolean field
 */
export function ApiBool(description?: string) {
  return applyDecorators(
    ApiProperty({
      description,
      example: true,
    }),
    IsBoolean(),
    Transform(({ value }) => value === 'true' || value === true),
  );
}

export function ApiBoolOptional(description?: string) {
  return applyDecorators(
    ApiPropertyOptional({
      description,
      example: true,
    }),
    IsOptional(),
    IsBoolean(),
    Transform(({ value }) => value === 'true' || value === true),
  );
}

/**
 * Date field
 */
export function ApiDate(description?: string) {
  return applyDecorators(
    ApiProperty({
      description,
      format: 'date-time',
      example: '2024-01-01T00:00:00Z',
    }),
    IsDate(),
    Type(() => Date),
  );
}

export function ApiDateOptional(description?: string) {
  return applyDecorators(
    ApiPropertyOptional({
      description,
      format: 'date-time',
      example: '2024-01-01T00:00:00Z',
    }),
    IsOptional(),
    IsDate(),
    Type(() => Date),
  );
}

/**
 * Enum field
 */
export function ApiEnumField<T extends object>(
  enumType: T,
  options?: { description?: string; example?: any },
) {
  return applyDecorators(
    ApiProperty({
      description: options?.description,
      enum: enumType,
      example: options?.example || Object.values(enumType)[0],
    }),
    IsEnum(enumType),
  );
}

export function ApiEnumOptional<T extends object>(
  enumType: T,
  options?: { description?: string; example?: any },
) {
  return applyDecorators(
    ApiPropertyOptional({
      description: options?.description,
      enum: enumType,
      example: options?.example || Object.values(enumType)[0],
    }),
    IsOptional(),
    IsEnum(enumType),
  );
}

/**
 * Array field
 */
export function ApiArrayField<T>(
  itemType: any,
  options?: { description?: string; example?: T[] },
) {
  return applyDecorators(
    ApiProperty({
      description: options?.description,
      type: [itemType],
      example: options?.example,
    }),
    IsArray(),
    Type(() => itemType),
  );
}

export function ApiArrayOptional<T>(
  itemType: any,
  options?: { description?: string; example?: T[] },
) {
  return applyDecorators(
    ApiPropertyOptional({
      description: options?.description,
      type: [itemType],
      example: options?.example,
    }),
    IsOptional(),
    IsArray(),
    Type(() => itemType),
  );
}

/**
 * JSON/Object field
 */
export function ApiObject(description?: string, example?: any) {
  return applyDecorators(
    ApiProperty({
      description,
      type: 'object',
      example: example || {},
    }),
  );
}

export function ApiObjectOptional(description?: string, example?: any) {
  return applyDecorators(
    ApiPropertyOptional({
      description,
      type: 'object',
      example: example || {},
    }),
    IsOptional(),
  );
}

/**
 * Password field
 */
export function ApiPassword(description?: string) {
  return applyDecorators(
    ApiProperty({
      description: description || 'Password',
      format: 'password',
      minLength: 8,
      example: 'SecureP@ss123',
    }),
    IsString(),
    MinLength(8),
    Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
      message: 'Password must contain uppercase, lowercase, and number',
    }),
  );
}

/**
 * Currency amount field
 */
export function ApiCurrency(description?: string) {
  return applyDecorators(
    ApiProperty({
      description: description || 'Amount in cents',
      example: 9999,
      minimum: 0,
    }),
    IsNumber(),
    Min(0),
    Type(() => Number),
  );
}

/**
 * URL field
 */
export function ApiUrl(description?: string) {
  return applyDecorators(
    ApiProperty({
      description: description || 'URL',
      format: 'uri',
      example: 'https://example.com',
    }),
    IsString(),
    Matches(/^https?:\/\/.+/, { message: 'Invalid URL format' }),
  );
}

export function ApiUrlOptional(description?: string) {
  return applyDecorators(
    ApiPropertyOptional({
      description: description || 'URL',
      format: 'uri',
      example: 'https://example.com',
    }),
    IsOptional(),
    IsString(),
  );
}
