/**
 * Care Request Workflow
 * 
 * Orchestrates the lifecycle of a care request from creation to fulfillment.
 */

import { proxyActivities, defineSignal, defineQuery, setHandler, condition, sleep } from '@temporalio/workflow';

// Define signals
export const acceptRequestSignal = defineSignal<[string, string]>('acceptRequest');
export const declineRequestSignal = defineSignal<[string, string]>('declineRequest');
export const cancelRequestSignal = defineSignal<[string]>('cancelRequest');

// Define queries
export const getStatusQuery = defineQuery<CareRequestStatus>('getStatus');

export interface CareRequestInput {
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

export interface CareRequestStatus {
  phase: 'matching' | 'notifying' | 'waiting' | 'assigned' | 'cancelled' | 'expired';
  matchedCaregivers: string[];
  notifiedCaregivers: string[];
  acceptedBy?: string;
  declinedBy: string[];
  assignmentId?: string;
}

const activities = proxyActivities<{
  findMatchingCaregivers: (requestId: string, requirements: any) => Promise<string[]>;
  notifyCaregivers: (caregiverIds: string[], requestDetails: any) => Promise<{ notified: number; failed: number }>;
  assignCaregiver: (requestId: string, caregiverId: string) => Promise<{ success: boolean; assignmentId: string }>;
}>({
  startToCloseTimeout: '1 minute',
  retry: { maximumAttempts: 3 },
});

export async function careRequestWorkflow(input: CareRequestInput): Promise<CareRequestStatus> {
  const status: CareRequestStatus = {
    phase: 'matching',
    matchedCaregivers: [],
    notifiedCaregivers: [],
    declinedBy: [],
  };

  let isCancelled = false;
  let acceptedCaregiverId: string | null = null;

  // Handle signals
  setHandler(acceptRequestSignal, (requestId: string, caregiverId: string) => {
    if (requestId === input.requestId && !acceptedCaregiverId) {
      acceptedCaregiverId = caregiverId;
      status.acceptedBy = caregiverId;
    }
  });

  setHandler(declineRequestSignal, (requestId: string, caregiverId: string) => {
    if (requestId === input.requestId) {
      status.declinedBy.push(caregiverId);
    }
  });

  setHandler(cancelRequestSignal, (requestId: string) => {
    if (requestId === input.requestId) {
      isCancelled = true;
      status.phase = 'cancelled';
    }
  });

  setHandler(getStatusQuery, () => status);

  // Phase 1: Find matching caregivers
  const matchedCaregivers = await activities.findMatchingCaregivers(
    input.requestId,
    input.requirements
  );
  status.matchedCaregivers = matchedCaregivers;
  status.phase = 'notifying';

  if (matchedCaregivers.length === 0) {
    status.phase = 'expired';
    return status;
  }

  // Phase 2: Notify caregivers
  const notifyResult = await activities.notifyCaregivers(matchedCaregivers, {
    requestId: input.requestId,
    patientName: `Patient-${input.patientId}`,
    startDate: input.requirements.startDate,
    message: 'New care request available',
  });
  status.notifiedCaregivers = matchedCaregivers.slice(0, notifyResult.notified);
  status.phase = 'waiting';

  // Phase 3: Wait for acceptance or timeout
  const timeoutMinutes = input.urgency === 'urgent' ? 30 : input.urgency === 'normal' ? 120 : 480;
  const accepted = await condition(
    () => acceptedCaregiverId !== null || isCancelled,
    `${timeoutMinutes} minutes`
  );

  if (isCancelled) {
    return status;
  }

  if (!accepted || !acceptedCaregiverId) {
    status.phase = 'expired';
    return status;
  }

  // Phase 4: Assign caregiver
  const assignment = await activities.assignCaregiver(input.requestId, acceptedCaregiverId);
  if (assignment.success) {
    status.phase = 'assigned';
    status.assignmentId = assignment.assignmentId;
  }

  return status;
}

