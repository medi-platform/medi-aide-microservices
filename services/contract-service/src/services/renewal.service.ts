import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { ContractRenewal, RenewalStatus, RenewalType } from '../entities/contract-renewal.entity';
import { Contract, ContractStatus } from '../entities/contract.entity';
import { ContractEvent, ContractEventType } from '../entities/contract-event.entity';

interface CreateRenewalDto {
  originalContractId: string;
  type: RenewalType;
  proposedStartDate: Date;
  proposedEndDate: Date;
  proposedTerms?: ContractRenewal['proposedTerms'];
  renewalDeadline: Date;
  initiatedById?: string;
  initiatedByName?: string;
}

@Injectable()
export class RenewalService {
  private readonly logger = new Logger(RenewalService.name);

  constructor(
    @InjectRepository(ContractRenewal)
    private readonly renewalRepo: Repository<ContractRenewal>,
    @InjectRepository(Contract)
    private readonly contractRepo: Repository<Contract>,
    @InjectRepository(ContractEvent)
    private readonly eventRepo: Repository<ContractEvent>,
  ) {}

  async createRenewal(dto: CreateRenewalDto): Promise<ContractRenewal> {
    // Validate original contract
    const originalContract = await this.contractRepo.findOne({
      where: { id: dto.originalContractId },
    });
    if (!originalContract) {
      throw new NotFoundException(`Contract ${dto.originalContractId} not found`);
    }

    // Check for existing active renewal
    const existingRenewal = await this.renewalRepo.findOne({
      where: {
        originalContractId: dto.originalContractId,
        status: RenewalStatus.PENDING_DECISION,
      },
    });
    if (existingRenewal) {
      throw new BadRequestException('A renewal is already pending for this contract');
    }

    // Calculate rate change if applicable
    let previousRate: number | undefined;
    let proposedRate: number | undefined;
    let rateChangePercentage: number | undefined;

    if (originalContract.terms?.hourlyRate && dto.proposedTerms?.hourlyRate) {
      previousRate = originalContract.terms.hourlyRate;
      proposedRate = dto.proposedTerms.hourlyRate;
      rateChangePercentage = ((proposedRate - previousRate) / previousRate) * 100;
    }

    const renewal = this.renewalRepo.create({
      ...dto,
      status: RenewalStatus.PENDING_DECISION,
      previousRate,
      proposedRate,
      rateChangePercentage,
      initiatedAt: new Date(),
    });

    await this.renewalRepo.save(renewal);

    this.logger.log(`Renewal ${renewal.id} created for contract ${dto.originalContractId}`);

    return renewal;
  }

  async getRenewal(id: string): Promise<ContractRenewal> {
    const renewal = await this.renewalRepo.findOne({
      where: { id },
      relations: ['originalContract', 'newContract'],
    });
    if (!renewal) {
      throw new NotFoundException(`Renewal ${id} not found`);
    }
    return renewal;
  }

  async offerRenewal(id: string): Promise<ContractRenewal> {
    const renewal = await this.getRenewal(id);

    if (renewal.status !== RenewalStatus.PENDING_DECISION) {
      throw new BadRequestException('Renewal must be pending decision');
    }

    renewal.status = RenewalStatus.RENEWAL_OFFERED;
    return this.renewalRepo.save(renewal);
  }

