import { Test, TestingModule } from '@nestjs/testing';
import { ProgramsController } from './programs.controller';
import { ProgramsService } from './programs.service';
import { ProgramWithIndicationsResponseDto } from './dtos/program-with-indications-response.dto';
import { FindProgramsDto } from './dtos/find-programs.dto';

describe('ProgramsController', () => {
  let controller: ProgramsController;
  let service: ProgramsService;

  const mockProgramsService = {
    findByFilters: jest.fn(),
    findByProgramId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProgramsController],
      providers: [
        {
          provide: ProgramsService,
          useValue: mockProgramsService,
        },
      ],
    }).compile();

    controller = module.get<ProgramsController>(ProgramsController);
    service = module.get<ProgramsService>(ProgramsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return filtered programs', async () => {
      const filters: FindProgramsDto = { search: 'diabetes' };
      const mockResult: ProgramWithIndicationsResponseDto[] = [
        {
          id: 1,
          drug: 'Metformin',
          programId: 'abc123',
          indications: [],
        },
      ];
      mockProgramsService.findByFilters.mockResolvedValue(mockResult);

      const result = await controller.findAll(filters);
      expect(result).toEqual(mockResult);
      expect(service.findByFilters).toHaveBeenCalledWith(filters);
    });
  });

  describe('findById', () => {
    it('should return a program by ID', async () => {
      const mockResult: ProgramWithIndicationsResponseDto = {
        id: 1,
        drug: 'Insulin',
        programId: 'ins123',
        indications: [],
      };
      mockProgramsService.findByProgramId.mockResolvedValue(mockResult);

      const result = await controller.findById('ins123');
      expect(result).toEqual(mockResult);
      expect(service.findByProgramId).toHaveBeenCalledWith('ins123');
    });
  });
});
