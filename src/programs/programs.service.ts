import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Program } from 'src/entities/program.entity';
import { ILike, Repository } from 'typeorm';
import { FindProgramsDto } from './dtos/find-programs.dto';
import { ProgramWithIndicationsResponseDto } from './dtos/program-with-indications-response.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class ProgramsService {
  private readonly logger = new Logger(ProgramsService.name);

  constructor(
    @InjectRepository(Program)
    private readonly programRepo: Repository<Program>,
  ) {}

  async findOrCreateProgram(drug: string, programId: string): Promise<Program> {
    this.logger.log(
      `Looking for program with drug: "${drug}", programId: "${programId}"`,
    );

    let program = await this.programRepo.findOne({
      where: { drug, programId: programId },
    });

    if (program) {
      this.logger.log(`Found existing program (id: ${program.id})`);
      return program;
    }

    this.logger.log(
      `Program not found. Creating new program for drug: "${drug}"`,
    );
    program = this.programRepo.create({ drug, programId: programId });
    await this.programRepo.save(program);
    this.logger.log(`New program created (id: ${program.id})`);

    return program;
  }

  async findEntityByProgramId(programId: string): Promise<Program | null> {
    return await this.programRepo.findOne({
      where: { programId: programId },
      relations: ['indications'],
    });
  }

  async findByProgramId(programId: string): Promise<ProgramWithIndicationsResponseDto> {
    const program = await this.findEntityByProgramId(programId);

    if (!program) {
      this.logger.error(`Program with programId ${programId} not found`);
      throw new NotFoundException(
        `Program with programId ${programId} not found`,
      );
    }

    return plainToInstance(ProgramWithIndicationsResponseDto, program, {
      excludeExtraneousValues: true,
    });
  }

  async findByFilters(
    filters: FindProgramsDto,
  ): Promise<ProgramWithIndicationsResponseDto[]> {
    const query = this.programRepo
      .createQueryBuilder('program')
      .leftJoinAndSelect('program.indications', 'indication')
      .orderBy('program.createdAt', 'DESC');

    if (filters.search) {
      const search = `%${filters.search}%`;
      query.andWhere(
        `
      program.drug ILIKE :search OR
      program.programId ILIKE :search OR
      indication.title ILIKE :search OR
      indication.description ILIKE :search OR
      indication.icd10Code ILIKE :search OR
      indication.icd10Title ILIKE :search
    `,
        { search },
      );
    }

    const programs = await query.getMany();
    return programs.map((program) =>
      plainToInstance(ProgramWithIndicationsResponseDto, program, {
        excludeExtraneousValues: true,
      }),
    );
  }
}
