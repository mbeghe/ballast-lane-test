import { Test, TestingModule } from '@nestjs/testing';
import { LabelsController } from './labels.controller';
import { LabelsService } from './labels.service';
import { ProcessLabelDto } from './dtos/process-label.dto';
import { IndicationBaseResponseDto } from '../indications/dtos/indication-base-response.dto';

describe('LabelsController', () => {
  let controller: LabelsController;
  let service: LabelsService;

  const mockLabelsService = {
    processLabel: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LabelsController],
      providers: [
        {
          provide: LabelsService,
          useValue: mockLabelsService,
        },
      ],
    }).compile();

    controller = module.get<LabelsController>(LabelsController);
    service = module.get<LabelsService>(LabelsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call service and return processed indications', async () => {
    const labelDto: ProcessLabelDto = { label: 'Dupixent' };

    const expectedResponse: IndicationBaseResponseDto[] = [
      {
        id: 1,
        title: 'Asthma',
        description: 'Some description.',
        icd10Code: 'J45.909',
        icd10Title: 'Unspecified asthma, uncomplicated',
        source: 'dataset',
      },
    ];

    mockLabelsService.processLabel.mockResolvedValue(expectedResponse);

    const result = await controller.processLabel(labelDto);

    expect(service.processLabel).toHaveBeenCalledWith('Dupixent');
    expect(result).toEqual(expectedResponse);
  });
});
