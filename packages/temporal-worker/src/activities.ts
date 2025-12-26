import axios, { AxiosInstance } from 'axios';
import { Counter, Histogram } from 'prom-client';

/**
 * Activity implementations for Temporal workflows
 * 
 * These activities are called by workflows to perform actual work.
 * Each activity should be idempotent and handle retries gracefully.
 */

// HTTP client with defaults
const httpClient: AxiosInstance = axios.create({
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'X-Service': 'temporal-worker',
  },
});

// Metrics
const activityCounter = new Counter({
  name: 'temporal_activity_total',
  help: 'Total number of activity executions',
  labelNames: ['activity', 'status'],
});

const activityDuration = new Histogram({
  name: 'temporal_activity_duration_seconds',
  help: 'Activity execution duration',
  labelNames: ['activity'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10, 30, 60],
});

// Service URLs from environment
const SERVICES = {
  careRequest: process.env.CARE_REQUEST_SERVICE_URL || 'http://stage3-care-request-service:4053',
  caregiver: process.env.CAREGIVER_SERVICE_URL || 'http://stage3-caregiver-service:4051',
  patient: process.env.PATIENT_SERVICE_URL || 'http://stage3-patient-service:4052',
  matching: process.env.MATCHING_SERVICE_URL || 'http://stage3-matching-service:4023',
  notification: process.env.NOTIFICATION_SERVICE_URL || 'http://stage3-notification-service:4010',
  evv: process.env.EVV_SERVICE_URL || 'http://stage3-evv-service:4020',
  audit: process.env.AUDIT_SERVICE_URL || 'http://stage3-audit-service:4017',
  wellness: process.env.WELLNESS_SERVICE_URL || 'http://stage3-wellness-service:4014',
};

/**
 * Helper to track activity metrics
 */
function withMetrics<T>(
  activityName: string,
  fn: () => Promise<T>
): Promise<T> {
  const timer = activityDuration.startTimer({ activity: activityName });
  
  return fn()
    .then((result) => {
      timer();
      activityCounter.inc({ activity: activityName, status: 'success' });
      return result;
    })
    .catch((error) => {
      timer();
      activityCounter.inc({ activity: activityName, status: 'failure' });
      throw error;
    });
}

// ============================================================================
// Care Request Activities
// ============================================================================

export async function validateCareRequest(careRequestId: string): Promise<boolean> {
  return withMetrics('validateCareRequest', async () => {
    const response = await httpClient.get(
      `${SERVICES.careRequest}/care-requests/${careRequestId}/validate`
    );
    return response.data.valid;
  });
}

export async function findMatchingCaregivers(
  careRequestId: string
): Promise<Array<{ caregiverId: string; score: number }>> {
  return withMetrics('findMatchingCaregivers', async () => {
    const response = await httpClient.post(
      `${SERVICES.matching}/matching/find`,
      { careRequestId }
    );
    return response.data.matches;
  });
}

export async function notifyCaregivers(
  caregiverIds: string[],
  careRequestId: string,
  notificationType: string
): Promise<void> {
  return withMetrics('notifyCaregivers', async () => {
    await httpClient.post(`${SERVICES.notification}/notifications/bulk`, {
      recipients: caregiverIds.map(id => ({ caregiverId: id })),
      template: notificationType,
      data: { careRequestId },
    });
  });
}

export async function waitForCaregiverResponse(
  careRequestId: string,
  timeoutMinutes: number
): Promise<{ caregiverId: string; accepted: boolean } | null> {
  return withMetrics('waitForCaregiverResponse', async () => {
    const response = await httpClient.get(
      `${SERVICES.careRequest}/care-requests/${careRequestId}/responses`,
      { timeout: timeoutMinutes * 60 * 1000 }
    );
    return response.data.response || null;
  });
}

export async function assignCaregiver(
  careRequestId: string,
  caregiverId: string
): Promise<void> {
  return withMetrics('assignCaregiver', async () => {
    await httpClient.post(
      `${SERVICES.careRequest}/care-requests/${careRequestId}/assign`,
      { caregiverId }
    );
  });
}

