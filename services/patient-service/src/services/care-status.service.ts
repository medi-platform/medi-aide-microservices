import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CareStatus,
  CareStatusType,
  CareUrgency,
} from '../entities/care-status.entity';

interface UpdateCareStatusDto {
  status?: CareStatusType;
  urgency?: CareUrgency;
  activeCareRequestId?: string;
  primaryCaregiverId?: string;
  secondaryCaregiverIds?: string[];
  careType?: string;
  hoursPerWeek?: number;
  careStartDate?: Date;
  expectedEndDate?: Date;
  statusChangeReason?: string;
  matchingProgress?: number;
  onboardingComplete?: boolean;
}

@Injectable()
export class CareStatusService {
  private readonly logger = new Logger(CareStatusService.name);

  constructor(
    @InjectRepository(CareStatus)
    private readonly statusRepo: Repository<CareStatus>,
  ) {}

  /**
   * Get or create care status for a patient
   */
  async getCareStatus(patientId: string): Promise<CareStatus> {
    let status = await this.statusRepo.findOne({
      where: { patientId },
    });

    if (!status) {
      status = await this.createInitialStatus(patientId);
    }

    return status;
  }

  /**
   * Update care status
   */
  async updateCareStatus(
    patientId: string,
    dto: UpdateCareStatusDto,
  ): Promise<CareStatus> {
    let status = await this.statusRepo.findOne({
      where: { patientId },
    });

    if (!status) {
      status = await this.createInitialStatus(patientId);
    }

    const oldStatus = status.status;

    // Update fields
    if (dto.status !== undefined) {
      this.validateStatusTransition(oldStatus, dto.status);
      status.status = dto.status;
      status.lastStatusChange = new Date();
      status.statusChangeReason = dto.statusChangeReason;
    }

    if (dto.urgency !== undefined) status.urgency = dto.urgency;
    if (dto.activeCareRequestId !== undefined) status.activeCareRequestId = dto.activeCareRequestId;
    if (dto.primaryCaregiverId !== undefined) status.primaryCaregiverId = dto.primaryCaregiverId;
    if (dto.secondaryCaregiverIds !== undefined) status.secondaryCaregiverIds = dto.secondaryCaregiverIds;
    if (dto.careType !== undefined) status.careType = dto.careType;
    if (dto.hoursPerWeek !== undefined) status.hoursPerWeek = dto.hoursPerWeek;
    if (dto.careStartDate !== undefined) status.careStartDate = dto.careStartDate;
    if (dto.expectedEndDate !== undefined) status.expectedEndDate = dto.expectedEndDate;
    if (dto.matchingProgress !== undefined) status.matchingProgress = dto.matchingProgress;
    if (dto.onboardingComplete !== undefined) status.onboardingComplete = dto.onboardingComplete;

    await this.statusRepo.save(status);

    if (dto.status !== undefined && oldStatus !== dto.status) {
      this.logger.log(`Care status changed for patient ${patientId}: ${oldStatus} → ${dto.status}`);
    }

    return status;
  }

  /**
   * Transition to receiving care
   */
  async startReceivingCare(
    patientId: string,
    careRequestId: string,
    caregiverId: string,
    startDate: Date,
  ): Promise<CareStatus> {
    return this.updateCareStatus(patientId, {
      status: CareStatusType.RECEIVING_CARE,
      activeCareRequestId: careRequestId,
      primaryCaregiverId: caregiverId,
      careStartDate: startDate,
      matchingProgress: 100,
      onboardingComplete: true,
      statusChangeReason: 'Care started',
    });
  }

  /**
   * Put care on hold
   */
  async putOnHold(patientId: string, reason: string): Promise<CareStatus> {
    return this.updateCareStatus(patientId, {
      status: CareStatusType.ON_HOLD,
      statusChangeReason: reason,
    });
  }

  /**
   * Resume care from hold
   */
  async resumeCare(patientId: string): Promise<CareStatus> {
    const status = await this.getCareStatus(patientId);

    if (status.status !== CareStatusType.ON_HOLD) {
      throw new BadRequestException('Care is not on hold');
    }

    return this.updateCareStatus(patientId, {
      status: CareStatusType.RECEIVING_CARE,
      statusChangeReason: 'Care resumed',
    });
  }

