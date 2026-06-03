/**
 * Compliance Check Workflow
 * 
 * Periodic compliance verification for caregivers and agencies:
 * 1. Check document expirations
 * 2. Verify certifications
 * 3. Review training requirements
 * 4. Generate compliance report
 * 5. Notify of violations
 */

import { proxyActivities, sleep } from '@temporalio/workflow';
import type * as activities from '../activities';

const {
  getExpiringDocuments,
  checkCertificationStatus,
  checkTrainingRequirements,
  generateComplianceReport,
  sendComplianceAlert,
  updateComplianceStatus,
  notifyComplianceTeam,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '2 minutes',
  retry: { maximumAttempts: 3 },
});

export interface ComplianceCheckInput {
  entityId: string;
  entityType: 'caregiver' | 'agency';
  checkType: 'scheduled' | 'manual' | 'pre_assignment';
}

export interface ComplianceCheckResult {
  entityId: string;
  isCompliant: boolean;
  score: number;
  violations: ComplianceViolation[];
  expiringItems: ExpiringItem[];
  reportId: string;
}

interface ComplianceViolation {
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  dueDate?: string;
}

interface ExpiringItem {
  type: string;
  name: string;
  expirationDate: string;
  daysUntilExpiry: number;
}

export async function complianceCheckWorkflow(
  input: ComplianceCheckInput
): Promise<ComplianceCheckResult> {
  const { entityId, entityType, checkType } = input;
  const violations: ComplianceViolation[] = [];
  const expiringItems: ExpiringItem[] = [];

  // Step 1: Check document expirations
  const expiringDocs = await getExpiringDocuments(entityId, 30); // 30 days lookahead
  for (const doc of expiringDocs) {
    if (doc.daysUntilExpiry <= 0) {
      violations.push({
        type: 'expired_document',
        severity: 'critical',
        description: `${doc.documentType} has expired`,
      });
    } else if (doc.daysUntilExpiry <= 7) {
      violations.push({
        type: 'expiring_document',
        severity: 'high',
        description: `${doc.documentType} expires in ${doc.daysUntilExpiry} days`,
        dueDate: doc.expirationDate,
      });
    }
    expiringItems.push({
      type: 'document',
      name: doc.documentType,
      expirationDate: doc.expirationDate,
      daysUntilExpiry: doc.daysUntilExpiry,
    });
  }

  // Step 2: Check certification status
  if (entityType === 'caregiver') {
    const certStatus = await checkCertificationStatus(entityId);
    for (const cert of certStatus.certifications) {
      if (!cert.isValid) {
        violations.push({
          type: 'invalid_certification',
          severity: 'critical',
          description: `${cert.name} certification is invalid or expired`,
        });
      } else if (cert.expiringWithin30Days) {
        expiringItems.push({
          type: 'certification',
          name: cert.name,
          expirationDate: cert.expirationDate,
          daysUntilExpiry: cert.daysUntilExpiry,
        });
      }
    }
  }

  // Step 3: Check training requirements
  const trainingStatus = await checkTrainingRequirements(entityId, entityType);
  for (const training of trainingStatus.overdueTraining) {
    violations.push({
      type: 'overdue_training',
      severity: 'high',
      description: `Required training "${training.name}" is overdue`,
      dueDate: training.dueDate,
    });
  }

  // Calculate compliance score
  const criticalCount = violations.filter(v => v.severity === 'critical').length;
  const highCount = violations.filter(v => v.severity === 'high').length;
  const mediumCount = violations.filter(v => v.severity === 'medium').length;
  
  let score = 100;
  score -= criticalCount * 25;
  score -= highCount * 10;
  score -= mediumCount * 5;
  score = Math.max(0, score);

  const isCompliant = criticalCount === 0 && score >= 70;

  // Step 4: Generate compliance report
  const report = await generateComplianceReport({
    entityId,
    entityType,
    checkType,
    isCompliant,
    score,
    violations,
    expiringItems,
  });

  // Step 5: Update compliance status
  await updateComplianceStatus(entityId, entityType, {
    isCompliant,
    score,
    lastCheckDate: new Date().toISOString(),
    nextCheckDate: getNextCheckDate(checkType),
  });

  // Step 6: Send alerts for violations
  if (violations.length > 0) {
    await sendComplianceAlert(entityId, entityType, violations);
    
    if (criticalCount > 0) {
      await notifyComplianceTeam({
        entityId,
        entityType,
        criticalViolations: violations.filter(v => v.severity === 'critical'),
        reportId: report.reportId,
      });
    }
  }

  return {
    entityId,
    isCompliant,
    score,
    violations,
    expiringItems,
    reportId: report.reportId,
  };
}

function getNextCheckDate(checkType: string): string {
  const now = new Date();
  switch (checkType) {
    case 'scheduled':
      now.setDate(now.getDate() + 30); // Monthly
      break;
    case 'pre_assignment':
      now.setDate(now.getDate() + 7); // Weekly after assignment
      break;
    default:
      now.setDate(now.getDate() + 30);
  }
  return now.toISOString();
}

