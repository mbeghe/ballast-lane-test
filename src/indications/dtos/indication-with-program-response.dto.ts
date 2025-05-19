import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ProgramResponseDto } from 'src/programs/dtos/program-response.dto';
import { IndicationBaseResponseDto } from './indication-base-response.dto';

export class IndicationWithProgramResponseDto extends IndicationBaseResponseDto {
  @ApiProperty({ type: () => ProgramResponseDto })
  @Expose()
  @Type(() => ProgramResponseDto)
  program: ProgramResponseDto;
}
