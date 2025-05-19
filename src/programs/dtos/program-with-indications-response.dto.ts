import { ApiProperty } from "@nestjs/swagger";
import { IndicationBaseResponseDto } from "src/indications/dtos/indication-base-response.dto";
import { ProgramResponseDto } from "./program-response.dto";
import { Expose, Type } from "class-transformer";

export class ProgramWithIndicationsResponseDto extends ProgramResponseDto {
  @ApiProperty({ type: () => [IndicationBaseResponseDto] })
  @Expose()
  @Type(() => IndicationBaseResponseDto)
  indications: IndicationBaseResponseDto[];
}