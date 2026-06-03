import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { v4 as uuid } from 'uuid';

// Import entities
import { Residence } from '../src/entities/residence.entity';
import { Room } from '../src/entities/room.entity';
import { Resident } from '../src/entities/resident.entity';
import { ResidentialShift } from '../src/entities/residential-shift.entity';
import { ResidentialTask } from '../src/entities/residential-task.entity';
import { ShiftHandoff } from '../src/entities/shift-handoff.entity';

// Import controllers
import { ResidenceController } from '../src/controllers/residence.controller';
import { RoomController } from '../src/controllers/room.controller';
import { ResidentController } from '../src/controllers/resident.controller';
import { ShiftController } from '../src/controllers/shift.controller';

// Import services
import { ResidenceService } from '../src/services/residence.service';
import { RoomService } from '../src/services/room.service';
import { ResidentService } from '../src/services/resident.service';
import { ShiftService } from '../src/services/shift.service';

describe('ResidentialService E2E Tests', () => {
  let app: INestApplication;
  let residenceId: string;
  let roomId: string;
  let residentId: string;

  const entities = [Residence, Room, Resident, ResidentialShift, ResidentialTask, ShiftHandoff];

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
            database: config.get('DB_DATABASE', 'residential_db_test'),
            entities,
            synchronize: true,
            dropSchema: true,
          }),
        }),
        TypeOrmModule.forFeature(entities),
      ],
      controllers: [ResidenceController, RoomController, ResidentController, ShiftController],
      providers: [ResidenceService, RoomService, ResidentService, ShiftService],
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

  describe('Residence CRUD Operations', () => {
    it('POST /residences - should create a new residence', async () => {
      const createDto = {
        agencyId: uuid(),
        name: 'Sunset Manor',
        status: 'active',
        addressLine1: '123 Care Street',
        city: 'Toronto',
        province: 'ON',
        postalCode: 'M5V 3A8',
        capacity: 50,
        careTypes: ['long_term', 'respite'],
      };

      const response = await request(app.getHttpServer())
        .post('/residences')
        .send(createDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(createDto.name);
      expect(response.body.capacity).toBe(createDto.capacity);
      
      residenceId = response.body.id;
    });

    it('GET /residences/:id - should get residence by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/residences/${residenceId}`)
        .expect(200);

      expect(response.body.id).toBe(residenceId);
      expect(response.body.name).toBe('Sunset Manor');
    });

    it('GET /residences - should list all residences', async () => {
      const response = await request(app.getHttpServer())
        .get('/residences')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
    });

    it('GET /residences/:id/occupancy - should get occupancy stats', async () => {
      const response = await request(app.getHttpServer())
        .get(`/residences/${residenceId}/occupancy`)
        .expect(200);

      expect(response.body).toHaveProperty('capacity');
      expect(response.body).toHaveProperty('currentOccupancy');
      expect(response.body).toHaveProperty('availableBeds');
    });
  });

  describe('Room Operations', () => {
    it('POST /rooms - should create a room', async () => {
      const createDto = {
        residenceId,
        roomNumber: '101',
        floor: '1',
        roomType: 'private',
        status: 'available',
        capacity: 1,
        dailyRate: 150.00,
        amenities: ['private_bathroom', 'tv'],
      };

      const response = await request(app.getHttpServer())
        .post('/rooms')
        .send(createDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.roomNumber).toBe(createDto.roomNumber);
      
      roomId = response.body.id;
    });

    it('GET /rooms - should list rooms by residence', async () => {
      const response = await request(app.getHttpServer())
        .get('/rooms')
        .query({ residenceId })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
    });

    it('GET /rooms/available - should list available rooms', async () => {
      const response = await request(app.getHttpServer())
        .get('/rooms/available')
        .query({ residenceId })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((room: any) => {
        expect(room.status).toBe('available');
      });
    });
  });

  describe('Resident Operations', () => {
    it('POST /residents - should admit a resident', async () => {
      const createDto = {
        residenceId,
        roomId,
        firstName: 'John',
        lastName: 'Smith',
        dateOfBirth: '1945-03-15',
        gender: 'male',
        status: 'active',
        admissionDate: new Date().toISOString().split('T')[0],
        careLevel: 'intermediate',
      };

      const response = await request(app.getHttpServer())
        .post('/residents')
        .send(createDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.firstName).toBe(createDto.firstName);
      expect(response.body.status).toBe('active');
      
      residentId = response.body.id;
    });

    it('GET /residents/:id - should get resident details', async () => {
      const response = await request(app.getHttpServer())
        .get(`/residents/${residentId}`)
        .expect(200);

      expect(response.body.id).toBe(residentId);
      expect(response.body.firstName).toBe('John');
    });

    it('PATCH /residents/:id - should update resident info', async () => {
      const updateDto = {
        careLevel: 'high',
        dietaryRestrictions: ['diabetic', 'low_sodium'],
      };

      const response = await request(app.getHttpServer())
        .patch(`/residents/${residentId}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.careLevel).toBe(updateDto.careLevel);
    });

    it('GET /residents - should list residents by residence', async () => {
      const response = await request(app.getHttpServer())
        .get('/residents')
        .query({ residenceId })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Shift Operations', () => {
    let shiftId: string;

    it('POST /shifts - should create a shift', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const createDto = {
        residenceId,
        caregiverId: uuid(),
        shiftType: 'day',
        startTime: new Date(tomorrow.setHours(7, 0, 0, 0)).toISOString(),
        endTime: new Date(tomorrow.setHours(15, 0, 0, 0)).toISOString(),
        status: 'scheduled',
      };

      const response = await request(app.getHttpServer())
        .post('/shifts')
        .send(createDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.shiftType).toBe(createDto.shiftType);
      
      shiftId = response.body.id;
    });

    it('GET /shifts - should list shifts by residence', async () => {
      const response = await request(app.getHttpServer())
        .get('/shifts')
        .query({ residenceId })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('PATCH /shifts/:id/clock-in - should clock in a shift', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/shifts/${shiftId}/clock-in`)
        .send({ actualStart: new Date().toISOString() })
        .expect(200);

      expect(response.body.actualStart).toBeDefined();
      expect(response.body.status).toBe('in_progress');
    });

    it('PATCH /shifts/:id/clock-out - should clock out a shift', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/shifts/${shiftId}/clock-out`)
        .send({ actualEnd: new Date().toISOString() })
        .expect(200);

      expect(response.body.actualEnd).toBeDefined();
      expect(response.body.status).toBe('completed');
    });
  });
});
