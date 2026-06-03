import { IsString, IsOptional, IsBoolean, IsNumber, IsEnum, IsUUID, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RecommendationType, RecommendationCategory } from '../enums/recommendation-type.enum';

export class CreateRecommendationDto {
  @ApiProperty({ description: 'Recommendation content' })
  @IsString()
  content!: string;

  @ApiPropertyOptional({ enum: RecommendationType, default: RecommendationType.SYSTEM })
  @IsOptional()
  @IsEnum(RecommendationType)
  type?: RecommendationType;

  @ApiPropertyOptional({ enum: RecommendationCategory })
  @IsOptional()
  @IsEnum(RecommendationCategory)
  category?: RecommendationCategory;

  @ApiPropertyOptional({ description: 'Quick tip text' })
  @IsOptional()
  @IsString()
  tip?: string;

  @ApiPropertyOptional({ enum: ['low', 'medium', 'high', 'urgent'] })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional({ description: 'Confidence score (0-1)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  confidenceScore?: number;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class UpdateRecommendationDto {
  @ApiPropertyOptional({ description: 'Mark as viewed' })
  @IsOptional()
  @IsBoolean()
  viewed?: boolean;

  @ApiPropertyOptional({ description: 'Mark as accepted' })
  @IsOptional()
  @IsBoolean()
  accepted?: boolean;

  @ApiPropertyOptional({ description: 'User feedback' })
  @IsOptional()
  feedback?: Record<string, unknown>;
}

export class RecommendationResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty({ enum: RecommendationType })
  type!: RecommendationType;

  @ApiPropertyOptional({ enum: RecommendationCategory })
  category?: RecommendationCategory;

  @ApiProperty()
  content!: string;

  @ApiPropertyOptional()
  tip?: string;

  @ApiProperty()
  viewed!: boolean;

  @ApiPropertyOptional()
  priority?: string;

  @ApiPropertyOptional()
  confidenceScore?: number;

  @ApiPropertyOptional()
  personalizationScore?: number;

  @ApiPropertyOptional()
  accepted?: boolean;

  @ApiPropertyOptional()
  acceptedAt?: Date;

  @ApiPropertyOptional()
  viewedAt?: Date;

  @ApiProperty()
  createdAt!: Date;
}

export class RecommendationQueryDto {
  @ApiPropertyOptional({ enum: RecommendationType })
  @IsOptional()
  @IsEnum(RecommendationType)
  type?: RecommendationType;

  @ApiPropertyOptional({ enum: RecommendationCategory })
  @IsOptional()
  @IsEnum(RecommendationCategory)
  category?: RecommendationCategory;

  @ApiPropertyOptional({ description: 'Filter by viewed status' })
  @IsOptional()
  @IsBoolean()
  viewed?: boolean;

  @ApiPropertyOptional({ description: 'Limit results' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ description: 'Skip results' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number;
}

