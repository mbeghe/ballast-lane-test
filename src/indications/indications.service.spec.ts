// src/indications/indications.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { IndicationsService } from './indications.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Indication } from 'src/entities/indication.entity';
import { ProgramsService } from 'src/programs/programs.service';
import { CreateIndicationDto } from './dtos/create-indication.dto';
import { UpdateIndicationDto } from './dtos/update-indication.dto';
import { LABEL_SOURCES } from 'src/common/types/label-source-type';
import { Logger } from '@nestjs/common';
import { Program } from 'src/entities/program.entity';

describe('IndicationsService', () => {
  let service: IndicationsService;
  let mockIndicationRepo: jest.Mocked<Repository<Indication>>;
  let mockProgramsService: Partial<ProgramsService>;
  let loggerErrorSpy: jest.SpyInstance;

  const mockProgram = {
    id: 1,
    programId: 'test-program-id',
    drug: 'TestDrug',
    createdAt: new Date(),
  };

  let mockIndication: Indication;

  beforeEach(async () => {
    mockIndication = {
      id: 1,
      title: 'TestTitle',
      description: 'TestDescription',
      icd10Code: 'A00',
      icd10Title: 'Cholera',
      source: LABEL_SOURCES.MANUAL,
      createdAt: new Date(),
      program: mockProgram as any,
    } as Indication;

    mockProgramsService = {
      findEntityByProgramId: jest.fn().mockResolvedValue(mockProgram),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IndicationsService,
        {
          provide: ProgramsService,
          useValue: mockProgramsService,
        },
        {
          provide: getRepositoryToken(Indication),
          useValue: {
            save: jest.fn(),
            delete: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<IndicationsService>(IndicationsService);
    mockIndicationRepo = module.get(getRepositoryToken(Indication));
    loggerErrorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
  it('should throw InternalServerErrorException if save fails on create', async () => {
    const dto: CreateIndicationDto = {
      programId: mockProgram.programId,
      title: 'New Title',
      description: 'New Description',
    };

    mockProgramsService.findEntityByProgramId = jest
      .fn()
      .mockResolvedValue(mockProgram);
    mockIndicationRepo.save.mockRejectedValue({
      stack: 'error stack',
      detail: 'save error',
    });

    await expect(service.create(dto)).rejects.toThrow(
      'Failed to save indication',
    );
  });

  it('should throw InternalServerErrorException if save fails on update', async () => {
    const dto: UpdateIndicationDto = { title: 'Updated' };

    mockIndicationRepo.findOne.mockResolvedValue(mockIndication);
    mockIndicationRepo.save.mockRejectedValue({
      stack: 'error stack',
      message: 'update error',
    });

    await expect(service.update(1, dto)).rejects.toThrow(
      'Failed to update indication',
    );
  });

  it('should throw if updating programId to non-existent program', async () => {
    const dto: UpdateIndicationDto = { programId: 'new-id' };

    mockIndicationRepo.findOne.mockResolvedValue({
      ...mockIndication,
      program: {
        id: 99,
        programId: 'old-id',
        drug: 'OldDrug',
        createdAt: new Date(),
        indications: [],
      } as Program,
    });

    mockProgramsService.findEntityByProgramId = jest
      .fn()
      .mockResolvedValue(null);

    await expect(service.update(1, dto)).rejects.toThrow(
      'Program with ID new-id not found',
    );
  });

  it('should create an indication', async () => {
    const dto: CreateIndicationDto = {
      programId: mockProgram.programId,
      title: mockIndication.title,
      description: mockIndication.description,
      icd10Code: mockIndication.icd10Code,
      icd10Title: mockIndication.icd10Title,
    };

    mockIndicationRepo.save.mockResolvedValue({ ...mockIndication, ...dto });

    const result = await service.create(dto);
    expect(result.title).toBe(dto.title);
    expect(result.program.programId).toBe(dto.programId);
  });

  it('should throw if program not found on create', async () => {
    (mockProgramsService.findEntityByProgramId as jest.Mock).mockResolvedValue(
      null,
    );

    const dto: CreateIndicationDto = {
      programId: 'non-existent',
      title: 't',
      description: 'd',
    };

    try {
      await service.create(dto);
      fail('Expected error was not thrown');
    } catch (error: any) {
      expect(error.message).toBe(
        'Program with programId non-existent not found',
      );
    }
  });

  it('should delete an indication', async () => {
    mockIndicationRepo.delete.mockResolvedValue({ affected: 1, raw: {} });

    await expect(service.remove(1)).resolves.toBeUndefined();
  });

  it('should throw if indication not found on delete', async () => {
    mockIndicationRepo.delete.mockResolvedValue({ affected: 0, raw: {} });

    await expect(service.remove(999)).rejects.toThrow(
      'Indication with ID 999 not found',
    );
  });

  it('should return an indication by id', async () => {
    mockIndicationRepo.findOne.mockResolvedValue(mockIndication);

    try {
      const result = await service.findOne(1);
      expect(result.id).toBe(1);
    } catch (error) {
      fail(`Unexpected error thrown: ${error.message}`);
    }
  });

  it('should throw if indication not found', async () => {
    mockIndicationRepo.findOne.mockResolvedValue(null);

    await expect(service.findOne(999)).rejects.toThrow(
      'Indication with ID 999 not found',
    );
  });

  it('should update an indication', async () => {
    const dto: UpdateIndicationDto = {
      title: 'Updated',
    };

    mockIndicationRepo.findOne.mockResolvedValue(mockIndication);
    mockIndicationRepo.save.mockResolvedValue({ ...mockIndication, ...dto });

    const result = await service.update(1, dto);
    expect(result.title).toBe('Updated');
  });

  it('should throw if updating non-existent indication', async () => {
    mockIndicationRepo.findOne.mockResolvedValue(null);

    await expect(service.update(999, { title: 'test' })).rejects.toThrow(
      'Indication with ID 999 not found',
    );
  });

  it('should find all indications', async () => {
    mockIndicationRepo.find.mockResolvedValue([mockIndication]);

    const result = await service.findAll();
    expect(result.length).toBe(1);
    expect(result[0].title).toBe('TestTitle');
  });
});
