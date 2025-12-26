import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike } from 'typeorm';
import { AgencyProfile } from '../entities/agency-profile.entity';
import { AgencyServicePackage } from '../entities/agency-service-package.entity';
import { AgencyPreferences } from '../entities/agency-preferences.entity';
import { AgencyBranding } from '../entities/agency-branding.entity';

@Injectable()
export class AgencyService {
  constructor(
    @InjectRepository(AgencyProfile)
    private agencyRepo: Repository<AgencyProfile>,
    @InjectRepository(AgencyServicePackage)
    private packageRepo: Repository<AgencyServicePackage>,
    @InjectRepository(AgencyPreferences)
    private prefsRepo: Repository<AgencyPreferences>,
    @InjectRepository(AgencyBranding)
    private brandingRepo: Repository<AgencyBranding>,
  ) {}

  async create(dto: any) {
    const agency = this.agencyRepo.create(dto);
    return this.agencyRepo.save(agency);
  }

  async findAll(query: any) {
    const { status, province, search, page = 1, limit = 20 } = query;
    const where: any = {};

    if (status) where.onboarding_status = status;
    if (province) where.business_province = province;
    if (search) where.business_name = ILike(`%${search}%`);

    const [items, total] = await this.agencyRepo.findAndCount({
      where,
      take: limit,
      skip: (page - 1) * limit,
      order: { created_at: 'DESC' },
    });

    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async findById(id: string) {
    const agency = await this.agencyRepo.findOne({ where: { id } });
    if (!agency) throw new NotFoundException('Agency not found');
    return agency;
  }

  async update(id: string, dto: any) {
    await this.findById(id);
    await this.agencyRepo.update(id, dto);
    return this.findById(id);
  }

  async updateStatus(id: string, status: string) {
    await this.agencyRepo.update(id, { onboarding_status: status as any });
    return this.findById(id);
  }

  async approve(id: string) {
    await this.agencyRepo.update(id, { 
      is_approved: true, 
      is_active: true,
      activated_at: new Date() 
    });
    return this.findById(id);
  }

  async suspend(id: string, reason: string) {
    await this.agencyRepo.update(id, { is_active: false });
    return { id, status: 'suspended', reason };
  }

  async remove(id: string) {
    await this.agencyRepo.update(id, { is_active: false });
    return { id, status: 'deleted' };
  }

  async getSummary(id: string) {
    const agency = await this.findById(id);
    return {
      agency,
      metrics: {
        totalCaregivers: agency.total_caregivers || 0,
        activeCaregivers: agency.active_caregivers || 0,
        totalPatientsServed: agency.total_patients_served || 0,
        utilizationRate: agency.total_caregivers > 0 
          ? (agency.active_caregivers / agency.total_caregivers) * 100 
          : 0,
      },
    };
  }

  async getServicePackages(id: string) {
    return this.packageRepo.find({ where: { agency_id: id } });
  }

  async createServicePackage(id: string, dto: any) {
    const pkg = this.packageRepo.create({ ...dto, agency_id: id });
    return this.packageRepo.save(pkg);
  }

  async getPreferences(id: string) {
    return this.prefsRepo.findOne({ where: { agency_id: id } });
  }

  async updatePreferences(id: string, dto: any) {
    const prefs = await this.prefsRepo.findOne({ where: { agency_id: id } });
    if (prefs) {
      await this.prefsRepo.update(prefs.id, dto);
    } else {
      const newPrefs = this.prefsRepo.create({ ...dto, agency_id: id });
      await this.prefsRepo.save(newPrefs);
    }
    return this.getPreferences(id);
  }

  async getBranding(id: string) {
    return this.brandingRepo.findOne({ where: { agency_id: id } });
  }

  async updateBranding(id: string, dto: any) {
    const branding = await this.brandingRepo.findOne({ where: { agency_id: id } });
    if (branding) {
      await this.brandingRepo.update(branding.id, dto);
    } else {
      const newBranding = this.brandingRepo.create({ ...dto, agency_id: id });
      await this.brandingRepo.save(newBranding);
    }
    return this.getBranding(id);
  }
}


