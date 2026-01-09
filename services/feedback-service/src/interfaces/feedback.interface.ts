/**
 * Feedback Service Interfaces
 */

export enum SurveyType {
  VISIT_SATISFACTION = 'visit_satisfaction',
  CAREGIVER_RATING = 'caregiver_rating',
  SERVICE_QUALITY = 'service_quality',
  NPS = 'nps',
  CUSTOM = 'custom',
}

export enum SurveyStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

export enum QuestionType {
  RATING = 'rating',
  TEXT = 'text',
  MULTIPLE_CHOICE = 'multiple_choice',
  CHECKBOX = 'checkbox',
  SCALE = 'scale',
  YES_NO = 'yes_no',
  NPS = 'nps',
}

export enum ResponseStatus {
  STARTED = 'started',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned',
}

export interface SurveyQuestion {
  id: string;
  type: QuestionType;
  text: string;
  required: boolean;
  order: number;
  options?: string[];
  minValue?: number;
  maxValue?: number;
  minLabel?: string;
  maxLabel?: string;
}

export interface QuestionAnswer {
  questionId: string;
  value: string | number | string[];
}

export interface RatingBreakdown {
  average: number;
  count: number;
  distribution: Record<number, number>;
}
