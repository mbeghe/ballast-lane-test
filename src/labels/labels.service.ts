import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { DataRetrievalService } from './data-retrieval/data-retrieval.service';
import { DataProcessService } from './data-process/data-process.service';
import { AIService } from './ai/ai.service';
import { Indication } from 'src/entities/indication.entity';
import { IndicationBaseResponseDto } from '../indications/dtos/indication-base-response.dto';
import { ICD10Code } from './interfaces/icd10-code.interface';
import { LabelSource } from 'src/common/types/label-source-type';
import { Program } from 'src/entities/program.entity';
import { ProgramsService } from 'src/programs/programs.service';

@Injectable()
export class LabelsService {
  private readonly logger = new Logger(LabelsService.name);

  constructor(
    private readonly dataRetrieval: DataRetrievalService,
    private readonly dataProcess: DataProcessService,
    private readonly aiService: AIService,
    private readonly programsService: ProgramsService,
    @InjectRepository(Indication)
    private readonly indicationsRepo: Repository<Indication>,
  ) {}

  async processLabel(labelName: string): Promise<IndicationBaseResponseDto[]> {
    this.logger.log(`Processing label: ${labelName}`);

    const programId = await this.dataRetrieval.getProgramIdByLabel(labelName);

    if (!programId) {
      this.logger.warn(`ProgramId not found for label: ${labelName}`);
      throw new BadRequestException(`No DailyMed entry found for label "${labelName}"`);
    }

    const program = await this.programsService.findOrCreateProgram(labelName, programId);

    let xml: string;
    try {
      xml = await this.dataRetrieval.getXMLByProgramId(programId);
    } catch (error: any) {
      this.logger.error(`Error retrieving XML for programId ${programId}: ${error?.message ?? error}`);
      throw new InternalServerErrorException(`Failed to fetch SPL XML for "${labelName}"`);
    }

    let indications: { title: string; description: string }[];

    try {
      indications = await this.dataProcess.processXML(xml);
      if (!indications.length) {
        this.logger.warn(`No indications found in XML for programId ${programId}`);
      } else {
        this.logger.log(`Parsed ${indications.length} indications from XML`);
      }
    } catch (error: any) {
      this.logger.error(`Error parsing indications from XML: ${error?.message ?? error}`);
      throw new InternalServerErrorException(`Failed to parse indications for "${labelName}"`);
    }

    const mapped: IndicationBaseResponseDto[] = [];

    for (const indication of indications) {
      let codes: ICD10Code[] = [];
      let icd10: ICD10Code | null = null;
      let labelSource: LabelSource = 'dataset';

      try {
        codes = await this.dataRetrieval.getICD10Codes(indication.title);
      } catch (error: any) {
        this.logger.error(`Error querying ICD10 codes for "${indication.title}": ${error?.message ?? error}`);
        codes = [];
      }

      if (codes.length === 1) {
        icd10 = codes[0];
      } else if (codes.length > 1) {
        try {
          icd10 = await this.aiService.suggestICD10Code(indication.title, codes);
          labelSource = icd10 ? 'ai' : 'unmappable';
        } catch (error: any) {
          this.logger.error(`AI mapping failed for "${indication.title}": ${error?.message ?? error}`);
          labelSource = 'unmappable';
        }
      } else {
        labelSource = 'unmappable';
      }
      
      try {
        const saved = await this.indicationsRepo.save({
          title: indication.title,
          description: indication.description,
          icd10Code: icd10?.code ?? null,
          icd10Title: icd10?.title ?? null,
          source: labelSource,
          program
        } as Partial<Indication>);

        mapped.push({
        id: saved.id,
        title: indication.title,
        description: indication.description,
        icd10Code: icd10?.code ?? null,
        icd10Title: icd10?.title ?? null,
        source: labelSource,
      });
      } catch (error: any) {
        this.logger.error(`DB save failed for "${indication.title}": ${error?.message ?? error}`);
        throw new InternalServerErrorException(`Failed to save indication "${indication.title}"`);
      }

      
    }

    this.logger.log(`Finished processing ${mapped.length} indications for label "${labelName}"`);
    return mapped;
  }
}
