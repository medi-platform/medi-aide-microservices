import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SentimentAnalysis, SentimentScore } from '../entities/sentiment-analysis.entity';

type SentimentSourceType = SentimentAnalysis['sourceType'];

interface AnalyzeTextDto {
  sourceType: SentimentSourceType;
  sourceId: string;
  text: string;
  language?: string;
}

@Injectable()
export class SentimentService {
  private readonly logger = new Logger(SentimentService.name);

  constructor(
    @InjectRepository(SentimentAnalysis)
    private readonly sentimentRepo: Repository<SentimentAnalysis>,
  ) {}

  async analyzeText(dto: AnalyzeTextDto): Promise<SentimentAnalysis> {
    // Check if already analyzed
    const existing = await this.sentimentRepo.findOne({
      where: { sourceType: dto.sourceType, sourceId: dto.sourceId },
    });

    if (existing) {
      return existing;
    }

    // Simulate AI analysis (would integrate with actual AI service)
    const analysisResult = this.performSentimentAnalysis(dto.text);

    const analysis = this.sentimentRepo.create({
      sourceType: dto.sourceType,
      sourceId: dto.sourceId,
      originalText: dto.text,
      detectedLanguage: dto.language || 'en',
      sentiment: analysisResult.sentiment,
      confidenceScore: analysisResult.confidence,
      positiveScore: analysisResult.positive,
      negativeScore: analysisResult.negative,
      neutralScore: analysisResult.neutral,
      emotions: analysisResult.emotions,
      keywords: analysisResult.keywords,
      topics: analysisResult.topics,
      detectedIssues: analysisResult.issues,
      modelVersion: 'v1.0.0',
      analyzedAt: new Date(),
    });

    return this.sentimentRepo.save(analysis);
  }

  async getSentimentAnalysis(
    sourceType: string,
    sourceId: string,
  ): Promise<SentimentAnalysis | null> {
    return this.sentimentRepo.findOne({
      where: { sourceType: sourceType as SentimentSourceType, sourceId },
    });
  }

  async getSentimentBreakdown(
    sourceType?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<Record<SentimentScore, number>> {
    const qb = this.sentimentRepo.createQueryBuilder('s')
      .select('s.sentiment', 'sentiment')
      .addSelect('COUNT(*)', 'count');

    if (sourceType) {
      qb.where('s.source_type = :sourceType', { sourceType });
    }

    if (startDate && endDate) {
      qb.andWhere('s.analyzed_at BETWEEN :startDate AND :endDate', { startDate, endDate });
    }

    qb.groupBy('s.sentiment');

    const results = await qb.getRawMany();

    const breakdown: Record<string, number> = {
      [SentimentScore.VERY_POSITIVE]: 0,
      [SentimentScore.POSITIVE]: 0,
      [SentimentScore.NEUTRAL]: 0,
      [SentimentScore.NEGATIVE]: 0,
      [SentimentScore.VERY_NEGATIVE]: 0,
    };

    for (const r of results) {
      breakdown[r.sentiment] = parseInt(r.count, 10);
    }

    return breakdown as Record<SentimentScore, number>;
  }

  async getTopKeywords(limit: number = 20): Promise<{ keyword: string; count: number }[]> {
    const analyses = await this.sentimentRepo.find({
      select: ['keywords'],
      take: 1000,
    });

    const keywordCounts: Record<string, number> = {};

    for (const a of analyses) {
      if (a.keywords) {
        for (const kw of a.keywords) {
          keywordCounts[kw] = (keywordCounts[kw] || 0) + 1;
        }
      }
    }

    return Object.entries(keywordCounts)
      .map(([keyword, count]) => ({ keyword, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  async getDetectedIssues(
    severity?: 'low' | 'medium' | 'high',
    limit: number = 50,
  ): Promise<SentimentAnalysis[]> {
    const qb = this.sentimentRepo.createQueryBuilder('s')
      .where('s.detected_issues IS NOT NULL')
      .andWhere("jsonb_array_length(s.detected_issues) > 0");

    if (severity) {
      qb.andWhere(`s.detected_issues @> :severity`, {
        severity: JSON.stringify([{ severity }]),
      });
    }

    return qb.orderBy('s.analyzed_at', 'DESC').take(limit).getMany();
  }

  // Simulated sentiment analysis (would be replaced with actual AI integration)
  private performSentimentAnalysis(text: string): {
    sentiment: SentimentScore;
    confidence: number;
    positive: number;
    negative: number;
    neutral: number;
    emotions: SentimentAnalysis['emotions'];
    keywords: string[];
    topics: string[];
    issues: SentimentAnalysis['detectedIssues'];
  } {
    const lowerText = text.toLowerCase();

    // Simple keyword-based analysis
    const positiveWords = ['great', 'excellent', 'amazing', 'wonderful', 'love', 'fantastic', 'happy', 'satisfied', 'helpful', 'kind'];
    const negativeWords = ['bad', 'terrible', 'awful', 'poor', 'disappointed', 'frustrating', 'rude', 'late', 'unprofessional', 'never'];

    let positiveCount = 0;
    let negativeCount = 0;

    for (const word of positiveWords) {
      if (lowerText.includes(word)) positiveCount++;
    }

    for (const word of negativeWords) {
      if (lowerText.includes(word)) negativeCount++;
    }

    const total = positiveCount + negativeCount || 1;
    const positive = positiveCount / total;
    const negative = negativeCount / total;
    const neutral = 1 - positive - negative;

    let sentiment: SentimentScore;
    if (positive > 0.6) sentiment = SentimentScore.VERY_POSITIVE;
    else if (positive > 0.3) sentiment = SentimentScore.POSITIVE;
    else if (negative > 0.6) sentiment = SentimentScore.VERY_NEGATIVE;
    else if (negative > 0.3) sentiment = SentimentScore.NEGATIVE;
    else sentiment = SentimentScore.NEUTRAL;

    // Extract keywords (simple implementation)
    const words = text.split(/\s+/).filter(w => w.length > 4);
    const keywords = [...new Set(words)].slice(0, 10);

    // Detect issues
    const issues: SentimentAnalysis['detectedIssues'] = [];
    if (lowerText.includes('late')) {
      issues.push({ category: 'punctuality', description: 'Lateness mentioned', severity: 'medium' });
    }
    if (lowerText.includes('rude') || lowerText.includes('unprofessional')) {
      issues.push({ category: 'behavior', description: 'Professionalism concern', severity: 'high' });
    }

    return {
      sentiment,
      confidence: 0.85,
      positive,
      negative,
      neutral,
      emotions: {
        joy: positive > 0.5 ? 0.8 : 0.2,
        trust: positive > 0.3 ? 0.6 : 0.3,
        anger: negative > 0.5 ? 0.7 : 0.1,
        sadness: negative > 0.3 ? 0.5 : 0.1,
      },
      keywords,
      topics: [],
      issues,
    };
  }
}
