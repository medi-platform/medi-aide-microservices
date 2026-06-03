import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import {
  LaborRulesService,
  ValidateShiftDto,
} from '../services/labor-rules.service';
import { LaborRule, LaborRuleType } from '../entities/labor-rule.entity';

@ApiTags('Labor Rules')
@ApiBearerAuth()
@Controller('labor-rules')
export class LaborRulesController {
  constructor(private readonly laborRulesService: LaborRulesService) {}

  @Get('provinces')
  @ApiOperation({ summary: 'Get list of Canadian provinces' })
  getProvinces() {
    const provinces = [
      { code: 'AB', name: 'Alberta' },
      { code: 'BC', name: 'British Columbia' },
      { code: 'MB', name: 'Manitoba' },
      { code: 'NB', name: 'New Brunswick' },
      { code: 'NL', name: 'Newfoundland and Labrador' },
      { code: 'NS', name: 'Nova Scotia' },
      { code: 'NT', name: 'Northwest Territories' },
      { code: 'NU', name: 'Nunavut' },
      { code: 'ON', name: 'Ontario' },
      { code: 'PE', name: 'Prince Edward Island' },
      { code: 'QC', name: 'Quebec' },
      { code: 'SK', name: 'Saskatchewan' },
      { code: 'YT', name: 'Yukon' },
    ];
    return {
      success: true,
      data: provinces,
    };
  }

  @Get('overtime-rates')
  @ApiOperation({ summary: 'Get overtime rates for all provinces' })
  async getOvertimeRates() {
    const rates = await this.laborRulesService.getProvinceOvertimeRates();
    return {
      success: true,
      data: rates,
    };
  }

  @Get('province/:province')
  @ApiOperation({ summary: 'Get active labor rules for a province' })
  @ApiParam({ name: 'province', description: 'Province code (e.g., ON, BC, QC)' })
  @ApiQuery({ name: 'date', required: false, description: 'Effective date (defaults to today)' })
  async getRulesForProvince(
    @Param('province') province: string,
    @Query('date') date?: string,
  ) {
    const rules = await this.laborRulesService.getActiveRulesForProvince(
      province.toUpperCase(),
      date ? new Date(date) : undefined,
    );
    return {
      success: true,
      data: rules,
    };
  }

  @Get('province/:province/type/:type')
  @ApiOperation({ summary: 'Get labor rules by type for a province' })
  @ApiParam({ name: 'province', description: 'Province code' })
  @ApiParam({ name: 'type', enum: LaborRuleType })
  async getRulesByType(
    @Param('province') province: string,
    @Param('type') type: LaborRuleType,
  ) {
    const rules = await this.laborRulesService.getRulesByType(province.toUpperCase(), type);
    return {
      success: true,
      data: rules,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new labor rule' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Labor rule created' })
  async createRule(@Body() rule: Partial<LaborRule>) {
    const created = await this.laborRulesService.createRule(rule);
    return {
      success: true,
      data: created,
      message: 'Labor rule created successfully',
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a labor rule' })
  @ApiParam({ name: 'id', type: String })
  async updateRule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updates: Partial<LaborRule>,
  ) {
    const updated = await this.laborRulesService.updateRule(id, updates);
    return {
      success: true,
      data: updated,
      message: 'Labor rule updated successfully',
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get labor rule by ID' })
  @ApiParam({ name: 'id', type: String })
  async getRule(@Param('id', ParseUUIDPipe) id: string) {
    const rule = await this.laborRulesService.getRuleById(id);
    return {
      success: true,
      data: rule,
    };
  }

  @Post('validate-shift')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate a shift against labor rules' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Validation result' })
  async validateShift(@Body() dto: ValidateShiftDto) {
    const result = await this.laborRulesService.validateShift(dto);
    return {
      success: true,
      data: result,
    };
  }

  @Post('calculate-overtime')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Calculate overtime for additional hours' })
  async calculateOvertime(
    @Body() body: { province: string; weekly_hours_worked: number; additional_hours: number },
  ) {
    const result = await this.laborRulesService.calculateOvertime(
      body.province.toUpperCase(),
      body.weekly_hours_worked,
      body.additional_hours,
    );
    return {
      success: true,
      data: result,
    };
  }
}
