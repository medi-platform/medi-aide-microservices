import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ContractDispute,
  DisputeStatus,
  DisputeType,
  DisputeSeverity,
  DisputeResolutionType,
} from '../entities/contract-dispute.entity';
import { Contract, ContractStatus } from '../entities/contract.entity';
import { ContractEvent, ContractEventType } from '../entities/contract-event.entity';

interface CreateDisputeDto {
  contractId: string;
  type: DisputeType;
  severity: DisputeSeverity;
  subject: string;
  description: string;
  raisedById: string;
  raisedByName: string;
  raisedByRole: 'patient' | 'caregiver' | 'guardian' | 'agency';
  againstId: string;
  againstName: string;
  againstRole: 'patient' | 'caregiver' | 'guardian' | 'agency';
  disputedAmount?: number;
  currency?: string;
  evidenceFileIds?: string[];
}

interface ResolveDisputeDto {
  resolutionType: DisputeResolutionType;
  resolutionSummary: string;
  resolutionAmount?: number;
  resolvedById: string;
  resolvedByName: string;
}

@Injectable()
export class DisputeService {
  private readonly logger = new Logger(DisputeService.name);

  constructor(
    @InjectRepository(ContractDispute)
    private readonly disputeRepo: Repository<ContractDispute>,
    @InjectRepository(Contract)
    private readonly contractRepo: Repository<Contract>,
    @InjectRepository(ContractEvent)
    private readonly eventRepo: Repository<ContractEvent>,
  ) {}

  async createDispute(dto: CreateDisputeDto): Promise<ContractDispute> {
    // Validate contract exists
    const contract = await this.contractRepo.findOne({ where: { id: dto.contractId } });
    if (!contract) {
      throw new NotFoundException(`Contract ${dto.contractId} not found`);
    }

    // Generate dispute number
    const count = await this.disputeRepo.count();
    const disputeNumber = `DSP-${Date.now().toString(36).toUpperCase()}-${(count + 1).toString().padStart(4, '0')}`;

    // Calculate SLA deadlines based on severity
    const responseDueAt = new Date();
    const resolutionDueAt = new Date();
    switch (dto.severity) {
      case DisputeSeverity.CRITICAL:
        responseDueAt.setHours(responseDueAt.getHours() + 4);
        resolutionDueAt.setDate(resolutionDueAt.getDate() + 2);
        break;
      case DisputeSeverity.HIGH:
        responseDueAt.setHours(responseDueAt.getHours() + 24);
        resolutionDueAt.setDate(resolutionDueAt.getDate() + 5);
        break;
      case DisputeSeverity.MEDIUM:
        responseDueAt.setHours(responseDueAt.getHours() + 48);
        resolutionDueAt.setDate(resolutionDueAt.getDate() + 10);
        break;
      default:
        responseDueAt.setHours(responseDueAt.getHours() + 72);
        resolutionDueAt.setDate(resolutionDueAt.getDate() + 14);
    }

    const dispute = this.disputeRepo.create({
      ...dto,
      disputeNumber,
      status: DisputeStatus.OPEN,
      raisedAt: new Date(),
      responseDueAt,
      resolutionDueAt,
    });

    await this.disputeRepo.save(dispute);

    // Update contract status
    contract.status = ContractStatus.DISPUTED;
    await this.contractRepo.save(contract);

    // Record event
    await this.eventRepo.save(
      this.eventRepo.create({
        contractId: dto.contractId,
        eventType: ContractEventType.DISPUTED,
        actorId: dto.raisedById,
        description: `Dispute raised: ${dto.subject}`,
      }),
    );

    this.logger.log(`Dispute ${disputeNumber} created for contract ${dto.contractId}`);

    return dispute;
  }

  async getDispute(id: string): Promise<ContractDispute> {
    const dispute = await this.disputeRepo.findOne({
      where: { id },
      relations: ['contract'],
    });
    if (!dispute) {
      throw new NotFoundException(`Dispute ${id} not found`);
    }
    return dispute;
  }

