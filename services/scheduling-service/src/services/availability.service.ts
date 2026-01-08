import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Not, LessThanOrEqual, MoreThanOrEqual, In } from 'typeorm';
import { AvailabilitySlot, SlotStatus, SlotType } from '../entities/availability-slot.entity';
import { SchedulingEventPublisher } from './scheduling-event-publisher.service';
import { addDays, startOfDay, endOfDay, differenceInMinutes } from 'date-fns';

interface CreateAvailabilityDto {
  caregiverId: string;
  startTime: Date;
  endTime: Date;
  slotType?: SlotType;
  isRecurring?: boolean;
  recurringPatternId?: string;
  preferredLocation?: AvailabilitySlot['preferredLocation'];
  maxTravelMinutes?: number;
  notes?: string;
}

interface UpdateAvailabilityDto {
  startTime?: Date;
  endTime?: Date;
  slotType?: SlotType;
  status?: SlotStatus;
  notes?: string;
}

interface AvailabilityQuery {
  caregiverId: string;
  startDate: Date;
  endDate: Date;
  status?: SlotStatus;
  slotType?: SlotType;
}

@Injectable()
export class AvailabilityService {
  private readonly logger = new Logger(AvailabilityService.name);

  constructor(
    @InjectRepository(AvailabilitySlot)
    private readonly slotRepo: Repository<AvailabilitySlot>,
    private readonly eventPublisher: SchedulingEventPublisher,
  ) {}

  /**
   * Create an availability slot
   */
  async createSlot(dto: CreateAvailabilityDto): Promise<AvailabilitySlot> {
    // Validate time range
    if (dto.endTime <= dto.startTime) {
      throw new BadRequestException('End time must be after start time');
    }

    // Check for overlapping slots
    const overlapping = await this.findOverlapping(
      dto.caregiverId,
      dto.startTime,
      dto.endTime,
    );

    if (overlapping.length > 0) {
      throw new ConflictException('Overlapping availability slot exists');
    }

    const slot = this.slotRepo.create({
      ...dto,
      status: SlotStatus.AVAILABLE,
      slotType: dto.slotType || SlotType.WORK,
    });

    await this.slotRepo.save(slot);

    await this.eventPublisher.publishAvailabilityCreated(slot);

    this.logger.log(`Availability slot created: ${slot.id}`);

    return slot;
  }

  /**
   * Get availability slots for a caregiver
   */
  async getCaregiverAvailability(
    query: AvailabilityQuery,
  ): Promise<AvailabilitySlot[]> {
    const where: any = {
      caregiverId: query.caregiverId,
      startTime: MoreThanOrEqual(query.startDate),
      endTime: LessThanOrEqual(query.endDate),
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.slotType) {
      where.slotType = query.slotType;
    }

    return this.slotRepo.find({
      where,
      order: { startTime: 'ASC' },
    });
  }

