import { Module } from '@nestjs/common';
import { IndicationsService } from './indications.service';
import { IndicationsController } from './indications.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Indication } from 'src/entities/indication.entity';
import { ProgramsService } from 'src/programs/programs.service';
import { Program } from 'src/entities/program.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Indication, Program])],
  providers: [IndicationsService, ProgramsService],
  controllers: [IndicationsController],
})
export class IndicationsModule {}
