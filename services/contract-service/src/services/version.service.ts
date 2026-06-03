import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { ContractVersion } from '../entities/contract-version.entity';
import { Contract } from '../entities/contract.entity';

@Injectable()
export class VersionService {
  private readonly logger = new Logger(VersionService.name);

  constructor(
    @InjectRepository(ContractVersion)
    private readonly versionRepo: Repository<ContractVersion>,
    @InjectRepository(Contract)
    private readonly contractRepo: Repository<Contract>,
  ) {}

  /**
   * Create a new version snapshot of a contract
   */
  async createVersion(
    contractId: string,
    changeType: ContractVersion['changeType'],
    changeReason?: string,
    createdById?: string,
    createdByName?: string,
    amendmentId?: string,
    renewalId?: string,
  ): Promise<ContractVersion> {
    const contract = await this.contractRepo.findOne({ where: { id: contractId } });
    if (!contract) {
      throw new NotFoundException(`Contract ${contractId} not found`);
    }

    // Get the last version
    const lastVersion = await this.versionRepo.findOne({
      where: { contractId },
      order: { versionNumber: 'DESC' },
    });

    const versionNumber = (lastVersion?.versionNumber || 0) + 1;

    // Create full snapshot
    const fullSnapshot = {
      ...contract,
      snapshotAt: new Date().toISOString(),
    };

    // Generate version hash
    const versionData = JSON.stringify({
      contractId,
      versionNumber,
      fullSnapshot,
      previousVersionHash: lastVersion?.versionHash,
    });
    const versionHash = crypto.createHash('sha256').update(versionData).digest('hex');

    const version = this.versionRepo.create({
      contractId,
      versionNumber,
      type: contract.type,
      status: contract.status,
      templateId: contract.templateId,
      documentUrl: contract.documentUrl,
      documentHash: contract.documentHash,
      terms: contract.terms,
      effectiveDate: contract.effectiveDate,
      expirationDate: contract.expirationDate,
      patientSigned: contract.patientSigned,
      patientSignedAt: contract.patientSignedAt,
      caregiverSigned: contract.caregiverSigned,
      caregiverSignedAt: contract.caregiverSignedAt,
      changeType,
      changeReason,
      amendmentId,
      renewalId,
      createdById,
      createdByName,
      versionHash,
      previousVersionHash: lastVersion?.versionHash,
      fullSnapshot,
    });

    await this.versionRepo.save(version);

    this.logger.log(`Contract ${contractId} version ${versionNumber} created`);

    return version;
  }

  /**
   * Get a specific version
   */
  async getVersion(id: string): Promise<ContractVersion> {
    const version = await this.versionRepo.findOne({ where: { id } });
    if (!version) {
      throw new NotFoundException(`Version ${id} not found`);
    }
    return version;
  }

  /**
   * Get a specific version by contract ID and version number
   */
  async getContractVersion(
    contractId: string,
    versionNumber: number,
  ): Promise<ContractVersion> {
    const version = await this.versionRepo.findOne({
      where: { contractId, versionNumber },
    });
    if (!version) {
      throw new NotFoundException(`Version ${versionNumber} for contract ${contractId} not found`);
    }
    return version;
  }

  /**
   * Get all versions of a contract
   */
  async listContractVersions(contractId: string): Promise<ContractVersion[]> {
    return this.versionRepo.find({
      where: { contractId },
      order: { versionNumber: 'DESC' },
    });
  }

  /**
   * Get the latest version of a contract
   */
  async getLatestVersion(contractId: string): Promise<ContractVersion | null> {
    return this.versionRepo.findOne({
      where: { contractId },
      order: { versionNumber: 'DESC' },
    });
  }

  /**
   * Verify version chain integrity
   */
  async verifyVersionChain(contractId: string): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const versions = await this.listContractVersions(contractId);
    const errors: string[] = [];

    if (versions.length === 0) {
      return { isValid: true, errors: [] };
    }

    // Check version numbers are sequential
    for (let i = 0; i < versions.length - 1; i++) {
      const current = versions[i];
      const previous = versions[i + 1];

      if (current.versionNumber !== previous.versionNumber + 1) {
        errors.push(
          `Version sequence gap between ${previous.versionNumber} and ${current.versionNumber}`,
        );
      }

      // Verify hash chain
      if (current.previousVersionHash !== previous.versionHash) {
        errors.push(
          `Hash chain broken at version ${current.versionNumber}`,
        );
      }
    }

    // First version should have no previous hash
    const firstVersion = versions[versions.length - 1];
    if (firstVersion.versionNumber === 1 && firstVersion.previousVersionHash) {
      errors.push('First version should not have a previous hash');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Compare two versions
   */
  async compareVersions(
    contractId: string,
    version1: number,
    version2: number,
  ): Promise<{
    version1: ContractVersion;
    version2: ContractVersion;
    differences: {
      field: string;
      value1: any;
      value2: any;
    }[];
  }> {
    const v1 = await this.getContractVersion(contractId, version1);
    const v2 = await this.getContractVersion(contractId, version2);

    const differences: { field: string; value1: any; value2: any }[] = [];

    // Compare key fields
    const fieldsToCompare = [
      'status',
      'terms',
      'effectiveDate',
      'expirationDate',
      'patientSigned',
      'caregiverSigned',
    ];

    for (const field of fieldsToCompare) {
      const value1 = (v1 as any)[field];
      const value2 = (v2 as any)[field];

      if (JSON.stringify(value1) !== JSON.stringify(value2)) {
        differences.push({ field, value1, value2 });
      }
    }

    return { version1: v1, version2: v2, differences };
  }

  /**
   * Restore a contract to a previous version
   */
  async restoreVersion(
    contractId: string,
    versionNumber: number,
    restoredById?: string,
    restoredByName?: string,
  ): Promise<Contract> {
    const version = await this.getContractVersion(contractId, versionNumber);
    const contract = await this.contractRepo.findOne({ where: { id: contractId } });
    
    if (!contract) {
      throw new NotFoundException(`Contract ${contractId} not found`);
    }

    // Create a version before restoring
    await this.createVersion(
      contractId,
      'correction',
      `Restored to version ${versionNumber}`,
      restoredById,
      restoredByName,
    );

    // Restore the contract
    contract.terms = version.terms;
    contract.effectiveDate = version.effectiveDate;
    contract.expirationDate = version.expirationDate;
    
    await this.contractRepo.save(contract);

    this.logger.log(`Contract ${contractId} restored to version ${versionNumber}`);

    return contract;
  }
}
