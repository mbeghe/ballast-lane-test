import { Test, TestingModule } from '@nestjs/testing';
import { AIService } from './ai.service';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { ICD10Code } from '../interfaces/icd10-code.interface';
import { Logger } from '@nestjs/common';

jest.mock('openai');

describe('AIService', () => {
  let service: AIService;
  let configService: ConfigService;
  let openaiInstance: any;
  let loggerErrorSpy: jest.SpyInstance;
  
  beforeEach(async () => {
    const configServiceMock = {
      get: jest.fn().mockReturnValue('fake-api-key'),
    };

    openaiInstance = {
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
    };

    (OpenAI as unknown as jest.Mock).mockImplementation(() => openaiInstance);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AIService,
        { provide: ConfigService, useValue: configServiceMock },
      ],
    }).compile();

    service = module.get<AIService>(AIService);
    configService = module.get<ConfigService>(ConfigService);
    loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return a valid ICD10Code when OpenAI responds with correct JSON', async () => {
    const fakeResponse = {
      choices: [
        {
          message: {
            content: '{"code": "J45", "title": "Asthma"}',
          },
        },
      ],
    };

    openaiInstance.chat.completions.create.mockResolvedValue(fakeResponse);

    const result = await service.suggestICD10Code('asthma');
    expect(result).toEqual({ code: 'J45', title: 'Asthma' });
  });

  it('should return null if OpenAI response is not valid JSON', async () => {
    const invalidJsonResponse = {
      choices: [
        {
          message: {
            content: 'not a json string',
          },
        },
      ],
    };

    openaiInstance.chat.completions.create.mockResolvedValue(
      invalidJsonResponse,
    );

    const result = await service.suggestICD10Code('asthma');
    expect(result).toBeNull();
  });

  it('should return null if OpenAI throws an error', async () => {
    openaiInstance.chat.completions.create.mockRejectedValue(
      new Error('API failure'),
    );

    const result = await service.suggestICD10Code('asthma');
    expect(result).toBeNull();
  });

  it('should include options in the prompt when provided', async () => {
    const fakeResponse = {
      choices: [
        {
          message: {
            content: '{"code": "J45", "title": "Asthma"}',
          },
        },
      ],
    };

    openaiInstance.chat.completions.create.mockResolvedValue(fakeResponse);

    const options: ICD10Code[] = [
      { code: 'J45', title: 'Asthma' },
      { code: 'I10', title: 'Hypertension' },
    ];

    await service.suggestICD10Code('asthma', options);

    const callArgs = openaiInstance.chat.completions.create.mock.calls[0][0];
    expect(callArgs.messages[1].content).toContain('J45 (Asthma)');
    expect(callArgs.messages[1].content).toContain('I10 (Hypertension)');
  });
});
