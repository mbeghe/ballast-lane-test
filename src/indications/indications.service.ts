import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Indication } from 'src/entities/indication.entity';
import { Repository } from 'typeorm';
import { CreateIndicationDto } from './dtos/create-indication.dto';
import { ProgramsService } from 'src/programs/programs.service';
import { IndicationWithProgramResponseDto } from 'src/indications/dtos/indication-with-program-response.dto';
import { UpdateIndicationDto } from './dtos/update-indication.dto';
import { InternalServerErrorException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { LABEL_SOURCES } from 'src/common/types/label-source-type';

@Injectable()
export class IndicationsService {
  private readonly logger = new Logger(IndicationsService.name);

  constructor(
    private readonly programService: ProgramsService,
    @InjectRepository(Indication)
    private readonly indicationRepo: Repository<Indication>,
  ) {}

  async create(
    dto: CreateIndicationDto,
  ): Promise<IndicationWithProgramResponseDto> {
    const program = await this.programService.findEntityByProgramId(dto.programId);
    if (!program) {
      this.logger.error(`Program with programId ${dto.programId} not found`);
      throw new NotFoundException(
        `Program with programId ${dto.programId} not found`,
      );
    }

    try {
      const saved = await this.indicationRepo.save({
        ...dto,
        source: LABEL_SOURCES.MANUAL,
        program,
      });
      this.logger.log(`Indication saved with id ${saved.id}`);
      return plainToInstance(IndicationWithProgramResponseDto, saved, {
        excludeExtraneousValues: true,
      });;
    } catch (error) {
      this.logger.error('Failed to save indication', error.stack);
      throw new InternalServerErrorException(
        'Failed to save indication',
        error.detail,
      );
    }
  }

  async remove(id: number): Promise<void> {
    const result = await this.indicationRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Indication with ID ${id} not found`);
    }
  }

  async findAll(): Promise<IndicationWithProgramResponseDto[]> {
    return this.indicationRepo.find({ relations: ['program'] });
  }

  async findOne(id: number): Promise<IndicationWithProgramResponseDto> {
    const indication = await this.indicationRepo.findOne({
      where: { id },
      relations: ['program'],
    });

    if (!indication) {
      throw new NotFoundException(`Indication with ID ${id} not found`);
    }

    return indication;
  }

  async update(
    id: number,
    dto: UpdateIndicationDto,
  ): Promise<IndicationWithProgramResponseDto> {
    const indication = await this.indicationRepo.findOne({
      where: { id },
      relations: ['program'],
    });

    if (!indication) {
      throw new NotFoundException(`Indication with ID ${id} not found`);
    }

    if (dto.programId && dto.programId !== indication.program.programId) {
      const newProgram = await this.programService.findEntityByProgramId(
        dto.programId,
      );
      if (!newProgram) {
        throw new NotFoundException(
          `Program with ID ${dto.programId} not found`,
        );
      }
      indication.program = newProgram;
    }

    Object.assign(indication, { ...dto, source: LABEL_SOURCES.MANUAL });

    try {
      const saved = await this.indicationRepo.save(indication);
      this.logger.log(`Updated indication with id ${saved.id}`);
      return plainToInstance(IndicationWithProgramResponseDto, saved, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      this.logger.error('Failed to update indication', error.stack);
      throw new InternalServerErrorException(
        'Failed to update indication',
        error.message,
      );
    }
  }
}
