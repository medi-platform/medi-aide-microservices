/**
 * Agency/Caregiver Onboarding Workflow
 * 
 * Orchestrates the multi-step onboarding process:
 * 1. Collect basic information
 * 2. Document upload and verification
 * 3. Background check
 * 4. Training assignment
 * 5. Final approval
 */

import { proxyActivities, sleep, defineSignal, setHandler, condition } from '@temporalio/workflow';
import type * as activities from '../activities';

const {
  sendOnboardingEmail,
  verifyDocuments,
  initiateBackgroundCheck,
  checkBackgroundStatus,
  assignRequiredTraining,
  checkTrainingCompletion,
  approveOnboarding,
  notifyAdminForReview,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '5 minutes',
  retry: {
    maximumAttempts: 3,
  },
});

export const documentsUploadedSignal = defineSignal<[string[]]>('documentsUploaded');
export const adminApprovalSignal = defineSignal<[boolean, string]>('adminApproval');

export interface OnboardingWorkflowInput {
  entityId: string;
  entityType: 'caregiver' | 'agency';
  email: string;
  name: string;
}

export interface OnboardingWorkflowResult {
  entityId: string;
  status: 'approved' | 'rejected' | 'expired';
  completedSteps: string[];
  rejectionReason?: string;
}

export async function onboardingWorkflow(
  input: OnboardingWorkflowInput
): Promise<OnboardingWorkflowResult> {
  const { entityId, entityType, email, name } = input;
  const completedSteps: string[] = [];
  
  let uploadedDocuments: string[] = [];
  let adminApproved: boolean | null = null;
  let adminNotes = '';

  // Signal handlers
  setHandler(documentsUploadedSignal, (docs: string[]) => {
    uploadedDocuments = docs;
  });

  setHandler(adminApprovalSignal, (approved: boolean, notes: string) => {
    adminApproved = approved;
    adminNotes = notes;
  });

  // Step 1: Send welcome email with instructions
  await sendOnboardingEmail(email, 'welcome', { name, entityType });
  completedSteps.push('welcome_sent');

  // Step 2: Wait for document upload (max 7 days)
  await sendOnboardingEmail(email, 'document_request', { 
    name, 
    requiredDocs: getRequiredDocuments(entityType) 
  });

  const docsUploaded = await condition(
    () => uploadedDocuments.length >= getRequiredDocuments(entityType).length,
    '7 days'
  );

  if (!docsUploaded) {
    return {
      entityId,
      status: 'expired',
      completedSteps,
      rejectionReason: 'Documents not uploaded within deadline',
    };
  }
  completedSteps.push('documents_uploaded');

  // Step 3: Verify documents
  const docVerification = await verifyDocuments(entityId, uploadedDocuments);
  if (!docVerification.allValid) {
    await sendOnboardingEmail(email, 'document_issues', {
      name,
      issues: docVerification.issues,
    });
    return {
      entityId,
      status: 'rejected',
      completedSteps,
      rejectionReason: `Document issues: ${docVerification.issues.join(', ')}`,
    };
  }
  completedSteps.push('documents_verified');

  // Step 4: Background check (for caregivers)
  if (entityType === 'caregiver') {
    const bgCheckId = await initiateBackgroundCheck(entityId);
    
    // Poll for background check completion (max 14 days)
    let bgCheckComplete = false;
    let bgCheckPassed = false;
    const bgDeadline = Date.now() + 14 * 24 * 60 * 60 * 1000;

    while (!bgCheckComplete && Date.now() < bgDeadline) {
      await sleep('6 hours');
      const status = await checkBackgroundStatus(bgCheckId);
      if (status.complete) {
        bgCheckComplete = true;
        bgCheckPassed = status.passed;
      }
    }

    if (!bgCheckComplete || !bgCheckPassed) {
      return {
        entityId,
        status: 'rejected',
        completedSteps,
        rejectionReason: bgCheckComplete 
          ? 'Background check did not pass'
          : 'Background check timed out',
      };
    }
    completedSteps.push('background_check_passed');
  }

  // Step 5: Assign and track required training
  if (entityType === 'caregiver') {
    const trainingIds = await assignRequiredTraining(entityId);
    await sendOnboardingEmail(email, 'training_assigned', { name, trainingIds });

    // Wait for training completion (max 30 days)
    const trainingDeadline = Date.now() + 30 * 24 * 60 * 60 * 1000;
    let trainingComplete = false;

    while (!trainingComplete && Date.now() < trainingDeadline) {
      await sleep('1 day');
      trainingComplete = await checkTrainingCompletion(entityId, trainingIds);
    }

    if (!trainingComplete) {
      return {
        entityId,
        status: 'expired',
        completedSteps,
        rejectionReason: 'Required training not completed within deadline',
      };
    }
    completedSteps.push('training_completed');
  }

  // Step 6: Admin review for agencies
  if (entityType === 'agency') {
    await notifyAdminForReview(entityId, entityType);
    
    const adminReviewed = await condition(
      () => adminApproved !== null,
      '7 days'
    );

    if (!adminReviewed || !adminApproved) {
      return {
        entityId,
        status: adminReviewed ? 'rejected' : 'expired',
        completedSteps,
        rejectionReason: adminNotes || 'Admin review not completed',
      };
    }
    completedSteps.push('admin_approved');
  }

  // Final approval
  await approveOnboarding(entityId, entityType);
  await sendOnboardingEmail(email, 'onboarding_complete', { name });
  completedSteps.push('onboarding_complete');

  return {
    entityId,
    status: 'approved',
    completedSteps,
  };
}

function getRequiredDocuments(entityType: 'caregiver' | 'agency'): string[] {
  if (entityType === 'caregiver') {
    return ['id', 'certification', 'insurance'];
  }
  return ['business_license', 'insurance', 'registration'];
}

