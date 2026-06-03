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
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CourseService } from '../services/course.service';
import { CourseCategory, CourseStatus, CourseLevel } from '../entities/training-course.entity';
import { ModuleType } from '../entities/training-module.entity';

/**
 * Course Controller
 * Phase 5I: Training course management
 */
@ApiTags('Training Courses')
@Controller('courses')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Post()
  @ApiOperation({ summary: 'Create a training course' })
  @ApiResponse({ status: 201, description: 'Course created' })
  async createCourse(@Body() dto: {
    title: string;
    titleFr?: string;
    description?: string;
    category: CourseCategory;
    level?: CourseLevel;
    createdBy: string;
    agencyId?: string;
    isRequired?: boolean;
    estimatedDurationMinutes: number;
    passingScore?: number;
    validityMonths?: number;
  }) {
    return this.courseService.createCourse(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List training courses' })
  @ApiQuery({ name: 'category', required: false, enum: CourseCategory })
  @ApiQuery({ name: 'status', required: false, enum: CourseStatus })
  @ApiQuery({ name: 'agencyId', required: false })
  async listCourses(
    @Query('category') category?: CourseCategory,
    @Query('status') status?: CourseStatus,
    @Query('agencyId') agencyId?: string,
  ) {
    return this.courseService.listCourses(category, status, agencyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get course by ID' })
  @ApiParam({ name: 'id', description: 'Course ID' })
  async getCourse(@Param('id', ParseUUIDPipe) id: string) {
    return this.courseService.getCourse(id);
  }

  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publish a course' })
  async publishCourse(@Param('id', ParseUUIDPipe) id: string) {
    return this.courseService.publishCourse(id);
  }

  @Get(':id/modules')
  @ApiOperation({ summary: 'Get course modules' })
  async getCourseModules(@Param('id', ParseUUIDPipe) id: string) {
    return this.courseService.getCourseModules(id);
  }

  @Post(':id/modules')
  @ApiOperation({ summary: 'Add module to course' })
  async createModule(
    @Param('id', ParseUUIDPipe) courseId: string,
    @Body() dto: {
      title: string;
      titleFr?: string;
      description?: string;
      moduleType: ModuleType;
      order: number;
      contentData?: any;
      estimatedDurationMinutes?: number;
    },
  ) {
    return this.courseService.createModule({ ...dto, courseId });
  }

  @Post(':id/enroll')
  @ApiOperation({ summary: 'Enroll user in course' })
  async enrollUser(
    @Param('id', ParseUUIDPipe) courseId: string,
    @Body() dto: { userId: string; enrolledBy?: string },
  ) {
    return this.courseService.enrollUser(dto.userId, courseId, dto.enrolledBy);
  }

  @Get('user/:userId/enrollments')
  @ApiOperation({ summary: 'Get user enrollments' })
  async getUserEnrollments(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.courseService.getUserEnrollments(userId);
  }

  @Get('user/:userId/certificates')
  @ApiOperation({ summary: 'Get user certificates' })
  async getUserCertificates(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.courseService.getUserCertificates(userId);
  }

  @Get('certificates/verify/:code')
  @ApiOperation({ summary: 'Verify a certificate' })
  async verifyCertificate(@Param('code') code: string) {
    return this.courseService.verifyCertificate(code);
  }
}