  async assignDispute(
    id: string,
    assignedToId: string,
    assignedToName: string,
  ): Promise<ContractDispute> {
    const dispute = await this.getDispute(id);

    dispute.assignedToId = assignedToId;
    dispute.assignedToName = assignedToName;
    dispute.assignedAt = new Date();
    dispute.status = DisputeStatus.UNDER_REVIEW;

    return this.disputeRepo.save(dispute);
  }

  async respondToDispute(
    id: string,
    responseText: string,
  ): Promise<ContractDispute> {
    const dispute = await this.getDispute(id);

    if (dispute.status === DisputeStatus.RESOLVED || dispute.status === DisputeStatus.CLOSED) {
      throw new BadRequestException('Cannot respond to a closed or resolved dispute');
    }

    dispute.responseText = responseText;
    dispute.respondedAt = new Date();

    return this.disputeRepo.save(dispute);
  }

  async escalateDispute(
    id: string,
    escalatedById: string,
    escalatedByName: string,
    reason: string,
    toLevel: string,
  ): Promise<ContractDispute> {
    const dispute = await this.getDispute(id);

    dispute.status = DisputeStatus.ESCALATED;
    dispute.escalationHistory = dispute.escalationHistory || [];
    dispute.escalationHistory.push({
      escalatedAt: new Date().toISOString(),
      escalatedById,
      escalatedByName,
      reason,
      toLevel,
    });

    return this.disputeRepo.save(dispute);
  }

  async resolveDispute(id: string, dto: ResolveDisputeDto): Promise<ContractDispute> {
    const dispute = await this.getDispute(id);

    if (dispute.status === DisputeStatus.RESOLVED || dispute.status === DisputeStatus.CLOSED) {
      throw new BadRequestException('Dispute is already resolved or closed');
    }

    dispute.status = DisputeStatus.RESOLVED;
    dispute.resolutionType = dto.resolutionType;
    dispute.resolutionSummary = dto.resolutionSummary;
    dispute.resolutionAmount = dto.resolutionAmount;
    dispute.resolvedById = dto.resolvedById;
    dispute.resolvedByName = dto.resolvedByName;
    dispute.resolvedAt = new Date();

    await this.disputeRepo.save(dispute);

    // Update contract status back to active (unless terminated)
    const contract = await this.contractRepo.findOne({ where: { id: dispute.contractId } });
    if (contract && dto.resolutionType !== DisputeResolutionType.CONTRACT_TERMINATION) {
      contract.status = ContractStatus.ACTIVE;
      await this.contractRepo.save(contract);
    }

    this.logger.log(`Dispute ${dispute.disputeNumber} resolved`);

    return dispute;
  }

  async withdrawDispute(id: string): Promise<ContractDispute> {
    const dispute = await this.getDispute(id);

    if (dispute.status === DisputeStatus.RESOLVED || dispute.status === DisputeStatus.CLOSED) {
      throw new BadRequestException('Cannot withdraw a resolved or closed dispute');
    }

    dispute.status = DisputeStatus.WITHDRAWN;

    await this.disputeRepo.save(dispute);

    // Update contract status
    const contract = await this.contractRepo.findOne({ where: { id: dispute.contractId } });
    if (contract) {
      contract.status = ContractStatus.ACTIVE;
      await this.contractRepo.save(contract);
    }

    return dispute;
  }

  async listContractDisputes(contractId: string): Promise<ContractDispute[]> {
    return this.disputeRepo.find({
      where: { contractId },
      order: { createdAt: 'DESC' },
    });
  }

  async listUserDisputes(
    userId: string,
    role: 'raised' | 'against' = 'raised',
  ): Promise<ContractDispute[]> {
    const where = role === 'raised' ? { raisedById: userId } : { againstId: userId };
    return this.disputeRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async getOpenDisputes(): Promise<ContractDispute[]> {
    return this.disputeRepo.find({
      where: { status: DisputeStatus.OPEN },
      order: { severity: 'DESC', createdAt: 'ASC' },
    });
  }
}
