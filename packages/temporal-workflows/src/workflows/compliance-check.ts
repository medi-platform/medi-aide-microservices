/**
 * Compliance Check Workflow
 * 
 * Handles periodic compliance verification for caregivers and agencies.
 */

import { proxyActivities, defineQuery, setHandler, sleep, continueAsNew } from '@temporalio/workflow';

export const getComplianceStatusQuery = defineQuery<ComplianceStatus>('getComplianceStatus');

export interface ComplianceInput {
  entityId: string;
  entityType: 'caregiver' | 'agency';
  requirements: string[];
  checkIntervalDays: number;
  maxIterations?: number;
}

export interface ComplianceStatus {
  lastCheck: string;
  isCompliant: boolean;
  violations: string[];
  checksPerformed: number;
  nextCheckDue: string;
}

const activities = proxyActivities<{
  checkCompliance: (entityId: string, entityType: 'caregiver' | 'agency' | 'patient', requirements: string[]) => Promise<{ compliant: boolean; violations: string[] }>;
  sendAlert: (alertType: string, recipients: string[], message: string) => Promise<{ sent: boolean }>;
}>({
  startToCloseTimeout: '5 minutes',
  retry: { maximumAttempts: 3 },
});

export async function complianceCheckWorkflow(input: ComplianceInput): Promise<ComplianceStatus> {
  const maxIterations = input.maxIterations ?? 100;
  let checksPerformed = 0;
  
  const status: ComplianceStatus = {
    lastCheck: new Date().toISOString(),
    isCompliant: true,
    violations: [],
    checksPerformed: 0,
    nextCheckDue: '',
  };

  setHandler(getComplianceStatusQuery, () => status);

  // Perform compliance check
  const result = await activities.checkCompliance(
    input.entityId,
    input.entityType,
    input.requirements
  );

  status.isCompliant = result.compliant;
  status.violations = result.violations;
  status.lastCheck = new Date().toISOString();
  checksPerformed++;
  status.checksPerformed = checksPerformed;

  // If not compliant, send alert
  if (!result.compliant) {
    await activities.sendAlert(
      'compliance-violation',
      [input.entityId],
      `Compliance violations detected: ${result.violations.join(', ')}`
    );
  }

  // Calculate next check
  const nextCheck = new Date();
  nextCheck.setDate(nextCheck.getDate() + input.checkIntervalDays);
  status.nextCheckDue = nextCheck.toISOString();

  // Wait until next check
  await sleep(`${input.checkIntervalDays} days`);

  // Continue as new to prevent history from growing too large
  if (checksPerformed < maxIterations) {
    await continueAsNew<typeof complianceCheckWorkflow>({
      ...input,
      maxIterations: maxIterations - checksPerformed,
    });
  }

  return status;
}

