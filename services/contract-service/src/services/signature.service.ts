import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { ContractSignature, SignatureStatus, SignerRole } from '../entities/contract-signature.entity';
import { Contract, ContractStatus } from '../entities/contract.entity';
import { ContractEvent, ContractEventType } from '../entities/contract-event.entity';
import * as crypto from 'crypto';

interface SignContractDto {
  typedName: string;
  signatureData?: string; // Base64 encoded signature image
  consent: boolean;
  consentVersion?: string;
  ipAddress?: string;
  userAgent?: string;
  geoLocation?: ContractSignature['geoLocation'];
  verificationMethod?: ContractSignature['verificationMethod'];
  verificationReference?: string;
}

interface DeclineSignatureDto {
  reason: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class SignatureService {
  private readonly logger = new Logger(SignatureService.name);

  constructor(
    @InjectRepository(ContractSignature)
    private readonly signatureRepo: Repository<ContractSignature>,
    @InjectRepository(Contract)
    private readonly contractRepo: Repository<Contract>,
    @InjectRepository(ContractEvent)
    private readonly eventRepo: Repository<ContractEvent>,
  ) {}

  /**
   * Sign a contract
   */
  async signContract(
    signatureId: string,
    userId: string,
    dto: SignContractDto,
  ): Promise<ContractSignature> {
    const signature = await this.getSignature(signatureId);

    // Validate signature can be signed
    if (signature.status !== SignatureStatus.PENDING) {
      throw new BadRequestException(`Signature is already ${signature.status}`);
    }

    if (signature.expiresAt && signature.expiresAt < new Date()) {
      throw new BadRequestException('Signature request has expired');
    }

    // Validate consent
    if (!dto.consent) {
      throw new BadRequestException('Consent is required to sign');
    }

    // Get contract and validate status
    const contract = await this.contractRepo.findOne({
      where: { id: signature.contractId },
    });

    if (!contract) {
      throw new NotFoundException(`Contract ${signature.contractId} not found`);
    }

    if (
      contract.status !== ContractStatus.PENDING_SIGNATURES &&
      contract.status !== ContractStatus.PARTIALLY_SIGNED
    ) {
      throw new BadRequestException('Contract is not available for signing');
    }

    // Update signature
    signature.userId = userId;
    signature.status = SignatureStatus.SIGNED;
    signature.typedName = dto.typedName;
    signature.signatureData = dto.signatureData;
    signature.consent = true;
    signature.consentVersion = dto.consentVersion || 'v1';
    signature.consentText = this.getConsentText(signature.role);
    signature.ipAddress = dto.ipAddress;
    signature.userAgent = dto.userAgent;
    signature.geoLocation = dto.geoLocation;
    signature.verificationMethod = dto.verificationMethod;
    signature.verificationReference = dto.verificationReference;
    signature.identityVerified = !!dto.verificationMethod;
    signature.signedAt = new Date();

    await this.signatureRepo.save(signature);

    // Record event
    await this.recordEvent(
      contract.id,
      ContractEventType.SIGNED,
      userId,
      `${signature.role} signed the contract`,
      dto.ipAddress,
      dto.userAgent,
    );

    // Update contract status based on role
    await this.updateContractSigningStatus(contract, signature.role);

    this.logger.log(`Signature ${signatureId} completed by ${userId}`);

    return signature;
  }

  /**
   * Decline to sign a contract
   */
  async declineSignature(
    signatureId: string,
    userId: string,
    dto: DeclineSignatureDto,
  ): Promise<ContractSignature> {
    const signature = await this.getSignature(signatureId);

    if (signature.status !== SignatureStatus.PENDING) {
      throw new BadRequestException(`Signature is already ${signature.status}`);
    }

    signature.userId = userId;
    signature.status = SignatureStatus.DECLINED;
    signature.declinedAt = new Date();
    signature.declineReason = dto.reason;
    signature.ipAddress = dto.ipAddress;
    signature.userAgent = dto.userAgent;

    await this.signatureRepo.save(signature);

    // Record event
    await this.recordEvent(
      signature.contractId,
      ContractEventType.DECLINED,
      userId,
      `${signature.role} declined to sign: ${dto.reason}`,
      dto.ipAddress,
      dto.userAgent,
    );

    this.logger.log(`Signature ${signatureId} declined by ${userId}`);

    return signature;
  }

  /**
   * Send signature reminder
   */
  async sendReminder(signatureId: string, sentBy?: string): Promise<ContractSignature> {
    const signature = await this.getSignature(signatureId);

    if (signature.status !== SignatureStatus.PENDING) {
      throw new BadRequestException('Can only send reminders for pending signatures');
    }

    signature.reminderSentAt = new Date();
    signature.reminderCount += 1;

    await this.signatureRepo.save(signature);

    // Record event
    await this.recordEvent(
      signature.contractId,
      ContractEventType.SIGNATURE_REMINDER_SENT,
      sentBy,
      `Reminder ${signature.reminderCount} sent to ${signature.role}`,
    );

    this.logger.log(`Reminder sent for signature ${signatureId}`);

    return signature;
  }

  /**
   * Revoke a signature
   */
  async revokeSignature(signatureId: string, reason: string, revokedBy?: string): Promise<ContractSignature> {
    const signature = await this.getSignature(signatureId);

    if (signature.status !== SignatureStatus.SIGNED) {
      throw new BadRequestException('Can only revoke signed signatures');
    }

    signature.status = SignatureStatus.REVOKED;
    signature.metadata = {
      ...signature.metadata,
      revokedAt: new Date(),
      revokedBy,
      revokeReason: reason,
    };

    await this.signatureRepo.save(signature);

    // Update contract status
    const contract = await this.contractRepo.findOne({
      where: { id: signature.contractId },
    });

    if (contract && contract.status === ContractStatus.FULLY_SIGNED) {
      contract.status = ContractStatus.PARTIALLY_SIGNED;
      await this.contractRepo.save(contract);
    }

    this.logger.log(`Signature ${signatureId} revoked: ${reason}`);

    return signature;
  }

  /**
   * Get signature by ID
   */
  async getSignature(signatureId: string): Promise<ContractSignature> {
    const signature = await this.signatureRepo.findOne({
      where: { id: signatureId },
    });

    if (!signature) {
      throw new NotFoundException(`Signature ${signatureId} not found`);
    }

    return signature;
  }

  /**
   * Get signatures for a contract
   */
  async getContractSignatures(contractId: string): Promise<ContractSignature[]> {
    return this.signatureRepo.find({
      where: { contractId },
      order: { role: 'ASC' },
    });
  }

  /**
   * Get pending signatures for a user
   */
  async getPendingSignaturesForUser(userId: string): Promise<ContractSignature[]> {
    // Note: This would need logic to match user to role (e.g., caregiver, patient)
    // For now, return signatures where userId is set
    return this.signatureRepo.find({
      where: { userId, status: SignatureStatus.PENDING },
    });
  }

  /**
   * Expire old pending signatures
   */
  async expireOldSignatures(): Promise<number> {
    const result = await this.signatureRepo.update(
      {
        status: SignatureStatus.PENDING,
        expiresAt: LessThan(new Date()),
      },
      { status: SignatureStatus.EXPIRED },
    );

    if (result.affected && result.affected > 0) {
      this.logger.log(`Expired ${result.affected} old signatures`);
    }

    return result.affected || 0;
  }

  /**
   * Generate signature hash for verification
   */
  generateSignatureHash(signature: ContractSignature): string {
    const data = {
      contractId: signature.contractId,
      role: signature.role,
      typedName: signature.typedName,
      signedAt: signature.signedAt?.toISOString(),
      ipAddress: signature.ipAddress,
    };

    return crypto
      .createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex');
  }

  /**
   * Update contract signing status based on signatures
   */
  private async updateContractSigningStatus(
    contract: Contract,
    signerRole: SignerRole,
  ): Promise<void> {
    // Update the specific signer flag
    if (signerRole === SignerRole.PATIENT) {
      contract.patientSigned = true;
      contract.patientSignedAt = new Date();
    } else if (signerRole === SignerRole.CAREGIVER) {
      contract.caregiverSigned = true;
      contract.caregiverSignedAt = new Date();
    }

    // Check if all required signatures are complete
    const signatures = await this.signatureRepo.find({
      where: { contractId: contract.id, isRequired: true },
    });

    const allSigned = signatures.every(s => s.status === SignatureStatus.SIGNED);

    if (allSigned) {
      contract.status = ContractStatus.FULLY_SIGNED;
      await this.recordEvent(
        contract.id,
        ContractEventType.FULLY_SIGNED,
        undefined,
        'All required signatures collected',
      );
    } else {
      contract.status = ContractStatus.PARTIALLY_SIGNED;
    }

    await this.contractRepo.save(contract);
  }

  /**
   * Get consent text for a role
   */
  private getConsentText(role: SignerRole): string {
    const consentTexts: Record<SignerRole, string> = {
      [SignerRole.PATIENT]: 'I consent to the terms of this care agreement and authorize the care services described herein.',
      [SignerRole.CAREGIVER]: 'I agree to provide care services as described in this agreement and comply with all applicable regulations.',
      [SignerRole.GUARDIAN]: 'As legal guardian, I consent to the care services described in this agreement on behalf of the patient.',
      [SignerRole.FAMILY_MEMBER]: 'I acknowledge the terms of this care agreement as a family member of the patient.',
      [SignerRole.WITNESS]: 'I witness that the parties have signed this agreement.',
      [SignerRole.AGENCY_REPRESENTATIVE]: 'I confirm this agreement on behalf of the care agency.',
      [SignerRole.NOTARY]: 'I certify that the signatures on this document are authentic.',
    };

    return consentTexts[role] || 'I agree to the terms of this agreement.';
  }

  /**
   * Record an event
   */
  private async recordEvent(
    contractId: string,
    eventType: ContractEventType,
    actorId?: string,
    description?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    const event = this.eventRepo.create({
      contractId,
      eventType,
      actorId,
      description,
      ipAddress,
      userAgent,
    });

    await this.eventRepo.save(event);
  }
}

