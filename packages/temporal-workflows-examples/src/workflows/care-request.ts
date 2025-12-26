/**
 * Care Request Workflow
 * 
 * Orchestrates the end-to-end care request fulfillment process:
 * 1. Validate request
 * 2. Find matching caregivers (AI)
 * 3. Notify matched caregivers
 * 4. Wait for acceptance
 * 5. Create schedule
 * 6. Notify patient
 */

import { proxyActivities, sleep, defineSignal, setHandler } from '@temporalio/workflow';
import type * as activities from '../activities';

const {
  validateCareRequest,
  findMatchingCaregivers,
  notifyCaregiver,
  notifyPatient,
  createSchedule,
  updateRequestStatus,
  sendToAIMatching,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '30 seconds',
  retry: {
    initialInterval: '1 second',
    maximumInterval: '1 minute',
    maximumAttempts: 3,
  },
});

// Signals for external events
export const acceptRequestSignal = defineSignal<[string, string]>('acceptRequest');
export const declineRequestSignal = defineSignal<[string, string]>('declineRequest');

export interface CareRequestWorkflowInput {
  requestId: string;
  patientId: string;
  requirements: {
    skills: string[];
    languages: string[];
    startDate: string;
    frequency: string;
    duration: number;
  };
  urgency: 'urgent' | 'normal' | 'flexible';
}

export interface CareRequestWorkflowResult {
  requestId: string;
  status: 'fulfilled' | 'expired' | 'cancelled';
  assignedCaregiverId?: string;
  scheduleId?: string;
}

export async function careRequestWorkflow(
  input: CareRequestWorkflowInput
): Promise<CareRequestWorkflowResult> {
  const { requestId, patientId, requirements, urgency } = input;
  
  let acceptedBy: string | null = null;
  let cancelled = false;

  // Set up signal handlers
  setHandler(acceptRequestSignal, (reqId: string, caregiverId: string) => {
    if (reqId === requestId && !acceptedBy) {
      acceptedBy = caregiverId;
    }
  });

  setHandler(declineRequestSignal, (reqId: string, _caregiverId: string) => {
    if (reqId === requestId) {
      // Track declined, but continue looking
    }
  });

  // Step 1: Validate the care request
  await updateRequestStatus(requestId, 'validating');
  const isValid = await validateCareRequest(requestId);
  if (!isValid) {
    await updateRequestStatus(requestId, 'invalid');
    return { requestId, status: 'cancelled' };
  }

  // Step 2: Find matching caregivers using AI
  await updateRequestStatus(requestId, 'matching');
  const aiMatches = await sendToAIMatching({
    patientId,
    requirements,
  });

  const matchedCaregivers = await findMatchingCaregivers({
    requestId,
    aiScores: aiMatches,
    limit: 10,
  });

  if (matchedCaregivers.length === 0) {
    await updateRequestStatus(requestId, 'no_matches');
    await notifyPatient(patientId, 'care_request_no_matches', { requestId });
    return { requestId, status: 'expired' };
  }

  // Step 3: Notify matched caregivers
  await updateRequestStatus(requestId, 'pending_acceptance');
  for (const caregiver of matchedCaregivers) {
    await notifyCaregiver(caregiver.caregiverId, 'new_care_request', {
      requestId,
      patientId,
      requirements,
      matchScore: caregiver.score,
    });
  }

  // Step 4: Wait for acceptance (with timeout based on urgency)
  const timeoutHours = urgency === 'urgent' ? 4 : urgency === 'normal' ? 24 : 72;
  const deadline = Date.now() + timeoutHours * 60 * 60 * 1000;

  while (!acceptedBy && !cancelled && Date.now() < deadline) {
    await sleep('5 minutes');
  }

  if (!acceptedBy) {
    await updateRequestStatus(requestId, 'expired');
    await notifyPatient(patientId, 'care_request_expired', { requestId });
    return { requestId, status: 'expired' };
  }

  // Step 5: Create schedule
  await updateRequestStatus(requestId, 'scheduling');
  const schedule = await createSchedule({
    requestId,
    patientId,
    caregiverId: acceptedBy,
    startDate: requirements.startDate,
    frequency: requirements.frequency,
    duration: requirements.duration,
  });

  // Step 6: Notify patient of assignment
  await updateRequestStatus(requestId, 'fulfilled');
  await notifyPatient(patientId, 'caregiver_assigned', {
    requestId,
    caregiverId: acceptedBy,
    scheduleId: schedule.scheduleId,
  });

  return {
    requestId,
    status: 'fulfilled',
    assignedCaregiverId: acceptedBy,
    scheduleId: schedule.scheduleId,
  };
}

