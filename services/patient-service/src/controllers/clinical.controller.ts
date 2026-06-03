import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ClinicalService } from '../services/clinical.service';
import { ClinicalNoteType } from '../entities/clinical-note.entity';
import {
  CarePlanGoalCategory,
  CarePlanGoalPriority,
  CarePlanGoalStatus,
} from '../entities/care-plan-goal.entity';
import { ClinicalAssessmentType } from '../entities/clinical-assessment.entity';
import { DiagnosisStatus, DiagnosisType } from '../entities/diagnosis.entity';
import { AllergySeverity, AllergyType } from '../entities/allergy.entity';

/**
 * Clinical Documentation Controller
 *
 * Phase 5D: Full clinical documentation with:
 * - Vital signs recording
 * - Allergy management
 * - Diagnosis tracking
 * - Clinical notes (SOAP, DAR, etc.)
 * - Care plan goals
 * - Clinical assessments
 * - Canadian healthcare compliance
 */
@ApiTags('Clinical')
@Controller('clinical')
export class ClinicalController {
  constructor(private readonly clinicalService: ClinicalService) {}

  private mapGoalPriority(priority?: number): CarePlanGoalPriority | undefined {
    if (priority === undefined) return undefined;
    if (priority <= 1) return CarePlanGoalPriority.HIGH;
    if (priority === 2) return CarePlanGoalPriority.MEDIUM;
    return CarePlanGoalPriority.LOW;
  }

  // ===== VITAL SIGNS =====

  @Post('vitals')
  @ApiOperation({ summary: 'Record vital signs' })
  @ApiResponse({ status: 201, description: 'Vital signs recorded successfully' })
  async recordVitalSigns(@Body() dto: {
    patientId: string;
    recordedById: string;
    recordedByName: string;
    bpSystolic?: number;
    bpDiastolic?: number;
    heartRate?: number;
    respiratoryRate?: number;
    temperature?: number;
    temperatureUnit?: 'celsius' | 'fahrenheit';
    oxygenSaturation?: number;
    oxygenDelivery?: string;
    painLevel?: number;
    painLocation?: string;
    weight?: number;
    weightUnit?: 'kg' | 'lbs';
    height?: number;
    heightUnit?: 'cm' | 'inches';
    bloodGlucose?: number;
    bloodGlucoseTiming?: string;
    notes?: string;
  }) {
    return this.clinicalService.recordVitalSigns(dto);
  }

  @Get('vitals/:id')
  @ApiOperation({ summary: 'Get vital sign record' })
  @ApiParam({ name: 'id', description: 'Vital sign ID' })
  async getVitalSign(@Param('id', ParseUUIDPipe) id: string) {
    return this.clinicalService.getVitalSign(id);
  }

