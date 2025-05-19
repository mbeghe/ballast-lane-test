import { Test, TestingModule } from '@nestjs/testing';
import { LabelsService } from './labels.service';
import { DataRetrievalService } from './data-retrieval/data-retrieval.service';
import { DataProcessService } from './data-process/data-process.service';
import { AIService } from './ai/ai.service';
import { ProgramsService } from '../programs/programs.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Indication } from '../entities/indication.entity';
import { Repository } from 'typeorm';
import { Program } from '../entities/program.entity';
import {
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

const mockDataRetrievalService = {
  getProgramIdByLabel: jest.fn(),
  getXMLByProgramId: jest.fn(),
  getICD10Codes: jest.fn(),
};

const mockDataProcessService = {
  processXML: jest.fn(),
};

const mockAIService = {
  suggestICD10Code: jest.fn(),
};

const mockProgramsService = {
  findOrCreateProgram: jest.fn(),
};

const mockIndicationRepo = {
  save: jest.fn(),
};

const mockProgram: Program = {
  id: 1,
  programId: 'test-program-id',
  drug: 'TestDrug',
  createdAt: new Date(),
  indications: [],
};

describe('LabelsService', () => {
  let service: LabelsService;
  let loggerErrorSpy: jest.SpyInstance;
  
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LabelsService,
        { provide: DataRetrievalService, useValue: mockDataRetrievalService },
        { provide: DataProcessService, useValue: mockDataProcessService },
        { provide: AIService, useValue: mockAIService },
        { provide: ProgramsService, useValue: mockProgramsService },
        {
          provide: getRepositoryToken(Indication),
          useValue: mockIndicationRepo,
        },
      ],
    }).compile();

    service = module.get<LabelsService>(LabelsService);
    loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should process a label with one ICD10 match', async () => {
    mockDataRetrievalService.getProgramIdByLabel.mockResolvedValue('123');
    mockProgramsService.findOrCreateProgram.mockResolvedValue(mockProgram);
    mockDataRetrievalService.getXMLByProgramId.mockResolvedValue('<xml>...</xml>');
    mockDataProcessService.processXML.mockResolvedValue([
      { title: 'Asthma', description: 'Description for Asthma' },
    ]);
    mockDataRetrievalService.getICD10Codes.mockResolvedValue([
      { code: 'J45', title: 'Asthma' },
    ]);
    mockIndicationRepo.save.mockImplementation((dto) =>
      Promise.resolve({ id: 1, ...dto }),
    );

    const result = await service.processLabel('SomeLabel');

    expect(result).toEqual([
      {
        id: 1,
        title: 'Asthma',
        description: 'Description for Asthma',
        icd10Code: 'J45',
        icd10Title: 'Asthma',
        source: 'dataset',
      },
    ]);
  });

  it('should mark as unmappable when no ICD10 match', async () => {
    mockDataRetrievalService.getProgramIdByLabel.mockResolvedValue('123');
    mockProgramsService.findOrCreateProgram.mockResolvedValue(mockProgram);
    mockDataRetrievalService.getXMLByProgramId.mockResolvedValue('<xml>...</xml>');
    mockDataProcessService.processXML.mockResolvedValue([
      { title: 'Unknown', description: 'Desc' },
    ]);
    mockDataRetrievalService.getICD10Codes.mockResolvedValue([]);
    mockIndicationRepo.save.mockImplementation((dto) =>
      Promise.resolve({ id: 2, ...dto }),
    );

    const result = await service.processLabel('SomeLabel');

    expect(result[0].source).toBe('unmappable');
    expect(result[0].icd10Code).toBeNull();
  });

  it('should throw BadRequestException if programId is not found', async () => {
    mockDataRetrievalService.getProgramIdByLabel.mockResolvedValue(null);
    await expect(service.processLabel('non-existent-label')).rejects.toThrow(BadRequestException);
  });

  it('should throw InternalServerErrorException if getXMLByProgramId fails', async () => {
    mockDataRetrievalService.getProgramIdByLabel.mockResolvedValue('test-program-id');
    mockProgramsService.findOrCreateProgram.mockResolvedValue(mockProgram);
    mockDataRetrievalService.getXMLByProgramId.mockRejectedValue(new Error('XML fetch error'));

    await expect(service.processLabel('fail-xml')).rejects.toThrow(InternalServerErrorException);
  });

  it('should throw InternalServerErrorException if processXML fails', async () => {
    mockDataRetrievalService.getProgramIdByLabel.mockResolvedValue('test-program-id');
    mockProgramsService.findOrCreateProgram.mockResolvedValue(mockProgram);
    mockDataRetrievalService.getXMLByProgramId.mockResolvedValue('<xml>');
    mockDataProcessService.processXML.mockRejectedValue(new Error('parse error'));

    await expect(service.processLabel('fail-parse')).rejects.toThrow(InternalServerErrorException);
  });

  it('should log a warning if no indications are found', async () => {
    mockDataRetrievalService.getProgramIdByLabel.mockResolvedValue('test-program-id');
    mockProgramsService.findOrCreateProgram.mockResolvedValue(mockProgram);
    mockDataRetrievalService.getXMLByProgramId.mockResolvedValue('<xml>');
    mockDataProcessService.processXML.mockResolvedValue([]);

    const result = await service.processLabel('empty');
    expect(result).toEqual([]);
  });

  it('should handle AI service failure gracefully', async () => {
    mockDataRetrievalService.getProgramIdByLabel.mockResolvedValue('test-program-id');
    mockProgramsService.findOrCreateProgram.mockResolvedValue(mockProgram);
    mockDataRetrievalService.getXMLByProgramId.mockResolvedValue('<xml>');
    mockDataProcessService.processXML.mockResolvedValue([
      { title: 'asthma', description: 'desc' },
    ]);
    mockDataRetrievalService.getICD10Codes.mockResolvedValue([
      { code: 'J45', title: 'Asthma' },
      { code: 'I10', title: 'Hypertension' },
    ]);
    mockAIService.suggestICD10Code.mockRejectedValue(new Error('AI fail'));
    mockIndicationRepo.save.mockResolvedValue({ id: 1 });

    const result = await service.processLabel('label');
    expect(result.length).toBe(1);
    expect(result[0].source).toBe('unmappable');
  });

  it('should throw InternalServerErrorException if saving indication fails', async () => {
    mockDataRetrievalService.getProgramIdByLabel.mockResolvedValue('test-program-id');
    mockProgramsService.findOrCreateProgram.mockResolvedValue(mockProgram);
    mockDataRetrievalService.getXMLByProgramId.mockResolvedValue('<xml>');
    mockDataProcessService.processXML.mockResolvedValue([
      { title: 'asthma', description: 'desc' },
    ]);
    mockDataRetrievalService.getICD10Codes.mockResolvedValue([
      { code: 'J45', title: 'Asthma' },
    ]);
    mockIndicationRepo.save.mockRejectedValue(new Error('DB error'));

    await expect(service.processLabel('fail-save')).rejects.toThrow(InternalServerErrorException);
  });
});
