import { IsEnum, IsOptional, IsString, IsUUID, IsBoolean, IsInt, Min, Max, IsDateString, IsObject } from 'class-validator';
import { AuditSeverity } from '../entities/audit-log-enhanced.entity';

export class CreateAuditLogDto {
  // Support both new and legacy field names
  @IsOptional()
  @IsString()
  eventType?: string;

  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @IsEnum(AuditSeverity)
  severity?: AuditSeverity;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsUUID()
  actorId?: string;

  @IsOptional()
  @IsString()
  entityType?: string;

  @IsOptional()
  @IsString()
  resourceType?: string;

  @IsOptional()
  @IsUUID()
  entityId?: string;

  @IsOptional()
  @IsUUID()
  resourceId?: string;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsUUID()
  sessionId?: string;

  @IsOptional()
  @IsUUID()
  requestId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  // HIPAA fields
  @IsOptional()
  @IsUUID()
  patientId?: string;

  @IsOptional()
  @IsString()
  accessReason?: string;

  @IsOptional()
  @IsString()
  authorizationId?: string;
}

export class QueryAuditLogsDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsString()
  eventType?: string;

  @IsOptional()
  @IsString()
  entityType?: string;

  @IsOptional()
  @IsUUID()
  entityId?: string;

  @IsOptional()
  @IsEnum(AuditSeverity)
  severity?: AuditSeverity;

  @IsOptional()
  @IsBoolean()
  phiAccessed?: boolean;

  @IsOptional()
  @IsBoolean()
  flaggedOnly?: boolean;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number = 0;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  limit?: number = 50;
}

export class UpdateComplianceDto {
  @IsString()
  regulationType!: string;

  @IsString()
  requirementId!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['compliant', 'non_compliant', 'pending_review', 'exception_granted'])
  status?: string;

  @IsOptional()
  @IsObject()
  evidence?: Record<string, any>;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  controlEffectiveness?: number;

  @IsOptional()
  @IsString()
  lastAuditResult?: string;

  @IsOptional()
  @IsObject()
  remediationPlan?: Record<string, any>;

  @IsOptional()
  @IsString()
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';

  @IsOptional()
  @IsInt()
  @Min(1)
  reviewFrequencyDays?: number;
}
