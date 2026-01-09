import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { ReviewService } from '../services/review.service';

class CreateReviewDto {
  @IsUUID()
  mentorshipId!: string;

  @IsUUID()
  reviewerId!: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsString()
  comment?: string;
}

@ApiTags('Mentorship Reviews')
@Controller('mentorship/reviews')
export class MentorshipReviewController {
  constructor(private readonly reviews: ReviewService) {}

  @Post()
  @ApiOperation({ summary: 'Create a mentorship review (mentor or mentee rates the other)' })
  async create(@Body() dto: CreateReviewDto) {
    const review = await this.reviews.createReview({
      mentorshipId: dto.mentorshipId,
      reviewerId: dto.reviewerId,
      rating: dto.rating,
      comment: dto.comment,
    });
    return { review };
  }

  @Get(':mentorshipId')
  @ApiOperation({ summary: 'List reviews for a mentorship' })
  async list(
    @Param('mentorshipId', ParseUUIDPipe) mentorshipId: string,
    @Query('userId', ParseUUIDPipe) userId: string,
  ) {
    const reviews = await this.reviews.listReviewsForMentorship(mentorshipId, userId);
    return { reviews };
  }
}