  /**
   * Complete care
   */
  async completeCare(patientId: string, reason?: string): Promise<CareStatus> {
    return this.updateCareStatus(patientId, {
      status: CareStatusType.CARE_COMPLETED,
      statusChangeReason: reason || 'Care completed successfully',
    });
  }

  /**
   * Terminate care
   */
  async terminateCare(patientId: string, reason: string): Promise<CareStatus> {
    return this.updateCareStatus(patientId, {
      status: CareStatusType.CARE_TERMINATED,
      statusChangeReason: reason,
    });
  }

  /**
   * Update matching progress
   */
  async updateMatchingProgress(
    patientId: string,
    progress: number,
  ): Promise<CareStatus> {
    if (progress < 0 || progress > 100) {
      throw new BadRequestException('Progress must be between 0 and 100');
    }

    return this.updateCareStatus(patientId, {
      matchingProgress: progress,
    });
  }

  /**
   * Assign caregiver
   */
  async assignCaregiver(
    patientId: string,
    caregiverId: string,
    isSecondary = false,
  ): Promise<CareStatus> {
    const status = await this.getCareStatus(patientId);

    if (isSecondary) {
      const secondaries = status.secondaryCaregiverIds || [];
      if (!secondaries.includes(caregiverId)) {
        secondaries.push(caregiverId);
      }
      return this.updateCareStatus(patientId, {
        secondaryCaregiverIds: secondaries,
      });
    }

    return this.updateCareStatus(patientId, {
      primaryCaregiverId: caregiverId,
    });
  }

  /**
   * Remove caregiver
   */
  async removeCaregiver(
    patientId: string,
    caregiverId: string,
  ): Promise<CareStatus> {
    const status = await this.getCareStatus(patientId);

    if (status.primaryCaregiverId === caregiverId) {
      return this.updateCareStatus(patientId, {
        primaryCaregiverId: undefined,
      });
    }

    if (status.secondaryCaregiverIds?.includes(caregiverId)) {
      const secondaries = status.secondaryCaregiverIds.filter(id => id !== caregiverId);
      return this.updateCareStatus(patientId, {
        secondaryCaregiverIds: secondaries,
      });
    }

    throw new NotFoundException('Caregiver not assigned to this patient');
  }

  /**
   * Get patients by status
   */
  async getPatientsByStatus(status: CareStatusType): Promise<CareStatus[]> {
    return this.statusRepo.find({
      where: { status },
      order: { lastStatusChange: 'DESC' },
    });
  }

  /**
   * Create initial status
   */
  private async createInitialStatus(patientId: string): Promise<CareStatus> {
    const status = this.statusRepo.create({
      patientId,
      status: CareStatusType.SEEKING_CARE,
      urgency: CareUrgency.FLEXIBLE,
      matchingProgress: 0,
      onboardingComplete: false,
    });

    await this.statusRepo.save(status);

    this.logger.log(`Initial care status created for patient ${patientId}`);

    return status;
  }

  /**
   * Validate status transition
   */
  private validateStatusTransition(
    currentStatus: CareStatusType,
    newStatus: CareStatusType,
  ): void {
    const allowedTransitions: Record<CareStatusType, CareStatusType[]> = {
      [CareStatusType.SEEKING_CARE]: [
        CareStatusType.RECEIVING_CARE,
        CareStatusType.ON_HOLD,
        CareStatusType.CARE_TERMINATED,
      ],
      [CareStatusType.RECEIVING_CARE]: [
        CareStatusType.ON_HOLD,
        CareStatusType.CARE_COMPLETED,
        CareStatusType.CARE_TERMINATED,
      ],
      [CareStatusType.ON_HOLD]: [
        CareStatusType.SEEKING_CARE,
        CareStatusType.RECEIVING_CARE,
        CareStatusType.CARE_TERMINATED,
      ],
      [CareStatusType.CARE_COMPLETED]: [CareStatusType.SEEKING_CARE],
      [CareStatusType.CARE_TERMINATED]: [CareStatusType.SEEKING_CARE],
    };

    const allowed = allowedTransitions[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition: ${currentStatus} → ${newStatus}`,
      );
    }
  }
}

