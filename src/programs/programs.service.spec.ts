import { Test, TestingModule } from '@nestjs/testing';
import { ProgramsService } from './programs.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Program } from 'src/entities/program.entity';
import { Repository } from 'typeorm';
import { Logger, NotFoundException } from '@nestjs/common';
import { FindProgramsDto } from './dtos/find-programs.dto';

const mockProgramRepo = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  createQueryBuilder: jest.fn(() => mockQueryBuilder),
});

const mockQueryBuilder: any = {
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  getMany: jest.fn(),
};

describe('ProgramsService', () => {
  let service: ProgramsService;
  let repo: jest.Mocked<Repository<Program>>;
  let loggerErrorSpy: jest.SpyInstance;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgramsService,
        { provide: getRepositoryToken(Program), useFactory: mockProgramRepo },
      ],
    }).compile();

    service = module.get<ProgramsService>(ProgramsService);
    repo = module.get(getRepositoryToken(Program));
    loggerErrorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => {});
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find or create a new program', async () => {
    const drug = 'testDrug';
    const programId = '123';
    const program = { id: 1, drug, programId } as Program;

    repo.findOne.mockResolvedValueOnce(null);
    repo.create.mockReturnValue(program);
    repo.save.mockResolvedValue(program);

    const result = await service.findOrCreateProgram(drug, programId);
    expect(result).toEqual(program);
    expect(repo.save).toHaveBeenCalledWith(program);
  });

  it('should return an existing program', async () => {
    const drug = 'existingDrug';
    const programId = '321';
    const program = { id: 2, drug, programId } as Program;

    repo.findOne.mockResolvedValue(program);

    const result = await service.findOrCreateProgram(drug, programId);
    expect(result).toEqual(program);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('should find program by programId and return DTO', async () => {
    const programId = 'prog123';
    const program = {
      id: 5,
      programId,
      drug: 'test-drug',
      indications: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Program;
    repo.findOne.mockResolvedValue(program);

    const result = await service.findByProgramId(programId);
    expect(result.programId).toEqual(programId);
  });

  it('should throw NotFoundException if program not found', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.findByProgramId('notfound')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should find programs with filters', async () => {
    const filters: FindProgramsDto = { search: 'test' };
    const mockPrograms = [
      {
        id: 1,
        programId: 'p1',
        drug: 'drug1',
        indications: [],
        createdAt: new Date(),
      } as Program,
    ];

    mockQueryBuilder.getMany.mockResolvedValue(mockPrograms);

    const result = await service.findByFilters(filters);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].programId).toBe('p1');
  });
});
