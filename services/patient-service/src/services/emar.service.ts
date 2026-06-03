import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Medication, MedicationStatus } from '../entities/medication.entity';
import { MedicationSchedule, ScheduleStatus } from '../entities/medication-schedule.entity';
import {
  MedicationAdministration,
  AdministrationStatus,
  NotGivenReason,
} from '../entities/medication-administration.entity';

@Injectable()
export class EmarService {
  constructor(
    @InjectRepository(Medication)
    private readonly medicationRepository: Repository<Medication>,
    @InjectRepository(MedicationSchedule)
    private readonly scheduleRepository: Repository<MedicationSchedule>,
    @InjectRepository(MedicationAdministration)
    private readonly administrationRepository: Repository<MedicationAdministration>,
  ) {}

  // ===== MEDICATIONS =====

  async createMedication(data: Partial<Medication>): Promise<Medication> {
    const medication = this.medicationRepository.create(data);
    return this.medicationRepository.save(medication);
  }

  async getMedication(id: string): Promise<Medication> {
    const medication = await this.medicationRepository.findOne({ where: { id } });
    if (!medication) {
      throw new NotFoundException(`Medication ${id} not found`);
    }
    return medication;
  }

  async updateMedication(id: string, data: Partial<Medication>): Promise<Medication> {
    const medication = await this.getMedication(id);
    Object.assign(medication, data);
    return this.medicationRepository.save(medication);
  }

  async discontinueMedication(id: string, reason: string): Promise<Medication> {
    const medication = await this.getMedication(id);
    medication.status = MedicationStatus.DISCONTINUED;
    medication.discontinuedDate = new Date();
    medication.discontinueReason = reason;
    return this.medicationRepository.save(medication);
  }

  async listPatientMedications(
    patientId: string,
    status?: MedicationStatus,
  ): Promise<Medication[]> {
    const where: any = { patientId };
    if (status) {
      where.status = status;
    }
    return this.medicationRepository.find({
      where,
      order: { medicationName: 'ASC' },
    });
  }

  async getActiveMedications(patientId: string): Promise<Medication[]> {
    return this.medicationRepository.find({
      where: { patientId, status: MedicationStatus.ACTIVE },
      order: { medicationName: 'ASC' },
    });
  }

  // ===== MEDICATION SCHEDULES =====

