import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ProcessLabelDto {
  @ApiProperty({ example: 'dupixent' })
  @IsString()
  @IsNotEmpty()
  label: string;
}
