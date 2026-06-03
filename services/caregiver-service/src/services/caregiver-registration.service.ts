import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CaregiverRegistrationProgress, RegistrationStatus } from '../entities/caregiver-registration-progress.entity';
import { CaregiverRegistrationSession } from '../entities/caregiver-registration-session.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CaregiverRegistrationService {
  constructor(
    @InjectRepository(CaregiverRegistrationProgress)
    private readonly progressRepository: Repository<CaregiverRegistrationProgress>,
    @InjectRepository(CaregiverRegistrationSession)
    private readonly sessionRepository: Repository<CaregiverRegistrationSession>,
  ) {}

  // ===== REGISTRATION PROGRESS =====

  async initializeProgress(caregiverId: string, totalSteps: number = 10): Promise<CaregiverRegistrationProgress> {
    const existing = await this.progressRepository.findOne({ where: { caregiver_id: caregiverId } });
    if (existing) {
      return existing;
    }

    const progress = this.progressRepository.create({
      caregiver_id: caregiverId,
      current_step: '1',
      total_steps: totalSteps,
      status: RegistrationStatus.IN_PROGRESS,
      started_at: new Date(),
    });
    return this.progressRepository.save(progress);
  }

  async getProgress(caregiverId: string): Promise<CaregiverRegistrationProgress | null> {
    return this.progressRepository.findOne({ where: { caregiver_id: caregiverId } });
  }

  async updateProgress(
    caregiverId: string,
    currentStep: number,
    status?: string,
    metadata?: Record<string, any>,
  ): Promise<CaregiverRegistrationProgress> {
    const progress = await this.progressRepository.findOne({ where: { caregiver_id: caregiverId } });
    if (!progress) {
      throw new NotFoundException(`Registration progress for caregiver ${caregiverId} not found`);
    }

    progress.current_step = String(currentStep);
    if (status) {
      progress.status = status as RegistrationStatus;
    }
    if (metadata) {
      progress.metadata = { ...progress.metadata, ...metadata };
    }
    progress.updated_at = new Date();

    return this.progressRepository.save(progress);
  }

  async completeRegistration(caregiverId: string): Promise<CaregiverRegistrationProgress> {
    const progress = await this.progressRepository.findOne({ where: { caregiver_id: caregiverId } });
    if (!progress) {
      throw new NotFoundException(`Registration progress for caregiver ${caregiverId} not found`);
    }

    progress.current_step = String(progress.total_steps);
    progress.completed_steps = progress.total_steps;
    progress.completion_percentage = 100;
    progress.status = RegistrationStatus.PENDING_REVIEW;
    progress.submitted_at = new Date();
    progress.updated_at = new Date();

    return this.progressRepository.save(progress);
  }

  async getRegistrationStats(): Promise<{
    total: number;
    inProgress: number;
    completed: number;
    abandoned: number;
  }> {
    const all = await this.progressRepository.find();
    return {
      total: all.length,
      inProgress: all.filter(p => p.status === RegistrationStatus.IN_PROGRESS).length,
      completed: all.filter(p =>
        p.status === RegistrationStatus.PENDING_REVIEW || p.status === RegistrationStatus.APPROVED,
      ).length,
      abandoned: all.filter(p =>
        p.status === RegistrationStatus.REJECTED || p.status === RegistrationStatus.SUSPENDED,
      ).length,
    };
  }

  // ===== REGISTRATION SESSIONS =====

  async createSession(
    caregiverId: string,
    initialData: Record<string, any> = {},
    expirationHours: number = 24,
  ): Promise<CaregiverRegistrationSession> {
    // Expire any existing sessions
    await this.sessionRepository.update(
      { caregiver_id: caregiverId },
      { expires_at: new Date(), is_active: false },
    );

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expirationHours);

    const session = this.sessionRepository.create({
      caregiver_id: caregiverId,
      session_token: uuidv4(),
      current_step: '1',
      metadata: { data: initialData },
      expires_at: expiresAt,
    });
    return this.sessionRepository.save(session);
  }

  async getSession(sessionId: string): Promise<CaregiverRegistrationSession | null> {
    const session = await this.sessionRepository.findOne({ where: { session_token: sessionId } });
    if (session && session.expires_at < new Date()) {
      return null; // Session expired
    }
    return session;
  }

  async getActiveSession(caregiverId: string): Promise<CaregiverRegistrationSession | null> {
    return this.sessionRepository
      .createQueryBuilder('session')
      .where('session.caregiver_id = :caregiverId', { caregiverId })
      .andWhere('session.expires_at > :now', { now: new Date() })
      .orderBy('session.created_at', 'DESC')
      .getOne();
  }

  async updateSessionData(
    sessionId: string,
    step: number,
    data: Record<string, any>,
  ): Promise<CaregiverRegistrationSession> {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found or expired`);
    }

    session.current_step = String(step);
    const existingData = (session.metadata?.data as Record<string, any> | undefined) ?? {};
    session.metadata = {
      ...session.metadata,
      data: { ...existingData, ...data },
    };

    return this.sessionRepository.save(session);
  }

  async extendSession(sessionId: string, additionalHours: number = 24): Promise<CaregiverRegistrationSession> {
    const session = await this.sessionRepository.findOne({ where: { session_token: sessionId } });
    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    const newExpiry = new Date(Math.max(session.expires_at.getTime(), Date.now()));
    newExpiry.setHours(newExpiry.getHours() + additionalHours);
    session.expires_at = newExpiry;

    return this.sessionRepository.save(session);
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.sessionRepository.delete({ session_token: sessionId });
  }

  async cleanupExpiredSessions(): Promise<number> {
    const result = await this.sessionRepository
      .createQueryBuilder()
      .delete()
      .where('expires_at < :now', { now: new Date() })
      .execute();
    return result.affected || 0;
  }
}
