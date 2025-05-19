import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { LabelsController } from './labels.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Indication } from 'src/entities/indication.entity';
import { LabelsService } from './labels.service';
import { AIService } from './ai/ai.service';
import { DataProcessService } from './data-process/data-process.service';
import { DataRetrievalService } from './data-retrieval/data-retrieval.service';
import { Program } from 'src/entities/program.entity';
import { ProgramsService } from 'src/programs/programs.service';

@Module({
  imports: [HttpModule, TypeOrmModule.forFeature([Indication, Program])],
  controllers: [LabelsController],
  providers: [
    LabelsService,
    DataRetrievalService,
    DataProcessService,
    AIService,
    ProgramsService,
  ],
})
export class LabelsModule {}
