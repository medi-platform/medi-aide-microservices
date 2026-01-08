import { Injectable, Logger } from '@nestjs/common';
import { CarePlan, CarePlanStatus, CarePlanIntent } from '../entities/care-plan.entity';
import { CarePlanGoal, GoalStatus, GoalPriority } from '../entities/care-plan-goal.entity';
import { CarePlanActivity, ActivityStatus, ActivityKind } from '../entities/care-plan-activity.entity';

/**
 * FHIR R4 CarePlan Resource interface
 * @see https://www.hl7.org/fhir/careplan.html
 */
interface FHIRCarePlan {
  resourceType: 'CarePlan';
  id?: string;
  meta?: {
    versionId?: string;
    lastUpdated?: string;
    source?: string;
  };
  status: string;
  intent: string;
  category?: { coding: { system: string; code: string; display: string }[] }[];
  title?: string;
  description?: string;
  subject: { reference: string; display?: string };
  period?: { start?: string; end?: string };
  created?: string;
  author?: { reference: string; display?: string };
  contributor?: { reference: string; display?: string }[];
  goal?: { reference: string }[];
  activity?: {
    detail?: {
      kind?: string;
      code?: { coding: { system: string; code: string; display: string }[] };
      status: string;
      description?: string;
      scheduledTiming?: any;
      scheduledPeriod?: { start?: string; end?: string };
      performer?: { reference: string }[];
      location?: { reference: string };
    };
  }[];
  addresses?: { reference: string; display?: string }[];
  supportingInfo?: { reference: string; display?: string }[];
}

/**
 * FHIR R4 Goal Resource interface
 * @see https://www.hl7.org/fhir/goal.html
 */
interface FHIRGoal {
  resourceType: 'Goal';
  id?: string;
  lifecycleStatus: string;
  achievementStatus?: { coding: { system: string; code: string; display: string }[] };
  priority?: { coding: { system: string; code: string; display: string }[] };
  description: { text: string };
  subject: { reference: string };
  startDate?: string;
  target?: {
    measure?: { coding: { system: string; code: string; display: string }[] };
    detailQuantity?: { value: number; unit: string };
    detailRange?: { low: { value: number; unit: string }; high: { value: number; unit: string } };
    dueDate?: string;
  }[];
  expressedBy?: { reference: string };
  addresses?: { reference: string }[];
  note?: { text: string; time?: string }[];
}

@Injectable()
export class FHIRService {
  private readonly logger = new Logger(FHIRService.name);
  private readonly FHIR_SYSTEM_BASE = 'http://terminology.hl7.org/CodeSystem';

  /**
   * Convert internal CarePlan to FHIR R4 format
   */
  toFHIRCarePlan(
    carePlan: CarePlan,
    goals?: CarePlanGoal[],
    activities?: CarePlanActivity[],
  ): FHIRCarePlan {
    const fhirPlan: FHIRCarePlan = {
      resourceType: 'CarePlan',
      id: carePlan.fhirId || carePlan.id,
      meta: {
        versionId: String(carePlan.version),
        lastUpdated: carePlan.updatedAt.toISOString(),
        source: 'medi-aide',
      },
      status: this.mapCarePlanStatus(carePlan.status),
      intent: this.mapCarePlanIntent(carePlan.intent),
      title: carePlan.title,
      description: carePlan.description,
      subject: {
        reference: `Patient/${carePlan.patientId}`,
      },
      created: carePlan.createdAt.toISOString(),
    };

    // Period
    if (carePlan.periodStart || carePlan.periodEnd) {
      fhirPlan.period = {};
      if (carePlan.periodStart) fhirPlan.period.start = carePlan.periodStart.toISOString().split('T')[0];
      if (carePlan.periodEnd) fhirPlan.period.end = carePlan.periodEnd.toISOString().split('T')[0];
    }

    // Category
    if (carePlan.category) {
      fhirPlan.category = [{
        coding: [{
          system: `${this.FHIR_SYSTEM_BASE}/care-plan-category`,
          code: carePlan.category,
          display: this.formatCategoryDisplay(carePlan.category),
        }],
      }];
    }

    // Author
    if (carePlan.authorId) {
      fhirPlan.author = {
        reference: `Practitioner/${carePlan.authorId}`,
      };
    }

    // Contributors
    if (carePlan.contributorIds && carePlan.contributorIds.length > 0) {
      fhirPlan.contributor = carePlan.contributorIds.map(id => ({
        reference: `Practitioner/${id}`,
      }));
    }

    // Goals
    if (goals && goals.length > 0) {
      fhirPlan.goal = goals.map(g => ({
        reference: `Goal/${g.id}`,
      }));
    }

    // Activities
    if (activities && activities.length > 0) {
      fhirPlan.activity = activities.map(a => ({
        detail: {
          kind: a.kind,
          status: this.mapActivityStatus(a.status),
          description: a.description,
          ...(a.scheduledStart && a.scheduledEnd && {
            scheduledPeriod: {
              start: a.scheduledStart.toISOString(),
              end: a.scheduledEnd.toISOString(),
            },
          }),
          ...(a.assignedTo && {
            performer: [{ reference: `Practitioner/${a.assignedTo}` }],
          }),
        },
      }));
    }

    // Addresses (conditions)
    if (carePlan.addresses && carePlan.addresses.length > 0) {
      fhirPlan.addresses = carePlan.addresses.map(c => ({
        reference: `Condition/${c}`,
      }));
    }

    return fhirPlan;
  }

