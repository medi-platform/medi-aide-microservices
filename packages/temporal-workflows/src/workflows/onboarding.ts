/**
 * Onboarding Workflow
 * 
 * Orchestrates caregiver or agency onboarding process.
 */

import { proxyActivities, defineQuery, setHandler, sleep } from '@temporalio/workflow';

export const getOnboardingStatusQuery = defineQuery<OnboardingStatus>('getOnboardingStatus');

export interface OnboardingInput {
  entityId: string;
  entityType: 'caregiver' | 'agency';
  requiredDocuments: string[];
  requiresBackgroundCheck: boolean;
}

export interface OnboardingStatus {
  phase: 'documents' | 'verification' | 'background-check' | 'training' | 'complete' | 'failed';
  documentsVerified: boolean;
  backgroundCheckPassed: boolean | null;
  trainingCompleted: boolean;
  completedAt?: string;
  failureReason?: string;
}

const activities = proxyActivities<{
  verifyDocuments: (entityId: string, documentTypes: string[]) => Promise<{ verified: boolean; missingDocuments: string[] }>;
  runBackgroundCheck: (entityId: string) => Promise<{ passed: boolean; checkId: string }>;
}>({
  startToCloseTimeout: '5 minutes',
  retry: { maximumAttempts: 3 },
});

export async function onboardingWorkflow(input: OnboardingInput): Promise<OnboardingStatus> {
  const status: OnboardingStatus = {
    phase: 'documents',
    documentsVerified: false,
    backgroundCheckPassed: null,
    trainingCompleted: false,
  };

  setHandler(getOnboardingStatusQuery, () => status);

  // Phase 1: Document Verification
  status.phase = 'verification';
  const docResult = await activities.verifyDocuments(input.entityId, input.requiredDocuments);
  
  if (!docResult.verified) {
    status.phase = 'failed';
    status.failureReason = `Missing documents: ${docResult.missingDocuments.join(', ')}`;
    return status;
  }
  status.documentsVerified = true;

  // Phase 2: Background Check (if required)
  if (input.requiresBackgroundCheck) {
    status.phase = 'background-check';
    const bgResult = await activities.runBackgroundCheck(input.entityId);
    status.backgroundCheckPassed = bgResult.passed;
    
    if (!bgResult.passed) {
      status.phase = 'failed';
      status.failureReason = 'Background check failed';
      return status;
    }
  } else {
    status.backgroundCheckPassed = true;
  }

  // Phase 3: Training (simulated)
  status.phase = 'training';
  await sleep('1 second'); // In production, this would wait for training completion
  status.trainingCompleted = true;

  // Complete
  status.phase = 'complete';
  status.completedAt = new Date().toISOString();

  return status;
}