  @Get('patients/:patientId/vitals')
  @ApiOperation({ summary: 'Get vital signs history for patient' })
  @ApiParam({ name: 'patientId', description: 'Patient ID' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async getVitalSignsHistory(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.clinicalService.getVitalSignsHistory(
      patientId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('patients/:patientId/vitals/latest')
  @ApiOperation({ summary: 'Get latest vital signs for patient' })
  @ApiParam({ name: 'patientId', description: 'Patient ID' })
  async getLatestVitals(@Param('patientId', ParseUUIDPipe) patientId: string) {
    return this.clinicalService.getLatestVitals(patientId);
  }

  // ===== ALLERGIES =====

  @Post('allergies')
  @ApiOperation({ summary: 'Add allergy to patient record' })
  @ApiResponse({ status: 201, description: 'Allergy added successfully' })
  async addAllergy(@Body() dto: {
    patientId: string;
    allergyType: string;
    allergen: string;
    reaction: string;
    severity: string;
    onsetDate?: Date;
    reportedById: string;
    reportedByName: string;
    notes?: string;
  }) {
    return this.clinicalService.addAllergy({
      ...dto,
      allergyType: dto.allergyType as AllergyType,
      severity: dto.severity as AllergySeverity,
    });
  }

  @Get('allergies/:id')
  @ApiOperation({ summary: 'Get allergy record' })
  @ApiParam({ name: 'id', description: 'Allergy ID' })
  async getAllergy(@Param('id', ParseUUIDPipe) id: string) {
    return this.clinicalService.getAllergy(id);
  }

  @Put('allergies/:id')
  @ApiOperation({ summary: 'Update allergy record' })
  @ApiParam({ name: 'id', description: 'Allergy ID' })
  async updateAllergy(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<{
      reaction: string;
      severity: string;
      notes: string;
    }>,
  ) {
    return this.clinicalService.updateAllergy(id, {
      ...dto,
      severity: dto.severity as AllergySeverity | undefined,
    });
  }

  @Post('allergies/:id/resolve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark allergy as resolved' })
  @ApiParam({ name: 'id', description: 'Allergy ID' })
  async resolveAllergy(@Param('id', ParseUUIDPipe) id: string) {
    return this.clinicalService.resolveAllergy(id);
  }

  @Get('patients/:patientId/allergies')
  @ApiOperation({ summary: 'Get allergies for patient' })
  @ApiParam({ name: 'patientId', description: 'Patient ID' })
  async listPatientAllergies(@Param('patientId', ParseUUIDPipe) patientId: string) {
    return this.clinicalService.listPatientAllergies(patientId);
  }

  @Get('patients/:patientId/allergies/check-drug')
  @ApiOperation({ summary: 'Check for drug allergies' })
  @ApiParam({ name: 'patientId', description: 'Patient ID' })
  @ApiQuery({ name: 'medication', description: 'Medication name to check' })
  async checkDrugAllergies(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Query('medication') medication: string,
  ) {
    return this.clinicalService.checkDrugAllergies(patientId, medication);
  }

  // ===== DIAGNOSES =====

  @Post('diagnoses')
  @ApiOperation({ summary: 'Add diagnosis to patient record' })
  @ApiResponse({ status: 201, description: 'Diagnosis added successfully' })
  async addDiagnosis(@Body() dto: {
    patientId: string;
    icdCode?: string;
    snomedCode?: string;
    diagnosisName: string;
    description?: string;
    diagnosisType: string;
    diagnosedById: string;
    diagnosedByName: string;
    diagnosisDate: Date;
    isPrimary?: boolean;
    ranking?: number;
    notes?: string;
  }) {
    return this.clinicalService.addDiagnosis({
      ...dto,
      diagnosisType: dto.diagnosisType as DiagnosisType,
    });
  }

  @Get('diagnoses/:id')
  @ApiOperation({ summary: 'Get diagnosis record' })
  @ApiParam({ name: 'id', description: 'Diagnosis ID' })
  async getDiagnosis(@Param('id', ParseUUIDPipe) id: string) {
    return this.clinicalService.getDiagnosis(id);
  }

  @Put('diagnoses/:id')
  @ApiOperation({ summary: 'Update diagnosis record' })
  @ApiParam({ name: 'id', description: 'Diagnosis ID' })
  async updateDiagnosis(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<{
      description: string;
      ranking: number;
      notes: string;
    }>,
  ) {
    return this.clinicalService.updateDiagnosis(id, dto);
  }

  @Post('diagnoses/:id/resolve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark diagnosis as resolved' })
  @ApiParam({ name: 'id', description: 'Diagnosis ID' })
  async resolveDiagnosis(@Param('id', ParseUUIDPipe) id: string) {
    return this.clinicalService.resolveDiagnosis(id);
  }

  @Get('patients/:patientId/diagnoses')
  @ApiOperation({ summary: 'Get diagnoses for patient' })
  @ApiParam({ name: 'patientId', description: 'Patient ID' })
  @ApiQuery({ name: 'status', required: false, enum: DiagnosisStatus })
  async listPatientDiagnoses(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Query('status') status?: DiagnosisStatus,
  ) {
    return this.clinicalService.listPatientDiagnoses(patientId, status);
  }

  // ===== CLINICAL NOTES =====

  @Post('notes')
  @ApiOperation({ summary: 'Create clinical note' })
  @ApiResponse({ status: 201, description: 'Clinical note created successfully' })
  async createClinicalNote(@Body() dto: {
    patientId: string;
    noteType: ClinicalNoteType;
    subject?: string;
    noteDate: Date;
    authorId: string;
    authorName: string;
    authorTitle?: string;
    content: string;
    soapSubjective?: string;
    soapObjective?: string;
    soapAssessment?: string;
    soapPlan?: string;
    visitId?: string;
    shiftId?: string;
  }) {
    return this.clinicalService.createClinicalNote({
      patientId: dto.patientId,
      noteType: dto.noteType,
      title: dto.subject,
      noteDate: dto.noteDate,
      authorId: dto.authorId,
      authorName: dto.authorName,
      authorCredentials: dto.authorTitle,
      narrative: dto.content,
      subjective: dto.soapSubjective,
      objective: dto.soapObjective,
      assessment: dto.soapAssessment,
      plan: dto.soapPlan,
      visitId: dto.visitId,
      shiftId: dto.shiftId,
    });
  }

  @Get('notes/:id')
  @ApiOperation({ summary: 'Get clinical note' })
  @ApiParam({ name: 'id', description: 'Note ID' })
  async getClinicalNote(@Param('id', ParseUUIDPipe) id: string) {
    return this.clinicalService.getClinicalNote(id);
  }

  @Put('notes/:id')
  @ApiOperation({ summary: 'Update clinical note (if not signed)' })
  @ApiParam({ name: 'id', description: 'Note ID' })
  async updateClinicalNote(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<{
      content: string;
      soapSubjective: string;
      soapObjective: string;
      soapAssessment: string;
      soapPlan: string;
    }>,
  ) {
    return this.clinicalService.updateClinicalNote(id, {
      narrative: dto.content,
      subjective: dto.soapSubjective,
      objective: dto.soapObjective,
      assessment: dto.soapAssessment,
      plan: dto.soapPlan,
    });
  }

  @Post('notes/:id/sign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign clinical note' })
  @ApiParam({ name: 'id', description: 'Note ID' })
  async signClinicalNote(@Param('id', ParseUUIDPipe) id: string) {
    return this.clinicalService.signClinicalNote(id);
  }

  @Post('notes/:id/cosign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Co-sign clinical note' })
  @ApiParam({ name: 'id', description: 'Note ID' })
  async cosignClinicalNote(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { cosignerId: string; cosignerName: string },
  ) {
    return this.clinicalService.cosignClinicalNote(id, dto.cosignerId, dto.cosignerName);
  }

