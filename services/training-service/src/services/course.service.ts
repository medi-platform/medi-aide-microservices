import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  TrainingCourse,
  CourseCategory,
  CourseStatus,
  CourseLevel,
} from '../entities/training-course.entity';
import { TrainingModule, ModuleType } from '../entities/training-module.entity';
import { TrainingEnrollment, EnrollmentStatus } from '../entities/training-enrollment.entity';
import { TrainingCertificate, CertificateStatus } from '../entities/training-certificate.entity';
import { v4 as uuidv4 } from 'uuid';

interface CreateCourseDto {
  title: string;
  titleFr?: string;
  description?: string;
  category: CourseCategory;
  level?: CourseLevel;
  createdBy: string;
  agencyId?: string;
  isRequired?: boolean;
  requiredForRoles?: string[];
  estimatedDurationMinutes: number;
  passingScore?: number;
  validityMonths?: number;
  pointsOnCompletion?: number;
}

interface CreateModuleDto {
  courseId: string;
  title: string;
  titleFr?: string;
  description?: string;
  moduleType: ModuleType;
  order: number;
  contentData?: any;
  estimatedDurationMinutes?: number;
  passingScore?: number;
}

@Injectable()
export class CourseService {
  private readonly logger = new Logger(CourseService.name);

  constructor(
    @InjectRepository(TrainingCourse)
    private readonly courseRepo: Repository<TrainingCourse>,
    @InjectRepository(TrainingModule)
    private readonly moduleRepo: Repository<TrainingModule>,
    @InjectRepository(TrainingEnrollment)
    private readonly enrollmentRepo: Repository<TrainingEnrollment>,
    @InjectRepository(TrainingCertificate)
    private readonly certificateRepo: Repository<TrainingCertificate>,
  ) {}

  async createCourse(dto: CreateCourseDto): Promise<TrainingCourse> {
    const course = this.courseRepo.create({
      ...dto,
      status: CourseStatus.DRAFT,
      level: dto.level || CourseLevel.BEGINNER,
      passingScore: dto.passingScore || 80,
    });
    return this.courseRepo.save(course);
  }

  async getCourse(id: string): Promise<TrainingCourse> {
    const course = await this.courseRepo.findOne({ where: { id } });
    if (!course) throw new NotFoundException(`Course ${id} not found`);
    return course;
  }

  async listCourses(
    category?: CourseCategory,
    status?: CourseStatus,
    agencyId?: string,
  ): Promise<TrainingCourse[]> {
    const where: any = {};
    if (category) where.category = category;
    if (status) where.status = status;
    if (agencyId) where.agencyId = agencyId;
    return this.courseRepo.find({ where, order: { title: 'ASC' } });
  }

  async publishCourse(id: string): Promise<TrainingCourse> {
    const course = await this.getCourse(id);
    course.status = CourseStatus.PUBLISHED;
    return this.courseRepo.save(course);
  }

  async createModule(dto: CreateModuleDto): Promise<TrainingModule> {
    const module = this.moduleRepo.create(dto);
    return this.moduleRepo.save(module);
  }

  async getCourseModules(courseId: string): Promise<TrainingModule[]> {
    return this.moduleRepo.find({
      where: { courseId, isActive: true },
      order: { order: 'ASC' },
    });
  }

  async enrollUser(userId: string, courseId: string, enrolledBy?: string): Promise<TrainingEnrollment> {
    const course = await this.getCourse(courseId);

    const existing = await this.enrollmentRepo.findOne({
      where: { userId, courseId },
    });
    if (existing) return existing;

    const enrollment = this.enrollmentRepo.create({
      userId,
      courseId,
      enrolledBy,
      status: EnrollmentStatus.ENROLLED,
    });

    course.enrollmentCount++;
    await this.courseRepo.save(course);

    return this.enrollmentRepo.save(enrollment);
  }

  async getEnrollment(userId: string, courseId: string): Promise<TrainingEnrollment | null> {
    return this.enrollmentRepo.findOne({ where: { userId, courseId } });
  }

  async getUserEnrollments(userId: string): Promise<TrainingEnrollment[]> {
    return this.enrollmentRepo.find({
      where: { userId },
      order: { enrolledAt: 'DESC' },
    });
  }

  async updateProgress(
    enrollmentId: string,
    moduleId: string,
    progress: { status: string; score?: number; timeSpentMinutes?: number },
  ): Promise<TrainingEnrollment> {
    const enrollment = await this.enrollmentRepo.findOne({ where: { id: enrollmentId } });
    if (!enrollment) throw new NotFoundException('Enrollment not found');

    const moduleProgress = enrollment.moduleProgress || [];
    const existing = moduleProgress.find(mp => mp.moduleId === moduleId);
    if (existing) {
      Object.assign(existing, progress, { completedAt: progress.status === 'completed' ? new Date() : undefined });
    } else {
      moduleProgress.push({
        moduleId,
        status: progress.status as any,
        score: progress.score,
        timeSpentMinutes: progress.timeSpentMinutes,
        completedAt: progress.status === 'completed' ? new Date() : undefined,
      });
    }
    enrollment.moduleProgress = moduleProgress;

    // Calculate overall progress
    const modules = await this.getCourseModules(enrollment.courseId);
    const completedModules = moduleProgress.filter(mp => mp.status === 'completed').length;
    enrollment.progressPercentage = Math.round((completedModules / modules.length) * 100);
    enrollment.completedModuleIds = moduleProgress
      .filter(mp => mp.status === 'completed')
      .map(mp => mp.moduleId);

    if (enrollment.progressPercentage === 100) {
      enrollment.status = EnrollmentStatus.COMPLETED;
      enrollment.completedAt = new Date();
    } else if (enrollment.status === EnrollmentStatus.ENROLLED) {
      enrollment.status = EnrollmentStatus.IN_PROGRESS;
      enrollment.startedAt = enrollment.startedAt || new Date();
    }

    return this.enrollmentRepo.save(enrollment);
  }

  async issueCertificate(enrollmentId: string): Promise<TrainingCertificate> {
    const enrollment = await this.enrollmentRepo.findOne({ where: { id: enrollmentId } });
    if (!enrollment) throw new NotFoundException('Enrollment not found');

    const course = await this.getCourse(enrollment.courseId);

    const certificate = this.certificateRepo.create({
      certificateNumber: `CERT-${Date.now()}-${uuidv4().split('-')[0].toUpperCase()}`,
      userId: enrollment.userId,
      courseId: enrollment.courseId,
      enrollmentId: enrollment.id,
      courseTitle: course.title,
      courseCategory: course.category,
      score: enrollment.bestScore,
      passedOn: enrollment.completedAt || new Date(),
      expiresAt: course.validityMonths
        ? new Date(Date.now() + course.validityMonths * 30 * 24 * 60 * 60 * 1000)
        : undefined,
      verificationCode: uuidv4(),
      status: CertificateStatus.ACTIVE,
    });

    const saved = await this.certificateRepo.save(certificate);

    enrollment.certificateId = saved.id;
    enrollment.passed = true;
    await this.enrollmentRepo.save(enrollment);

    course.completionCount++;
    await this.courseRepo.save(course);

    return saved;
  }

  async getUserCertificates(userId: string): Promise<TrainingCertificate[]> {
    return this.certificateRepo.find({
      where: { userId },
      order: { issuedAt: 'DESC' },
    });
  }

  async verifyCertificate(verificationCode: string): Promise<TrainingCertificate | null> {
    return this.certificateRepo.findOne({ where: { verificationCode } });
  }
}
