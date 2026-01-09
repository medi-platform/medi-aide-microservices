import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { TestimonialRequest, TestimonialRequestStatus } from '../entities/testimonial-request.entity';
import { Testimonial, TestimonialStatus } from '../entities/testimonial.entity';

interface CreateTestimonialRequestDto {
  recipientId: string;
  recipientType: 'patient' | 'family' | 'caregiver';
  recipientName: string;
  recipientEmail?: string;
  agencyId?: string;
  sourceRatingId?: string;
  personalizedMessage?: string;
  expiresInDays?: number;
}

interface SubmitTestimonialDto {
  content: string;
  contentFr?: string;
  videoUrl?: string;
  rating?: number;
  authorTitle?: string;
  authorLocation?: string;
  consentNamePublic: boolean;
  consentPhotoPublic: boolean;
}

@Injectable()
export class TestimonialService {
  private readonly logger = new Logger(TestimonialService.name);

  constructor(
    @InjectRepository(TestimonialRequest)
    private readonly requestRepo: Repository<TestimonialRequest>,
    @InjectRepository(Testimonial)
    private readonly testimonialRepo: Repository<Testimonial>,
  ) {}

  // ===== REQUESTS =====

  async createRequest(dto: CreateTestimonialRequestDto): Promise<TestimonialRequest> {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (dto.expiresInDays || 14));

    const request = this.requestRepo.create({
      ...dto,
      token,
      expiresAt,
      status: TestimonialRequestStatus.PENDING,
    });

    return this.requestRepo.save(request);
  }

  async getRequestByToken(token: string): Promise<TestimonialRequest> {
    const request = await this.requestRepo.findOne({ where: { token } });
    if (!request) {
      throw new NotFoundException('Invalid testimonial request');
    }
    return request;
  }

  async sendRequest(id: string): Promise<TestimonialRequest> {
    const request = await this.requestRepo.findOne({ where: { id } });
    if (!request) {
      throw new NotFoundException(`Testimonial request ${id} not found`);
    }

    request.status = TestimonialRequestStatus.SENT;
    request.sentAt = new Date();

    return this.requestRepo.save(request);
  }

  // ===== TESTIMONIALS =====

  async submitTestimonial(
    token: string,
    dto: SubmitTestimonialDto,
  ): Promise<Testimonial> {
    const request = await this.getRequestByToken(token);

    if (request.status === TestimonialRequestStatus.SUBMITTED) {
      throw new BadRequestException('Testimonial already submitted');
    }

    if (request.expiresAt < new Date()) {
      throw new BadRequestException('Testimonial request has expired');
    }

    const testimonial = this.testimonialRepo.create({
      authorId: request.recipientId,
      authorType: request.recipientType,
      authorName: request.recipientName,
      authorTitle: dto.authorTitle,
      authorLocation: dto.authorLocation,
      agencyId: request.agencyId,
      content: dto.content,
      contentFr: dto.contentFr,
      videoUrl: dto.videoUrl,
      rating: dto.rating,
      consentNamePublic: dto.consentNamePublic,
      consentPhotoPublic: dto.consentPhotoPublic,
      consentSignedAt: new Date(),
      requestId: request.id,
      sourceRatingId: request.sourceRatingId,
      status: TestimonialStatus.PENDING_REVIEW,
    });

    const saved = await this.testimonialRepo.save(testimonial);

    // Update request
    request.status = TestimonialRequestStatus.SUBMITTED;
    request.testimonialId = saved.id;
    await this.requestRepo.save(request);

    this.logger.log(`Testimonial ${saved.id} submitted from request ${request.id}`);

    return saved;
  }

  async getTestimonial(id: string): Promise<Testimonial> {
    const testimonial = await this.testimonialRepo.findOne({ where: { id } });
    if (!testimonial) {
      throw new NotFoundException(`Testimonial ${id} not found`);
    }
    return testimonial;
  }

  async approveTestimonial(id: string, reviewedBy: string): Promise<Testimonial> {
    const testimonial = await this.getTestimonial(id);

    testimonial.status = TestimonialStatus.APPROVED;
    testimonial.reviewedBy = reviewedBy;
    testimonial.reviewedAt = new Date();

    // Update request status
    if (testimonial.requestId) {
      await this.requestRepo.update(testimonial.requestId, {
        status: TestimonialRequestStatus.APPROVED,
      });
    }

    return this.testimonialRepo.save(testimonial);
  }

  async rejectTestimonial(id: string, reviewedBy: string, reason: string): Promise<Testimonial> {
    const testimonial = await this.getTestimonial(id);

    testimonial.status = TestimonialStatus.REJECTED;
    testimonial.reviewedBy = reviewedBy;
    testimonial.reviewedAt = new Date();
    testimonial.rejectionReason = reason;

    return this.testimonialRepo.save(testimonial);
  }

  async publishTestimonial(id: string): Promise<Testimonial> {
    const testimonial = await this.getTestimonial(id);

    if (testimonial.status !== TestimonialStatus.APPROVED) {
      throw new BadRequestException('Testimonial must be approved before publishing');
    }

    testimonial.status = TestimonialStatus.PUBLISHED;
    testimonial.publishedAt = new Date();

    return this.testimonialRepo.save(testimonial);
  }

  async featureTestimonial(id: string, isFeatured: boolean): Promise<Testimonial> {
    const testimonial = await this.getTestimonial(id);
    testimonial.isFeatured = isFeatured;
    return this.testimonialRepo.save(testimonial);
  }

  async getPublishedTestimonials(
    agencyId?: string,
    limit: number = 20,
  ): Promise<Testimonial[]> {
    const where: any = { status: TestimonialStatus.PUBLISHED };
    if (agencyId) where.agencyId = agencyId;

    return this.testimonialRepo.find({
      where,
      order: { isFeatured: 'DESC', displayOrder: 'ASC', publishedAt: 'DESC' },
      take: limit,
    });
  }

  async getFeaturedTestimonials(limit: number = 5): Promise<Testimonial[]> {
    return this.testimonialRepo.find({
      where: { status: TestimonialStatus.PUBLISHED, isFeatured: true },
      order: { displayOrder: 'ASC' },
      take: limit,
    });
  }

  async getPendingReview(): Promise<Testimonial[]> {
    return this.testimonialRepo.find({
      where: { status: TestimonialStatus.PENDING_REVIEW },
      order: { createdAt: 'ASC' },
    });
  }
}
