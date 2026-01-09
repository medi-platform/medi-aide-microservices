import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { TestimonialService } from '../services/testimonial.service';

/**
 * Testimonial Controller
 * Phase 5G: Testimonial requests and management
 */
@ApiTags('Testimonials')
@Controller('testimonials')
export class TestimonialController {
  constructor(private readonly testimonialService: TestimonialService) {}

  // ===== REQUESTS =====

  @Post('requests')
  @ApiOperation({ summary: 'Create a testimonial request' })
  @ApiResponse({ status: 201, description: 'Request created' })
  async createRequest(@Body() dto: {
    recipientId: string;
    recipientType: 'patient' | 'family' | 'caregiver';
    recipientName: string;
    recipientEmail?: string;
    agencyId?: string;
    sourceRatingId?: string;
    personalizedMessage?: string;
    expiresInDays?: number;
  }) {
    return this.testimonialService.createRequest(dto);
  }

  @Get('requests/token/:token')
  @ApiOperation({ summary: 'Get testimonial request by token' })
  @ApiParam({ name: 'token', description: 'Request token' })
  async getRequestByToken(@Param('token') token: string) {
    return this.testimonialService.getRequestByToken(token);
  }

  @Put('requests/:id/send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark request as sent' })
  @ApiParam({ name: 'id', description: 'Request ID' })
  async sendRequest(@Param('id', ParseUUIDPipe) id: string) {
    return this.testimonialService.sendRequest(id);
  }

  // ===== TESTIMONIALS =====

  @Post('submit/:token')
  @ApiOperation({ summary: 'Submit a testimonial' })
  @ApiParam({ name: 'token', description: 'Request token' })
  async submitTestimonial(
    @Param('token') token: string,
    @Body() dto: {
      content: string;
      contentFr?: string;
      videoUrl?: string;
      rating?: number;
      authorTitle?: string;
      authorLocation?: string;
      consentNamePublic: boolean;
      consentPhotoPublic: boolean;
    },
  ) {
    return this.testimonialService.submitTestimonial(token, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get testimonial by ID' })
  @ApiParam({ name: 'id', description: 'Testimonial ID' })
  async getTestimonial(@Param('id', ParseUUIDPipe) id: string) {
    return this.testimonialService.getTestimonial(id);
  }

  @Put(':id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a testimonial' })
  @ApiParam({ name: 'id', description: 'Testimonial ID' })
  async approveTestimonial(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { reviewedBy: string },
  ) {
    return this.testimonialService.approveTestimonial(id, dto.reviewedBy);
  }

  @Put(':id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject a testimonial' })
  @ApiParam({ name: 'id', description: 'Testimonial ID' })
  async rejectTestimonial(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { reviewedBy: string; reason: string },
  ) {
    return this.testimonialService.rejectTestimonial(id, dto.reviewedBy, dto.reason);
  }

  @Put(':id/publish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publish a testimonial' })
  @ApiParam({ name: 'id', description: 'Testimonial ID' })
  async publishTestimonial(@Param('id', ParseUUIDPipe) id: string) {
    return this.testimonialService.publishTestimonial(id);
  }

  @Put(':id/feature')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Feature/unfeature a testimonial' })
  @ApiParam({ name: 'id', description: 'Testimonial ID' })
  async featureTestimonial(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { isFeatured: boolean },
  ) {
    return this.testimonialService.featureTestimonial(id, dto.isFeatured);
  }

  @Get()
  @ApiOperation({ summary: 'Get published testimonials' })
  @ApiQuery({ name: 'agencyId', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getPublishedTestimonials(
    @Query('agencyId') agencyId?: string,
    @Query('limit') limit?: number,
  ) {
    return this.testimonialService.getPublishedTestimonials(agencyId, limit);
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get featured testimonials' })
  @ApiQuery({ name: 'limit', required: false })
  async getFeaturedTestimonials(@Query('limit') limit?: number) {
    return this.testimonialService.getFeaturedTestimonials(limit);
  }

  @Get('pending-review')
  @ApiOperation({ summary: 'Get testimonials pending review' })
  async getPendingReview() {
    return this.testimonialService.getPendingReview();
  }
}