export async function updateCareRequestStatus(
  careRequestId: string,
  status: string
): Promise<void> {
  return withMetrics('updateCareRequestStatus', async () => {
    await httpClient.patch(
      `${SERVICES.careRequest}/care-requests/${careRequestId}/status`,
      { status }
    );
  });
}

export async function escalateCareRequest(
  careRequestId: string,
  reason: string
): Promise<void> {
  return withMetrics('escalateCareRequest', async () => {
    await httpClient.post(
      `${SERVICES.careRequest}/care-requests/${careRequestId}/escalate`,
      { reason }
    );
  });
}

// ============================================================================
// Onboarding Activities
// ============================================================================

export async function verifyBackgroundCheck(userId: string): Promise<{
  passed: boolean;
  issues: string[];
}> {
  return withMetrics('verifyBackgroundCheck', async () => {
    const response = await httpClient.post(
      `${SERVICES.caregiver}/caregivers/${userId}/background-check`
    );
    return response.data;
  });
}

export async function validateCredentials(userId: string): Promise<{
  valid: boolean;
  expiring: string[];
  missing: string[];
}> {
  return withMetrics('validateCredentials', async () => {
    const response = await httpClient.get(
      `${SERVICES.caregiver}/caregivers/${userId}/credentials/validate`
    );
    return response.data;
  });
}

export async function assignTrainingModules(
  userId: string,
  modules: string[]
): Promise<void> {
  return withMetrics('assignTrainingModules', async () => {
    await httpClient.post(
      `${SERVICES.caregiver}/caregivers/${userId}/training/assign`,
      { modules }
    );
  });
}

export async function scheduleOrientation(
  userId: string
): Promise<{ scheduledDate: string; location: string }> {
  return withMetrics('scheduleOrientation', async () => {
    const response = await httpClient.post(
      `${SERVICES.caregiver}/caregivers/${userId}/orientation/schedule`
    );
    return response.data;
  });
}

export async function activateCaregiver(userId: string): Promise<void> {
  return withMetrics('activateCaregiver', async () => {
    await httpClient.post(
      `${SERVICES.caregiver}/caregivers/${userId}/activate`
    );
  });
}

// ============================================================================
// EVV/Shift Activities
// ============================================================================

export async function getShiftDetails(shiftId: string): Promise<any> {
  return withMetrics('getShiftDetails', async () => {
    const response = await httpClient.get(`${SERVICES.evv}/shifts/${shiftId}`);
    return response.data;
  });
}

export async function getPatientLocation(patientId: string): Promise<{
  latitude: number;
  longitude: number;
}> {
  return withMetrics('getPatientLocation', async () => {
    const response = await httpClient.get(
      `${SERVICES.patient}/patients/${patientId}/location`
    );
    return response.data;
  });
}

export async function recordClockIn(
  shiftId: string,
  data: any
): Promise<boolean> {
  return withMetrics('recordClockIn', async () => {
    const response = await httpClient.post(
      `${SERVICES.evv}/shifts/${shiftId}/clock-in`,
      data
    );
    return response.data.verified;
  });
}

export async function recordClockOut(
  shiftId: string,
  data: any
): Promise<boolean> {
  return withMetrics('recordClockOut', async () => {
    const response = await httpClient.post(
      `${SERVICES.evv}/shifts/${shiftId}/clock-out`,
      data
    );
    return response.data.verified;
  });
}

export async function verifyEVV(
  shiftId: string,
  data: any
): Promise<{ verified: boolean; discrepancies: string[] }> {
  return withMetrics('verifyEVV', async () => {
    const response = await httpClient.post(
      `${SERVICES.evv}/shifts/${shiftId}/verify`,
      data
    );
    return response.data;
  });
}

export async function calculateShiftMetrics(data: any): Promise<any> {
  return withMetrics('calculateShiftMetrics', async () => {
    const response = await httpClient.post(
      `${SERVICES.evv}/shifts/metrics/calculate`,
      data
    );
    return response.data;
  });
}

