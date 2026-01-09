import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { AgencyService } from './agency.service';
import { Agency } from '../entities/agency.entity';

describe('AgencyService', () => {
  let service: AgencyService;
  let mockRepository: any;

  const mockAgency = {
    id: uuid(),
    name: 'Test Agency',
    code: 'TEST001',
    province: 'ON',
    status: 'active',
    email: 'test@agency.com',
    phone: '555-123-4567',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockRepository = {
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
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
        getOne: jest.fn().mockResolvedValue(null),
      })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgencyService,
        {
          provide: getRepositoryToken(Agency),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AgencyService>(AgencyService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return an array of agencies', async () => {
      const agencies = [mockAgency];
      mockRepository.find.mockResolvedValue(agencies);

      const result = await service.findAll();

      expect(result).toEqual(agencies);
      expect(mockRepository.find).toHaveBeenCalled();
    });

    it('should return empty array when no agencies exist', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return an agency by id', async () => {
      mockRepository.findOneBy.mockResolvedValue(mockAgency);

      const result = await service.findOne(mockAgency.id);

      expect(result).toEqual(mockAgency);
      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: mockAgency.id });
    });

    it('should throw NotFoundException when agency not found', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      await expect(service.findOne(uuid())).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new agency', async () => {
      const createDto = {
        name: 'New Agency',
        code: 'NEW001',
        province: 'BC',
        email: 'new@agency.com',
      };

      mockRepository.create.mockReturnValue({ ...createDto, id: uuid() });
      mockRepository.save.mockResolvedValue({ ...createDto, id: uuid() });

      const result = await service.create(createDto);

      expect(result).toHaveProperty('id');
      expect(mockRepository.create).toHaveBeenCalledWith(createDto);
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update an existing agency', async () => {
      const updateDto = { name: 'Updated Agency Name' };
      mockRepository.findOneBy.mockResolvedValue(mockAgency);
      mockRepository.save.mockResolvedValue({ ...mockAgency, ...updateDto });

      const result = await service.update(mockAgency.id, updateDto);

      expect(result.name).toBe(updateDto.name);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when updating non-existent agency', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      await expect(service.update(uuid(), { name: 'Test' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove an agency', async () => {
      mockRepository.findOneBy.mockResolvedValue(mockAgency);
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      await expect(service.remove(mockAgency.id)).resolves.not.toThrow();
      expect(mockRepository.delete).toHaveBeenCalledWith(mockAgency.id);
    });

    it('should throw NotFoundException when removing non-existent agency', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      await expect(service.remove(uuid())).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByProvince', () => {
    it('should return agencies filtered by province', async () => {
      const agencies = [mockAgency];
      mockRepository.find.mockResolvedValue(agencies);

      const result = await service.findByProvince('ON');

      expect(result).toEqual(agencies);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { province: 'ON' },
      });
    });
  });

  describe('findActiveAgencies', () => {
    it('should return only active agencies', async () => {
      const agencies = [mockAgency];
      mockRepository.find.mockResolvedValue(agencies);

      const result = await service.findActiveAgencies();

      expect(result).toEqual(agencies);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { status: 'active' },
      });
    });
  });

  describe('getAgencyStats', () => {
    it('should return agency statistics', async () => {
      const stats = {
        totalCaregivers: 50,
        activePatients: 100,
        pendingApplications: 5,
      };

      mockRepository.createQueryBuilder.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(stats),
      });

      const result = await service.getAgencyStats(mockAgency.id);

      expect(result).toHaveProperty('totalCaregivers');
      expect(result).toHaveProperty('activePatients');
    });
  });
});