  /**
   * Convert internal Goal to FHIR R4 format
   */
  toFHIRGoal(goal: CarePlanGoal): FHIRGoal {
    const fhirGoal: FHIRGoal = {
      resourceType: 'Goal',
      id: goal.id,
      lifecycleStatus: this.mapGoalStatus(goal.status),
      description: {
        text: goal.description,
      },
      subject: {
        reference: `Patient/${goal.patientId}`,
      },
    };

    // Priority
    if (goal.priority) {
      fhirGoal.priority = {
        coding: [{
          system: `${this.FHIR_SYSTEM_BASE}/goal-priority`,
          code: goal.priority,
          display: goal.priority.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        }],
      };
    }

    // Achievement status
    if (goal.achievementStatus) {
      fhirGoal.achievementStatus = {
        coding: [{
          system: `${this.FHIR_SYSTEM_BASE}/goal-achievement`,
          code: goal.achievementStatus,
          display: goal.achievementStatus.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        }],
      };
    }

    // Start date
    if (goal.startDate) {
      fhirGoal.startDate = goal.startDate.toISOString().split('T')[0];
    }

    // Target
    if (goal.target || goal.targetDate) {
      fhirGoal.target = [{
        ...(goal.targetDate && { dueDate: goal.targetDate.toISOString().split('T')[0] }),
        ...(goal.target?.detailQuantity && {
          detailQuantity: {
            value: goal.target.detailQuantity.value,
            unit: goal.target.detailQuantity.unit,
          },
        }),
      }];
    }

    // Expressed by
    if (goal.expressedBy) {
      fhirGoal.expressedBy = {
        reference: `Practitioner/${goal.expressedBy}`,
      };
    }

    // Progress notes
    if (goal.progressNotes) {
      fhirGoal.note = [{
        text: goal.progressNotes,
        time: goal.updatedAt.toISOString(),
      }];
    }

    return fhirGoal;
  }

  /**
   * Parse FHIR CarePlan to internal format
   */
  fromFHIRCarePlan(fhirPlan: FHIRCarePlan): Partial<CarePlan> {
    const carePlan: Partial<CarePlan> = {
      fhirId: fhirPlan.id,
      title: fhirPlan.title || '',
      description: fhirPlan.description || '',
      status: this.parseCarePlanStatus(fhirPlan.status),
      intent: this.parseCarePlanIntent(fhirPlan.intent),
    };

    // Extract patient ID from reference
    if (fhirPlan.subject?.reference) {
      carePlan.patientId = fhirPlan.subject.reference.replace('Patient/', '');
    }

    // Period
    if (fhirPlan.period) {
      if (fhirPlan.period.start) carePlan.periodStart = new Date(fhirPlan.period.start);
      if (fhirPlan.period.end) carePlan.periodEnd = new Date(fhirPlan.period.end);
    }

    // Author
    if (fhirPlan.author?.reference) {
      carePlan.authorId = fhirPlan.author.reference.replace('Practitioner/', '');
    }

    // Addresses
    if (fhirPlan.addresses) {
      carePlan.addresses = fhirPlan.addresses.map(a => 
        a.reference.replace('Condition/', '')
      );
    }

    return carePlan;
  }

