import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { v4 as uuid } from 'uuid';

// Import entities
import { Agency } from '../src/entities/agency.entity';
import { JobPosting } from '../src/entities/job-posting.entity';
import { JobApplication } from '../src/entities/job-application.entity';
import { InterviewSchedule } from '../src/entities/interview-schedule.entity';
import { SupportTicket } from '../src/entities/support-ticket.entity';

// Import controllers
import { AgencyController } from '../src/controllers/agency.controller';
import { JobPostingController } from '../src/controllers/job-posting.controller';
import { SupportTicketController } from '../src/controllers/support-ticket.controller';

// Import services
import { AgencyService } from '../src/services/agency.service';
import { JobPostingService } from '../src/services/job-posting.service';
import { SupportTicketService } from '../src/services/support-ticket.service';

describe('AgencyService E2E Tests', () => {
  let app: INestApplication;
  let agencyId: string;

  const entities = [Agency, JobPosting, JobApplication, InterviewSchedule, SupportTicket];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (config: ConfigService) => ({
            type: 'postgres',
            host: config.get('DB_HOST', 'localhost'),
            port: config.get<number>('DB_PORT', 5432),
            username: config.get('DB_USER', 'postgres'),
            password: config.get('DB_PASSWORD', 'postgres'),
            database: config.get('DB_DATABASE', 'agency_db_test'),
            entities,
            synchronize: true,
            dropSchema: true,
          }),
        }),
        TypeOrmModule.forFeature(entities),
      ],
      controllers: [AgencyController, JobPostingController, SupportTicketController],
      providers: [AgencyService, JobPostingService, SupportTicketService],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Agency CRUD Operations', () => {
    it('POST /agencies - should create a new agency', async () => {
      const createAgencyDto = {
        name: 'Test Agency',
        code: 'TEST001',
        province: 'ON',
        email: 'test@agency.com',
        phone: '555-123-4567',
        status: 'active',
      };

      const response = await request(app.getHttpServer())
        .post('/agencies')
        .send(createAgencyDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(createAgencyDto.name);
      expect(response.body.code).toBe(createAgencyDto.code);
      
      agencyId = response.body.id;
    });

    it('GET /agencies/:id - should get agency by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/agencies/${agencyId}`)
        .expect(200);

      expect(response.body.id).toBe(agencyId);
      expect(response.body.name).toBe('Test Agency');
    });

    it('GET /agencies - should list all agencies', async () => {
      const response = await request(app.getHttpServer())
        .get('/agencies')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
    });

    it('PATCH /agencies/:id - should update agency', async () => {
      const updateDto = { name: 'Updated Agency Name' };

      const response = await request(app.getHttpServer())
        .patch(`/agencies/${agencyId}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.name).toBe(updateDto.name);
    });

    it('GET /agencies/:id - should return 404 for non-existent agency', async () => {
      await request(app.getHttpServer())
        .get(`/agencies/${uuid()}`)
        .expect(404);
    });
  });

  describe('Job Posting Operations', () => {
    let jobPostingId: string;

    it('POST /job-postings - should create a job posting', async () => {
      const createDto = {
        agencyId,
        title: 'Senior Caregiver',
        description: 'Looking for experienced caregiver',
        jobType: 'full_time',
        status: 'draft',
        positionsAvailable: 2,
        createdBy: uuid(),
      };

      const response = await request(app.getHttpServer())
        .post('/job-postings')
        .send(createDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(createDto.title);
      
      jobPostingId = response.body.id;
    });

    it('GET /job-postings - should list job postings', async () => {
      const response = await request(app.getHttpServer())
        .get('/job-postings')
        .query({ agencyId })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('PATCH /job-postings/:id/publish - should publish job posting', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/job-postings/${jobPostingId}/publish`)
        .expect(200);

      expect(response.body.status).toBe('active');
    });

    it('GET /job-postings/active - should list active job postings', async () => {
      const response = await request(app.getHttpServer())
        .get('/job-postings/active')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((posting: any) => {
        expect(posting.status).toBe('active');
      });
    });
  });

  describe('Support Ticket Operations', () => {
    let ticketId: string;

    it('POST /support-tickets - should create a support ticket', async () => {
      const createDto = {
        agencyId,
        createdBy: uuid(),
        category: 'billing',
        subject: 'Invoice Question',
        description: 'I have a question about my invoice',
        priority: 'medium',
      };

      const response = await request(app.getHttpServer())
        .post('/support-tickets')
        .send(createDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('ticketNumber');
      expect(response.body.status).toBe('open');
      
      ticketId = response.body.id;
    });

    it('GET /support-tickets/:id - should get ticket details', async () => {
      const response = await request(app.getHttpServer())
        .get(`/support-tickets/${ticketId}`)
        .expect(200);

      expect(response.body.id).toBe(ticketId);
    });

    it('PATCH /support-tickets/:id/assign - should assign ticket', async () => {
      const assigneeId = uuid();

      const response = await request(app.getHttpServer())
        .patch(`/support-tickets/${ticketId}/assign`)
        .send({ assignedTo: assigneeId })
        .expect(200);

      expect(response.body.assignedTo).toBe(assigneeId);
      expect(response.body.status).toBe('in_progress');
    });

    it('PATCH /support-tickets/:id/resolve - should resolve ticket', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/support-tickets/${ticketId}/resolve`)
        .send({ resolution: 'Issue resolved via phone call' })
        .expect(200);

      expect(response.body.status).toBe('resolved');
      expect(response.body.resolution).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should return 400 for invalid request body', async () => {
      const invalidDto = {
        // Missing required fields
        name: '',
      };

      await request(app.getHttpServer())
        .post('/agencies')
        .send(invalidDto)
        .expect(400);
    });

    it('should return 404 for non-existent resource', async () => {
      await request(app.getHttpServer())
        .get(`/job-postings/${uuid()}`)
        .expect(404);
    });
  });
});