  /**
   * Find available slots for a time range
   */
  async findAvailableSlots(
    caregiverId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<AvailabilitySlot[]> {
    return this.slotRepo.find({
      where: {
        caregiverId,
        status: SlotStatus.AVAILABLE,
        startTime: MoreThanOrEqual(startDate),
        endTime: LessThanOrEqual(endDate),
      },
      order: { startTime: 'ASC' },
    });
  }

  /**
   * Reserve a slot for a visit
   */
  async reserveSlot(
    caregiverId: string,
    visitId: string,
    startTime: Date,
    endTime: Date,
  ): Promise<AvailabilitySlot> {
    // Check for existing reservation
    const existing = await this.slotRepo.findOne({
      where: { visitId },
    });

    if (existing) {
      // Update existing reservation
      existing.startTime = startTime;
      existing.endTime = endTime;
      await this.slotRepo.save(existing);
      return existing;
    }

    // Check for overlapping reserved slots
    const overlapping = await this.slotRepo.count({
      where: {
        caregiverId,
        visitId: Not(visitId),
        status: SlotStatus.RESERVED,
        startTime: LessThanOrEqual(endTime),
        endTime: MoreThanOrEqual(startTime),
      },
    });

    if (overlapping > 0) {
      throw new ConflictException('Timeslot already reserved');
    }

    // Create new reservation
    const slot = this.slotRepo.create({
      caregiverId,
      visitId,
      startTime,
      endTime,
      status: SlotStatus.RESERVED,
      slotType: SlotType.WORK,
    });

    await this.slotRepo.save(slot);

    await this.eventPublisher.publishSlotReserved({
      slotId: slot.id,
      caregiverId,
      visitId,
      startTime,
      endTime,
    });

    this.logger.log(`Slot reserved for visit ${visitId}`);

    return slot;
  }

  /**
   * Release a reserved slot
   */
  async releaseSlot(visitId: string): Promise<void> {
    const slot = await this.slotRepo.findOne({
      where: { visitId },
    });

    if (!slot) {
      return;
    }

    await this.slotRepo.remove(slot);

    await this.eventPublisher.publishSlotReleased({
      slotId: slot.id,
      caregiverId: slot.caregiverId,
      visitId,
    });

    this.logger.log(`Slot released for visit ${visitId}`);
  }

  /**
   * Block a time slot
   */
  async blockSlot(
    caregiverId: string,
    startTime: Date,
    endTime: Date,
    reason?: string,
  ): Promise<AvailabilitySlot> {
    const slot = this.slotRepo.create({
      caregiverId,
      startTime,
      endTime,
      status: SlotStatus.BLOCKED,
      slotType: SlotType.PERSONAL,
      notes: reason,
    });

    await this.slotRepo.save(slot);

    this.logger.log(`Slot blocked for caregiver ${caregiverId}`);

    return slot;
  }

  /**
   * Update a slot
   */
  async updateSlot(
    slotId: string,
    dto: UpdateAvailabilityDto,
  ): Promise<AvailabilitySlot> {
    const slot = await this.slotRepo.findOne({ where: { id: slotId } });
    if (!slot) {
      throw new NotFoundException(`Slot ${slotId} not found`);
    }

    // Check for overlapping if times are being changed
    if (dto.startTime || dto.endTime) {
      const newStart = dto.startTime || slot.startTime;
      const newEnd = dto.endTime || slot.endTime;

      const overlapping = await this.findOverlapping(
        slot.caregiverId,
        newStart,
        newEnd,
        slot.id,
      );

      if (overlapping.length > 0) {
        throw new ConflictException('Update would create overlapping slot');
      }
    }

    Object.assign(slot, dto);
    await this.slotRepo.save(slot);

    return slot;
  }

  /**
   * Delete a slot
   */
  async deleteSlot(slotId: string): Promise<void> {
    const slot = await this.slotRepo.findOne({ where: { id: slotId } });
    if (!slot) {
      throw new NotFoundException(`Slot ${slotId} not found`);
    }

    if (slot.status === SlotStatus.RESERVED && slot.visitId) {
      throw new BadRequestException('Cannot delete a reserved slot');
    }

    await this.slotRepo.remove(slot);

    this.logger.log(`Slot deleted: ${slotId}`);
  }

  /**
   * Get available hours for a date range
   */
  async getAvailableHours(
    caregiverId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const slots = await this.findAvailableSlots(caregiverId, startDate, endDate);

    return slots.reduce((total, slot) => {
      return total + differenceInMinutes(slot.endTime, slot.startTime) / 60;
    }, 0);
  }

  /**
   * Find overlapping slots
   */
  private async findOverlapping(
    caregiverId: string,
    startTime: Date,
    endTime: Date,
    excludeId?: string,
  ): Promise<AvailabilitySlot[]> {
    const where: any = {
      caregiverId,
      startTime: LessThanOrEqual(endTime),
      endTime: MoreThanOrEqual(startTime),
    };

    if (excludeId) {
      where.id = Not(excludeId);
    }

    return this.slotRepo.find({ where });
  }
}

