/**
 * Resident Assignment Service
 * Business logic for managing resident placements
 */

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In } from 'typeorm';
import { ResidenceAssignment, AssignmentStatus } from '../entities/residence-assignment.entity';
import { Residence } from '../entities/residence.entity';

export interface CreateAssignmentDto {
  residence_id: string;
  resident_user_id: string;
  room_number?: string;
  bed_designation?: string;
  admission_date: Date;
  care_level?: string;
  special_needs?: string[];
  mobility_aids?: string[];
  emergency_contacts?: Array<{
    name: string;
    relationship: string;
    phone: string;
    email?: string;
    isPrimary: boolean;
  }>;
  guardian_account_id?: string;
  care_plan_id?: string;
  notes?: string;
}

export interface UpdateAssignmentDto extends Partial<CreateAssignmentDto> {
  status?: AssignmentStatus;
  dietary_preferences?: Record<string, any>;
  activity_preferences?: Record<string, any>;
  communication_preferences?: Record<string, any>;
}

export interface DischargeDto {
  discharge_date: Date;
  discharge_reason: string;
  discharge_destination?: string;
}

@Injectable()
export class ResidentAssignmentService {
  constructor(
    @InjectRepository(ResidenceAssignment)
    private readonly assignmentRepository: Repository<ResidenceAssignment>,
    @InjectRepository(Residence)
    private readonly residenceRepository: Repository<Residence>,
  ) {}

  async create(dto: CreateAssignmentDto): Promise<ResidenceAssignment> {
    // Check if resident already has an active assignment
    const existingActive = await this.assignmentRepository.findOne({
      where: {
        resident_user_id: dto.resident_user_id,
        status: In([AssignmentStatus.ACTIVE, AssignmentStatus.PENDING]),
      },
    });

    if (existingActive) {
      throw new BadRequestException('Resident already has an active placement');
    }

    // Check residence capacity
    const residence = await this.residenceRepository.findOne({
      where: { id: dto.residence_id },
    });

    if (!residence) {
      throw new NotFoundException(`Residence with ID ${dto.residence_id} not found`);
    }

    const availableBeds = residence.total_beds - residence.occupied_beds - residence.reserved_beds;
    if (availableBeds <= 0) {
      throw new BadRequestException('No available beds in this residence');
    }

    const assignment = this.assignmentRepository.create({
      ...dto,
      status: AssignmentStatus.PENDING,
    });

    const saved = await this.assignmentRepository.save(assignment);

    // Update residence reserved beds
    residence.reserved_beds += 1;
    await this.residenceRepository.save(residence);

    return saved;
  }

  async findById(id: string): Promise<ResidenceAssignment> {
    const assignment = await this.assignmentRepository.findOne({
      where: { id },
      relations: ['residence'],
    });
    if (!assignment) {
      throw new NotFoundException(`Assignment with ID ${id} not found`);
    }
    return assignment;
  }

  async update(id: string, dto: UpdateAssignmentDto): Promise<ResidenceAssignment> {
    const assignment = await this.findById(id);
    Object.assign(assignment, dto);
    return this.assignmentRepository.save(assignment);
  }

  async activate(id: string): Promise<ResidenceAssignment> {
    const assignment = await this.findById(id);
    
    if (assignment.status !== AssignmentStatus.PENDING) {
      throw new BadRequestException('Only pending assignments can be activated');
    }

    // Update residence occupancy
    const residence = await this.residenceRepository.findOne({
      where: { id: assignment.residence_id },
    });

    if (residence) {
      residence.reserved_beds = Math.max(0, residence.reserved_beds - 1);
      residence.occupied_beds += 1;
      await this.residenceRepository.save(residence);
    }

    assignment.status = AssignmentStatus.ACTIVE;
    return this.assignmentRepository.save(assignment);
  }

  async discharge(id: string, dto: DischargeDto): Promise<ResidenceAssignment> {
    const assignment = await this.findById(id);

    if (assignment.status === AssignmentStatus.DISCHARGED) {
      throw new BadRequestException('Resident is already discharged');
    }

    // Update residence occupancy
    const residence = await this.residenceRepository.findOne({
      where: { id: assignment.residence_id },
    });

    if (residence && assignment.status === AssignmentStatus.ACTIVE) {
      residence.occupied_beds = Math.max(0, residence.occupied_beds - 1);
      await this.residenceRepository.save(residence);
    } else if (residence && assignment.status === AssignmentStatus.PENDING) {
      residence.reserved_beds = Math.max(0, residence.reserved_beds - 1);
      await this.residenceRepository.save(residence);
    }

    assignment.status = AssignmentStatus.DISCHARGED;
    assignment.discharge_date = dto.discharge_date;
    assignment.discharge_reason = dto.discharge_reason;
    assignment.discharge_destination = dto.discharge_destination;

    return this.assignmentRepository.save(assignment);
  }

  async setOnLeave(id: string): Promise<ResidenceAssignment> {
    const assignment = await this.findById(id);
    if (assignment.status !== AssignmentStatus.ACTIVE) {
      throw new BadRequestException('Only active assignments can be set on leave');
    }
    assignment.status = AssignmentStatus.ON_LEAVE;
    return this.assignmentRepository.save(assignment);
  }

  async returnFromLeave(id: string): Promise<ResidenceAssignment> {
    const assignment = await this.findById(id);
    if (assignment.status !== AssignmentStatus.ON_LEAVE) {
      throw new BadRequestException('Assignment is not on leave');
    }
    assignment.status = AssignmentStatus.ACTIVE;
    return this.assignmentRepository.save(assignment);
  }

  async listByResidence(
    residenceId: string,
    status?: AssignmentStatus,
  ): Promise<ResidenceAssignment[]> {
    const query: any = { residence_id: residenceId };
    if (status) {
      query.status = status;
    }
    return this.assignmentRepository.find({
      where: query,
      order: { room_number: 'ASC' },
    });
  }

  async findByResident(residentUserId: string): Promise<ResidenceAssignment[]> {
    return this.assignmentRepository.find({
      where: { resident_user_id: residentUserId },
      relations: ['residence'],
      order: { admission_date: 'DESC' },
    });
  }

  async getActiveAssignment(residentUserId: string): Promise<ResidenceAssignment | null> {
    return this.assignmentRepository.findOne({
      where: {
        resident_user_id: residentUserId,
        status: AssignmentStatus.ACTIVE,
      },
      relations: ['residence'],
    });
  }
}
