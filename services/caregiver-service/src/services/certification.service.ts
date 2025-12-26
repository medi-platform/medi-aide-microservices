import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CaregiverCertification } from '../entities/caregiver-certification.entity';

@Injectable()
export class CertificationService {
  constructor(
    @InjectRepository(CaregiverCertification)
    private certRepo: Repository<CaregiverCertification>,
  ) {}

  async getCertifications(caregiverId: string, status?: string) {
    const where: any = { caregiver_id: caregiverId };
    if (status) where.status = status;
    return this.certRepo.find({ where, order: { expiry_date: 'ASC' } });
  }

  async addCertification(caregiverId: string, dto: any) {
    const cert = this.certRepo.create({ ...dto, caregiver_id: caregiverId });
    return this.certRepo.save(cert);
  }

  async getCertification(caregiverId: string, certId: string) {
    const cert = await this.certRepo.findOne({
      where: { id: certId, caregiver_id: caregiverId },
    });
    if (!cert) throw new NotFoundException('Certification not found');
    return cert;
  }

  async updateCertification(caregiverId: string, certId: string, dto: any) {
    await this.getCertification(caregiverId, certId);
    await this.certRepo.update(certId, dto);
    return this.getCertification(caregiverId, certId);
  }

  async removeCertification(caregiverId: string, certId: string) {
    await this.certRepo.delete(certId);
    return { deleted: true };
  }

  async verifyCertification(caregiverId: string, certId: string, dto: any) {
    await this.certRepo.update(certId, {
      verified: true,
      verified_at: new Date(),
      verified_by: dto.verified_by,
    });
    return this.getCertification(caregiverId, certId);
  }

  async getExpiring(caregiverId: string, days: number) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    const certs = await this.certRepo.find({
      where: { caregiver_id: caregiverId },
    });
    
    return certs.filter(c => c.expiry_date && new Date(c.expiry_date) <= futureDate);
  }

  async getRequiredStatus(caregiverId: string) {
    return {
      caregiverId,
      required: [
        { name: 'CPR/First Aid', status: 'valid', expiryDate: '2025-06-15' },
        { name: 'Police Check', status: 'valid', expiryDate: '2025-12-01' },
        { name: 'TB Test', status: 'expiring_soon', expiryDate: '2025-02-01' },
      ],
      compliant: true,
    };
  }
}

