import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { ResidenceService } from './residence.service';
import { Residence } from '../entities/residence.entity';
import { Room } from '../entities/room.entity';
import { Resident } from '../entities/resident.entity';

describe('ResidenceService', () => {
  let service: ResidenceService;
  let residenceRepository: any;
  let roomRepository: any;
  let residentRepository: any;

  const mockResidence = {
    id: uuid(),
    agencyId: uuid(),
    name: 'Sunset Manor',
    status: 'active',
    addressLine1: '123 Care Street',
    city: 'Toronto',
    province: 'ON',
    postalCode: 'M5V 3A8',
    capacity: 50,
    currentOccupancy: 25,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    residenceRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
        getMany: jest.fn().mockResolvedValue([]),
      })),
    };

    roomRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      count: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    };

    residentRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      count: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResidenceService,
        {
          provide: getRepositoryToken(Residence),
          useValue: residenceRepository,
        },
        {
          provide: getRepositoryToken(Room),
          useValue: roomRepository,
        },
        {
          provide: getRepositoryToken(Resident),
          useValue: residentRepository,
        },
      ],
    }).compile();

    service = module.get<ResidenceService>(ResidenceService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all residences', async () => {
      const residences = [mockResidence];
      residenceRepository.find.mockResolvedValue(residences);

      const result = await service.findAll();

      expect(result).toEqual(residences);
      expect(residenceRepository.find).toHaveBeenCalled();
    });

    it('should filter by agency id', async () => {
      const agencyId = uuid();
      const residences = [mockResidence];
      residenceRepository.find.mockResolvedValue(residences);

      const result = await service.findAll({ agencyId });

      expect(result).toEqual(residences);
      expect(residenceRepository.find).toHaveBeenCalledWith({
        where: { agencyId },
      });
    });
  });

  describe('findOne', () => {
    it('should return a residence by id', async () => {
      residenceRepository.findOneBy.mockResolvedValue(mockResidence);

      const result = await service.findOne(mockResidence.id);

      expect(result).toEqual(mockResidence);
    });

    it('should throw NotFoundException when residence not found', async () => {
      residenceRepository.findOneBy.mockResolvedValue(null);

      await expect(service.findOne(uuid())).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new residence', async () => {
      const createDto = {
        agencyId: uuid(),
        name: 'New Residence',
        addressLine1: '456 Care Ave',
        city: 'Ottawa',
        province: 'ON',
        postalCode: 'K1A 0A1',
        capacity: 30,
      };

      residenceRepository.create.mockReturnValue({ ...createDto, id: uuid() });
      residenceRepository.save.mockResolvedValue({ ...createDto, id: uuid() });

      const result = await service.create(createDto);

      expect(result).toHaveProperty('id');
      expect(residenceRepository.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('getOccupancy', () => {
    it('should return occupancy statistics', async () => {
      residenceRepository.findOneBy.mockResolvedValue(mockResidence);
      roomRepository.count.mockResolvedValue(50);
      residentRepository.count.mockResolvedValue(25);

      const result = await service.getOccupancy(mockResidence.id);

      expect(result).toHaveProperty('capacity');
      expect(result).toHaveProperty('currentOccupancy');
      expect(result).toHaveProperty('availableBeds');
      expect(result.capacity).toBe(50);
    });

    it('should throw NotFoundException for invalid residence', async () => {
      residenceRepository.findOneBy.mockResolvedValue(null);

      await expect(service.getOccupancy(uuid())).rejects.toThrow(NotFoundException);
    });
  });

  describe('checkCapacity', () => {
    it('should return true when capacity available', async () => {
      residenceRepository.findOneBy.mockResolvedValue({
        ...mockResidence,
        capacity: 50,
        currentOccupancy: 25,
      });

      const result = await service.checkCapacity(mockResidence.id);

      expect(result).toBe(true);
    });

    it('should return false when at capacity', async () => {
      residenceRepository.findOneBy.mockResolvedValue({
        ...mockResidence,
        capacity: 50,
        currentOccupancy: 50,
      });

      const result = await service.checkCapacity(mockResidence.id);

      expect(result).toBe(false);
    });
  });

  describe('updateOccupancy', () => {
    it('should increment occupancy on admission', async () => {
      residenceRepository.findOneBy.mockResolvedValue({
        ...mockResidence,
        currentOccupancy: 25,
      });
      residenceRepository.save.mockResolvedValue({
        ...mockResidence,
        currentOccupancy: 26,
      });

      const result = await service.updateOccupancy(mockResidence.id, 'admit');

      expect(result.currentOccupancy).toBe(26);
    });

    it('should decrement occupancy on discharge', async () => {
      residenceRepository.findOneBy.mockResolvedValue({
        ...mockResidence,
        currentOccupancy: 25,
      });
      residenceRepository.save.mockResolvedValue({
        ...mockResidence,
        currentOccupancy: 24,
      });

      const result = await service.updateOccupancy(mockResidence.id, 'discharge');

      expect(result.currentOccupancy).toBe(24);
    });

    it('should throw error when admitting at capacity', async () => {
      residenceRepository.findOneBy.mockResolvedValue({
        ...mockResidence,
        capacity: 50,
        currentOccupancy: 50,
      });

      await expect(
        service.updateOccupancy(mockResidence.id, 'admit'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getResidencesByStatus', () => {
    it('should return residences filtered by status', async () => {
      const residences = [mockResidence];
      residenceRepository.find.mockResolvedValue(residences);

      const result = await service.getResidencesByStatus('active');

      expect(result).toEqual(residences);
      expect(residenceRepository.find).toHaveBeenCalledWith({
        where: { status: 'active' },
      });
    });
  });

  describe('getStaffingRequirements', () => {
    it('should return staffing requirements for residence', async () => {
      const requirements = {
        day: { minStaff: 5, preferredStaff: 7 },
        evening: { minStaff: 4, preferredStaff: 5 },
        night: { minStaff: 2, preferredStaff: 3 },
      };

      residenceRepository.findOne.mockResolvedValue({
        ...mockResidence,
        staffingRequirements: requirements,
      });

      const result = await service.getStaffingRequirements(mockResidence.id);

      expect(result).toHaveProperty('day');
      expect(result).toHaveProperty('evening');
      expect(result).toHaveProperty('night');
    });
  });
});