  /**
   * Parse FHIR Goal to internal format
   */
  fromFHIRGoal(fhirGoal: FHIRGoal, carePlanId: string): Partial<CarePlanGoal> {
    const goal: Partial<CarePlanGoal> = {
      carePlanId,
      description: fhirGoal.description.text,
      status: this.parseGoalStatus(fhirGoal.lifecycleStatus),
    };

    // Extract patient ID
    if (fhirGoal.subject?.reference) {
      goal.patientId = fhirGoal.subject.reference.replace('Patient/', '');
    }

    // Priority
    if (fhirGoal.priority?.coding?.[0]?.code) {
      goal.priority = fhirGoal.priority.coding[0].code as GoalPriority;
    }

    // Start date
    if (fhirGoal.startDate) {
      goal.startDate = new Date(fhirGoal.startDate);
    }

    // Target date
    if (fhirGoal.target?.[0]?.dueDate) {
      goal.targetDate = new Date(fhirGoal.target[0].dueDate);
    }

    return goal;
  }

  /**
   * Validate FHIR resource structure
   */
  validateFHIRCarePlan(fhirPlan: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (fhirPlan.resourceType !== 'CarePlan') {
      errors.push('Invalid resourceType: expected CarePlan');
    }

    if (!fhirPlan.status) {
      errors.push('Missing required field: status');
    }

    if (!fhirPlan.intent) {
      errors.push('Missing required field: intent');
    }

    if (!fhirPlan.subject?.reference) {
      errors.push('Missing required field: subject.reference');
    }

    return { valid: errors.length === 0, errors };
  }

  // Status mapping helpers
  private mapCarePlanStatus(status: CarePlanStatus): string {
    return status.replace('_', '-');
  }

  private parseCarePlanStatus(status: string): CarePlanStatus {
    const statusMap: Record<string, CarePlanStatus> = {
      'draft': CarePlanStatus.DRAFT,
      'active': CarePlanStatus.ACTIVE,
      'on-hold': CarePlanStatus.ON_HOLD,
      'revoked': CarePlanStatus.REVOKED,
      'completed': CarePlanStatus.COMPLETED,
      'entered-in-error': CarePlanStatus.ENTERED_IN_ERROR,
      'unknown': CarePlanStatus.UNKNOWN,
    };
    return statusMap[status] || CarePlanStatus.UNKNOWN;
  }

  private mapCarePlanIntent(intent: CarePlanIntent): string {
    return intent;
  }

  private parseCarePlanIntent(intent: string): CarePlanIntent {
    const intentMap: Record<string, CarePlanIntent> = {
      'proposal': CarePlanIntent.PROPOSAL,
      'plan': CarePlanIntent.PLAN,
      'order': CarePlanIntent.ORDER,
      'option': CarePlanIntent.OPTION,
      'directive': CarePlanIntent.DIRECTIVE,
    };
    return intentMap[intent] || CarePlanIntent.PLAN;
  }

  private mapGoalStatus(status: GoalStatus): string {
    return status.replace('_', '-');
  }

  private parseGoalStatus(status: string): GoalStatus {
    const statusMap: Record<string, GoalStatus> = {
      'proposed': GoalStatus.PROPOSED,
      'planned': GoalStatus.PLANNED,
      'accepted': GoalStatus.ACCEPTED,
      'active': GoalStatus.ACTIVE,
      'on-hold': GoalStatus.ON_HOLD,
      'completed': GoalStatus.COMPLETED,
      'cancelled': GoalStatus.CANCELLED,
      'entered-in-error': GoalStatus.ENTERED_IN_ERROR,
      'rejected': GoalStatus.REJECTED,
    };
    return statusMap[status] || GoalStatus.PROPOSED;
  }

  private mapActivityStatus(status: ActivityStatus): string {
    return status.replace('_', '-');
  }

  private formatCategoryDisplay(category: string): string {
    return category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}

