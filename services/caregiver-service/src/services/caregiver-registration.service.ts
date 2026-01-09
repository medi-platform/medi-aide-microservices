import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CaregiverRegistrationProgress } from '../entities/caregiver-registration-progress.entity';
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
    const existing = await this.progressRepository.findOne({ where: { caregiverId } });
    if (existing) {
      return existing;
    }
    
    const progress = this.progressRepository.create({
      caregiverId,
      currentStep: 1,
      totalSteps,
      status: 'in_progress',
      lastUpdated: new Date(),
    });
    return this.progressRepository.save(progress);
  }

  async getProgress(caregiverId: string): Promise<CaregiverRegistrationProgress | null> {
    return this.progressRepository.findOne({ where: { caregiverId } });
  }

  async updateProgress(
    caregiverId: string,
    currentStep: number,
    status?: string,
    metadata?: Record<string, any>,
  ): Promise<CaregiverRegistrationProgress> {
    const progress = await this.progressRepository.findOne({ where: { caregiverId } });
    if (!progress) {
      throw new NotFoundException(`Registration progress for caregiver ${caregiverId} not found`);
    }
    
    progress.currentStep = currentStep;
    if (status) {
      progress.status = status;
    }
    if (metadata) {
      progress.metadata = { ...progress.metadata, ...metadata };
    }
    progress.lastUpdated = new Date();
    
    return this.progressRepository.save(progress);
  }

  async completeRegistration(caregiverId: string): Promise<CaregiverRegistrationProgress> {
    const progress = await this.progressRepository.findOne({ where: { caregiverId } });
    if (!progress) {
      throw new NotFoundException(`Registration progress for caregiver ${caregiverId} not found`);
    }
    
    progress.currentStep = progress.totalSteps;
    progress.status = 'completed';
    progress.lastUpdated = new Date();
    
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
      inProgress: all.filter(p => p.status === 'in_progress').length,
      completed: all.filter(p => p.status === 'completed').length,
      abandoned: all.filter(p => p.status === 'abandoned').length,
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
      { caregiverId },
      { expiresAt: new Date() },
    );
    
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expirationHours);
    
    const session = this.sessionRepository.create({
      caregiverId,
      sessionId: uuidv4(),
      currentStep: 1,
      data: initialData,
      expiresAt,
    });
    return this.sessionRepository.save(session);
  }

  async getSession(sessionId: string): Promise<CaregiverRegistrationSession | null> {
    const session = await this.sessionRepository.findOne({ where: { sessionId } });
    if (session && session.expiresAt < new Date()) {
      return null; // Session expired
    }
    return session;
  }

  async getActiveSession(caregiverId: string): Promise<CaregiverRegistrationSession | null> {
    return this.sessionRepository
      .createQueryBuilder('session')
      .where('session.caregiverId = :caregiverId', { caregiverId })
      .andWhere('session.expiresAt > :now', { now: new Date() })
      .orderBy('session.createdAt', 'DESC')
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
    
    session.currentStep = step;
    session.data = { ...session.data, ...data };
    
    return this.sessionRepository.save(session);
  }

  async extendSession(sessionId: string, additionalHours: number = 24): Promise<CaregiverRegistrationSession> {
    const session = await this.sessionRepository.findOne({ where: { sessionId } });
    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }
    
    const newExpiry = new Date(Math.max(session.expiresAt.getTime(), Date.now()));
    newExpiry.setHours(newExpiry.getHours() + additionalHours);
    session.expiresAt = newExpiry;
    
    return this.sessionRepository.save(session);
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.sessionRepository.delete({ sessionId });
  }

  async cleanupExpiredSessions(): Promise<number> {
    const result = await this.sessionRepository
      .createQueryBuilder()
      .delete()
      .where('expiresAt < :now', { now: new Date() })
      .execute();
    return result.affected || 0;
  }
}
