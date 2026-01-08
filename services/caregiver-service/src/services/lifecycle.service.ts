import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CaregiverProfile } from '../entities/caregiver-profile.entity';
import { CaregiverLifecycleEntity } from '../entities/caregiver-lifecycle.entity';
import { CaregiverDocument } from '../entities/caregiver-document.entity';
import { CaregiverCertification } from '../entities/caregiver-certification.entity';
import {
  CaregiverLifecycleState,
  StateTransition,
  StateTransitionResult,
  CaregiverLifecycle,
  EligibilitySnapshot,
  ProfileCompletenessResult,
  DocumentStatus,
  TransitionValidationResult,
  VALID_TRANSITIONS,
} from '../types/lifecycle.types';

export interface TransitionOptions {
  skipValidation?: boolean;
  skipHooks?: boolean;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class LifecycleService {
  private readonly logger = new Logger(LifecycleService.name);

  constructor(
    @InjectRepository(CaregiverProfile)
    private readonly caregiverRepo: Repository<CaregiverProfile>,
    @InjectRepository(CaregiverLifecycleEntity)
    private readonly lifecycleRepo: Repository<CaregiverLifecycleEntity>,
    @InjectRepository(CaregiverDocument)
    private readonly documentRepo: Repository<CaregiverDocument>,
    @InjectRepository(CaregiverCertification)
    private readonly certificationRepo: Repository<CaregiverCertification>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Get caregiver lifecycle
   */
  async getLifecycle(caregiverId: string): Promise<CaregiverLifecycle> {
    let lifecycle = await this.lifecycleRepo.findOne({
      where: { caregiverId },
    });

    if (!lifecycle) {
      lifecycle = await this.createInitialLifecycle(caregiverId);
    }

    return {
      currentState: lifecycle.currentState,
      stateHistory: lifecycle.stateHistory || [],
      eligibilitySnapshot: lifecycle.eligibilitySnapshot,
      complianceStatus: lifecycle.complianceStatus,
    };
  }

  /**
   * Transition caregiver to a new state
   */
  async transitionState(
    caregiverId: string,
    targetState: CaregiverLifecycleState,
    triggeredBy: string,
    reason: string,
    options: TransitionOptions = {},
  ): Promise<StateTransitionResult> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let lifecycle = await queryRunner.manager.findOne(CaregiverLifecycleEntity, {
        where: { caregiverId },
      });

      if (!lifecycle) {
        lifecycle = await this.createInitialLifecycleWithManager(caregiverId, queryRunner.manager);
      }

      const currentState = lifecycle.currentState;

      // Validate transition
      if (!options.skipValidation) {
        const validation = this.validateTransition(currentState, targetState);
        if (!validation.isValid) {
          throw new BadRequestException(
            `Invalid state transition from ${currentState} to ${targetState}: ${validation.reasons.join(', ')}`,
          );
        }
      }

      // Execute pre-transition hooks
      if (!options.skipHooks) {
        await this.executePreTransitionHooks(caregiverId, currentState, targetState, queryRunner.manager);
      }

      // Create transition record
      const transition: StateTransition = {
        fromState: currentState,
        toState: targetState,
        triggeredBy,
        reason,
        metadata: options.metadata || {},
        timestamp: new Date(),
      };

      // Update lifecycle
      lifecycle.currentState = targetState;
      lifecycle.stateHistory = [...lifecycle.stateHistory, transition];
      lifecycle.updatedAt = new Date();

      // Take eligibility snapshot
      lifecycle.eligibilitySnapshot = await this.createEligibilitySnapshot(caregiverId, queryRunner.manager);

      await queryRunner.manager.save(lifecycle);

      // Update caregiver flags
      await this.updateCaregiverFlags(caregiverId, targetState, queryRunner.manager);

      // Commit transaction
      await queryRunner.commitTransaction();

      // Execute post-transition hooks
      if (!options.skipHooks) {
        await this.executePostTransitionHooks(caregiverId, currentState, targetState);
      }

      this.logger.log(
        `✅ Caregiver ${caregiverId} transitioned from ${currentState} to ${targetState}`,
      );

      return {
        success: true,
        previousState: currentState,
        newState: targetState,
        transition,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`State transition failed for caregiver ${caregiverId}`, error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Evaluate caregiver and auto-transition if needed
   */
  async evaluateAndTransition(caregiverId: string): Promise<StateTransitionResult | null> {
    const lifecycle = await this.getLifecycle(caregiverId);
    const currentState = lifecycle.currentState;

    // Don't evaluate terminal states
    if ([
      CaregiverLifecycleState.APPROVED_ACTIVE,
      CaregiverLifecycleState.SUSPENDED,
      CaregiverLifecycleState.DEACTIVATED,
    ].includes(currentState)) {
      return null;
    }

    // Evaluate current status
    const completeness = await this.evaluateProfileCompleteness(caregiverId);
    const documents = await this.getDocumentStatus(caregiverId);

    // Determine target state
    let targetState: CaregiverLifecycleState | null = null;

    if (!completeness.isComplete) {
      targetState = CaregiverLifecycleState.PROFILE_INCOMPLETE;
    } else if (!documents.allRequiredDocumentsUploaded) {
      targetState = CaregiverLifecycleState.DOCUMENTS_PENDING;
    } else if (!documents.allRequiredDocumentsVerified) {
      targetState = CaregiverLifecycleState.VERIFICATION_PENDING;
    } else if (documents.backgroundCheckStatus === 'pending') {
      targetState = CaregiverLifecycleState.BACKGROUND_CHECK_PENDING;
    } else if (documents.backgroundCheckStatus === 'approved') {
      targetState = CaregiverLifecycleState.READY_FOR_APPROVAL;
    }

    // Transition if state changed
    if (targetState && targetState !== currentState) {
      return this.transitionState(
        caregiverId,
        targetState,
        'system',
        'Automatic evaluation based on profile changes',
        {
          metadata: {
            completenessScore: completeness.score,
            documentsUploaded: documents.uploadedCount,
            documentsVerified: documents.verifiedCount,
          },
        },
      );
    }

    return null;
  }

  /**
   * Get transition history
   */
  async getTransitionHistory(caregiverId: string, limit = 20): Promise<StateTransition[]> {
    const lifecycle = await this.lifecycleRepo.findOne({
      where: { caregiverId },
    });

    if (!lifecycle) {
      return [];
    }

    return (lifecycle.stateHistory || []).slice(-limit).reverse();
  }

  /**
   * Approve caregiver (admin action)
   */
  async approveCaregiver(
    caregiverId: string,
    approvedBy: string,
    notes?: string,
  ): Promise<StateTransitionResult> {
    const lifecycle = await this.getLifecycle(caregiverId);

    // Verify caregiver is ready for approval
    if (lifecycle.currentState !== CaregiverLifecycleState.READY_FOR_APPROVAL) {
      throw new BadRequestException(
        `Caregiver must be in 'ready_for_approval' state. Current state: ${lifecycle.currentState}`,
      );
    }

    return this.transitionState(
      caregiverId,
      CaregiverLifecycleState.APPROVED_ACTIVE,
      approvedBy,
      notes || 'Admin approval',
    );
  }

  /**
   * Suspend caregiver
   */
  async suspendCaregiver(
    caregiverId: string,
    suspendedBy: string,
    reason: string,
  ): Promise<StateTransitionResult> {
    return this.transitionState(
      caregiverId,
      CaregiverLifecycleState.SUSPENDED,
      suspendedBy,
      reason,
    );
  }

  /**
   * Reactivate suspended caregiver
   */
  async reactivateCaregiver(
    caregiverId: string,
    reactivatedBy: string,
    reason: string,
  ): Promise<StateTransitionResult> {
    return this.transitionState(
      caregiverId,
      CaregiverLifecycleState.APPROVED_ACTIVE,
      reactivatedBy,
      reason,
    );
  }

  /**
   * Deactivate caregiver
   */
  async deactivateCaregiver(
    caregiverId: string,
    deactivatedBy: string,
    reason: string,
  ): Promise<StateTransitionResult> {
    return this.transitionState(
      caregiverId,
      CaregiverLifecycleState.DEACTIVATED,
      deactivatedBy,
      reason,
    );
  }

  /**
   * Get lifecycle statistics
   */
  async getLifecycleStats(): Promise<Record<CaregiverLifecycleState, number>> {
    const stats = await this.lifecycleRepo
      .createQueryBuilder('lifecycle')
      .select('lifecycle.currentState', 'state')
      .addSelect('COUNT(*)', 'count')
      .groupBy('lifecycle.currentState')
      .getRawMany();

    const result: Record<string, number> = {};
    for (const state of Object.values(CaregiverLifecycleState)) {
      result[state] = 0;
    }
    for (const stat of stats) {
      result[stat.state] = parseInt(stat.count, 10);
    }

    return result as Record<CaregiverLifecycleState, number>;
  }

  // Private helper methods

  private validateTransition(
    fromState: CaregiverLifecycleState,
    toState: CaregiverLifecycleState,
  ): TransitionValidationResult {
    const validTargets = VALID_TRANSITIONS[fromState] || [];

    if (!validTargets.includes(toState)) {
      return {
        isValid: false,
        reasons: [`Transition from ${fromState} to ${toState} is not allowed`],
      };
    }

    return { isValid: true, reasons: [] };
  }

  private async createInitialLifecycle(caregiverId: string): Promise<CaregiverLifecycleEntity> {
    const caregiver = await this.caregiverRepo.findOne({ where: { id: caregiverId } });
    if (!caregiver) {
      throw new NotFoundException(`Caregiver ${caregiverId} not found`);
    }

    const initialState = caregiver.is_approved && caregiver.is_active
      ? CaregiverLifecycleState.APPROVED_ACTIVE
      : CaregiverLifecycleState.REGISTERED;

    const lifecycle = this.lifecycleRepo.create({
      caregiverId,
      currentState: initialState,
      stateHistory: [{
        fromState: CaregiverLifecycleState.REGISTERED,
        toState: initialState,
        triggeredBy: 'system',
        reason: 'Initial lifecycle creation',
        timestamp: new Date(),
      }],
    });

    return this.lifecycleRepo.save(lifecycle);
  }

  private async createInitialLifecycleWithManager(
    caregiverId: string,
    manager: any,
  ): Promise<CaregiverLifecycleEntity> {
    const lifecycle = manager.create(CaregiverLifecycleEntity, {
      caregiverId,
      currentState: CaregiverLifecycleState.REGISTERED,
      stateHistory: [],
    });
    return manager.save(lifecycle);
  }

  private async updateCaregiverFlags(
    caregiverId: string,
    state: CaregiverLifecycleState,
    manager: any,
  ): Promise<void> {
    const flagMapping: Record<CaregiverLifecycleState, Record<string, unknown>> = {
      [CaregiverLifecycleState.REGISTERED]: { is_active: false, is_approved: false },
      [CaregiverLifecycleState.PROFILE_INCOMPLETE]: { is_active: false, is_approved: false },
      [CaregiverLifecycleState.DOCUMENTS_PENDING]: { is_active: false, is_approved: false },
      [CaregiverLifecycleState.VERIFICATION_PENDING]: { is_active: false, is_approved: false },
      [CaregiverLifecycleState.BACKGROUND_CHECK_PENDING]: { is_active: false, is_approved: false },
      [CaregiverLifecycleState.READY_FOR_APPROVAL]: { is_active: false, is_approved: false },
      [CaregiverLifecycleState.APPROVED_ACTIVE]: { is_active: true, is_approved: true },
      [CaregiverLifecycleState.SUSPENDED]: { is_active: false, is_approved: true },
      [CaregiverLifecycleState.DEACTIVATED]: { is_active: false, is_approved: false },
    };

    const flags = flagMapping[state];
    await manager.update(CaregiverProfile, { id: caregiverId }, flags);
  }

  private async executePreTransitionHooks(
    caregiverId: string,
    fromState: CaregiverLifecycleState,
    toState: CaregiverLifecycleState,
    manager: any,
  ): Promise<void> {
    if (toState === CaregiverLifecycleState.APPROVED_ACTIVE) {
      // Verify all requirements are met
      const completeness = await this.evaluateProfileCompleteness(caregiverId);
      if (!completeness.isComplete) {
        throw new BadRequestException('Cannot approve caregiver with incomplete profile');
      }

      const documents = await this.getDocumentStatus(caregiverId);
      if (!documents.allRequiredDocumentsVerified) {
        throw new BadRequestException('Cannot approve caregiver with unverified documents');
      }
    }
  }

  private async executePostTransitionHooks(
    caregiverId: string,
    fromState: CaregiverLifecycleState,
    toState: CaregiverLifecycleState,
  ): Promise<void> {
    if (toState === CaregiverLifecycleState.APPROVED_ACTIVE) {
      this.logger.log(`Caregiver ${caregiverId} approved and added to matching pool`);
      // TODO: Emit event for notification service
      // TODO: Add to matching pool
    }

    if (fromState === CaregiverLifecycleState.APPROVED_ACTIVE) {
      this.logger.log(`Caregiver ${caregiverId} removed from matching pool`);
      // TODO: Remove from matching pool
    }
  }

  private async evaluateProfileCompleteness(caregiverId: string): Promise<ProfileCompletenessResult> {
    const caregiver = await this.caregiverRepo.findOne({ where: { id: caregiverId } });
    if (!caregiver) {
      throw new NotFoundException(`Caregiver ${caregiverId} not found`);
    }

    const missing: string[] = [];
    let personalScore = 0;
    let professionalScore = 0;

    // Personal info checks
    if (caregiver.bio) personalScore += 25;
    else missing.push('Bio/About section');

    if (caregiver.city) personalScore += 25;
    else missing.push('City');

    if (caregiver.postal_code) personalScore += 25;
    else missing.push('Postal code');

    if (caregiver.address) personalScore += 25;
    else missing.push('Address');

    // Professional checks
    if (caregiver.experience && caregiver.experience > 0) professionalScore += 50;
    else missing.push('Experience level');

    // Check skills
    const skills = await this.caregiverRepo.manager.query(
      'SELECT COUNT(*) as count FROM caregiver_skills WHERE caregiver_id = $1',
      [caregiverId],
    );
    if (parseInt(skills[0]?.count || '0', 10) > 0) professionalScore += 50;
    else missing.push('Skills');

    // Calculate overall
    const overallScore = (personalScore + professionalScore) / 2;
    const isComplete = overallScore >= 75 && missing.length <= 2;

    return {
      isComplete,
      score: overallScore,
      categoryScores: {
        personal: personalScore,
        professional: professionalScore,
        documents: 0, // Calculated separately
        availability: 0,
      },
      missingRequirements: missing,
    };
  }

  private async getDocumentStatus(caregiverId: string): Promise<DocumentStatus> {
    const documents = await this.documentRepo.find({ where: { caregiver_id: caregiverId } });
    const certifications = await this.certificationRepo.find({ where: { caregiver_id: caregiverId } });

    const uploadedCount = documents.length + certifications.length;
    const verifiedCount = documents.filter(d => d.status === 'verified').length +
      certifications.filter(c => c.verified).length;
    const pendingCount = uploadedCount - verifiedCount;

    // Required documents for Canadian caregivers
    const requiredDocs = [
      'government_id',
      'sin_card',
      'background_check',
      'first_aid_certificate',
    ];

    const uploadedTypes = documents.map(d => d.document_type);
    const missingDocuments = requiredDocs.filter(r => !uploadedTypes.includes(r));

    const backgroundDoc = documents.find(d => d.document_type === 'background_check');
    let backgroundCheckStatus: DocumentStatus['backgroundCheckStatus'] = 'not_started';
    if (backgroundDoc) {
      backgroundCheckStatus = backgroundDoc.status === 'verified' ? 'approved' : 'pending';
    }

    return {
      uploadedCount,
      verifiedCount,
      rejectedCount: 0,
      pendingCount,
      allRequiredDocumentsUploaded: missingDocuments.length === 0,
      allRequiredDocumentsVerified: missingDocuments.length === 0 && pendingCount === 0,
      identityVerified: documents.some(d => d.document_type === 'government_id' && d.status === 'verified'),
      backgroundCheckStatus,
      missingDocuments,
    };
  }

  private async createEligibilitySnapshot(
    caregiverId: string,
    manager?: any,
  ): Promise<EligibilitySnapshot> {
    const completeness = await this.evaluateProfileCompleteness(caregiverId);
    const documents = await this.getDocumentStatus(caregiverId);

    return {
      profileCompleteness: completeness,
      documentStatus: documents,
      verificationStatus: {
        emailVerified: true,
        phoneVerified: false,
        identityVerified: documents.identityVerified,
        backgroundCheckStatus: documents.backgroundCheckStatus,
      },
      approvalReadiness: {
        ready: completeness.isComplete && documents.allRequiredDocumentsVerified,
        blockers: [...completeness.missingRequirements, ...documents.missingDocuments],
      },
      generatedAt: new Date(),
    };
  }
}

