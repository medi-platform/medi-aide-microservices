/**
 * Residence Service
 * Core business logic for managing residential facilities
 */

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Residence } from '../entities/residence.entity';
import { ResidenceStatus, ResidenceType } from '../interfaces/residential.interface';

export interface CreateResidenceDto {
  agency_id: string;
  name: string;
  type?: ResidenceType;
  street_address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  total_beds?: number;
  license_number?: string;
  license_expiry?: Date;
  services_offered?: string[];
  description?: string;
}

export interface UpdateResidenceDto extends Partial<CreateResidenceDto> {
  status?: ResidenceStatus;
  manager_user_id?: string;
  staffing_requirements?: Record<string, any>;
  operating_hours?: Record<string, any>;
}

@Injectable()
export class ResidenceService {
  constructor(
    @InjectRepository(Residence)
    private readonly residenceRepository: Repository<Residence>,
  ) {}

  async create(dto: CreateResidenceDto): Promise<Residence> {
    const residence = this.residenceRepository.create({
      ...dto,
      status: ResidenceStatus.ACTIVE,
      type: dto.type || ResidenceType.GROUP_HOME,
      occupied_beds: 0,
      reserved_beds: 0,
    });
    return this.residenceRepository.save(residence);
  }

  async findById(id: string): Promise<Residence> {
    const residence = await this.residenceRepository.findOne({
      where: { id },
      relations: ['assignments', 'shifts'],
    });
    if (!residence) {
      throw new NotFoundException(`Residence with ID ${id} not found`);
    }
    return residence;
  }

  async update(id: string, dto: UpdateResidenceDto): Promise<Residence> {
    const residence = await this.findById(id);
    Object.assign(residence, dto);
    return this.residenceRepository.save(residence);
  }

  async listByAgency(agencyId: string, status?: ResidenceStatus): Promise<Residence[]> {
    const query: any = { agency_id: agencyId };
    if (status) {
      query.status = status;
    }
    return this.residenceRepository.find({
      where: query,
      order: { name: 'ASC' },
    });
  }

  async getCapacity(id: string): Promise<{
    totalBeds: number;
    occupiedBeds: number;
    reservedBeds: number;
    availableBeds: number;
    occupancyRate: number;
  }> {
    const residence = await this.findById(id);
    const availableBeds = residence.total_beds - residence.occupied_beds - residence.reserved_beds;
    const occupancyRate = residence.total_beds > 0
      ? (residence.occupied_beds / residence.total_beds) * 100
      : 0;

    return {
      totalBeds: residence.total_beds,
      occupiedBeds: residence.occupied_beds,
      reservedBeds: residence.reserved_beds,
      availableBeds: Math.max(0, availableBeds),
      occupancyRate: Math.round(occupancyRate * 100) / 100,
    };
  }

  async updateCapacity(id: string, occupiedBeds: number, reservedBeds: number): Promise<Residence> {
    const residence = await this.findById(id);
    
    if (occupiedBeds + reservedBeds > residence.total_beds) {
      throw new BadRequestException('Total occupied and reserved beds cannot exceed total beds');
    }
    
    residence.occupied_beds = occupiedBeds;
    residence.reserved_beds = reservedBeds;
    return this.residenceRepository.save(residence);
  }

  async deactivate(id: string): Promise<Residence> {
    return this.update(id, { status: ResidenceStatus.INACTIVE });
  }

  async reactivate(id: string): Promise<Residence> {
    return this.update(id, { status: ResidenceStatus.ACTIVE });
  }

  async search(
    agencyId: string,
    query: string,
    filters?: {
      type?: ResidenceType;
      province?: string;
      hasAvailability?: boolean;
    },
  ): Promise<Residence[]> {
    const qb = this.residenceRepository.createQueryBuilder('r');
    qb.where('r.agency_id = :agencyId', { agencyId });
    qb.andWhere('r.status = :status', { status: ResidenceStatus.ACTIVE });

    if (query) {
      qb.andWhere('(LOWER(r.name) LIKE LOWER(:query) OR LOWER(r.city) LIKE LOWER(:query))', {
        query: `%${query}%`,
      });
    }

    if (filters?.type) {
      qb.andWhere('r.type = :type', { type: filters.type });
    }

    if (filters?.province) {
      qb.andWhere('r.province = :province', { province: filters.province });
    }

    if (filters?.hasAvailability) {
      qb.andWhere('r.total_beds > (r.occupied_beds + r.reserved_beds)');
    }

    return qb.orderBy('r.name', 'ASC').getMany();
  }
}
