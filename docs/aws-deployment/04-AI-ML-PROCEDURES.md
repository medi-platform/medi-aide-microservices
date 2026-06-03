# AI/ML Expert: AI Module Configuration & Operations (Monolithic)

## Table of Contents

1. [AI Architecture Overview](#1-ai-architecture-overview)
2. [AI Modules in Backend](#2-ai-modules-in-backend)
3. [External AI Services Setup](#3-external-ai-services-setup)
4. [AI Matching Service](#4-ai-matching-service)
5. [NLP & Text Analysis](#5-nlp--text-analysis)
6. [Recommendations Engine](#6-recommendations-engine)
7. [AI Configuration](#7-ai-configuration)
8. [Monitoring & Observability](#8-monitoring--observability)
9. [Testing AI Features](#9-testing-ai-features)
10. [Production Operations](#10-production-operations)

---

## 1. AI Architecture Overview

### 1.1 AI in Monolithic Architecture

In the monolithic Medi-Aide backend, AI capabilities are **integrated directly into the NestJS application** as modules. There is no separate AI microservice.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    medi-aide-backend (NestJS)                       │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                      Core Modules                               ││
│  │  Users, Caregivers, Care Recipients, Care Requests, Visits, etc.││
│  └─────────────────────────────────────────────────────────────────┘│
│                                │                                    │
│                                ▼                                    │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                      AI Modules                                 ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ ││
│  │  │ AIModule    │  │ AIMatching  │  │  CohereModule           │ ││
│  │  │ (Core AI)   │  │   Module    │  │  (Text Generation)      │ ││
│  │  └─────────────┘  └─────────────┘  └─────────────────────────┘ ││
│  │                                                                 ││
│  │  ┌─────────────────────────┐  ┌─────────────────────────────┐  ││
│  │  │  HuggingFaceModule      │  │  RecommendationsModule      │  ││
│  │  │  (NLP, Embeddings)      │  │  (Training, Wellness)       │  ││
│  │  └─────────────────────────┘  └─────────────────────────────┘  ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                │                                    │
│                                ▼                                    │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                   External AI APIs                              ││
│  │  ┌───────────┐  ┌───────────────┐  ┌─────────────────────────┐ ││
│  │  │  Cohere   │  │  HuggingFace  │  │  (Future: AWS Bedrock)  │ ││
│  │  │   API     │  │  Inference    │  │                         │ ││
│  │  └───────────┘  └───────────────┘  └─────────────────────────┘ ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 AI Capabilities

| Capability | Module | External Service | Purpose |
|------------|--------|------------------|---------|
| Caregiver-Care Recipient Matching | AIMatchingModule | Cohere (optional) | Match caregivers to care recipient needs |
| Text Generation | CohereModule | Cohere API | Care plan suggestions, summaries |
| Sentiment Analysis | HuggingFaceModule | HuggingFace | Analyze feedback sentiment |
| Text Embeddings | HuggingFaceModule | HuggingFace | Semantic search, similarity |
| Training Recommendations | RecommendationsModule | Internal | Suggest training courses |
| Wellness Insights | WellnessModule | Internal | Health trend analysis |

### 1.3 Module Locations

```
medi-aide-backend/src/modules/
├── ai/
│   ├── ai.module.ts
│   ├── ai.service.ts
│   └── ai.controller.ts
├── ai-matching/
│   ├── ai-matching.module.ts
│   ├── ai-matching.service.ts
│   ├── scoring/
│   │   ├── skill-matcher.ts
│   │   ├── availability-matcher.ts
│   │   └── preference-matcher.ts
│   └── dto/
├── cohere/
│   ├── cohere.module.ts
│   ├── cohere.service.ts
│   └── cohere.config.ts
├── huggingface/
│   ├── huggingface.module.ts
│   ├── huggingface.service.ts
│   └── models/
└── recommendations/
    ├── recommendations.module.ts
    ├── training-recommendations.service.ts
    └── wellness-recommendations.service.ts
```

---

## 2. AI Modules in Backend

### 2.1 Core AI Module

```typescript
// src/modules/ai/ai.module.ts
import { Module } from '@nestjs/common';
import { AIService } from './ai.service';
import { AIController } from './ai.controller';
import { AIMatchingModule } from '../ai-matching/ai-matching.module';
import { CohereModule } from '../cohere/cohere.module';
import { HuggingFaceModule } from '../huggingface/huggingface.module';

@Module({
  imports: [
    AIMatchingModule,
    CohereModule,
    HuggingFaceModule,
  ],
  controllers: [AIController],
  providers: [AIService],
  exports: [AIService],
})
export class AIModule {}
```

### 2.2 AI Service

```typescript
// src/modules/ai/ai.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { AIMatchingService } from '../ai-matching/ai-matching.service';
import { CohereService } from '../cohere/cohere.service';
import { HuggingFaceService } from '../huggingface/huggingface.service';

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);

  constructor(
    private readonly matchingService: AIMatchingService,
    private readonly cohereService: CohereService,
    private readonly huggingfaceService: HuggingFaceService,
  ) {}

  async findCaregiverMatches(patientId: string, options?: MatchOptions) {
    this.logger.log(`Finding caregiver matches for patient ${patientId}`);
    return this.matchingService.findMatches(patientId, options);
  }

  async generateCarePlanSuggestions(patientData: any) {
    return this.cohereService.generateCarePlanSuggestions(patientData);
  }

  async analyzeSentiment(text: string) {
    return this.huggingfaceService.analyzeSentiment(text);
  }

  async getTextEmbedding(text: string) {
    return this.huggingfaceService.getEmbedding(text);
  }
}
```

### 2.3 AI Controller

```typescript
// src/modules/ai/ai.controller.ts
import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AIService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('AI')
@Controller('api/v1/ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AIController {
  constructor(private readonly aiService: AIService) {}

  @Post('match-caregivers')
  @ApiOperation({ summary: 'Find matching caregivers for a care recipient' })
  async matchCaregivers(
    @Body() body: { patientId: string; options?: MatchOptions },
  ) {
    return this.aiService.findCaregiverMatches(body.patientId, body.options);
  }

  @Post('care-plan-suggestions')
  @ApiOperation({ summary: 'Generate care plan suggestions' })
  async carePlanSuggestions(@Body() patientData: any) {
    return this.aiService.generateCarePlanSuggestions(patientData);
  }

  @Post('sentiment')
  @ApiOperation({ summary: 'Analyze text sentiment' })
  async analyzeSentiment(@Body() body: { text: string }) {
    return this.aiService.analyzeSentiment(body.text);
  }
}
```

---

## 3. External AI Services Setup

### 3.1 Cohere Setup

1. **Create Cohere Account**: https://cohere.ai/
2. **Get API Key**: Dashboard > API Keys
3. **Configure Environment**:

```bash
# .env
COHERE_API_KEY=your_cohere_api_key_here
COHERE_MODEL=command
COHERE_MAX_TOKENS=1000
```

4. **Cohere Service**:

```typescript
// src/modules/cohere/cohere.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CohereClient } from 'cohere-ai';

@Injectable()
export class CohereService {
  private readonly logger = new Logger(CohereService.name);
  private client: CohereClient;
  private isEnabled: boolean;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('COHERE_API_KEY');
    this.isEnabled = !!apiKey;

    if (this.isEnabled) {
      this.client = new CohereClient({ token: apiKey });
      this.logger.log('Cohere client initialized');
    } else {
      this.logger.warn('Cohere API key not configured - AI features disabled');
    }
  }

  async generateCarePlanSuggestions(patientData: any): Promise<string> {
    if (!this.isEnabled) {
      return 'AI suggestions not available';
    }

    const prompt = this.buildCarePlanPrompt(patientData);

    const response = await this.client.generate({
      model: this.configService.get('COHERE_MODEL', 'command'),
      prompt,
      maxTokens: this.configService.get('COHERE_MAX_TOKENS', 1000),
      temperature: 0.7,
    });

    return response.generations[0].text;
  }

  async generateText(prompt: string): Promise<string> {
    if (!this.isEnabled) {
      throw new Error('Cohere not configured');
    }

    const response = await this.client.generate({
      model: 'command',
      prompt,
      maxTokens: 500,
    });

    return response.generations[0].text;
  }

  private buildCarePlanPrompt(patientData: any): string {
    return `Based on the following care recipient information, suggest care plan goals and interventions:

Care recipient age: ${patientData.age}
Conditions: ${patientData.conditions?.join(', ') || 'None specified'}
Care Needs: ${patientData.careNeeds?.join(', ') || 'General care'}
Preferences: ${patientData.preferences || 'None specified'}

Please suggest:
1. Three measurable care goals
2. Recommended interventions for each goal
3. Suggested visit frequency
`;
  }
}
```

### 3.2 HuggingFace Setup

1. **Create HuggingFace Account**: https://huggingface.co/
2. **Get API Token**: Settings > Access Tokens
3. **Configure Environment**:

```bash
# .env
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxx
HUGGINGFACE_SENTIMENT_MODEL=distilbert-base-uncased-finetuned-sst-2-english
HUGGINGFACE_EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
```

4. **HuggingFace Service**:

```typescript
// src/modules/huggingface/huggingface.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HfInference } from '@huggingface/inference';

@Injectable()
export class HuggingFaceService {
  private readonly logger = new Logger(HuggingFaceService.name);
  private client: HfInference;
  private isEnabled: boolean;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('HUGGINGFACE_API_KEY');
    this.isEnabled = !!apiKey;

    if (this.isEnabled) {
      this.client = new HfInference(apiKey);
      this.logger.log('HuggingFace client initialized');
    } else {
      this.logger.warn('HuggingFace API key not configured');
    }
  }

  async analyzeSentiment(text: string): Promise<SentimentResult> {
    if (!this.isEnabled) {
      return { label: 'NEUTRAL', score: 0.5 };
    }

    const model = this.configService.get(
      'HUGGINGFACE_SENTIMENT_MODEL',
      'distilbert-base-uncased-finetuned-sst-2-english',
    );

    const result = await this.client.textClassification({
      model,
      inputs: text,
    });

    return {
      label: result[0].label,
      score: result[0].score,
    };
  }

  async getEmbedding(text: string): Promise<number[]> {
    if (!this.isEnabled) {
      throw new Error('HuggingFace not configured');
    }

    const model = this.configService.get(
      'HUGGINGFACE_EMBEDDING_MODEL',
      'sentence-transformers/all-MiniLM-L6-v2',
    );

    const result = await this.client.featureExtraction({
      model,
      inputs: text,
    });

    return result as number[];
  }
}

interface SentimentResult {
  label: string;
  score: number;
}
```

### 3.3 AWS Secrets Manager (Production)

Store API keys securely:

```bash
# Create secrets for AI services
aws secretsmanager create-secret \
  --name medi-aide/production/ai/cohere-api-key \
  --secret-string "your_cohere_api_key"

aws secretsmanager create-secret \
  --name medi-aide/production/ai/huggingface-api-key \
  --secret-string "hf_xxxxxxxxxxxxx"
```

---

## 4. AI Matching Service

### 4.1 Matching Algorithm

The AI matching service scores caregiver-care recipient compatibility:

```typescript
// src/modules/ai-matching/ai-matching.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Caregiver } from '../../entities/caregiver.entity';
import { Patient } from '../../entities/patient.entity';

@Injectable()
export class AIMatchingService {
  private readonly logger = new Logger(AIMatchingService.name);

  constructor(
    @InjectRepository(Caregiver)
    private caregiverRepo: Repository<Caregiver>,
    @InjectRepository(Patient)
    private patientRepo: Repository<Patient>,
  ) {}

  async findMatches(
    patientId: string,
    options?: MatchOptions,
  ): Promise<MatchResult[]> {
    // Get care recipient with care needs
    const patient = await this.patientRepo.findOne({
      where: { id: patientId },
      relations: ['careNeeds', 'preferences'],
    });

    if (!patient) {
      throw new Error('Care recipient not found');
    }

    // Get available caregivers
    const caregivers = await this.caregiverRepo.find({
      where: { isActive: true, isAvailable: true },
      relations: ['skills', 'certifications', 'availability'],
    });

    // Score each caregiver
    const scoredCaregivers = caregivers.map((caregiver) => ({
      caregiver,
      score: this.calculateMatchScore(patient, caregiver),
      breakdown: this.getScoreBreakdown(patient, caregiver),
    }));

    // Sort by score and filter by minimum
    const minScore = options?.minScore ?? 0.3;
    const maxResults = options?.maxResults ?? 20;

    return scoredCaregivers
      .filter((m) => m.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults)
      .map((m) => ({
        caregiverId: m.caregiver.id,
        caregiverName: `${m.caregiver.firstName} ${m.caregiver.lastName}`,
        score: m.score,
        breakdown: m.breakdown,
      }));
  }

  private calculateMatchScore(patient: Patient, caregiver: Caregiver): number {
    const weights = {
      skills: 0.30,
      availability: 0.25,
      distance: 0.20,
      experience: 0.10,
      rating: 0.10,
      preferences: 0.05,
    };

    const scores = {
      skills: this.calculateSkillMatch(patient, caregiver),
      availability: this.calculateAvailabilityMatch(patient, caregiver),
      distance: this.calculateDistanceScore(patient, caregiver),
      experience: this.normalizeExperience(caregiver.experienceYears),
      rating: this.normalizeRating(caregiver.averageRating),
      preferences: this.calculatePreferenceMatch(patient, caregiver),
    };

    return Object.entries(weights).reduce(
      (total, [key, weight]) => total + scores[key] * weight,
      0,
    );
  }

  private calculateSkillMatch(patient: Patient, caregiver: Caregiver): number {
    const requiredSkills = patient.careNeeds?.map((n) => n.skillRequired) || [];
    const caregiverSkills = caregiver.skills?.map((s) => s.name) || [];

    if (requiredSkills.length === 0) return 1;

    const matches = requiredSkills.filter((skill) =>
      caregiverSkills.some((cs) => cs.toLowerCase().includes(skill.toLowerCase())),
    );

    return matches.length / requiredSkills.length;
  }

  private calculateAvailabilityMatch(
    patient: Patient,
    caregiver: Caregiver,
  ): number {
    // Compare the care recipient's needed schedule with caregiver availability
    // Implementation depends on your scheduling model
    return 0.8; // Placeholder
  }

  private calculateDistanceScore(
    patient: Patient,
    caregiver: Caregiver,
  ): number {
    // Calculate based on lat/lng distance
    // Returns 1 for very close, 0 for too far
    const maxDistance = 50; // km
    const distance = this.calculateDistance(
      patient.latitude,
      patient.longitude,
      caregiver.latitude,
      caregiver.longitude,
    );

    if (distance > maxDistance) return 0;
    return 1 - distance / maxDistance;
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    // Haversine formula
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  private normalizeExperience(years: number): number {
    // 0 years = 0.3, 10+ years = 1.0
    return Math.min(0.3 + (years / 10) * 0.7, 1);
  }

  private normalizeRating(rating: number): number {
    // 1-5 scale to 0-1
    return (rating - 1) / 4;
  }

  private calculatePreferenceMatch(
    patient: Patient,
    caregiver: Caregiver,
  ): number {
    let score = 1;

    // Gender preference
    if (patient.preferences?.genderPreference) {
      if (patient.preferences.genderPreference !== caregiver.gender) {
        score *= 0.5;
      }
    }

    // Language preference
    if (patient.preferences?.languages?.length > 0) {
      const hasLanguage = patient.preferences.languages.some((lang) =>
        caregiver.languages?.includes(lang),
      );
      if (!hasLanguage) {
        score *= 0.7;
      }
    }

    return score;
  }

  private getScoreBreakdown(
    patient: Patient,
    caregiver: Caregiver,
  ): ScoreBreakdown {
    return {
      skills: this.calculateSkillMatch(patient, caregiver),
      availability: this.calculateAvailabilityMatch(patient, caregiver),
      distance: this.calculateDistanceScore(patient, caregiver),
      experience: this.normalizeExperience(caregiver.experienceYears),
      rating: this.normalizeRating(caregiver.averageRating),
      preferences: this.calculatePreferenceMatch(patient, caregiver),
    };
  }
}

interface MatchOptions {
  minScore?: number;
  maxResults?: number;
  includeUnavailable?: boolean;
}

interface MatchResult {
  caregiverId: string;
  caregiverName: string;
  score: number;
  breakdown: ScoreBreakdown;
}

interface ScoreBreakdown {
  skills: number;
  availability: number;
  distance: number;
  experience: number;
  rating: number;
  preferences: number;
}
```

---

## 5. NLP & Text Analysis

### 5.1 Sentiment Analysis for Feedback

```typescript
// Usage in feedback module
@Injectable()
export class FeedbackService {
  constructor(
    private readonly aiService: AIService,
    @InjectRepository(Feedback)
    private feedbackRepo: Repository<Feedback>,
  ) {}

  async submitFeedback(createDto: CreateFeedbackDto): Promise<Feedback> {
    // Analyze sentiment
    const sentiment = await this.aiService.analyzeSentiment(createDto.comment);

    const feedback = this.feedbackRepo.create({
      ...createDto,
      sentimentLabel: sentiment.label,
      sentimentScore: sentiment.score,
    });

    return this.feedbackRepo.save(feedback);
  }

  async getFeedbackWithNegativeSentiment(): Promise<Feedback[]> {
    return this.feedbackRepo.find({
      where: { sentimentLabel: 'NEGATIVE' },
      order: { createdAt: 'DESC' },
    });
  }
}
```

### 5.2 Text Summarization

```typescript
// Care plan summary generation
async generateVisitSummary(visitId: string): Promise<string> {
  const visit = await this.visitRepo.findOne({
    where: { id: visitId },
    relations: ['notes', 'tasks'],
  });

  const notesText = visit.notes.map((n) => n.content).join('\n');

  const prompt = `Summarize the following caregiver visit notes in 2-3 sentences:

${notesText}

Summary:`;

  return this.cohereService.generateText(prompt);
}
```

---

## 6. Recommendations Engine

### 6.1 Training Recommendations

```typescript
// src/modules/recommendations/training-recommendations.service.ts
@Injectable()
export class TrainingRecommendationsService {
  constructor(
    @InjectRepository(Caregiver)
    private caregiverRepo: Repository<Caregiver>,
    @InjectRepository(Course)
    private courseRepo: Repository<Course>,
    @InjectRepository(CourseCompletion)
    private completionRepo: Repository<CourseCompletion>,
  ) {}

  async getRecommendationsForCaregiver(
    caregiverId: string,
  ): Promise<CourseRecommendation[]> {
    const caregiver = await this.caregiverRepo.findOne({
      where: { id: caregiverId },
      relations: ['skills', 'certifications'],
    });

    // Get completed courses
    const completedCourseIds = await this.completionRepo
      .find({
        where: { caregiverId },
        select: ['courseId'],
      })
      .then((c) => c.map((x) => x.courseId));

    // Get all courses not yet completed
    const availableCourses = await this.courseRepo.find({
      where: { isActive: true },
    });

    const uncompletedCourses = availableCourses.filter(
      (c) => !completedCourseIds.includes(c.id),
    );

    // Score and rank courses
    const scoredCourses = uncompletedCourses.map((course) => ({
      course,
      score: this.calculateRelevanceScore(caregiver, course),
      reason: this.getRecommendationReason(caregiver, course),
    }));

    return scoredCourses
      .filter((c) => c.score > 0.3)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((c) => ({
        courseId: c.course.id,
        courseName: c.course.name,
        score: c.score,
        reason: c.reason,
      }));
  }

  private calculateRelevanceScore(caregiver: Caregiver, course: Course): number {
    let score = 0.5; // Base score

    // Boost if course matches caregiver's specialty areas
    if (caregiver.skills?.some((s) => course.relatedSkills?.includes(s.name))) {
      score += 0.2;
    }

    // Boost if certification is expiring soon
    if (course.forCertification) {
      const expiringSoon = caregiver.certifications?.find(
        (c) =>
          c.name === course.forCertification &&
          c.expiresAt &&
          new Date(c.expiresAt) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      );
      if (expiringSoon) {
        score += 0.3;
      }
    }

    // Boost popular courses
    if (course.completionCount > 100) {
      score += 0.1;
    }

    return Math.min(score, 1);
  }

  private getRecommendationReason(
    caregiver: Caregiver,
    course: Course,
  ): string {
    // Return human-readable reason
    if (course.forCertification) {
      return `Helps maintain your ${course.forCertification} certification`;
    }
    if (course.relatedSkills?.some((s) => caregiver.skills?.find((cs) => cs.name === s))) {
      return 'Builds on your existing skills';
    }
    return 'Recommended for caregivers in your role';
  }
}
```

---

## 7. AI Configuration

### 7.1 Environment Variables

```bash
# AI Feature Flags
AI_MATCHING_ENABLED=true
AI_TEXT_GENERATION_ENABLED=true
AI_SENTIMENT_ANALYSIS_ENABLED=true

# Cohere Configuration
COHERE_API_KEY=your_api_key
COHERE_MODEL=command
COHERE_MAX_TOKENS=1000
COHERE_TEMPERATURE=0.7

# HuggingFace Configuration
HUGGINGFACE_API_KEY=hf_xxxxxxxxx
HUGGINGFACE_SENTIMENT_MODEL=distilbert-base-uncased-finetuned-sst-2-english
HUGGINGFACE_EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2

# Matching Configuration
AI_MATCHING_MIN_SCORE=0.3
AI_MATCHING_MAX_RESULTS=20
AI_MATCHING_CACHE_TTL=3600
```

### 7.2 Feature Toggles

```typescript
// src/modules/ai/ai-config.service.ts
@Injectable()
export class AIConfigService {
  constructor(private configService: ConfigService) {}

  isMatchingEnabled(): boolean {
    return this.configService.get('AI_MATCHING_ENABLED', 'true') === 'true';
  }

  isTextGenerationEnabled(): boolean {
    return this.configService.get('AI_TEXT_GENERATION_ENABLED', 'true') === 'true';
  }

  isSentimentAnalysisEnabled(): boolean {
    return this.configService.get('AI_SENTIMENT_ANALYSIS_ENABLED', 'true') === 'true';
  }

  getMatchingConfig(): MatchingConfig {
    return {
      minScore: parseFloat(this.configService.get('AI_MATCHING_MIN_SCORE', '0.3')),
      maxResults: parseInt(this.configService.get('AI_MATCHING_MAX_RESULTS', '20')),
      cacheTtl: parseInt(this.configService.get('AI_MATCHING_CACHE_TTL', '3600')),
    };
  }
}
```

---

## 8. Monitoring & Observability

### 8.1 Logging AI Operations

```typescript
// Add structured logging for AI operations
@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);

  async findCaregiverMatches(patientId: string, options?: MatchOptions) {
    const startTime = Date.now();

    this.logger.log({
      message: 'Starting caregiver matching',
      patientId,
      options,
    });

    try {
      const results = await this.matchingService.findMatches(patientId, options);

      this.logger.log({
        message: 'Caregiver matching completed',
        patientId,
        matchCount: results.length,
        topScore: results[0]?.score,
        durationMs: Date.now() - startTime,
      });

      return results;
    } catch (error) {
      this.logger.error({
        message: 'Caregiver matching failed',
        patientId,
        error: error.message,
        durationMs: Date.now() - startTime,
      });
      throw error;
    }
  }
}
```

### 8.2 Metrics

Track key AI metrics:

| Metric | Description |
|--------|-------------|
| `ai_matching_requests_total` | Total matching requests |
| `ai_matching_duration_seconds` | Matching operation duration |
| `ai_matching_results_count` | Number of matches returned |
| `ai_cohere_requests_total` | Cohere API calls |
| `ai_cohere_errors_total` | Cohere API errors |
| `ai_sentiment_requests_total` | Sentiment analysis requests |

---

## 9. Testing AI Features

### 9.1 Unit Tests

```typescript
// src/modules/ai-matching/ai-matching.service.spec.ts
describe('AIMatchingService', () => {
  let service: AIMatchingService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AIMatchingService,
        {
          provide: getRepositoryToken(Caregiver),
          useValue: mockCaregiverRepo,
        },
        {
          provide: getRepositoryToken(Patient),
          useValue: mockPatientRepo,
        },
      ],
    }).compile();

    service = module.get<AIMatchingService>(AIMatchingService);
  });

  describe('findMatches', () => {
    it('should return sorted matches above minimum score', async () => {
      mockPatientRepo.findOne.mockResolvedValue(mockPatient);
      mockCaregiverRepo.find.mockResolvedValue(mockCaregivers);

      const results = await service.findMatches('patient-1', { minScore: 0.5 });

      expect(results).toHaveLength(3);
      expect(results[0].score).toBeGreaterThanOrEqual(results[1].score);
      expect(results.every((r) => r.score >= 0.5)).toBe(true);
    });

    it('should throw error if care recipient not found', async () => {
      mockPatientRepo.findOne.mockResolvedValue(null);

      await expect(service.findMatches('invalid-id')).rejects.toThrow(
        'Care recipient not found',
      );
    });
  });
});
```

### 9.2 Integration Tests

```typescript
// test/ai.e2e-spec.ts
describe('AI (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/api/v1/ai/match-caregivers (POST)', () => {
    return request(app.getHttpServer())
      .post('/api/v1/ai/match-caregivers')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ patientId: 'test-patient-id' })
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body[0]).toHaveProperty('caregiverId');
        expect(res.body[0]).toHaveProperty('score');
      });
  });
});
```

---

## 10. Production Operations

### 10.1 API Rate Limits

External AI APIs have rate limits. Handle gracefully:

```typescript
@Injectable()
export class CohereService {
  private rateLimiter = new RateLimiter({
    tokensPerInterval: 100,
    interval: 'minute',
  });

  async generateText(prompt: string): Promise<string> {
    await this.rateLimiter.removeTokens(1);

    try {
      return await this.client.generate({ prompt });
    } catch (error) {
      if (error.status === 429) {
        this.logger.warn('Rate limited by Cohere API');
        throw new TooManyRequestsException('AI service temporarily unavailable');
      }
      throw error;
    }
  }
}
```

### 10.2 Fallback Strategies

```typescript
async generateCarePlanSuggestions(patientData: any): Promise<string> {
  // Try Cohere first
  if (this.cohereService.isEnabled) {
    try {
      return await this.cohereService.generateCarePlanSuggestions(patientData);
    } catch (error) {
      this.logger.error('Cohere failed, using fallback', error);
    }
  }

  // Fallback to template-based suggestions
  return this.generateTemplateSuggestions(patientData);
}

private generateTemplateSuggestions(patientData: any): string {
  // Rule-based fallback
  const suggestions = [];

  if (patientData.conditions?.includes('diabetes')) {
    suggestions.push('Monitor blood glucose levels daily');
  }

  if (patientData.age > 65) {
    suggestions.push('Fall prevention assessment recommended');
  }

  return suggestions.join('\n');
}
```

### 10.3 Cost Management

Monitor and control AI API costs:

| Service | Pricing | Monthly Budget |
|---------|---------|----------------|
| Cohere | ~$0.40/1K tokens | $500 |
| HuggingFace | Free tier / ~$0.06/1K chars | $200 |

Set up billing alerts in each service's dashboard.

---

## Appendix: Quick Reference

### AI Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/ai/match-caregivers` | POST | Find matching caregivers |
| `/api/v1/ai/care-plan-suggestions` | POST | Generate care plan suggestions |
| `/api/v1/ai/sentiment` | POST | Analyze text sentiment |

### Environment Variables

```bash
# Required for AI features
COHERE_API_KEY=your_key
HUGGINGFACE_API_KEY=hf_xxxxx

# Optional configuration
AI_MATCHING_ENABLED=true
AI_MATCHING_MIN_SCORE=0.3
AI_MATCHING_MAX_RESULTS=20
```

### Troubleshooting

| Issue | Solution |
|-------|----------|
| AI features returning defaults | Check API keys are set |
| Rate limit errors | Implement caching, reduce request frequency |
| Slow matching | Add indexes on care recipient/caregiver tables |
| Sentiment always neutral | Check HuggingFace model availability |
