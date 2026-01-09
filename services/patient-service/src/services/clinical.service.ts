import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { VitalSign } from '../entities/vital-sign.entity';
import { Allergy, AllergyStatus, AllergyType } from '../entities/allergy.entity';
import { Diagnosis, DiagnosisStatus } from '../entities/diagnosis.entity';
import { ClinicalNote, ClinicalNoteType, ClinicalNoteStatus } from '../entities/clinical-note.entity';
import { CarePlanGoal, CarePlanGoalStatus } from '../entities/care-plan-goal.entity';
import { ClinicalAssessment, ClinicalAssessmentType, ClinicalAssessmentStatus } from '../entities/clinical-assessment.entity';

@Injectable()
export class ClinicalService {
  constructor(
    @InjectRepository(VitalSign)
    private readonly vitalSignRepository: Repository<VitalSign>,
    @InjectRepository(Allergy)
    private readonly allergyRepository: Repository<Allergy>,
    @InjectRepository(Diagnosis)
    private readonly diagnosisRepository: Repository<Diagnosis>,
    @InjectRepository(ClinicalNote)
    private readonly clinicalNoteRepository: Repository<ClinicalNote>,
    @InjectRepository(CarePlanGoal)
    private readonly carePlanGoalRepository: Repository<CarePlanGoal>,
    @InjectRepository(ClinicalAssessment)
    private readonly clinicalAssessmentRepository: Repository<ClinicalAssessment>,
  ) {}

  // ===== VITAL SIGNS =====

  async recordVitalSigns(data: Partial<VitalSign>): Promise<VitalSign> {
    // Check for abnormal values
    const abnormalValues: string[] = [];
    if (data.bpSystolic && (data.bpSystolic < 90 || data.bpSystolic > 140)) {
      abnormalValues.push('Blood Pressure');
    }
    if (data.heartRate && (data.heartRate < 60 || data.heartRate > 100)) {
      abnormalValues.push('Heart Rate');
    }
    if (data.oxygenSaturation && data.oxygenSaturation < 95) {
      abnormalValues.push('Oxygen Saturation');
    }
    if (data.temperature && (data.temperature < 36 || data.temperature > 38)) {
      abnormalValues.push('Temperature');
    }
    if (data.respiratoryRate && (data.respiratoryRate < 12 || data.respiratoryRate > 20)) {
      abnormalValues.push('Respiratory Rate');
    }
    
    const vitalSign = this.vitalSignRepository.create({
      ...data,
      isAbnormal: abnormalValues.length > 0,
      abnormalValues,
    });
    return this.vitalSignRepository.save(vitalSign);
  }

  async getVitalSign(id: string): Promise<VitalSign> {
    const vitalSign = await this.vitalSignRepository.findOne({ where: { id } });
    if (!vitalSign) {
      throw new NotFoundException(`Vital sign record ${id} not found`);
    }
    return vitalSign;
  }

