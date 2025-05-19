// src/programs/dtos/find-programs.dto.ts
import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FindProgramsDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Search term to look for in indication title/description/icd10' })
  search?: string;
}
