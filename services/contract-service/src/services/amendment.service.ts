import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContractAmendment, AmendmentStatus, AmendmentType } from '../entities/contract-amendment.entity';
import { Contract, ContractStatus } from '../entities/contract.entity';
import { ContractEvent, ContractEventType } from '../entities/contract-event.entity';

interface CreateAmendmentDto {
  contractId: string;
  type: AmendmentType;
  title: string;
  description: string;
  changes: ContractAmendment['changes'];
  newTerms?: Record<string, any>;
  effectiveDate: Date;
  requestedById: string;
  requestedByName: string;
}

interface UpdateAmendmentDto {
  title?: string;
  description?: string;
  changes?: ContractAmendment['changes'];
  newTerms?: Record<string, any>;
  effectiveDate?: Date;
}

@Injectable()
export class AmendmentService {
  private readonly logger = new Logger(AmendmentService.name);

  constructor(
    @InjectRepository(ContractAmendment)
    private readonly amendmentRepo: Repository<ContractAmendment>,
    @InjectRepository(Contract)
    private readonly contractRepo: Repository<Contract>,
    @InjectRepository(ContractEvent)
    private readonly eventRepo: Repository<ContractEvent>,
  ) {}

  async createAmendment(dto: CreateAmendmentDto): Promise<ContractAmendment> {
    // Validate contract exists and is active
    const contract = await this.contractRepo.findOne({ where: { id: dto.contractId } });
    if (!contract) {
      throw new NotFoundException(`Contract ${dto.contractId} not found`);
    }

    if (contract.status !== ContractStatus.ACTIVE) {
      throw new BadRequestException('Can only amend active contracts');
    }

    // Get next amendment number
    const lastAmendment = await this.amendmentRepo.findOne({
      where: { contractId: dto.contractId },
      order: { amendmentNumber: 'DESC' },
    });
    const amendmentNumber = (lastAmendment?.amendmentNumber || 0) + 1;

    const amendment = this.amendmentRepo.create({
      ...dto,
      amendmentNumber,
      status: AmendmentStatus.DRAFT,
      requestedAt: new Date(),
    });

    await this.amendmentRepo.save(amendment);

    this.logger.log(`Amendment ${amendment.id} created for contract ${dto.contractId}`);

    return amendment;
  }

  async getAmendment(id: string): Promise<ContractAmendment> {
    const amendment = await this.amendmentRepo.findOne({
      where: { id },
      relations: ['contract'],
    });
    if (!amendment) {
      throw new NotFoundException(`Amendment ${id} not found`);
    }
    return amendment;
  }

  async updateAmendment(id: string, dto: UpdateAmendmentDto): Promise<ContractAmendment> {
    const amendment = await this.getAmendment(id);

    if (amendment.status !== AmendmentStatus.DRAFT) {
      throw new BadRequestException('Can only update amendments in draft status');
    }

    Object.assign(amendment, dto);
    return this.amendmentRepo.save(amendment);
  }

  async submitForApproval(id: string): Promise<ContractAmendment> {
    const amendment = await this.getAmendment(id);

    if (amendment.status !== AmendmentStatus.DRAFT) {
      throw new BadRequestException('Can only submit draft amendments for approval');
    }

    amendment.status = AmendmentStatus.PENDING_APPROVAL;
    return this.amendmentRepo.save(amendment);
  }

  async approveAmendment(
    id: string,
    approvedById: string,
    approvedByName: string,
  ): Promise<ContractAmendment> {
    const amendment = await this.getAmendment(id);

    if (amendment.status !== AmendmentStatus.PENDING_APPROVAL) {
      throw new BadRequestException('Amendment must be pending approval');
    }

    amendment.status = AmendmentStatus.PENDING_SIGNATURES;
    amendment.approvedById = approvedById;
    amendment.approvedByName = approvedByName;
    amendment.approvedAt = new Date();

    return this.amendmentRepo.save(amendment);
  }

  async rejectAmendment(id: string, reason: string): Promise<ContractAmendment> {
    const amendment = await this.getAmendment(id);

    if (amendment.status !== AmendmentStatus.PENDING_APPROVAL) {
      throw new BadRequestException('Amendment must be pending approval to reject');
    }

    amendment.status = AmendmentStatus.REJECTED;
    amendment.rejectionReason = reason;

    return this.amendmentRepo.save(amendment);
  }

  async signAmendment(
    id: string,
    role: 'patient' | 'caregiver',
  ): Promise<ContractAmendment> {
    const amendment = await this.getAmendment(id);

    if (
      amendment.status !== AmendmentStatus.PENDING_SIGNATURES &&
      amendment.status !== AmendmentStatus.PARTIALLY_SIGNED
    ) {
      throw new BadRequestException('Amendment must be pending signatures');
    }

    if (role === 'patient') {
      amendment.patientSigned = true;
      amendment.patientSignedAt = new Date();
    } else if (role === 'caregiver') {
      amendment.caregiverSigned = true;
      amendment.caregiverSignedAt = new Date();
    }

    // Check if fully signed
    const patientComplete = !amendment.requiresPatientSignature || amendment.patientSigned;
    const caregiverComplete = !amendment.requiresCaregiverSignature || amendment.caregiverSigned;

    if (patientComplete && caregiverComplete) {
      amendment.status = AmendmentStatus.FULLY_SIGNED;
    } else {
      amendment.status = AmendmentStatus.PARTIALLY_SIGNED;
    }

    return this.amendmentRepo.save(amendment);
  }

  async activateAmendment(id: string): Promise<ContractAmendment> {
    const amendment = await this.getAmendment(id);

    if (amendment.status !== AmendmentStatus.FULLY_SIGNED) {
      throw new BadRequestException('Amendment must be fully signed to activate');
    }

    // Apply changes to the contract
    const contract = await this.contractRepo.findOne({ where: { id: amendment.contractId } });
    if (contract && amendment.newTerms) {
      contract.terms = { ...contract.terms, ...amendment.newTerms };
      await this.contractRepo.save(contract);
    }

    amendment.status = AmendmentStatus.ACTIVE;
    await this.amendmentRepo.save(amendment);

    // Record event
    await this.eventRepo.save(
      this.eventRepo.create({
        contractId: amendment.contractId,
        eventType: ContractEventType.UPDATED,
        description: `Amendment ${amendment.amendmentNumber} activated`,
      }),
    );

    this.logger.log(`Amendment ${id} activated for contract ${amendment.contractId}`);

    return amendment;
  }

  async listContractAmendments(contractId: string): Promise<ContractAmendment[]> {
    return this.amendmentRepo.find({
      where: { contractId },
      order: { amendmentNumber: 'DESC' },
    });
  }
}
