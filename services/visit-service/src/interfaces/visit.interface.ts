/**
 * Visit Service Interfaces
 */

export enum VisitStatus {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  EN_ROUTE = 'en_route',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
  RESCHEDULED = 'rescheduled',
}

export enum VisitType {
  REGULAR = 'regular',
  INITIAL_ASSESSMENT = 'initial_assessment',
  FOLLOW_UP = 'follow_up',
  RESPITE = 'respite',
  EMERGENCY = 'emergency',
  OVERNIGHT = 'overnight',
  LIVE_IN = 'live_in',
}

export enum CancellationReason {
  CAREGIVER_UNAVAILABLE = 'caregiver_unavailable',
  PATIENT_UNAVAILABLE = 'patient_unavailable',
  WEATHER = 'weather',
  HOSPITALIZATION = 'hospitalization',
  FAMILY_REQUEST = 'family_request',
  AGENCY_DECISION = 'agency_decision',
  OTHER = 'other',
}

export interface VisitTask {
  id: string;
  name: string;
  description?: string;
  category: string;
  isRequired: boolean;
  completedAt?: Date;
  notes?: string;
}

export interface VisitNote {
  id: string;
  type: 'general' | 'clinical' | 'incident' | 'private';
  content: string;
  createdBy: string;
  createdAt: Date;
  isPrivate: boolean;
}

export interface VisitAttachment {
  id: string;
  fileName: string;
  fileType: string;
  fileUrl: string;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface VisitSummary {
  visitId: string;
  duration: number;
  tasksCompleted: number;
  totalTasks: number;
  notes: string[];
  caregiverRating?: number;
  patientSatisfaction?: number;
}
