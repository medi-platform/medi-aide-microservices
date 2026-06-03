import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import {
  AgencyContract,
  AgencyContractStatus,
  AgencyContractType,
} from '../entities/agency-contract.entity';

interface CreateAgencyContractDto {
  agencyId: string;
  agencyName: string;
  type: AgencyContractType;
  title: string;
  description?: string;
  effectiveDate: Date;
  expirationDate: Date;
  autoRenew?: boolean;
  renewalNoticeDays?: number;
  baseFee?: number;
  platformFeePercentage?: number;
  volumeDiscountTiers?: AgencyContract['volumeDiscountTiers'];
  paymentTermsDays?: number;
  currency?: string;
  slaTerms?: AgencyContract['slaTerms'];
  serviceAreas?: string[];
  serviceTypes?: string[];
  caregiverRequirements?: AgencyContract['caregiverRequirements'];
  complianceRequirements?: AgencyContract['complianceRequirements'];
  accountManagerId?: string;
  accountManagerName?: string;
}

interface UpdateAgencyContractDto {
  title?: string;
  description?: string;
  baseFee?: number;
  platformFeePercentage?: number;
  volumeDiscountTiers?: AgencyContract['volumeDiscountTiers'];
  slaTerms?: AgencyContract['slaTerms'];
  serviceAreas?: string[];
  serviceTypes?: string[];
  caregiverRequirements?: AgencyContract['caregiverRequirements'];
  complianceRequirements?: AgencyContract['complianceRequirements'];
  accountManagerId?: string;
  accountManagerName?: string;
}

@Injectable()
export class AgencyContractService {
  private readonly logger = new Logger(AgencyContractService.name);

  constructor(
    @InjectRepository(AgencyContract)
    private readonly agencyContractRepo: Repository<AgencyContract>,
  ) {}

  async createAgencyContract(dto: CreateAgencyContractDto): Promise<AgencyContract> {
    // Generate contract number
    const count = await this.agencyContractRepo.count();
    const contractNumber = `AGC-${new Date().getFullYear()}-${(count + 1).toString().padStart(5, '0')}`;

    const contract = this.agencyContractRepo.create({
      ...dto,
      contractNumber,
      status: AgencyContractStatus.DRAFT,
    });

    await this.agencyContractRepo.save(contract);

    this.logger.log(`Agency contract ${contractNumber} created for ${dto.agencyName}`);

    return contract;
  }

  async getAgencyContract(id: string): Promise<AgencyContract> {
    const contract = await this.agencyContractRepo.findOne({ where: { id } });
    if (!contract) {
      throw new NotFoundException(`Agency contract ${id} not found`);
    }
    return contract;
  }

  async updateAgencyContract(id: string, dto: UpdateAgencyContractDto): Promise<AgencyContract> {
    const contract = await this.getAgencyContract(id);

    if (
      contract.status !== AgencyContractStatus.DRAFT &&
      contract.status !== AgencyContractStatus.PENDING_REVIEW
    ) {
      throw new BadRequestException('Can only update contracts in draft or pending review status');
    }

    Object.assign(contract, dto);
    return this.agencyContractRepo.save(contract);
  }

  async submitForReview(id: string): Promise<AgencyContract> {
    const contract = await this.getAgencyContract(id);

    if (contract.status !== AgencyContractStatus.DRAFT) {
      throw new BadRequestException('Only draft contracts can be submitted for review');
    }

    contract.status = AgencyContractStatus.PENDING_REVIEW;
    return this.agencyContractRepo.save(contract);
  }

  async sendForSignatures(id: string): Promise<AgencyContract> {
    const contract = await this.getAgencyContract(id);

    if (contract.status !== AgencyContractStatus.PENDING_REVIEW) {
      throw new BadRequestException('Contract must be reviewed before sending for signatures');
    }

    contract.status = AgencyContractStatus.PENDING_SIGNATURES;
    return this.agencyContractRepo.save(contract);
  }

