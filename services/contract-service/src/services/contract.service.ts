import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Contract, ContractStatus, ContractType } from '../entities/contract.entity';
import { ContractSignature, SignatureStatus, SignerRole } from '../entities/contract-signature.entity';
import { ContractTemplate } from '../entities/contract-template.entity';
import { ContractEvent, ContractEventType } from '../entities/contract-event.entity';

interface CreateContractDto {
  careRequestId: string;
  caregiverId: string;
  patientId: string;
  templateId?: string;
  type?: ContractType;
  effectiveDate?: Date;
  expirationDate?: Date;
  terms?: Contract['terms'];
}

interface UpdateContractDto {
  effectiveDate?: Date;
  expirationDate?: Date;
  terms?: Contract['terms'];
}

@Injectable()
export class ContractService {
  private readonly logger = new Logger(ContractService.name);

  constructor(
    @InjectRepository(Contract)
    private readonly contractRepo: Repository<Contract>,
    @InjectRepository(ContractSignature)
    private readonly signatureRepo: Repository<ContractSignature>,
    @InjectRepository(ContractTemplate)
    private readonly templateRepo: Repository<ContractTemplate>,
    @InjectRepository(ContractEvent)
    private readonly eventRepo: Repository<ContractEvent>,
  ) {}

  /**
   * Create a new contract
   */
  async createContract(dto: CreateContractDto, createdBy?: string): Promise<Contract> {
    // Check if contract already exists for this care request
    const existing = await this.contractRepo.findOne({
      where: { careRequestId: dto.careRequestId },
    });

    if (existing) {
      throw new ConflictException(`Contract already exists for care request ${dto.careRequestId}`);
    }

    // Get template if specified
    let template: ContractTemplate | null = null;
    if (dto.templateId) {
      template = await this.templateRepo.findOne({ where: { id: dto.templateId } });
      if (!template) {
        throw new NotFoundException(`Template ${dto.templateId} not found`);
      }
    }

    const contract = this.contractRepo.create({
      ...dto,
      type: dto.type || (template?.type ?? ContractType.CARE_AGREEMENT),
      status: ContractStatus.DRAFT,
      templateVersionId: template?.id,
      terms: dto.terms || template?.defaultTerms,
    });

    await this.contractRepo.save(contract);

    // Create required signature slots
    const requiredSignatures = template?.requiredSignatures || ['patient', 'caregiver'];
    for (const role of requiredSignatures) {
      const signerRole = this.mapToSignerRole(role);
      const signature = this.signatureRepo.create({
        contractId: contract.id,
        role: signerRole,
        isRequired: true,
        status: SignatureStatus.PENDING,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });
      await this.signatureRepo.save(signature);
    }

    // Record event
    await this.recordEvent(contract.id, ContractEventType.CREATED, createdBy);

    this.logger.log(`Contract created: ${contract.id} for care request ${dto.careRequestId}`);

    return contract;
  }

  /**
   * Get contract by ID
   */
  async getContract(contractId: string): Promise<Contract> {
    const contract = await this.contractRepo.findOne({ where: { id: contractId } });
    if (!contract) {
      throw new NotFoundException(`Contract ${contractId} not found`);
    }
    return contract;
  }

  /**
   * Get contract by care request ID
   */
  async getContractByCareRequest(careRequestId: string): Promise<Contract | null> {
    return this.contractRepo.findOne({ where: { careRequestId } });
  }