  async respondToRenewal(
    id: string,
    role: 'patient' | 'caregiver',
    response: 'accepted' | 'declined' | 'counter_offered',
    counterTerms?: Record<string, any>,
    declineReason?: string,
  ): Promise<ContractRenewal> {
    const renewal = await this.getRenewal(id);

    if (renewal.status !== RenewalStatus.RENEWAL_OFFERED) {
      throw new BadRequestException('Renewal must be offered before responding');
    }

    if (role === 'patient') {
      renewal.patientResponse = response;
      renewal.patientRespondedAt = new Date();
      if (counterTerms) renewal.patientCounterTerms = counterTerms;
    } else if (role === 'caregiver') {
      renewal.caregiverResponse = response;
      renewal.caregiverRespondedAt = new Date();
      if (counterTerms) renewal.caregiverCounterTerms = counterTerms;
    }

    if (declineReason) {
      renewal.declineReason = declineReason;
    }

    // Determine overall status based on responses
    if (renewal.patientResponse && renewal.caregiverResponse) {
      if (
        renewal.patientResponse === 'accepted' &&
        renewal.caregiverResponse === 'accepted'
      ) {
        renewal.status = RenewalStatus.ACCEPTED;
      } else if (
        renewal.patientResponse === 'declined' ||
        renewal.caregiverResponse === 'declined'
      ) {
        renewal.status = RenewalStatus.DECLINED;
      } else {
        renewal.status = RenewalStatus.COUNTER_OFFERED;
      }
    }

    return this.renewalRepo.save(renewal);
  }

  async executeRenewal(id: string): Promise<ContractRenewal> {
    const renewal = await this.getRenewal(id);

    if (renewal.status !== RenewalStatus.ACCEPTED) {
      throw new BadRequestException('Renewal must be accepted to execute');
    }

    // Get the original contract
    const originalContract = await this.contractRepo.findOne({
      where: { id: renewal.originalContractId },
    });
    if (!originalContract) {
      throw new NotFoundException(`Original contract not found`);
    }

    // Create a new contract based on the original
    const newContract = this.contractRepo.create({
      careRequestId: `${originalContract.careRequestId}-renewal`, // Generate new ID
      caregiverId: originalContract.caregiverId,
      patientId: originalContract.patientId,
      templateId: originalContract.templateId,
      type: originalContract.type,
      status: ContractStatus.DRAFT,
      effectiveDate: renewal.proposedStartDate,
      expirationDate: renewal.proposedEndDate,
      terms: renewal.proposedTerms || originalContract.terms,
    });

    await this.contractRepo.save(newContract);

    // Link the new contract to the renewal
    renewal.newContractId = newContract.id;
    await this.renewalRepo.save(renewal);

    // Record event on the original contract
    await this.eventRepo.save(
      this.eventRepo.create({
        contractId: originalContract.id,
        eventType: ContractEventType.UPDATED,
        description: `Contract renewed. New contract: ${newContract.id}`,
      }),
    );

    this.logger.log(`Renewal ${id} executed. New contract: ${newContract.id}`);

    return renewal;
  }

  async sendRenewalReminder(id: string): Promise<ContractRenewal> {
    const renewal = await this.getRenewal(id);

    if (
      renewal.status !== RenewalStatus.RENEWAL_OFFERED &&
      renewal.status !== RenewalStatus.PENDING_DECISION
    ) {
      throw new BadRequestException('Can only send reminders for pending renewals');
    }

    renewal.reminderSentCount += 1;
    renewal.lastReminderSentAt = new Date();

    return this.renewalRepo.save(renewal);
  }

  async listContractRenewals(contractId: string): Promise<ContractRenewal[]> {
    return this.renewalRepo.find({
      where: { originalContractId: contractId },
      order: { createdAt: 'DESC' },
    });
  }

  async getExpiringContracts(daysAhead: number = 30): Promise<Contract[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return this.contractRepo.find({
      where: {
        status: ContractStatus.ACTIVE,
        expirationDate: LessThan(futureDate),
      },
      order: { expirationDate: 'ASC' },
    });
  }

  async expireOldRenewals(): Promise<number> {
    const result = await this.renewalRepo.update(
      {
        status: RenewalStatus.RENEWAL_OFFERED,
        renewalDeadline: LessThan(new Date()),
      },
      { status: RenewalStatus.EXPIRED },
    );

    if (result.affected && result.affected > 0) {
      this.logger.log(`Expired ${result.affected} old renewals`);
    }

    return result.affected || 0;
  }
}
