import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Survey } from '../entities/survey.entity';
import { SurveyResponse } from '../entities/survey-response.entity';
import { SurveyType, SurveyStatus, ResponseStatus, SurveyQuestion, QuestionAnswer } from '../interfaces/feedback.interface';

/**
 * Survey Service
 * Manages surveys and responses
 */
@Injectable()
export class SurveyService {
  private readonly logger = new Logger(SurveyService.name);

  constructor(
    @InjectRepository(Survey)
    private readonly surveyRepo: Repository<Survey>,
    @InjectRepository(SurveyResponse)
    private readonly responseRepo: Repository<SurveyResponse>,
  ) {}

  /**
   * Create a survey
   */
  async createSurvey(
    name: string,
    type: SurveyType,
    questions: SurveyQuestion[],
    createdBy?: string,
    agencyId?: string,
    description?: string,
  ): Promise<Survey> {
    const survey = this.surveyRepo.create({
      name,
      type,
      questions: questions as Survey['questions'],
      createdBy,
      agencyId,
      description,
      status: SurveyStatus.DRAFT,
    });

    return this.surveyRepo.save(survey);
  }

  /**
   * Get survey by ID
   */
  async getSurveyById(id: string): Promise<Survey> {
    const survey = await this.surveyRepo.findOne({ where: { id } });
    if (!survey) {
      throw new NotFoundException(`Survey ${id} not found`);
    }
    return survey;
  }

  /**
   * Publish a survey
   */
  async publishSurvey(id: string): Promise<Survey> {
    const survey = await this.getSurveyById(id);
    survey.status = SurveyStatus.ACTIVE;
    return this.surveyRepo.save(survey);
  }

  /**
   * Get active surveys
   */
  async getActiveSurveys(type?: SurveyType, agencyId?: string): Promise<Survey[]> {
    const where: Record<string, unknown> = {
      status: SurveyStatus.ACTIVE,
      isActive: true,
    };
    if (type) where.type = type;
    if (agencyId) where.agencyId = agencyId;

    return this.surveyRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  /**
   * Submit survey response
   */
  async submitResponse(
    surveyId: string,
    answers: QuestionAnswer[],
    respondentId?: string,
    visitId?: string,
    caregiverId?: string,
    patientId?: string,
    comments?: string,
    isAnonymous?: boolean,
  ): Promise<SurveyResponse> {
    const survey = await this.getSurveyById(surveyId);

    // Calculate overall rating if applicable
    let overallRating: number | undefined;
    const ratingAnswers = answers.filter((a) => typeof a.value === 'number');
    if (ratingAnswers.length > 0) {
      const sum = ratingAnswers.reduce((acc, a) => acc + (a.value as number), 0);
      overallRating = sum / ratingAnswers.length;
    }

    const response = this.responseRepo.create({
      surveyId,
      respondentId: isAnonymous ? undefined : respondentId,
      visitId,
      caregiverId,
      patientId,
      answers: answers as SurveyResponse['answers'],
      overallRating,
      comments,
      isAnonymous: isAnonymous || survey.isAnonymous,
      status: ResponseStatus.COMPLETED,
      completedAt: new Date(),
    });

    const saved = await this.responseRepo.save(response);

    // Update survey response count
    await this.surveyRepo.increment({ id: surveyId }, 'responseCount', 1);

    this.logger.log(`Survey response ${saved.id} submitted for survey ${surveyId}`);
    return saved;
  }

  /**
   * Get survey responses
   */
  async getSurveyResponses(surveyId: string, limit: number = 50): Promise<SurveyResponse[]> {
    return this.responseRepo.find({
      where: { surveyId, status: ResponseStatus.COMPLETED },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get survey analytics
   */
  async getSurveyAnalytics(surveyId: string): Promise<{
    totalResponses: number;
    averageRating: number | null;
    completionRate: number;
    questionStats: Array<{ questionId: string; averageValue?: number; distribution?: Record<string, number> }>;
  }> {
    const survey = await this.getSurveyById(surveyId);
    const responses = await this.responseRepo.find({
      where: { surveyId },
    });

    const completed = responses.filter((r) => r.status === ResponseStatus.COMPLETED);
    const ratings = completed.filter((r) => r.overallRating).map((r) => r.overallRating!);

    return {
      totalResponses: responses.length,
      averageRating: ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null,
      completionRate: responses.length > 0 ? (completed.length / responses.length) * 100 : 0,
      questionStats: [], // TODO: Implement per-question analytics
    };
  }
}