  async generateSchedule(
    medicationId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<MedicationSchedule[]> {
    const medication = await this.getMedication(medicationId);
    const schedules: MedicationSchedule[] = [];

    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      for (const time of medication.scheduledTimes) {
        const [hours, minutes] = time.split(':').map(Number);
        const scheduledTime = new Date(currentDate);
        scheduledTime.setHours(hours, minutes, 0, 0);

        const schedule = this.scheduleRepository.create({
          patientId: medication.patientId,
          medicationId: medication.id,
          scheduledDate: new Date(currentDate),
          scheduledTime,
          scheduledTimeOfDay: time,
          dose: medication.dose,
          route: medication.route,
          isPrn: medication.isPrn,
          requiresWitness: medication.requiresWitness,
          instructions: medication.instructions,
        });
        schedules.push(schedule);
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return this.scheduleRepository.save(schedules);
  }

  async getSchedule(id: string): Promise<MedicationSchedule> {
    const schedule = await this.scheduleRepository.findOne({ where: { id } });
    if (!schedule) {
      throw new NotFoundException(`Schedule ${id} not found`);
    }
    return schedule;
  }

  async getMedicationScheduleForDate(
    patientId: string,
    date: Date,
  ): Promise<MedicationSchedule[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.scheduleRepository.find({
      where: {
        patientId,
        scheduledTime: Between(startOfDay, endOfDay),
        status: ScheduleStatus.ACTIVE,
      },
      order: { scheduledTime: 'ASC' },
      relations: ['medication'],
    });
  }

  async getUpcomingSchedules(
    patientId: string,
    hoursAhead: number = 2,
  ): Promise<MedicationSchedule[]> {
    const now = new Date();
    const futureTime = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

    return this.scheduleRepository.find({
      where: {
        patientId,
        scheduledTime: Between(now, futureTime),
        isAdministered: false,
        status: ScheduleStatus.ACTIVE,
      },
      order: { scheduledTime: 'ASC' },
      relations: ['medication'],
    });
  }

  async getOverdueSchedules(patientId: string): Promise<MedicationSchedule[]> {
    const now = new Date();

    return this.scheduleRepository.find({
      where: {
        patientId,
        scheduledTime: LessThanOrEqual(now),
        isAdministered: false,
        status: ScheduleStatus.ACTIVE,
      },
      order: { scheduledTime: 'ASC' },
      relations: ['medication'],
    });
  }

  // ===== MEDICATION ADMINISTRATION =====

  async recordAdministration(
    scheduleId: string,
    data: {
      administeredById: string;
      administeredByName: string;
      status: AdministrationStatus;
      doseGiven?: string;
      routeUsed?: string;
      site?: string;
      witnessId?: string;
      witnessName?: string;
      notGivenReason?: NotGivenReason;
      notGivenDetails?: string;
      notes?: string;
      vitalsBefore?: any;
      vitalsAfter?: any;
      prnIndication?: string;
    },
  ): Promise<MedicationAdministration> {
    const schedule = await this.getSchedule(scheduleId);

    const now = new Date();
    const scheduledTime = new Date(schedule.scheduledTime);
    const diffMinutes = Math.round((now.getTime() - scheduledTime.getTime()) / 60000);

    const administrationData: DeepPartial<MedicationAdministration> = {
      patientId: schedule.patientId,
      medicationId: schedule.medicationId,
      scheduledTime: schedule.scheduledTime,
      administeredAt: data.status === AdministrationStatus.GIVEN ? now : undefined,
      status: data.status,
      doseGiven: data.doseGiven || schedule.dose,
      routeUsed: data.routeUsed || schedule.route,
      site: data.site,
      administeredById: data.administeredById,
      administeredByName: data.administeredByName,
      witnessId: data.witnessId,
      witnessName: data.witnessName,
      notGivenReason: data.notGivenReason,
      notGivenDetails: data.notGivenDetails,
      notes: data.notes,
      isLate: diffMinutes > schedule.windowAfterMinutes,
      minutesLate: diffMinutes > schedule.windowAfterMinutes ? diffMinutes - schedule.windowAfterMinutes : undefined,
      isEarly: diffMinutes < -schedule.windowBeforeMinutes,
      minutesEarly: diffMinutes < -schedule.windowBeforeMinutes ? Math.abs(diffMinutes) - schedule.windowBeforeMinutes : undefined,
      vitalsBefore: data.vitalsBefore,
      vitalsAfter: data.vitalsAfter,
      prnIndication: data.prnIndication,
    };
    const administration = this.administrationRepository.create(administrationData);

    const savedAdmin = await this.administrationRepository.save(administration);

    // Update schedule
    schedule.isAdministered = true;
    schedule.administrationId = savedAdmin.id;
    await this.scheduleRepository.save(schedule);

    return savedAdmin;
  }

  async getAdministration(id: string): Promise<MedicationAdministration> {
    const administration = await this.administrationRepository.findOne({
      where: { id },
      relations: ['medication'],
    });
    if (!administration) {
      throw new NotFoundException(`Administration record ${id} not found`);
    }
    return administration;
  }

  async getAdministrationHistory(
    patientId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<MedicationAdministration[]> {
    const where: any = { patientId };
    if (startDate && endDate) {
      where.scheduledTime = Between(startDate, endDate);
    }
    return this.administrationRepository.find({
      where,
      order: { scheduledTime: 'DESC' },
      relations: ['medication'],
    });
  }

  async getMedicationAdministrationHistory(
    medicationId: string,
  ): Promise<MedicationAdministration[]> {
    return this.administrationRepository.find({
      where: { medicationId },
      order: { scheduledTime: 'DESC' },
    });
  }

  async recordPrnEffectiveness(
    id: string,
    effectiveness: string,
    followupTime: Date,
  ): Promise<MedicationAdministration> {
    const administration = await this.getAdministration(id);
    administration.prnEffectiveness = effectiveness;
    administration.prnFollowupTime = followupTime;
    return this.administrationRepository.save(administration);
  }

  // ===== e-MAR DASHBOARD =====

  async getEmarDashboard(patientId: string, date: Date) {
    const [schedule, overdue, activeMeds] = await Promise.all([
      this.getMedicationScheduleForDate(patientId, date),
      this.getOverdueSchedules(patientId),
      this.getActiveMedications(patientId),
    ]);

    const administered = schedule.filter(s => s.isAdministered);
    const pending = schedule.filter(s => !s.isAdministered);

    return {
      date: date.toISOString().split('T')[0],
      patientId,
      summary: {
        totalScheduled: schedule.length,
        administered: administered.length,
        pending: pending.length,
        overdue: overdue.length,
        activeMedications: activeMeds.length,
      },
      schedule,
      overdue,
      activeMedications: activeMeds,
    };
  }
}
