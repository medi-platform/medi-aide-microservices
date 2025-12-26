import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CaregiverDocument } from '../entities/caregiver-document.entity';

@Injectable()
export class DocumentService {
  constructor(
    @InjectRepository(CaregiverDocument)
    private docRepo: Repository<CaregiverDocument>,
  ) {}

  async getDocuments(caregiverId: string, type?: string, status?: string) {
    const where: any = { caregiver_id: caregiverId };
    if (type) where.document_type = type;
    if (status) where.status = status;
    return this.docRepo.find({ where, order: { created_at: 'DESC' } });
  }

  async uploadDocument(caregiverId: string, dto: any) {
    const doc = this.docRepo.create({ 
      ...dto, 
      caregiver_id: caregiverId,
      status: 'pending_verification'
    });
    return this.docRepo.save(doc);
  }

  async getDocument(caregiverId: string, docId: string) {
    const doc = await this.docRepo.findOne({
      where: { id: docId, caregiver_id: caregiverId },
    });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  async deleteDocument(caregiverId: string, docId: string) {
    await this.docRepo.delete(docId);
    return { deleted: true };
  }

  async verifyDocument(caregiverId: string, docId: string, dto: { verified: boolean; notes?: string }) {
    await this.docRepo.update(docId, {
      status: dto.verified ? 'verified' : 'rejected',
      verified_at: new Date(),
      verification_notes: dto.notes,
    });
    return this.getDocument(caregiverId, docId);
  }

  async getRequiredDocuments(caregiverId: string) {
    return {
      caregiverId,
      documents: [
        { type: 'government_id', required: true, status: 'verified' },
        { type: 'police_check', required: true, status: 'verified' },
        { type: 'first_aid_certificate', required: true, status: 'pending' },
        { type: 'professional_certificate', required: true, status: 'verified' },
      ],
      compliant: false,
      missingCount: 1,
    };
  }

  async getExpiring(caregiverId: string, days: number) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    const docs = await this.docRepo.find({
      where: { caregiver_id: caregiverId },
    });
    
    return docs.filter(d => d.expiry_date && new Date(d.expiry_date) <= futureDate);
  }
}

