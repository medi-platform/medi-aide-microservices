import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Base entity with common fields
 */
export class BaseEntitySchema {
  @ApiProperty({
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    format: 'date-time',
    example: '2024-01-01T00:00:00Z',
  })
  createdAt!: Date;

  @ApiProperty({
    format: 'date-time',
    example: '2024-01-01T00:00:00Z',
  })
  updatedAt!: Date;
}

/**
 * Address schema
 */
export class AddressSchema {
  @ApiProperty({ example: '123 Main Street' })
  street!: string;

  @ApiPropertyOptional({ example: 'Suite 100' })
  unit?: string;

  @ApiProperty({ example: 'Toronto' })
  city!: string;

  @ApiProperty({ example: 'Ontario' })
  province!: string;

  @ApiProperty({ example: 'M5V 1A1' })
  postalCode!: string;

  @ApiProperty({ example: 'Canada' })
  country!: string;

  @ApiPropertyOptional({ example: 43.6532 })
  latitude?: number;

  @ApiPropertyOptional({ example: -79.3832 })
  longitude?: number;
}

/**
 * Contact info schema
 */
export class ContactInfoSchema {
  @ApiPropertyOptional({ format: 'email', example: 'contact@example.com' })
  email?: string;

  @ApiPropertyOptional({ example: '+1-555-123-4567' })
  phone?: string;

  @ApiPropertyOptional({ example: '+1-555-123-4568' })
  mobile?: string;

  @ApiPropertyOptional({ example: '+1-555-123-4569' })
  fax?: string;
}

/**
 * Person name schema
 */
export class PersonNameSchema {
  @ApiProperty({ example: 'John' })
  firstName!: string;

  @ApiPropertyOptional({ example: 'Michael' })
  middleName?: string;

  @ApiProperty({ example: 'Doe' })
  lastName!: string;

  @ApiPropertyOptional({ example: 'Jr.' })
  suffix?: string;

  @ApiPropertyOptional({ example: 'JD' })
  preferredName?: string;
}

/**
 * Date range schema
 */
export class DateRangeSchema {
  @ApiProperty({ format: 'date-time', example: '2024-01-01T00:00:00Z' })
  startDate!: Date;

  @ApiProperty({ format: 'date-time', example: '2024-01-31T23:59:59Z' })
  endDate!: Date;
}

/**
 * Time range schema
 */
export class TimeRangeSchema {
  @ApiProperty({ example: '09:00' })
  startTime!: string;

  @ApiProperty({ example: '17:00' })
  endTime!: string;
}

/**
 * Money schema
 */
export class MoneySchema {
  @ApiProperty({ example: 9999, description: 'Amount in cents' })
  amount!: number;

  @ApiProperty({ example: 'CAD', description: 'ISO 4217 currency code' })
  currency!: string;
}

/**
 * Audit fields schema
 */
export class AuditFieldsSchema {
  @ApiPropertyOptional({ format: 'uuid' })
  createdBy?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  updatedBy?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  deletedBy?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  deletedAt?: Date;
}

/**
 * Status schema
 */
export enum CommonStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  SUSPENDED = 'suspended',
  ARCHIVED = 'archived',
}

/**
 * Geolocation schema
 */
export class GeolocationSchema {
  @ApiProperty({ example: 43.6532 })
  latitude!: number;

  @ApiProperty({ example: -79.3832 })
  longitude!: number;

  @ApiPropertyOptional({ example: 10, description: 'Accuracy in meters' })
  accuracy?: number;

  @ApiPropertyOptional({ format: 'date-time' })
  timestamp?: Date;
}

/**
 * Document reference schema
 */
export class DocumentReferenceSchema {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'contract.pdf' })
  filename!: string;

  @ApiProperty({ example: 'application/pdf' })
  mimeType!: string;

  @ApiProperty({ example: 'https://storage.medi-aide.com/files/contract.pdf' })
  url!: string;

  @ApiProperty({ example: 1024000 })
  size!: number;

  @ApiPropertyOptional({ format: 'date-time' })
  uploadedAt?: Date;
}

/**
 * Emergency contact schema
 */
export class EmergencyContactSchema {
  @ApiProperty({ example: 'Jane Doe' })
  name!: string;

  @ApiProperty({ example: 'Spouse' })
  relationship!: string;

  @ApiProperty({ example: '+1-555-123-4567' })
  phone!: string;

  @ApiPropertyOptional({ example: '+1-555-123-4568' })
  alternatePhone?: string;

  @ApiPropertyOptional({ format: 'email', example: 'jane.doe@example.com' })
  email?: string;

  @ApiPropertyOptional({ example: true })
  isPrimary?: boolean;
}

/**
 * Availability slot schema
 */
export class AvailabilitySlotSchema {
  @ApiProperty({ enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] })
  dayOfWeek!: string;

  @ApiProperty({ example: '09:00' })
  startTime!: string;

  @ApiProperty({ example: '17:00' })
  endTime!: string;

  @ApiPropertyOptional({ example: true })
  isAvailable?: boolean;
}

/**
 * Service rate schema
 */
export class ServiceRateSchema {
  @ApiProperty({ example: 'hourly_rate' })
  rateType!: string;

  @ApiProperty({ example: 2500, description: 'Rate in cents' })
  amount!: number;

  @ApiProperty({ example: 'CAD' })
  currency!: string;

  @ApiPropertyOptional({ format: 'date' })
  effectiveFrom?: Date;

  @ApiPropertyOptional({ format: 'date' })
  effectiveTo?: Date;
}

/**
 * Note schema
 */
export class NoteSchema {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Patient showed improvement in mobility.' })
  content!: string;

  @ApiProperty({ format: 'uuid' })
  authorId!: string;

  @ApiPropertyOptional({ example: 'clinical_note' })
  type?: string;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;

  @ApiPropertyOptional({ example: false })
  isConfidential?: boolean;
}
