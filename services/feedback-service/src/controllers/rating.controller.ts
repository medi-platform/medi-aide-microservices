import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { RatingService } from '../services/rating.service';

class SubmitRatingDto {
  targetId!: string;
  targetType!: 'caregiver' | 'patient' | 'visit' | 'agency' | 'service';
  rating!: number;
  raterId?: string;
  raterType?: 'patient' | 'family' | 'caregiver' | 'agency';
  visitId?: string;
  comment?: string;
  categoryRatings?: Record<string, number>;
  isAnonymous?: boolean;
}

class RespondToRatingDto {
  responseText!: string;
  responderId!: string;
}

class FlagRatingDto {
  reason!: string;
}

@Controller('ratings')
@ApiTags('ratings')
export class RatingController {
  constructor(private readonly ratingService: RatingService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a rating' })
  @ApiResponse({ status: 201, description: 'Rating submitted' })
  async submit(@Body() dto: SubmitRatingDto) {
    return this.ratingService.submitRating(
      dto.targetId,
      dto.targetType,
      dto.rating,
      dto.raterId,
      dto.raterType,
      dto.visitId,
      dto.comment,
      dto.categoryRatings,
      dto.isAnonymous,
    );
  }

  @Get('target/:targetId')
  @ApiOperation({ summary: 'Get ratings for a target' })
  @ApiQuery({ name: 'targetType', required: true })
  @ApiQuery({ name: 'limit', required: false })
  async getRatings(
    @Param('targetId', ParseUUIDPipe) targetId: string,
    @Query('targetType') targetType: string,
    @Query('limit') limit?: number,
  ) {
    return this.ratingService.getRatings(targetId, targetType, limit);
  }

  @Get('target/:targetId/breakdown')
  @ApiOperation({ summary: 'Get rating breakdown for a target' })
  @ApiQuery({ name: 'targetType', required: true })
  async getBreakdown(
    @Param('targetId', ParseUUIDPipe) targetId: string,
    @Query('targetType') targetType: string,
  ) {
    return this.ratingService.getRatingBreakdown(targetId, targetType);
  }

  @Get('target/:targetId/average')
  @ApiOperation({ summary: 'Get average rating for a target' })
  @ApiQuery({ name: 'targetType', required: true })
  async getAverage(
    @Param('targetId', ParseUUIDPipe) targetId: string,
    @Query('targetType') targetType: string,
  ) {
    const average = await this.ratingService.getAverageRating(targetId, targetType);
    return { targetId, targetType, average };
  }

  @Post(':id/respond')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Respond to a rating' })
  async respond(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RespondToRatingDto,
  ) {
    return this.ratingService.respondToRating(id, dto.responseText, dto.responderId);
  }

  @Post(':id/flag')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Flag a rating for review' })
  async flag(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: FlagRatingDto,
  ) {
    return this.ratingService.flagRating(id, dto.reason);
  }
}