  async getVitalSignsHistory(
    patientId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<VitalSign[]> {
    const where: any = { patientId };
    if (startDate && endDate) {
      where.recordedAt = Between(startDate, endDate);
    }
    return this.vitalSignRepository.find({
      where,
      order: { recordedAt: 'DESC' },
    });
  }

  async getLatestVitals(patientId: string): Promise<VitalSign | null> {
    return this.vitalSignRepository.findOne({
      where: { patientId },
      order: { recordedAt: 'DESC' },
    });
  }

  // ===== ALLERGIES =====

  async addAllergy(data: Partial<Allergy>): Promise<Allergy> {
    const allergy = this.allergyRepository.create(data);
    return this.allergyRepository.save(allergy);
  }

  async getAllergy(id: string): Promise<Allergy> {
    const allergy = await this.allergyRepository.findOne({ where: { id } });
    if (!allergy) {
      throw new NotFoundException(`Allergy ${id} not found`);
    }
    return allergy;
  }

  async updateAllergy(id: string, data: Partial<Allergy>): Promise<Allergy> {
    const allergy = await this.getAllergy(id);
    Object.assign(allergy, data);
    return this.allergyRepository.save(allergy);
  }

  async resolveAllergy(id: string): Promise<Allergy> {
    const allergy = await this.getAllergy(id);
    allergy.status = AllergyStatus.RESOLVED;
    allergy.resolvedDate = new Date();
    return this.allergyRepository.save(allergy);
  }

  async listPatientAllergies(patientId: string): Promise<Allergy[]> {
    return this.allergyRepository.find({
      where: { patientId, status: AllergyStatus.ACTIVE },
      order: { severity: 'DESC' },
    });
  }

  async checkDrugAllergies(patientId: string, medicationName: string): Promise<Allergy[]> {
    return this.allergyRepository
      .createQueryBuilder('allergy')
      .where('allergy.patientId = :patientId', { patientId })
      .andWhere('allergy.allergyType = :type', { type: AllergyType.DRUG })
      .andWhere('allergy.status = :status', { status: AllergyStatus.ACTIVE })
      .andWhere('LOWER(allergy.allergen) LIKE LOWER(:medication)', {
        medication: `%${medicationName}%`,
      })
      .getMany();
  }

  // ===== DIAGNOSES =====

  async addDiagnosis(data: Partial<Diagnosis>): Promise<Diagnosis> {
    const diagnosis = this.diagnosisRepository.create(data);
    return this.diagnosisRepository.save(diagnosis);
  }

  async getDiagnosis(id: string): Promise<Diagnosis> {
    const diagnosis = await this.diagnosisRepository.findOne({ where: { id } });
    if (!diagnosis) {
      throw new NotFoundException(`Diagnosis ${id} not found`);
    }
    return diagnosis;
  }

  async updateDiagnosis(id: string, data: Partial<Diagnosis>): Promise<Diagnosis> {
    const diagnosis = await this.getDiagnosis(id);
    Object.assign(diagnosis, data);
    return this.diagnosisRepository.save(diagnosis);
  }

  async resolveDiagnosis(id: string): Promise<Diagnosis> {
    const diagnosis = await this.getDiagnosis(id);
    diagnosis.status = DiagnosisStatus.RESOLVED;
    diagnosis.resolvedDate = new Date();
    return this.diagnosisRepository.save(diagnosis);
  }

  async listPatientDiagnoses(
    patientId: string,
    status?: DiagnosisStatus,
  ): Promise<Diagnosis[]> {
    const where: any = { patientId };
    if (status) {
      where.status = status;
    }
    return this.diagnosisRepository.find({
      where,
      order: { ranking: 'ASC', diagnosisDate: 'DESC' },
    });
  }

  // ===== CLINICAL NOTES =====

  async createClinicalNote(data: Partial<ClinicalNote>): Promise<ClinicalNote> {
    const note = this.clinicalNoteRepository.create(data);
    return this.clinicalNoteRepository.save(note);
  }

  async getClinicalNote(id: string): Promise<ClinicalNote> {
    const note = await this.clinicalNoteRepository.findOne({ where: { id } });
    if (!note) {
      throw new NotFoundException(`Clinical note ${id} not found`);
    }
    return note;
  }

  async updateClinicalNote(id: string, data: Partial<ClinicalNote>): Promise<ClinicalNote> {
    const note = await this.getClinicalNote(id);
    Object.assign(note, data);
    return this.clinicalNoteRepository.save(note);
  }

  async signClinicalNote(id: string): Promise<ClinicalNote> {
    const note = await this.getClinicalNote(id);
    note.signedAt = new Date();
    note.status = ClinicalNoteStatus.FINAL;
    return this.clinicalNoteRepository.save(note);
  }

  async cosignClinicalNote(
    id: string,
    cosignerId: string,
    cosignerName: string,
  ): Promise<ClinicalNote> {
    const note = await this.getClinicalNote(id);
    note.cosignerId = cosignerId;
    note.cosignerName = cosignerName;
    note.cosignedAt = new Date();
    return this.clinicalNoteRepository.save(note);
  }

  async addAddendum(parentNoteId: string, data: Partial<ClinicalNote>): Promise<ClinicalNote> {
    const note = this.clinicalNoteRepository.create({
      ...data,
      parentNoteId,
      status: ClinicalNoteStatus.ADDENDUM,
    });
    return this.clinicalNoteRepository.save(note);
  }

  async listPatientNotes(
    patientId: string,
    noteType?: ClinicalNoteType,
  ): Promise<ClinicalNote[]> {
    const where: any = { patientId };
    if (noteType) {
      where.noteType = noteType;
    }
    return this.clinicalNoteRepository.find({
      where,
      order: { noteDate: 'DESC' },
    });
  }

  // ===== CARE PLAN GOALS =====

  async createCarePlanGoal(data: Partial<CarePlanGoal>): Promise<CarePlanGoal> {
    const goal = this.carePlanGoalRepository.create(data);
    return this.carePlanGoalRepository.save(goal);
  }

  async getCarePlanGoal(id: string): Promise<CarePlanGoal> {
    const goal = await this.carePlanGoalRepository.findOne({ where: { id } });
    if (!goal) {
      throw new NotFoundException(`Care plan goal ${id} not found`);
    }
    return goal;
  }

  async updateCarePlanGoal(id: string, data: Partial<CarePlanGoal>): Promise<CarePlanGoal> {
    const goal = await this.getCarePlanGoal(id);
    Object.assign(goal, data);
    return this.carePlanGoalRepository.save(goal);
  }

  async updateGoalProgress(
    id: string,
    progress: number,
    note: string,
    authorId: string,
    authorName: string,
  ): Promise<CarePlanGoal> {
    const goal = await this.getCarePlanGoal(id);
    goal.progressPercentage = progress;
    goal.lastEvaluated = new Date();
    goal.lastEvaluationNote = note;
    goal.progressNotes.push({
      date: new Date().toISOString(),
      note,
      authorId,
      authorName,
    });
    
    if (progress >= 100) {
      goal.status = CarePlanGoalStatus.ACHIEVED;
      goal.achievedDate = new Date();
    }
    
    return this.carePlanGoalRepository.save(goal);
  }

  async listPatientGoals(
    patientId: string,
    status?: CarePlanGoalStatus,
  ): Promise<CarePlanGoal[]> {
    const where: any = { patientId };
    if (status) {
      where.status = status;
    }
    return this.carePlanGoalRepository.find({
      where,
      order: { priority: 'ASC', targetDate: 'ASC' },
    });
  }

  // ===== CLINICAL ASSESSMENTS =====

  async createAssessment(data: Partial<ClinicalAssessment>): Promise<ClinicalAssessment> {
    const assessment = this.clinicalAssessmentRepository.create(data);
    return this.clinicalAssessmentRepository.save(assessment);
  }

  async getAssessment(id: string): Promise<ClinicalAssessment> {
    const assessment = await this.clinicalAssessmentRepository.findOne({ where: { id } });
    if (!assessment) {
      throw new NotFoundException(`Assessment ${id} not found`);
    }
    return assessment;
  }

  async updateAssessment(id: string, data: Partial<ClinicalAssessment>): Promise<ClinicalAssessment> {
    const assessment = await this.getAssessment(id);
    Object.assign(assessment, data);
    return this.clinicalAssessmentRepository.save(assessment);
  }

  async completeAssessment(id: string): Promise<ClinicalAssessment> {
    const assessment = await this.getAssessment(id);
    assessment.status = ClinicalAssessmentStatus.COMPLETED;
    return this.clinicalAssessmentRepository.save(assessment);
  }

  async reviewAssessment(id: string, reviewerId: string): Promise<ClinicalAssessment> {
    const assessment = await this.getAssessment(id);
    assessment.status = ClinicalAssessmentStatus.REVIEWED;
    assessment.reviewedById = reviewerId;
    assessment.reviewedAt = new Date();
    return this.clinicalAssessmentRepository.save(assessment);
  }

  async listPatientAssessments(
    patientId: string,
    assessmentType?: ClinicalAssessmentType,
  ): Promise<ClinicalAssessment[]> {
    const where: any = { patientId };
    if (assessmentType) {
      where.assessmentType = assessmentType;
    }
    return this.clinicalAssessmentRepository.find({
      where,
      order: { assessmentDate: 'DESC' },
    });
  }

  async getLatestAssessment(
    patientId: string,
    assessmentType: ClinicalAssessmentType,
  ): Promise<ClinicalAssessment | null> {
    return this.clinicalAssessmentRepository.findOne({
      where: { patientId, assessmentType },
      order: { assessmentDate: 'DESC' },
    });
  }
}
