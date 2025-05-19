import { Controller, Get, Param, Query } from '@nestjs/common';
import { FindProgramsDto } from './dtos/find-programs.dto';
import { ProgramsService } from './programs.service';
import { ApiBearerAuth, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProgramWithIndicationsResponseDto } from './dtos/program-with-indications-response.dto';

@ApiTags('programs')
@ApiBearerAuth('access-token')
@Controller('api/programs')
export class ProgramsController {
  constructor(private readonly programsService: ProgramsService) {}

  @Get()
  @ApiQuery({ name: 'search', required: false })
  async findAll(@Query() filters: FindProgramsDto) {
    return this.programsService.findByFilters(filters);
  }

  @Get(':program_id')
  @ApiResponse({
    status: 200,
    description: 'Program found',
    type: ProgramWithIndicationsResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Program not found' })
  async findById(
    @Param('program_id') id: string,
  ): Promise<ProgramWithIndicationsResponseDto> {
    return await this.programsService.findByProgramId(id);
  }
}
