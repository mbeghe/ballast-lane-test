import { Test, TestingModule } from '@nestjs/testing';
import { DataRetrievalService } from './data-retrieval.service';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { AxiosHeaders, AxiosResponse } from 'axios';
import { Logger } from '@nestjs/common';

describe('DataRetrievalService', () => {
  let service: DataRetrievalService;
  let mockHttpService: { axiosRef: { get: jest.Mock } };
  let configService: any;
  let loggerErrorSpy: jest.SpyInstance;

  beforeEach(async () => {
    mockHttpService = {
      axiosRef: {
        get: jest.fn(),
      },
    };

    configService = {
      get: jest.fn((key: string) => {
        if (key === 'DAILYMED_API_BASE') return 'https://mock-dailymed.com';
        if (key === 'ICD10_API_BASE') return 'https://mock-icd10.com';
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DataRetrievalService,
        { provide: ConfigService, useValue: configService },
        { provide: HttpService, useValue: mockHttpService },
      ],
    }).compile();

    service = module.get<DataRetrievalService>(DataRetrievalService);
    loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
  });

  function createMockAxiosResponse<T>(data: T): AxiosResponse<T> {
    return {
      data,
      status: 200,
      statusText: 'OK',
      headers: new AxiosHeaders(),
      config: {
        headers: new AxiosHeaders(),
      },
    };
  }

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return programId when label is found', async () => {
    mockHttpService.axiosRef.get.mockResolvedValueOnce(
      createMockAxiosResponse({ data: [{ setid: '1234' }] }),
    );

    const result = await service.getProgramIdByLabel('Dupixent');
    expect(result).toBe('1234');
  });

  it('should return null when label is not found', async () => {
    mockHttpService.axiosRef.get.mockResolvedValueOnce(
      createMockAxiosResponse({ data: [] }),
    );

    const result = await service.getProgramIdByLabel('Unknown');
    expect(result).toBeNull();
  });

  it('should return null on error in getProgramIdByLabel', async () => {
    mockHttpService.axiosRef.get.mockRejectedValueOnce(new Error('Failed'));
    const result = await service.getProgramIdByLabel('FailLabel');
    expect(result).toBeNull();
  });

  it('should fetch XML by programId', async () => {
    const mockXML = '<xml>test</xml>';
    mockHttpService.axiosRef.get.mockResolvedValueOnce(
      createMockAxiosResponse(mockXML),
    );

    const result = await service.getXMLByProgramId('abcd');
    expect(result).toBe(mockXML);
  });

  it('should throw on getXMLByProgramId error', async () => {
    mockHttpService.axiosRef.get.mockRejectedValueOnce(new Error('Fetch error'));

    await expect(service.getXMLByProgramId('bad-id')).rejects.toThrow('Fetch error');
  });

  it('should return ICD10 codes from valid response', async () => {
    mockHttpService.axiosRef.get.mockResolvedValueOnce(
      createMockAxiosResponse([
        'meta',
        ['K20.0', 'L28.1'],
        'meta',
        [['a', 'Esophagitis'], ['b', 'Nodularis']],
      ]),
    );

    const result = await service.getICD10Codes('term');
    expect(result).toEqual([
      { code: 'K20.0', title: 'Esophagitis' },
      { code: 'L28.1', title: 'Nodularis' },
    ]);
  });

  it('should return empty array if ICD10 structure is invalid', async () => {
    mockHttpService.axiosRef.get.mockResolvedValueOnce(
      createMockAxiosResponse(['meta', null, 'meta', null]),
    );

    const result = await service.getICD10Codes('term');
    expect(result).toEqual([]);
  });

  it('should return empty array on ICD10 API error', async () => {
    mockHttpService.axiosRef.get.mockRejectedValueOnce(new Error('ICD API down'));
    const result = await service.getICD10Codes('error');
    expect(result).toEqual([]);
  });

  it('should throw if DAILYMED_API_BASE is missing', () => {
    configService.get = jest.fn((key: string) =>
      key === 'ICD10_API_BASE' ? 'https://mock-icd10.com' : undefined,
    );

    expect(() => {
      new DataRetrievalService(configService, mockHttpService as any);
    }).toThrow('DAILYMED_API_BASE not defined in environment variables!');
  });

  it('should throw if ICD10_API_BASE is missing', () => {
    configService.get = jest.fn((key: string) =>
      key === 'DAILYMED_API_BASE' ? 'https://mock-dailymed.com' : undefined,
    );

    expect(() => {
      new DataRetrievalService(configService, mockHttpService as any);
    }).toThrow('ICD10_API_BASE not defined in environment variables!');
  });
});
