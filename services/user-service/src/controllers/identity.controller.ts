import { Controller, Get, Post, Put, Body, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { IdentityVerificationService } from '../services/identity-verification.service';
import { DocumentType, VerificationLevel } from '../entities/identity-verification.entity';

@ApiTags('Identity')
@Controller('identity')
export class IdentityController {
  constructor(private readonly verificationService: IdentityVerificationService) {}

  @Get(':userId/status')
  @ApiOperation({ summary: 'Get identity verification status' })
  async getVerificationStatus(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.verificationService.getStatus(userId);
  }

  @Post(':userId/verify')
  @ApiOperation({ summary: 'Submit identity for verification' })
  async submitVerification(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: {
      documentType: DocumentType;
      documentNumber?: string;
      frontFileId?: string;
      backFileId?: string;
      selfieFileId?: string;
    },
  ) {
    const verification = await this.verificationService.submit(userId, dto);
    return {
      verificationId: verification.id,
      userId,
      status: verification.status,
      submittedAt: verification.createdAt,
      estimatedCompletionTime: '24-48 hours',
    };
  }

  @Get(':userId/documents')
  @ApiOperation({ summary: 'Get verified identity documents' })
  async getDocuments(@Param('userId', ParseUUIDPipe) userId: string) {
    const docs = await this.verificationService.getDocuments(userId);
    return { userId, documents: docs };
  }

  @Get(':userId/verify/:verificationId')
  @ApiOperation({ summary: 'Get single verification by ID' })
  async getVerification(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('verificationId', ParseUUIDPipe) verificationId: string,
  ) {
    return this.verificationService.getById(userId, verificationId);
  }

  @Put(':userId/verify/:verificationId')
  @ApiOperation({ summary: 'Update verification status (admin)' })
  async updateVerificationStatus(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('verificationId', ParseUUIDPipe) verificationId: string,
    @Body() dto: {
      status: 'approved' | 'rejected';
      rejectionReason?: string;
      verificationLevel?: VerificationLevel;
      reviewerId?: string;
    },
  ) {
    // In real usage, reviewerId would come from JWT claims
    const reviewerId = dto.reviewerId || 'system';
    return this.verificationService.review(verificationId, reviewerId, dto);
  }

  @Get('admin/queue')
  @ApiOperation({ summary: 'Get pending verifications for review (admin)' })
  async getPendingQueue(@Query('limit') limit = 50) {
    return this.verificationService.getPendingQueue(Number(limit));
  }
}