  @Post('notes/:id/addendum')
  @ApiOperation({ summary: 'Add addendum to clinical note' })
  @ApiParam({ name: 'id', description: 'Parent note ID' })
  async addAddendum(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: {
      patientId: string;
      authorId: string;
      authorName: string;
      content: string;
      noteDate: Date;
    },
  ) {
    return this.clinicalService.addAddendum(id, {
      patientId: dto.patientId,
      noteDate: dto.noteDate,
      authorId: dto.authorId,
      authorName: dto.authorName,
      narrative: dto.content,
    });
  }

  @Get('patients/:patientId/notes')
  @ApiOperation({ summary: 'Get clinical notes for patient' })
  @ApiParam({ name: 'patientId', description: 'Patient ID' })
  @ApiQuery({ name: 'noteType', required: false, enum: ClinicalNoteType })
  async listPatientNotes(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Query('noteType') noteType?: ClinicalNoteType,
  ) {
    return this.clinicalService.listPatientNotes(patientId, noteType);
  }

  // ===== CARE PLAN GOALS =====

  @Post('goals')
  @ApiOperation({ summary: 'Create care plan goal' })
  @ApiResponse({ status: 201, description: 'Goal created successfully' })
  async createCarePlanGoal(@Body() dto: {
    patientId: string;
    carePlanId?: string;
    goalDomain: string;
    goalStatement: string;
    shortTermObjectives: string[];
    targetDate: Date;
    priority: number;
    createdById: string;
    createdByName: string;
    interventions?: string[];
    measurementCriteria?: string;
  }) {
    return this.clinicalService.createCarePlanGoal({
      patientId: dto.patientId,
      carePlanId: dto.carePlanId,
      category: dto.goalDomain as CarePlanGoalCategory,
      goalStatement: dto.goalStatement,
      description: dto.shortTermObjectives?.join('\n'),
      targetDate: dto.targetDate,
      startDate: new Date(),
      priority: this.mapGoalPriority(dto.priority),
      createdById: dto.createdById,
      createdByName: dto.createdByName,
      interventions: dto.interventions?.map((description) => ({
        description,
        frequency: 'as_needed',
        responsible: 'care_team',
      })),
      measurableOutcome: dto.measurementCriteria,
      metadata: { shortTermObjectives: dto.shortTermObjectives },
    });
  }

  @Get('goals/:id')
  @ApiOperation({ summary: 'Get care plan goal' })
  @ApiParam({ name: 'id', description: 'Goal ID' })
  async getCarePlanGoal(@Param('id', ParseUUIDPipe) id: string) {
    return this.clinicalService.getCarePlanGoal(id);
  }

  @Put('goals/:id')
  @ApiOperation({ summary: 'Update care plan goal' })
  @ApiParam({ name: 'id', description: 'Goal ID' })
  async updateCarePlanGoal(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<{
      goalStatement: string;
      shortTermObjectives: string[];
      targetDate: Date;
      priority: number;
      interventions: string[];
      measurementCriteria: string;
    }>,
  ) {
    return this.clinicalService.updateCarePlanGoal(id, {
      goalStatement: dto.goalStatement,
      description: dto.shortTermObjectives?.join('\n'),
      targetDate: dto.targetDate,
      priority: this.mapGoalPriority(dto.priority),
      interventions: dto.interventions?.map((description) => ({
        description,
        frequency: 'as_needed',
        responsible: 'care_team',
      })),
      measurableOutcome: dto.measurementCriteria,
      metadata: dto.shortTermObjectives
        ? { shortTermObjectives: dto.shortTermObjectives }
        : undefined,
    });
  }

