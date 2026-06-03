/**
 * Example DTOs using the shared decorators
 * These serve as templates for service-specific DTOs
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ApiUuid,
  ApiEmail,
  ApiPhone,
  ApiString,
  ApiStringOptional,
  ApiDate,
  ApiDateOptional,
  ApiBool,
  ApiEnumField,
  ApiArrayField,
} from './dto-decorators';
import { BaseEntitySchema, AddressSchema, ContactInfoSchema } from './common-schemas';

/**
 * Create Agency DTO Example
 */
export class CreateAgencyDtoExample {
  @ApiString({ description: 'Agency name', example: 'Premium Care Services', minLength: 2, maxLength: 100 })
  name!: string;

  @ApiEmail('Primary contact email')
  email!: string;

  @ApiPhone('Primary phone number')
  phone!: string;

  @ApiProperty({ type: AddressSchema, description: 'Agency address' })
  address!: AddressSchema;

  @ApiStringOptional({ description: 'Business registration number', example: 'BN123456789' })
  businessNumber?: string;

  @ApiEnumField({ ACTIVE: 'active', PENDING: 'pending' }, { description: 'Initial status' })
  status!: string;
}

/**
 * Agency Response DTO Example
 */
export class AgencyResponseDtoExample extends BaseEntitySchema {
  @ApiProperty({ example: 'Premium Care Services' })
  name!: string;

  @ApiProperty({ format: 'email', example: 'contact@premiumcare.com' })
  email!: string;

  @ApiProperty({ example: '+1-555-123-4567' })
  phone!: string;

  @ApiProperty({ type: AddressSchema })
  address!: AddressSchema;

  @ApiProperty({ example: 'active', enum: ['active', 'pending', 'suspended', 'inactive'] })
  status!: string;

  @ApiPropertyOptional({ example: 'BN123456789' })
  businessNumber?: string;

  @ApiProperty({ example: true })
  isVerified!: boolean;
}

/**
 * Create Caregiver DTO Example
 */
export class CreateCaregiverDtoExample {
  @ApiString({ description: 'First name', example: 'Jane', minLength: 1, maxLength: 50 })
  firstName!: string;

  @ApiString({ description: 'Last name', example: 'Smith', minLength: 1, maxLength: 50 })
  lastName!: string;

  @ApiEmail('Email address')
  email!: string;

  @ApiPhone('Phone number')
  phone!: string;

  @ApiDateOptional('Date of birth')
  dateOfBirth?: Date;

  @ApiProperty({ type: AddressSchema, description: 'Home address' })
  address!: AddressSchema;

  @ApiArrayField(String, {
    description: 'List of skills',
    example: ['personal_care', 'medication_assistance', 'dementia_care'],
  })
  skills!: string[];

  @ApiArrayField(String, {
    description: 'Languages spoken',
    example: ['en', 'fr', 'es'],
  })
  languages!: string[];
}

/**
 * Create Patient DTO Example
 */
export class CreatePatientDtoExample {
  @ApiString({ description: 'First name', example: 'John', minLength: 1, maxLength: 50 })
  firstName!: string;

  @ApiString({ description: 'Last name', example: 'Doe', minLength: 1, maxLength: 50 })
  lastName!: string;

  @ApiDate('Date of birth')
  dateOfBirth!: Date;

  @ApiEnumField({ MALE: 'male', FEMALE: 'female', OTHER: 'other' }, { description: 'Gender' })
  gender!: string;

  @ApiProperty({ type: AddressSchema, description: 'Home address' })
  address!: AddressSchema;

  @ApiProperty({ type: ContactInfoSchema, description: 'Contact information' })
  contactInfo!: ContactInfoSchema;

  @ApiStringOptional({ description: 'Health card number (encrypted)', example: 'XXXX-XXX-XXX' })
  healthCardNumber?: string;

  @ApiArrayField(String, {
    description: 'Known allergies',
    example: ['Penicillin', 'Peanuts'],
  })
  allergies!: string[];
}

/**
 * Create Schedule DTO Example
 */
export class CreateScheduleDtoExample {
  @ApiUuid('Patient ID')
  patientId!: string;

  @ApiUuid('Caregiver ID')
  caregiverId!: string;

  @ApiDate('Shift start time')
  startTime!: Date;

  @ApiDate('Shift end time')
  endTime!: Date;

  @ApiEnumField(
    { ONE_TIME: 'one_time', RECURRING: 'recurring' },
    { description: 'Schedule type' },
  )
  scheduleType!: string;

  @ApiStringOptional({ description: 'Notes for the caregiver', maxLength: 500 })
  notes?: string;

  @ApiArrayField(String, {
    description: 'Services to be provided',
    example: ['personal_care', 'meal_prep', 'companionship'],
  })
  services!: string[];
}

/**
 * Search/Filter DTO Example
 */
export class SearchFilterDtoExample {
  @ApiPropertyOptional({
    description: 'Search query (searches name, email, phone)',
    example: 'john',
  })
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: ['active', 'inactive', 'pending'],
    example: 'active',
  })
  status?: string;

  @ApiPropertyOptional({
    description: 'Filter by date range start',
    format: 'date-time',
    example: '2024-01-01T00:00:00Z',
  })
  startDate?: Date;

  @ApiPropertyOptional({
    description: 'Filter by date range end',
    format: 'date-time',
    example: '2024-12-31T23:59:59Z',
  })
  endDate?: Date;

  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    minimum: 1,
  })
  page?: number;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 20,
    minimum: 1,
    maximum: 100,
  })
  limit?: number;

  @ApiPropertyOptional({
    description: 'Sort field',
    example: 'createdAt',
  })
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    example: 'desc',
  })
  sortOrder?: 'asc' | 'desc';
}

/**
 * Bulk Operation DTO Example
 */
export class BulkOperationDtoExample {
  @ApiArrayField(String, {
    description: 'IDs to operate on',
    example: ['uuid-1', 'uuid-2', 'uuid-3'],
  })
  ids!: string[];

  @ApiEnumField(
    { ACTIVATE: 'activate', DEACTIVATE: 'deactivate', DELETE: 'delete' },
    { description: 'Operation to perform' },
  )
  operation!: string;
}
