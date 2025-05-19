import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { LABEL_SOURCES, LabelSource } from 'src/common/types/label-source-type';

export class IndicationBaseResponseDto {
  @ApiProperty({ required: false })
  @Expose()
  id: number;

  @ApiProperty()
  @Expose()
  title: string;

  @ApiProperty()
  @Expose()
  description: string;

  @ApiProperty({ type: String, nullable: true })
  @Expose()
  icd10Code: string | null;

  @ApiProperty({ type: String, nullable: true })
  @Expose()
  icd10Title: string | null;

  @ApiProperty({ enum: Object.values(LABEL_SOURCES), default: LABEL_SOURCES.MANUAL })
  @Expose()
  source: LabelSource;
}
