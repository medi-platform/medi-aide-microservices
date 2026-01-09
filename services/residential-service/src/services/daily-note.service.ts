/**
 * Daily Note Service
 * Business logic for managing daily documentation
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ResidentialDailyNote, NoteCategory, NoteVisibility } from '../entities/residential-daily-note.entity';

export interface CreateDailyNoteDto {
  residence_id: string;
  resident_id: string;
  shift_id?: string;
  author_id: string;
  author_name?: string;
  note_date: Date;
  note_time: Date;
  category: NoteCategory;
  visibility?: NoteVisibility;
  content: string;
  tags?: string[];
  related_task_id?: string;
  related_incident_id?: string;
  requires_follow_up?: boolean;
  follow_up_notes?: string;
  follow_up_due?: Date;
}

export interface UpdateDailyNoteDto extends Partial<CreateDailyNoteDto> {
  follow_up_completed?: boolean;
}

@Injectable()
export class DailyNoteService {
  constructor(
    @InjectRepository(ResidentialDailyNote)
    private readonly noteRepository: Repository<ResidentialDailyNote>,
  ) {}

  async create(dto: CreateDailyNoteDto): Promise<ResidentialDailyNote> {
    const note = this.noteRepository.create({
      ...dto,
      visibility: dto.visibility || NoteVisibility.CARE_TEAM,
    });
    return this.noteRepository.save(note);
  }

  async findById(id: string): Promise<ResidentialDailyNote> {
    const note = await this.noteRepository.findOne({ where: { id } });
    if (!note) {
      throw new NotFoundException(`Daily note with ID ${id} not found`);
    }
    return note;
  }

  async update(id: string, dto: UpdateDailyNoteDto): Promise<ResidentialDailyNote> {
    const note = await this.findById(id);
    Object.assign(note, dto);
    return this.noteRepository.save(note);
  }

  async delete(id: string): Promise<void> {
    const result = await this.noteRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Daily note with ID ${id} not found`);
    }
  }

  async listByResident(
    residentId: string,
    startDate: Date,
    endDate: Date,
    category?: NoteCategory,
    visibility?: NoteVisibility,
  ): Promise<ResidentialDailyNote[]> {
    const qb = this.noteRepository.createQueryBuilder('n');
    qb.where('n.resident_id = :residentId', { residentId });
    qb.andWhere('n.note_date BETWEEN :startDate AND :endDate', { startDate, endDate });

    if (category) {
      qb.andWhere('n.category = :category', { category });
    }

    if (visibility) {
      qb.andWhere('n.visibility = :visibility', { visibility });
    }

    return qb.orderBy('n.note_date', 'DESC').addOrderBy('n.note_time', 'DESC').getMany();
  }

  async listByResidence(
    residenceId: string,
    date: Date,
    category?: NoteCategory,
  ): Promise<ResidentialDailyNote[]> {
    const qb = this.noteRepository.createQueryBuilder('n');
    qb.where('n.residence_id = :residenceId', { residenceId });
    qb.andWhere('n.note_date = :date', { date });

    if (category) {
      qb.andWhere('n.category = :category', { category });
    }

    return qb.orderBy('n.note_time', 'DESC').getMany();
  }

  async listByShift(shiftId: string): Promise<ResidentialDailyNote[]> {
    return this.noteRepository.find({
      where: { shift_id: shiftId },
      order: { note_time: 'ASC' },
    });
  }

  async listPendingFollowUps(residenceId: string): Promise<ResidentialDailyNote[]> {
    return this.noteRepository.find({
      where: {
        residence_id: residenceId,
        requires_follow_up: true,
        follow_up_completed: false,
      },
      order: { follow_up_due: 'ASC' },
    });
  }

  async markFollowUpComplete(id: string): Promise<ResidentialDailyNote> {
    const note = await this.findById(id);
    note.follow_up_completed = true;
    return this.noteRepository.save(note);
  }

  async acknowledgeNote(id: string, supervisorId: string): Promise<ResidentialDailyNote> {
    const note = await this.findById(id);
    note.acknowledged_by_supervisor = true;
    note.acknowledged_by = supervisorId;
    note.acknowledged_at = new Date();
    return this.noteRepository.save(note);
  }

  async addAttachment(
    id: string,
    fileId: string,
    fileName: string,
    fileType: string,
  ): Promise<ResidentialDailyNote> {
    const note = await this.findById(id);
    note.attachments.push({
      fileId,
      fileName,
      fileType,
      uploadedAt: new Date(),
    });
    return this.noteRepository.save(note);
  }

  async searchNotes(
    residenceId: string,
    query: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<ResidentialDailyNote[]> {
    const qb = this.noteRepository.createQueryBuilder('n');
    qb.where('n.residence_id = :residenceId', { residenceId });
    qb.andWhere('LOWER(n.content) LIKE LOWER(:query)', { query: `%${query}%` });

    if (startDate && endDate) {
      qb.andWhere('n.note_date BETWEEN :startDate AND :endDate', { startDate, endDate });
    }

    return qb.orderBy('n.note_date', 'DESC').addOrderBy('n.note_time', 'DESC').getMany();
  }

  async getFamilyVisibleNotes(residentId: string, limit: number = 20): Promise<ResidentialDailyNote[]> {
    return this.noteRepository.find({
      where: {
        resident_id: residentId,
        visibility: NoteVisibility.FAMILY_VISIBLE,
      },
      order: { note_date: 'DESC', note_time: 'DESC' },
      take: limit,
    });
  }
}
