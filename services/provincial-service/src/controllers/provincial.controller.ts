import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  Query,
  ParseUUIDPipe,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { LaborRulesService } from '../services/labor-rules.service';
import { TaxRulesService } from '../services/tax-rules.service';
import { PrivacyRulesService } from '../services/privacy-rules.service';
import { AttestationService } from '../services/attestation.service';
import { CanadianProvince, ProvinceSummary } from '../interfaces/provincial.interface';

/**
 * Provincial Controller
 * Enterprise-grade Canadian provincial regulations API
 */
@ApiTags('Provincial Regulations')
@Controller('provincial')
export class ProvincialController {
  constructor(
    private readonly laborRules: LaborRulesService,
    private readonly taxRules: TaxRulesService,
    private readonly privacyRules: PrivacyRulesService,
    private readonly attestationService: AttestationService,
  ) {}

  // ==================== Province Overview ====================

  @Get('provinces')
  @ApiOperation({ summary: 'Get all supported provinces with summary' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of provinces' })
  getProvinces(): ProvinceSummary[] {
    const provinces = Object.values(CanadianProvince);

    return provinces.map((code) => {
      const labor = this.laborRules.getRulesForProvince(code);
      const tax = this.taxRules.getTaxRules(code);
      const privacy = this.privacyRules.getPrivacyRequirements(code);

      return {
        code,
        name: labor.provinceName,
        isSupported: true,
        privacyLegislation: privacy.legislation,
        minimumWage: labor.minimumWage,
        hstRate: tax.hstRate,
        pstRate: tax.pstRate,
        gstRate: tax.gstRate,
        officialLanguages: code === CanadianProvince.QC ? ['fr', 'en'] : ['en'],
      };
    });
  }

  @Get('provinces/:code')
  @ApiOperation({ summary: 'Get comprehensive details for a province' })
  @ApiParam({ name: 'code', enum: CanadianProvince })
  @ApiResponse({ status: HttpStatus.OK, description: 'Province details' })
  getProvinceDetails(@Param('code') code: CanadianProvince) {
    const labor = this.laborRules.getRulesForProvince(code);
    const tax = this.taxRules.getTaxRules(code);
    const privacy = this.privacyRules.getPrivacyRequirements(code);
    const requiredDocs = this.laborRules.getRequiredDocuments(code);

    return {
      province: code,
      name: labor.provinceName,
      laborRules: labor,
      taxRules: {
        salesTax: {
          gst: tax.gstRate,
          pst: tax.pstRate,
          hst: tax.hstRate,
          usesHST: tax.usesHST,
        },
        employerHealthTax: tax.employerHealthTax,
        wcbRates: tax.wcbRates,
      },
      privacyRequirements: privacy,
      requiredDocuments: requiredDocs,
    };
  }

  // ==================== Labor Rules ====================

  @Get('labor/rules')
  @ApiOperation({ summary: 'Get all provincial labor rules' })
  @ApiResponse({ status: HttpStatus.OK, description: 'All labor rules' })
  getAllLaborRules() {
    return this.laborRules.getAllRules();
  }

  @Get('labor/rules/:province')
  @ApiOperation({ summary: 'Get labor rules for a specific province' })
  @ApiParam({ name: 'province', enum: CanadianProvince })
  @ApiResponse({ status: HttpStatus.OK, description: 'Provincial labor rules' })
  getLaborRulesForProvince(@Param('province') province: CanadianProvince) {
    return this.laborRules.getRulesForProvince(province);
  }

  @Post('labor/validate-shift')
  @ApiOperation({ summary: 'Validate a shift against provincial labor rules' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Shift validation result' })
  validateShift(@Body() data: {
    province: CanadianProvince;
    shiftDurationHours: number;
    restHoursSincePreviousShift?: number;
    consecutiveDaysWorked?: number;
    weeklyHoursWorked?: number;
  }) {
    return this.laborRules.validateShift(
      data.province,
      data.shiftDurationHours,
      data.restHoursSincePreviousShift,
      data.consecutiveDaysWorked,
      data.weeklyHoursWorked,
    );
  }

  @Get('labor/minimum-wage/:province')
  @ApiOperation({ summary: 'Get minimum wage for a province' })
  @ApiParam({ name: 'province', enum: CanadianProvince })
  @ApiResponse({ status: HttpStatus.OK, description: 'Minimum wage info' })
  getMinimumWage(@Param('province') province: CanadianProvince) {
    return this.laborRules.getMinimumWage(province);
  }

  @Get('labor/documents/:province')
  @ApiOperation({ summary: 'Get required documents for caregivers by province' })
  @ApiParam({ name: 'province', enum: CanadianProvince })
  @ApiResponse({ status: HttpStatus.OK, description: 'Required documents' })
  getRequiredDocuments(@Param('province') province: CanadianProvince) {
    return {
      province,
      documents: this.laborRules.getRequiredDocuments(province),
    };
  }

  // ==================== Tax Rules ====================

  @Get('tax/rules')
  @ApiOperation({ summary: 'Get all provincial tax rules summary' })
  @ApiResponse({ status: HttpStatus.OK, description: 'All tax rules' })
  getAllTaxRules() {
    return this.taxRules.getAllTaxRulesSummary();
  }

  @Get('tax/rules/:province')
  @ApiOperation({ summary: 'Get tax rules for a specific province' })
  @ApiParam({ name: 'province', enum: CanadianProvince })
  @ApiResponse({ status: HttpStatus.OK, description: 'Provincial tax rules' })
  getTaxRulesForProvince(@Param('province') province: CanadianProvince) {
    return this.taxRules.getTaxRules(province);
  }

  @Post('tax/calculate-sales-tax')
  @ApiOperation({ summary: 'Calculate sales tax for a province' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Calculated tax' })
  calculateSalesTax(@Body() data: { province: CanadianProvince; amount: number }) {
    return this.taxRules.calculateSalesTax(data.province, data.amount);
  }

  @Post('tax/calculate-eht')
  @ApiOperation({ summary: 'Calculate Employer Health Tax' })
  @ApiResponse({ status: HttpStatus.OK, description: 'EHT calculation' })
  calculateEmployerHealthTax(@Body() data: { province: CanadianProvince; annualPayroll: number }) {
    return this.taxRules.calculateEmployerHealthTax(data.province, data.annualPayroll);
  }

  @Get('tax/wcb/:province/:industryCode')
  @ApiOperation({ summary: 'Get WCB rate for an industry' })
  @ApiParam({ name: 'province', enum: CanadianProvince })
  @ApiResponse({ status: HttpStatus.OK, description: 'WCB rate' })
  getWCBRate(
    @Param('province') province: CanadianProvince,
    @Param('industryCode') industryCode: string,
  ) {
    return this.taxRules.getWCBRate(province, industryCode);
  }

  // ==================== Privacy Rules ====================

  @Get('privacy/requirements')
  @ApiOperation({ summary: 'Get all provincial privacy requirements summary' })
  @ApiResponse({ status: HttpStatus.OK, description: 'All privacy requirements' })
  getAllPrivacyRequirements() {
    return this.privacyRules.getAllPrivacyRequirementsSummary();
  }

  @Get('privacy/requirements/:province')
  @ApiOperation({ summary: 'Get privacy requirements for a province' })
  @ApiParam({ name: 'province', enum: CanadianProvince })
  @ApiResponse({ status: HttpStatus.OK, description: 'Provincial privacy requirements' })
  getPrivacyRequirements(@Param('province') province: CanadianProvince) {
    return this.privacyRules.getPrivacyRequirements(province);
  }

  @Post('privacy/check-cross-border')
  @ApiOperation({ summary: 'Check if cross-border data transfer is allowed' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Cross-border transfer check' })
  checkCrossBorderTransfer(@Body() data: { province: CanadianProvince; hasConsent: boolean }) {
    return this.privacyRules.canTransferCrossBorder(data.province, data.hasConsent);
  }

  @Get('privacy/breach-notification/:province')
  @ApiOperation({ summary: 'Get breach notification requirements' })
  @ApiParam({ name: 'province', enum: CanadianProvince })
  @ApiResponse({ status: HttpStatus.OK, description: 'Breach notification requirements' })
  getBreachNotificationRequirements(@Param('province') province: CanadianProvince) {
    return this.privacyRules.getBreachNotificationRequirements(province);
  }

  @Get('privacy/retention/:province')
  @ApiOperation({ summary: 'Get data retention policy' })
  @ApiParam({ name: 'province', enum: CanadianProvince })
  @ApiResponse({ status: HttpStatus.OK, description: 'Data retention policy' })
  getRetentionPolicy(@Param('province') province: CanadianProvince) {
    return this.privacyRules.getRetentionPolicy(province);
  }

  // ==================== Attestations ====================

  @Get('attestations/types')
  @ApiOperation({ summary: 'Get available attestation types' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Attestation types' })
  getAttestationTypes() {
    return this.attestationService.getAttestationTypes();
  }

  @Post('attestations')
  @ApiOperation({ summary: 'Submit a new attestation' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Attestation submitted' })
  submitAttestation(@Body() data: {
    caregiverId: string;
    attestationType: string;
    province: CanadianProvince;
    signature: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
  }) {
    return this.attestationService.submitAttestation(data);
  }

  @Get('attestations/caregiver/:caregiverId')
  @ApiOperation({ summary: 'Get attestations for a caregiver' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Caregiver attestations' })
  getCaregiverAttestations(@Param('caregiverId', ParseUUIDPipe) caregiverId: string) {
    return this.attestationService.getCaregiverAttestations(caregiverId);
  }

  @Get('attestations/check/:caregiverId/:attestationType')
  @ApiOperation({ summary: 'Check if caregiver has valid attestation' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Attestation validity' })
  checkAttestation(
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Param('attestationType') attestationType: string,
  ) {
    return this.attestationService.hasValidAttestation(caregiverId, attestationType);
  }

  @Get('attestations/expiring')
  @ApiOperation({ summary: 'Get attestations expiring soon' })
  @ApiQuery({ name: 'daysAhead', required: false, type: Number })
  @ApiResponse({ status: HttpStatus.OK, description: 'Expiring attestations' })
  getExpiringAttestations(@Query('daysAhead') daysAhead?: number) {
    return this.attestationService.getExpiringAttestations(daysAhead || 30);
  }

  @Get('attestations/compliance/:caregiverId/:province')
  @ApiOperation({ summary: 'Get compliance status for a caregiver' })
  @ApiParam({ name: 'province', enum: CanadianProvince })
  @ApiResponse({ status: HttpStatus.OK, description: 'Compliance status' })
  getComplianceStatus(
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Param('province') province: CanadianProvince,
  ) {
    return this.attestationService.getComplianceStatus(caregiverId, province);
  }

  @Post('attestations/:id/revoke')
  @ApiOperation({ summary: 'Revoke an attestation' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Attestation revoked' })
  revokeAttestation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason: string,
  ) {
    return this.attestationService.revokeAttestation(id, reason);
  }
}
