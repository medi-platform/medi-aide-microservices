import { IsString, IsInt, IsOptional, Min, Max, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum MoodType {
  HAPPY = 'happy',
  NEUTRAL = 'neutral',
  SAD = 'sad',
  STRESSED = 'stressed',
  ANXIOUS = 'anxious',
  ENERGETIC = 'energetic',
}

export class CreateWellnessCheckinDto {
  @ApiProperty({ enum: MoodType, description: 'Current mood' })
  @IsEnum(MoodType)
  mood!: MoodType;

  @ApiProperty({ minimum: 1, maximum: 10, description: 'Stress level (1-10)' })
  @IsInt()
  @Min(1)
  @Max(10)
  stressLevel!: number;

  @ApiProperty({ minimum: 1, maximum: 10, description: 'Sleep quality (1-10)' })
  @IsInt()
  @Min(1)
  @Max(10)
  sleepQuality!: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 10, description: 'Energy level (1-10)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  energyLevel?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 10, description: 'Pain level (0-10)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  painLevel?: number;

  @ApiPropertyOptional({ description: 'Recent behavior notes' })
  @IsOptional()
  @IsString()
  recentBehavior?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class WellnessCheckinResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty({ enum: MoodType })
  mood!: MoodType;

  @ApiProperty()
  stressLevel!: number;

  @ApiProperty()
  sleepQuality!: number;

  @ApiPropertyOptional()
  energyLevel?: number;

  @ApiPropertyOptional()
  painLevel?: number;

  @ApiPropertyOptional()
  recentBehavior?: string;

  @ApiPropertyOptional()
  notes?: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiPropertyOptional()
  burnoutRisk?: BurnoutRiskResponseDto;
}

export class BurnoutRiskResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  burnoutScore!: number;

  @ApiProperty({ enum: ['Low', 'Medium', 'High', 'Critical'] })
  label!: string;

  @ApiProperty()
  colorScheme!: string;

  @ApiProperty()
  advice!: string;

  @ApiPropertyOptional()
  factors?: {
    workload: number;
    emotionalExhaustion: number;
    personalAchievement: number;
    depersonalization: number;
  };

  @ApiPropertyOptional({ type: [String] })
  recommendations?: string[];

  @ApiProperty()
  calculatedAt!: Date;
}

