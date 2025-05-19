import { Test, TestingModule } from '@nestjs/testing';
import { IndicationsController } from './indications.controller';
import { IndicationsService } from './indications.service';
import { CreateIndicationDto } from './dtos/create-indication.dto';
import { UpdateIndicationDto } from './dtos/update-indication.dto';
import { Logger } from '@nestjs/common';

describe('IndicationsController', () => {
  let controller: IndicationsController;
  let service: IndicationsService;
  let loggerErrorSpy: jest.SpyInstance;

  const mockIndicationsService = {
    create: jest.fn(),
    remove: jest.fn(),
    update: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IndicationsController],
      providers: [
        {
          provide: IndicationsService,
          useValue: mockIndicationsService,
        },
      ],
    }).compile();

    controller = module.get<IndicationsController>(IndicationsController);
    service = module.get<IndicationsService>(IndicationsService);
    
    loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create an indication', async () => {
      const dto: CreateIndicationDto = {
        title: 'Test',
        description: 'Desc',
        programId: "test",
        icd10Code: 'A00',
        icd10Title: 'Test Disease',
      };
      const expectedResult = { id: 1, ...dto, program: { id: "test", drug: 'TestDrug' } };
      mockIndicationsService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(dto);
      expect(result).toEqual(expectedResult);
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('remove', () => {
    it('should delete an indication', async () => {
      mockIndicationsService.remove.mockResolvedValue({ success: true });

      const result = await controller.remove(1);
      expect(result).toEqual({ success: true });
      expect(service.remove).toHaveBeenCalledWith(1);
    });
  });

  describe('update', () => {
    it('should update an indication', async () => {
      const dto: UpdateIndicationDto = { title: 'Updated' };
      const expectedResult = { id: 1, ...dto, program: { id: 1, drug: 'UpdatedDrug' } };
      mockIndicationsService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(1, dto);
      expect(result).toEqual(expectedResult);
      expect(service.update).toHaveBeenCalledWith(1, dto);
    });
  });

  describe('findOne', () => {
    it('should return one indication', async () => {
      const expectedResult = { id: 1, title: 'Single', program: { id: 1, drug: 'Drug' } };
      mockIndicationsService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne(1);
      expect(result).toEqual(expectedResult);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('findAll', () => {
    it('should return all indications', async () => {
      const expectedResult = [
        { id: 1, title: 'One', program: { id: 1, drug: 'A' } },
        { id: 2, title: 'Two', program: { id: 2, drug: 'B' } },
      ];
      mockIndicationsService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll();
      expect(result).toEqual(expectedResult);
      expect(service.findAll).toHaveBeenCalled();
    });
  });
});
