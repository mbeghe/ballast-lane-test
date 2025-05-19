import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ProgramResponseDto {
  @ApiProperty()
  @Expose()
  id: number;

  @ApiProperty()
  @Expose()
  drug: string;

  @ApiProperty()
  @Expose()
  programId: string;
}
