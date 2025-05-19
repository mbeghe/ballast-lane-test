import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateIndicationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  programId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ nullable: true })
  @IsOptional()
  @IsString()
  icd10Code?: string;

  @ApiProperty({ nullable: true })
  @IsOptional()
  @IsString()
  icd10Title?: string;
}
