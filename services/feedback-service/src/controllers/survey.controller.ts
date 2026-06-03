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
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { SurveyService } from '../services/survey.service';
import { SurveyType, SurveyQuestion, QuestionAnswer } from '../interfaces/feedback.interface';

class CreateSurveyDto {
  name!: string;
  description?: string;
  type!: SurveyType;
  questions!: SurveyQuestion[];
  createdBy?: string;
  agencyId?: string;
}

class SubmitResponseDto {
  answers!: QuestionAnswer[];
  respondentId?: string;
  visitId?: string;
  caregiverId?: string;
  patientId?: string;
  comments?: string;
  isAnonymous?: boolean;
}

@Controller('surveys')
@ApiTags('surveys')
export class SurveyController {
  constructor(private readonly surveyService: SurveyService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a survey' })
  @ApiResponse({ status: 201, description: 'Survey created' })
  async create(@Body() dto: CreateSurveyDto) {
    return this.surveyService.createSurvey(
      dto.name,
      dto.type,
      dto.questions,
      dto.createdBy,
      dto.agencyId,
      dto.description,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get survey by ID' })
  @ApiResponse({ status: 200, description: 'Survey details' })
  async getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.surveyService.getSurveyById(id);
  }

  @Put(':id/publish')
  @ApiOperation({ summary: 'Publish a survey' })
  async publish(@Param('id', ParseUUIDPipe) id: string) {
    return this.surveyService.publishSurvey(id);
  }

  @Get()
  @ApiOperation({ summary: 'Get active surveys' })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'agencyId', required: false })
  async getActive(
    @Query('type') type?: SurveyType,
    @Query('agencyId') agencyId?: string,
  ) {
    return this.surveyService.getActiveSurveys(type, agencyId);
  }

  @Post(':id/responses')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit survey response' })
  async submitResponse(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SubmitResponseDto,
  ) {
    return this.surveyService.submitResponse(
      id,
      dto.answers,
      dto.respondentId,
      dto.visitId,
      dto.caregiverId,
      dto.patientId,
      dto.comments,
      dto.isAnonymous,
    );
  }

  @Get(':id/responses')
  @ApiOperation({ summary: 'Get survey responses' })
  @ApiQuery({ name: 'limit', required: false })
  async getResponses(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('limit') limit?: number,
  ) {
    return this.surveyService.getSurveyResponses(id, limit);
  }

  @Get(':id/analytics')
  @ApiOperation({ summary: 'Get survey analytics' })
  async getAnalytics(@Param('id', ParseUUIDPipe) id: string) {
    return this.surveyService.getSurveyAnalytics(id);
  }
}
