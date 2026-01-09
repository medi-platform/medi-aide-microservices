/**
 * Standard API Tags for Medi-Aide Services
 */

export const API_TAGS = {
  // Agency Service
  AGENCIES: 'agencies',
  AGENCY_STAFF: 'agency-staff',
  AGENCY_BILLING: 'agency-billing',
  AGENCY_COMPLIANCE: 'agency-compliance',
  JOB_POSTINGS: 'job-postings',
  
  // Caregiver Service
  CAREGIVERS: 'caregivers',
  CAREGIVER_AVAILABILITY: 'caregiver-availability',
  CAREGIVER_CERTIFICATIONS: 'caregiver-certifications',
  CAREGIVER_DOCUMENTS: 'caregiver-documents',
  CAREGIVER_PERFORMANCE: 'caregiver-performance',
  
  // Patient Service
  PATIENTS: 'patients',
  CARE_PLANS: 'care-plans',
  CLINICAL_NOTES: 'clinical-notes',
  MEDICATIONS: 'medications',
  VITAL_SIGNS: 'vital-signs',
  
  // Scheduling Service
  SCHEDULES: 'schedules',
  SHIFTS: 'shifts',
  AVAILABILITY: 'availability',
  RECURRING: 'recurring-schedules',
  
  // Residential Service
  RESIDENCES: 'residences',
  ROOMS: 'rooms',
  RESIDENTS: 'residents',
  FACILITY_SHIFTS: 'facility-shifts',
  MEALS: 'meals',
  
  // Communication Service
  MESSAGES: 'messages',
  NOTIFICATIONS: 'notifications',
  ANNOUNCEMENTS: 'announcements',
  TEMPLATES: 'message-templates',
  
  // Feedback Service
  SURVEYS: 'surveys',
  RATINGS: 'ratings',
  REVIEWS: 'reviews',
  FEEDBACK_ANALYTICS: 'feedback-analytics',
  
  // Reports Service
  REPORTS: 'reports',
  REPORT_TEMPLATES: 'report-templates',
  EXPORTS: 'exports',
  SCHEDULED_REPORTS: 'scheduled-reports',
  
  // Auth Service
  AUTH: 'auth',
  TOKENS: 'tokens',
  MFA: 'mfa',
  SESSIONS: 'sessions',
  
  // Supporting Services
  TRAINING: 'training',
  WELLNESS: 'wellness',
  MENTORSHIP: 'mentorship',
  INCIDENTS: 'incidents',
  
  // Infrastructure
  HEALTH: 'health',
  METRICS: 'metrics',
  DEFAULT: 'default',
} as const;

/**
 * Tag descriptions for Swagger UI
 */
export const TAG_DESCRIPTIONS: Record<string, string> = {
  [API_TAGS.AGENCIES]: 'Agency management and onboarding operations',
  [API_TAGS.AGENCY_STAFF]: 'Agency staff and employee management',
  [API_TAGS.AGENCY_BILLING]: 'Billing, invoicing, and payment operations',
  [API_TAGS.AGENCY_COMPLIANCE]: 'Compliance certificates and regulatory requirements',
  [API_TAGS.JOB_POSTINGS]: 'Job posting and application management',
  
  [API_TAGS.CAREGIVERS]: 'Caregiver profile and registration management',
  [API_TAGS.CAREGIVER_AVAILABILITY]: 'Caregiver availability and scheduling preferences',
  [API_TAGS.CAREGIVER_CERTIFICATIONS]: 'Professional certifications and training records',
  [API_TAGS.CAREGIVER_DOCUMENTS]: 'Document upload and management',
  [API_TAGS.CAREGIVER_PERFORMANCE]: 'Performance metrics and evaluations',
  
  [API_TAGS.PATIENTS]: 'Patient/client profile management',
  [API_TAGS.CARE_PLANS]: 'Care plan creation and management',
  [API_TAGS.CLINICAL_NOTES]: 'Clinical documentation and notes',
  [API_TAGS.MEDICATIONS]: 'Medication administration records (eMAR)',
  [API_TAGS.VITAL_SIGNS]: 'Vital signs tracking and monitoring',
  
  [API_TAGS.SCHEDULES]: 'Schedule creation and management',
  [API_TAGS.SHIFTS]: 'Shift assignments and time tracking',
  [API_TAGS.AVAILABILITY]: 'Availability checking and management',
  [API_TAGS.RECURRING]: 'Recurring schedule patterns',
  
  [API_TAGS.RESIDENCES]: 'Residential facility management',
  [API_TAGS.ROOMS]: 'Room and bed management',
  [API_TAGS.RESIDENTS]: 'Resident profiles and care',
  [API_TAGS.FACILITY_SHIFTS]: 'Facility staffing and shifts',
  [API_TAGS.MEALS]: 'Meal planning and dietary management',
  
  [API_TAGS.MESSAGES]: 'In-app messaging and chat',
  [API_TAGS.NOTIFICATIONS]: 'Push notifications and alerts',
  [API_TAGS.ANNOUNCEMENTS]: 'System-wide announcements',
  [API_TAGS.TEMPLATES]: 'Message and notification templates',
  
  [API_TAGS.SURVEYS]: 'Survey creation and distribution',
  [API_TAGS.RATINGS]: 'Rating submissions and management',
  [API_TAGS.REVIEWS]: 'Review management and moderation',
  [API_TAGS.FEEDBACK_ANALYTICS]: 'Feedback analytics and reporting',
  
  [API_TAGS.REPORTS]: 'Report generation and viewing',
  [API_TAGS.REPORT_TEMPLATES]: 'Custom report templates',
  [API_TAGS.EXPORTS]: 'Data export operations',
  [API_TAGS.SCHEDULED_REPORTS]: 'Automated scheduled reports',
  
  [API_TAGS.AUTH]: 'Authentication and login',
  [API_TAGS.TOKENS]: 'Token management and refresh',
  [API_TAGS.MFA]: 'Multi-factor authentication',
  [API_TAGS.SESSIONS]: 'Session management',
  
  [API_TAGS.TRAINING]: 'Training courses and certifications',
  [API_TAGS.WELLNESS]: 'Wellness programs and activities',
  [API_TAGS.MENTORSHIP]: 'Mentorship matching and management',
  [API_TAGS.INCIDENTS]: 'Incident reporting and management',
  
  [API_TAGS.HEALTH]: 'Health check endpoints',
  [API_TAGS.METRICS]: 'Metrics and monitoring endpoints',
  [API_TAGS.DEFAULT]: 'General endpoints',
};