  /**
   * Get contracts for a caregiver
   */
  async getCaregiverContracts(
    caregiverId: string,
    status?: ContractStatus,
  ): Promise<Contract[]> {
    const where: any = { caregiverId };
    if (status) {
      where.status = status;
    }

    return this.contractRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get contracts for a patient
   */
  async getPatientContracts(
    patientId: string,
    status?: ContractStatus,
  ): Promise<Contract[]> {
    const where: any = { patientId };
    if (status) {
      where.status = status;
    }

    return this.contractRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Update contract
   */
  async updateContract(
    contractId: string,
    dto: UpdateContractDto,
    updatedBy?: string,
  ): Promise<Contract> {
    const contract = await this.getContract(contractId);

    if (contract.status !== ContractStatus.DRAFT) {
      throw new BadRequestException('Can only update contracts in draft status');
    }

    const changes: any[] = [];
    for (const [key, value] of Object.entries(dto)) {
      if (value !== undefined && (contract as any)[key] !== value) {
        changes.push({
          field: key,
          oldValue: (contract as any)[key],
          newValue: value,
        });
        (contract as any)[key] = value;
      }
    }

    if (changes.length > 0) {
      await this.contractRepo.save(contract);
      await this.recordEvent(contractId, ContractEventType.UPDATED, updatedBy, undefined, changes);
    }

    return contract;
  }

  /**
   * Send contract for signatures
   */
  async sendForSignatures(contractId: string, sentBy?: string): Promise<Contract> {
    const contract = await this.getContract(contractId);

    if (contract.status !== ContractStatus.DRAFT) {
      throw new BadRequestException('Contract must be in draft status to send for signatures');
    }

    // Validate required fields
    if (!contract.documentUrl && !contract.templateId) {
      throw new BadRequestException('Contract must have a document or template');
    }

    contract.status = ContractStatus.PENDING_SIGNATURES;
    await this.contractRepo.save(contract);

    await this.recordEvent(contractId, ContractEventType.SIGNATURE_REQUESTED, sentBy);

    this.logger.log(`Contract ${contractId} sent for signatures`);

    return contract;
  }

  /**
   * Get signature status for a contract
   */
  async getSignatures(contractId: string): Promise<ContractSignature[]> {
    return this.signatureRepo.find({
      where: { contractId },
      order: { role: 'ASC' },
    });
  }

  /**
   * Check if contract is fully signed
   */
  async checkFullySigned(contractId: string): Promise<boolean> {
    const signatures = await this.signatureRepo.find({
      where: { contractId, isRequired: true },
    });

    return signatures.every(s => s.status === SignatureStatus.SIGNED);
  }

  /**
   * Activate a fully signed contract
   */
  async activateContract(contractId: string, activatedBy?: string): Promise<Contract> {
    const contract = await this.getContract(contractId);

    if (contract.status !== ContractStatus.FULLY_SIGNED) {
      throw new BadRequestException('Contract must be fully signed to activate');
    }

    contract.status = ContractStatus.ACTIVE;
    contract.effectiveDate = contract.effectiveDate || new Date();

    await this.contractRepo.save(contract);
    await this.recordEvent(contractId, ContractEventType.ACTIVATED, activatedBy);

    this.logger.log(`Contract ${contractId} activated`);

    return contract;
  }

  /**
   * Terminate a contract
   */
  async terminateContract(
    contractId: string,
    reason: string,
    terminatedBy?: string,
  ): Promise<Contract> {
    const contract = await this.getContract(contractId);

    if (contract.status === ContractStatus.TERMINATED) {
      throw new BadRequestException('Contract is already terminated');
    }

    contract.status = ContractStatus.TERMINATED;
    contract.terminatedAt = new Date();
    contract.terminationReason = reason;

    await this.contractRepo.save(contract);
    await this.recordEvent(contractId, ContractEventType.TERMINATED, terminatedBy, reason);

    this.logger.log(`Contract ${contractId} terminated: ${reason}`);

    return contract;
  }

  /**
   * Cancel a contract
   */
  async cancelContract(
    contractId: string,
    reason: string,
    cancelledBy?: string,
  ): Promise<Contract> {
    const contract = await this.getContract(contractId);

    if (contract.status === ContractStatus.ACTIVE) {
      throw new BadRequestException('Cannot cancel an active contract, use terminate instead');
    }

    contract.status = ContractStatus.CANCELLED;

    await this.contractRepo.save(contract);
    await this.recordEvent(contractId, ContractEventType.CANCELLED, cancelledBy, reason);

    this.logger.log(`Contract ${contractId} cancelled: ${reason}`);

    return contract;
  }

  /**
   * Get contract event history
   */
  async getEventHistory(contractId: string): Promise<ContractEvent[]> {
    return this.eventRepo.find({
      where: { contractId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Ensure contract created for care request (idempotent)
   */
  async ensureCreatedForCareRequest(careRequestId: string): Promise<Contract> {
    const existing = await this.getContractByCareRequest(careRequestId);
    if (existing) {
      return existing;
    }

    // This would typically fetch care request details
    // For now, create a placeholder
    throw new BadRequestException(
      'Care request details required to create contract. Use createContract with full details.',
    );
  }

  /**
   * Record an event
   */
  private async recordEvent(
    contractId: string,
    eventType: ContractEventType,
    actorId?: string,
    description?: string,
    changes?: any[],
  ): Promise<void> {
    const event = this.eventRepo.create({
      contractId,
      eventType,
      actorId,
      description,
      changes,
    });

    await this.eventRepo.save(event);
  }

  /**
   * Map string role to SignerRole enum
   */
  private mapToSignerRole(role: string): SignerRole {
    const roleMap: Record<string, SignerRole> = {
      'patient': SignerRole.PATIENT,
      'caregiver': SignerRole.CAREGIVER,
      'guardian': SignerRole.GUARDIAN,
      'family_member': SignerRole.FAMILY_MEMBER,
      'witness': SignerRole.WITNESS,
      'agency': SignerRole.AGENCY_REPRESENTATIVE,
      'notary': SignerRole.NOTARY,
    };
    return roleMap[role.toLowerCase()] || SignerRole.PATIENT;
  }
}

