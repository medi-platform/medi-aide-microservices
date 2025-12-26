import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AgencyStaff } from '../entities/agency-staff.entity';

@Injectable()
export class StaffService {
  constructor(
    @InjectRepository(AgencyStaff)
    private staffRepo: Repository<AgencyStaff>,
  ) {}

  async create(agencyId: string, dto: any) {
    const staff = this.staffRepo.create({ ...dto, agency_id: agencyId });
    return this.staffRepo.save(staff);
  }

  async findAll(agencyId: string, query: any) {
    const { role, status, page = 1, limit = 20 } = query;
    const where: any = { agency_id: agencyId };
    if (role) where.role = role;
    if (status) where.status = status;

    const [items, total] = await this.staffRepo.findAndCount({
      where,
      take: limit,
      skip: (page - 1) * limit,
      order: { created_at: 'DESC' },
    });

    return { items, total, page, limit };
  }

  async findById(agencyId: string, staffId: string) {
    const staff = await this.staffRepo.findOne({
      where: { id: staffId, agency_id: agencyId },
    });
    if (!staff) throw new NotFoundException('Staff member not found');
    return staff;
  }

  async update(agencyId: string, staffId: string, dto: any) {
    await this.findById(agencyId, staffId);
    await this.staffRepo.update(staffId, dto);
    return this.findById(agencyId, staffId);
  }

  async changeRole(agencyId: string, staffId: string, role: string) {
    await this.staffRepo.update(staffId, { role });
    return this.findById(agencyId, staffId);
  }

  async updatePermissions(agencyId: string, staffId: string, permissions: string[]) {
    await this.staffRepo.update(staffId, { permissions });
    return this.findById(agencyId, staffId);
  }

  async remove(agencyId: string, staffId: string) {
    await this.staffRepo.update(staffId, { status: 'inactive' });
    return { id: staffId, status: 'removed' };
  }

  async invite(agencyId: string, dto: { email: string; role: string; permissions?: string[] }) {
    // In production, send invite email
    const staff = this.staffRepo.create({
      agency_id: agencyId,
      email: dto.email,
      role: dto.role,
      permissions: dto.permissions || [],
      status: 'pending',
    });
    return this.staffRepo.save(staff);
  }
}