  @Post('goals/:id/progress')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update goal progress' })
  @ApiParam({ name: 'id', description: 'Goal ID' })
  async updateGoalProgress(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: {
      progress: number;
      note: string;
      authorId: string;
      authorName: string;
    },
  ) {
    return this.clinicalService.updateGoalProgress(
      id,
      dto.progress,
      dto.note,
      dto.authorId,
      dto.authorName,
    );
  }

  @Get('patients/:patientId/goals')
  @ApiOperation({ summary: 'Get care plan goals for patient' })
  @ApiParam({ name: 'patientId', description: 'Patient ID' })
  @ApiQuery({ name: 'status', required: false, enum: CarePlanGoalStatus })
  async listPatientGoals(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Query('status') status?: CarePlanGoalStatus,
  ) {
    return this.clinicalService.listPatientGoals(patientId, status);
  }

  // ===== CLINICAL ASSESSMENTS =====

  @Post('assessments')
  @ApiOperation({ summary: 'Create clinical assessment' })
  @ApiResponse({ status: 201, description: 'Assessment created successfully' })
  async createAssessment(@Body() dto: {
    patientId: string;
    assessmentType: ClinicalAssessmentType;
    assessmentName: string;
    assessmentDate: Date;
    assessorId: string;
    assessorName: string;
    assessorTitle?: string;
    visitId?: string;
    questionsAnswers?: any[];
    observations?: string;
    findings?: string;
    score?: number;
    maxScore?: number;
    riskLevel?: string;
    recommendations?: string[];
    followUpRequired?: boolean;
    followUpDate?: Date;
    referralRequired?: boolean;
    referralType?: string;
    referralReason?: string;
  }) {
    return this.clinicalService.createAssessment({
      ...dto,
      assessorCredentials: dto.assessorTitle,
      totalScore: dto.score,
      scoreBreakdown: {
        questionsAnswers: dto.questionsAnswers,
        maxScore: dto.maxScore,
      },
      recommendations: dto.recommendations?.join('\n'),
      metadata: {
        observations: dto.observations,
        followUpRequired: dto.followUpRequired,
        followUpDate: dto.followUpDate,
        referralRequired: dto.referralRequired,
        referralType: dto.referralType,
        referralReason: dto.referralReason,
      },
    });
  }

  @Get('assessments/:id')
  @ApiOperation({ summary: 'Get clinical assessment' })
  @ApiParam({ name: 'id', description: 'Assessment ID' })
  async getAssessment(@Param('id', ParseUUIDPipe) id: string) {
    return this.clinicalService.getAssessment(id);
  }

  @Put('assessments/:id')
  @ApiOperation({ summary: 'Update clinical assessment' })
  @ApiParam({ name: 'id', description: 'Assessment ID' })
  async updateAssessment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<{
      questionsAnswers: any[];
      observations: string;
      findings: string;
      score: number;
      recommendations: string[];
    }>,
  ) {
    return this.clinicalService.updateAssessment(id, {
      findings: dto.findings,
      totalScore: dto.score,
      scoreBreakdown: dto.questionsAnswers ? { questionsAnswers: dto.questionsAnswers } : undefined,
      recommendations: dto.recommendations?.join('\n'),
      metadata: dto.observations ? { observations: dto.observations } : undefined,
    });
  }

  @Post('assessments/:id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete clinical assessment' })
  @ApiParam({ name: 'id', description: 'Assessment ID' })
  async completeAssessment(@Param('id', ParseUUIDPipe) id: string) {
    return this.clinicalService.completeAssessment(id);
  }

  @Post('assessments/:id/review')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Review clinical assessment' })
  @ApiParam({ name: 'id', description: 'Assessment ID' })
  async reviewAssessment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { reviewerId: string },
  ) {
    return this.clinicalService.reviewAssessment(id, dto.reviewerId);
  }

  @Get('patients/:patientId/assessments')
  @ApiOperation({ summary: 'Get assessments for patient' })
  @ApiParam({ name: 'patientId', description: 'Patient ID' })
  @ApiQuery({ name: 'assessmentType', required: false, enum: ClinicalAssessmentType })
  async listPatientAssessments(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Query('assessmentType') assessmentType?: ClinicalAssessmentType,
  ) {
    return this.clinicalService.listPatientAssessments(patientId, assessmentType);
  }

  @Get('patients/:patientId/assessments/latest')
  @ApiOperation({ summary: 'Get latest assessment of a specific type' })
  @ApiParam({ name: 'patientId', description: 'Patient ID' })
  @ApiQuery({ name: 'assessmentType', enum: ClinicalAssessmentType })
  async getLatestAssessment(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Query('assessmentType') assessmentType: ClinicalAssessmentType,
  ) {
    return this.clinicalService.getLatestAssessment(patientId, assessmentType);
  }
}
