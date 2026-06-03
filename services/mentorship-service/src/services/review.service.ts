import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mentorship } from '../entities/mentorship.entity';
import { MentorshipReview } from '../entities/mentorship-review.entity';
import { MentorProfileService } from './mentor-profile.service';

export interface CreateReviewInput {
  mentorshipId: string;
  reviewerId: string;
  rating: number;
  comment?: string;
}

@Injectable()
export class ReviewService {
  private readonly logger = new Logger(ReviewService.name);

  constructor(
    @InjectRepository(MentorshipReview)
    private readonly reviewRepo: Repository<MentorshipReview>,
    @InjectRepository(Mentorship)
    private readonly mentorshipRepo: Repository<Mentorship>,
    private readonly mentorProfiles: MentorProfileService,
  ) {}

  async createReview(input: CreateReviewInput): Promise<MentorshipReview> {
    const mentorship = await this.mentorshipRepo.findOne({ where: { id: input.mentorshipId } });
    if (!mentorship) throw new NotFoundException(`Mentorship ${input.mentorshipId} not found`);

    if (mentorship.mentorUserId !== input.reviewerId && mentorship.menteeUserId !== input.reviewerId) {
      throw new ForbiddenException('Not allowed to review this mentorship');
    }

    const rating = Math.round(input.rating);
    if (rating < 1 || rating > 5) {
      throw new BadRequestException('rating must be between 1 and 5');
    }

    // Reviewer is one party; reviewee is the other
    const revieweeId = mentorship.mentorUserId === input.reviewerId ? mentorship.menteeUserId : mentorship.mentorUserId;

    const review = this.reviewRepo.create({
      mentorshipId: mentorship.id,
      reviewerId: input.reviewerId,
      revieweeId,
      rating,
      comment: input.comment,
    });

    const saved = await this.reviewRepo.save(review);

    // If mentor is being reviewed, update mentor rating aggregate
    if (revieweeId === mentorship.mentorUserId) {
      await this.mentorProfiles.applyNewRating(revieweeId, rating);
    }

    this.logger.log(`Mentorship review created: ${saved.id}`);
    return saved;
  }

  async listReviewsForMentorship(mentorshipId: string, userId: string): Promise<MentorshipReview[]> {
    const mentorship = await this.mentorshipRepo.findOne({ where: { id: mentorshipId } });
    if (!mentorship) throw new NotFoundException(`Mentorship ${mentorshipId} not found`);

    if (mentorship.mentorUserId !== userId && mentorship.menteeUserId !== userId) {
      throw new ForbiddenException('Not allowed to view reviews for this mentorship');
    }

    return this.reviewRepo.find({
      where: { mentorshipId },
      order: { createdAt: 'DESC' },
    });
  }
}


