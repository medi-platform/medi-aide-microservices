import { IsNumber, IsOptional, IsString, IsEnum, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVitalsDto {
  @ApiPropertyOptional({ description: 'Heart rate in BPM' })
  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(220)
  heartRate?: number;

  @ApiPropertyOptional({ description: 'Systolic blood pressure' })
  @IsOptional()
  @IsNumber()
  @Min(70)
  @Max(250)
  systolicBp?: number;

  @ApiPropertyOptional({ description: 'Diastolic blood pressure' })
  @IsOptional()
  @IsNumber()
  @Min(40)
  @Max(150)
  diastolicBp?: number;

  @ApiPropertyOptional({ description: 'Temperature in Fahrenheit' })
  @IsOptional()
  @IsNumber()
  @Min(95)
  @Max(108)
  temperature?: number;

  @ApiPropertyOptional({ description: 'Oxygen saturation percentage' })
  @IsOptional()
  @IsNumber()
  @Min(70)
  @Max(100)
  oxygenSaturation?: number;

  @ApiPropertyOptional({ description: 'Respiratory rate breaths/min' })
  @IsOptional()
  @IsNumber()
  @Min(8)
  @Max(40)
  respiratoryRate?: number;

  @ApiPropertyOptional({ description: 'HRV RMSSD in ms' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(200)
  hrvRmssd?: number;

  @ApiPropertyOptional({ description: 'Device ID' })
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class VitalsReadingDto {
  @ApiProperty()
  value!: number;

  @ApiProperty()
  unit!: string;

  @ApiProperty()
  timestamp!: string;

  @ApiProperty({ enum: ['normal', 'warning', 'critical', 'informational'] })
  status!: 'normal' | 'warning' | 'critical' | 'informational';
}

export class BloodPressureReadingDto {
  @ApiProperty()
  systolic!: number;

  @ApiProperty()
  diastolic!: number;

  @ApiProperty()
  unit!: string;

  @ApiProperty()
  timestamp!: string;

  @ApiProperty({ enum: ['normal', 'warning', 'critical'] })
  status!: 'normal' | 'warning' | 'critical';
}

export class VitalsCollectionDto {
  @ApiPropertyOptional({ type: VitalsReadingDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => VitalsReadingDto)
  heartRate?: VitalsReadingDto;

  @ApiPropertyOptional({ type: BloodPressureReadingDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => BloodPressureReadingDto)
  bloodPressure?: BloodPressureReadingDto;

  @ApiPropertyOptional({ type: VitalsReadingDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => VitalsReadingDto)
  temperature?: VitalsReadingDto;

  @ApiPropertyOptional({ type: VitalsReadingDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => VitalsReadingDto)
  oxygenSaturation?: VitalsReadingDto;

  @ApiPropertyOptional({ type: VitalsReadingDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => VitalsReadingDto)
  respiratoryRate?: VitalsReadingDto;

  @ApiPropertyOptional({ type: VitalsReadingDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => VitalsReadingDto)
  hrvRmssd?: VitalsReadingDto;
}

export class VitalsSummaryDto {
  @ApiProperty({ enum: ['healthy', 'degraded', 'critical'] })
  overallStatus!: 'healthy' | 'degraded' | 'critical';

  @ApiProperty()
  alertCount!: number;

  @ApiProperty()
  lastUpdated!: string;
}

export class VitalsResponseDto {
  @ApiProperty()
  userId!: string;

  @ApiProperty()
  timestamp!: string;

  @ApiProperty({ type: VitalsCollectionDto })
  @ValidateNested()
  @Type(() => VitalsCollectionDto)
  vitals!: VitalsCollectionDto;

  @ApiProperty({ type: VitalsSummaryDto })
  @ValidateNested()
  @Type(() => VitalsSummaryDto)
  summary!: VitalsSummaryDto;
}

export class VitalsHistoryQueryDto {
  @ApiPropertyOptional({ description: 'Start date for history' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for history' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Limit number of results' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  limit?: number;

  @ApiPropertyOptional({ description: 'Specific metric to filter' })
  @IsOptional()
  @IsString()
  metric?: string;
}