export async function processShiftCompletion(
  shiftId: string,
  data: any
): Promise<void> {
  return withMetrics('processShiftCompletion', async () => {
    await httpClient.post(
      `${SERVICES.evv}/shifts/${shiftId}/complete`,
      data
    );
  });
}

export async function escalateToSupervisor(
  shiftId: string,
  reason: string,
  details: string[]
): Promise<void> {
  return withMetrics('escalateToSupervisor', async () => {
    await httpClient.post(`${SERVICES.evv}/shifts/${shiftId}/escalate`, {
      reason,
      details,
    });
  });
}

// ============================================================================
// Compliance Activities
// ============================================================================

export async function gatherComplianceData(
  entityId: string,
  entityType: string
): Promise<any> {
  return withMetrics('gatherComplianceData', async () => {
    const response = await httpClient.get(
      `${SERVICES.audit}/compliance/${entityType}/${entityId}`
    );
    return response.data;
  });
}

export async function checkHIPAACompliance(data: any): Promise<{
  compliant: boolean;
  violations: string[];
}> {
  return withMetrics('checkHIPAACompliance', async () => {
    const response = await httpClient.post(
      `${SERVICES.audit}/compliance/hipaa/check`,
      data
    );
    return response.data;
  });
}

export async function checkRegionalCompliance(
  data: any,
  region: string
): Promise<{
  compliant: boolean;
  violations: string[];
}> {
  return withMetrics('checkRegionalCompliance', async () => {
    const response = await httpClient.post(
      `${SERVICES.audit}/compliance/regional/${region}/check`,
      data
    );
    return response.data;
  });
}

export async function generateComplianceReport(
  entityId: string,
  entityType: string,
  checkResults: any
): Promise<string> {
  return withMetrics('generateComplianceReport', async () => {
    const response = await httpClient.post(
      `${SERVICES.audit}/compliance/reports`,
      { entityId, entityType, checkResults }
    );
    return response.data.reportId;
  });
}

export async function notifyComplianceIssues(
  entityId: string,
  issues: string[]
): Promise<void> {
  return withMetrics('notifyComplianceIssues', async () => {
    await httpClient.post(`${SERVICES.notification}/notifications/compliance`, {
      entityId,
      issues,
    });
  });
}

export async function scheduleFollowUp(
  entityId: string,
  entityType: string,
  daysFromNow: number
): Promise<string> {
  return withMetrics('scheduleFollowUp', async () => {
    const response = await httpClient.post(
      `${SERVICES.audit}/compliance/follow-ups`,
      { entityId, entityType, daysFromNow }
    );
    return response.data.followUpId;
  });
}

// ============================================================================
// Audit Activities
// ============================================================================

export async function logAuditEvent(event: {
  action: string;
  entityType: string;
  entityId: string;
  userId?: string;
  metadata?: Record<string, any>;
}): Promise<void> {
  return withMetrics('logAuditEvent', async () => {
    await httpClient.post(`${SERVICES.audit}/logs`, event);
  });
}

// Export all activities as a bundle
export const activities = {
  // Care Request
  validateCareRequest,
  findMatchingCaregivers,
  notifyCaregivers,
  waitForCaregiverResponse,
  assignCaregiver,
  updateCareRequestStatus,
  escalateCareRequest,
  
  // Onboarding
  verifyBackgroundCheck,
  validateCredentials,
  assignTrainingModules,
  scheduleOrientation,
  activateCaregiver,
  
  // EVV/Shift
  getShiftDetails,
  getPatientLocation,
  recordClockIn,
  recordClockOut,
  verifyEVV,
  calculateShiftMetrics,
  processShiftCompletion,
  escalateToSupervisor,
  
  // Compliance
  gatherComplianceData,
  checkHIPAACompliance,
  checkRegionalCompliance,
  generateComplianceReport,
  notifyComplianceIssues,
  scheduleFollowUp,
  
  // Audit
  logAuditEvent,
};

