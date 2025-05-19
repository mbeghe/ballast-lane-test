import {
  Controller,
  Post,
  Body,
  Delete,
  Param,
  ParseIntPipe,
  Patch,
  Get,
} from '@nestjs/common';
import { IndicationsService } from './indications.service';
import { ApiTags, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CreateIndicationDto } from './dtos/create-indication.dto';
import { UpdateIndicationDto } from './dtos/update-indication.dto';
import { IndicationWithProgramResponseDto } from './dtos/indication-with-program-response.dto';

@ApiTags('indications')
@ApiBearerAuth('access-token')
@Controller('api/indications')
export class IndicationsController {
  constructor(private readonly indicationsService: IndicationsService) {}

  @Post()
  @ApiResponse({
    status: 201,
    description: 'Indication created',
    type: IndicationWithProgramResponseDto,
  })
  async create(
    @Body() dto: CreateIndicationDto,
  ): Promise<IndicationWithProgramResponseDto> {
    return this.indicationsService.create(dto);
  }

  @Delete(':id')
  @ApiResponse({ status: 200, description: 'Indication deleted' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.indicationsService.remove(id);
  }

  @Patch(':id')
  @ApiResponse({
    status: 200,
    description: 'Indication updated',
    type: IndicationWithProgramResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Indication not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateIndicationDto,
  ): Promise<IndicationWithProgramResponseDto> {
    return this.indicationsService.update(id, dto);
  }

  @Get(':id')
  @ApiResponse({
    status: 200,
    description: 'Get indication by ID',
    type: IndicationWithProgramResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Indication not found' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<IndicationWithProgramResponseDto> {
    return this.indicationsService.findOne(id);
  }

  @Get()
  @ApiResponse({
    status: 200,
    description: 'List of all indications',
    type: IndicationWithProgramResponseDto,
    isArray: true,
  })
  async findAll(): Promise<IndicationWithProgramResponseDto[]> {
    return this.indicationsService.findAll();
  }
}