  async signAgencyContract(
    id: string,
    signatoryId: string,
    signatoryName: string,
    party: 'agency' | 'platform',
  ): Promise<AgencyContract> {
    const contract = await this.getAgencyContract(id);

    if (contract.status !== AgencyContractStatus.PENDING_SIGNATURES) {
      throw new BadRequestException('Contract must be pending signatures');
    }

    if (party === 'agency') {
      contract.agencySigned = true;
      contract.agencySignedAt = new Date();
      contract.agencySignatoryId = signatoryId;
      contract.agencySignatoryName = signatoryName;
    } else {
      contract.platformSigned = true;
      contract.platformSignedAt = new Date();
      contract.platformSignatoryId = signatoryId;
      contract.platformSignatoryName = signatoryName;
    }

    // Check if fully signed
    if (contract.agencySigned && contract.platformSigned) {
      contract.status = AgencyContractStatus.ACTIVE;
    }

    return this.agencyContractRepo.save(contract);
  }

  async terminateAgencyContract(
    id: string,
    reason: string,
  ): Promise<AgencyContract> {
    const contract = await this.getAgencyContract(id);

    if (contract.status === AgencyContractStatus.TERMINATED) {
      throw new BadRequestException('Contract is already terminated');
    }

    contract.status = AgencyContractStatus.TERMINATED;
    contract.terminatedAt = new Date();
    contract.terminationReason = reason;

    return this.agencyContractRepo.save(contract);
  }

  async holdAgencyContract(id: string): Promise<AgencyContract> {
    const contract = await this.getAgencyContract(id);

    if (contract.status !== AgencyContractStatus.ACTIVE) {
      throw new BadRequestException('Only active contracts can be put on hold');
    }

    contract.status = AgencyContractStatus.ON_HOLD;
    return this.agencyContractRepo.save(contract);
  }

  async resumeAgencyContract(id: string): Promise<AgencyContract> {
    const contract = await this.getAgencyContract(id);

    if (contract.status !== AgencyContractStatus.ON_HOLD) {
      throw new BadRequestException('Only on-hold contracts can be resumed');
    }

    contract.status = AgencyContractStatus.ACTIVE;
    return this.agencyContractRepo.save(contract);
  }

  async listAgencyContracts(
    agencyId?: string,
    status?: AgencyContractStatus,
    type?: AgencyContractType,
  ): Promise<AgencyContract[]> {
    const where: any = {};
    if (agencyId) where.agencyId = agencyId;
    if (status) where.status = status;
    if (type) where.type = type;

    return this.agencyContractRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async getActiveAgencyContracts(agencyId: string): Promise<AgencyContract[]> {
    return this.agencyContractRepo.find({
      where: { agencyId, status: AgencyContractStatus.ACTIVE },
      order: { type: 'ASC' },
    });
  }

  async getExpiringAgencyContracts(daysAhead: number = 30): Promise<AgencyContract[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return this.agencyContractRepo.find({
      where: {
        status: AgencyContractStatus.ACTIVE,
        expirationDate: LessThan(futureDate),
      },
      order: { expirationDate: 'ASC' },
    });
  }

  async calculateDiscountedFee(
    agencyId: string,
    hoursWorked: number,
  ): Promise<{ baseFee: number; discountPercentage: number; finalFee: number }> {
    const activeContracts = await this.getActiveAgencyContracts(agencyId);
    
    // Find a contract with volume discount
    const contractWithDiscount = activeContracts.find(c => c.volumeDiscountTiers && c.volumeDiscountTiers.length > 0);
    
    if (!contractWithDiscount || !contractWithDiscount.platformFeePercentage) {
      return {
        baseFee: 0,
        discountPercentage: 0,
        finalFee: 0,
      };
    }

    const baseFee = contractWithDiscount.platformFeePercentage;
    let discountPercentage = 0;

    // Find applicable discount tier
    for (const tier of contractWithDiscount.volumeDiscountTiers!) {
      if (hoursWorked >= tier.minHours && (!tier.maxHours || hoursWorked <= tier.maxHours)) {
        discountPercentage = tier.discountPercentage;
        break;
      }
    }

    const finalFee = baseFee * (1 - discountPercentage / 100);

    return { baseFee, discountPercentage, finalFee };
  }

  async expireOldContracts(): Promise<number> {
    const result = await this.agencyContractRepo.update(
      {
        status: AgencyContractStatus.ACTIVE,
        expirationDate: LessThan(new Date()),
        autoRenew: false,
      },
      { status: AgencyContractStatus.EXPIRED },
    );

    if (result.affected && result.affected > 0) {
      this.logger.log(`Expired ${result.affected} agency contracts`);
    }

    return result.affected || 0;
  }
}
