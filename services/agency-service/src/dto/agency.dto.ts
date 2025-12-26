import { IsString, IsOptional, IsBoolean, IsArray, IsNumber, IsEmail, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAgencyDto {
  @ApiProperty()
  @IsString()
  business_name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  doing_business_as?: string;

  @ApiProperty()
  @IsString()
  business_license!: string;

  @ApiProperty()
  @IsString()
  business_address!: string;

  @ApiProperty()
  @IsString()
  business_city!: string;

  @ApiProperty()
  @IsString()
  business_province!: string;

  @ApiProperty()
  @IsString()
  business_postal_code!: string;

  @ApiProperty()
  @IsString()
  business_phone!: string;

  @ApiProperty()
  @IsEmail()
  business_email!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  website_url?: string;

  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  services_offered!: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specializations?: string[];

  @ApiProperty()
  @IsString()
  primary_contact_name!: string;

  @ApiProperty()
  @IsString()
  primary_contact_phone!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  primary_contact_email?: string;
}

export class UpdateAgencyDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  business_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  doing_business_as?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  business_address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  business_city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  business_province?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  business_postal_code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  business_phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  business_email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  website_url?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  services_offered?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specializations?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  accepts_new_patients?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  standard_hourly_rate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  specialized_care_rate?: number;
}

export class AgencyQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  province?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  limit?: number;
}

export class AgencyResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  business_name!: string;

  @ApiProperty()
  business_license!: string;

  @ApiProperty()
  business_email!: string;

  @ApiProperty()
  business_phone!: string;

  @ApiProperty()
  is_active!: boolean;

  @ApiProperty()
  is_approved!: boolean;

  @ApiProperty()
  onboarding_status!: string;

  @ApiProperty()
  created_at!: Date;

  @ApiProperty()
  updated_at!: Date;
}


