import { Controller, Post, Body, Logger } from '@nestjs/common';
import { LabelsService } from './labels.service';
import { ProcessLabelDto } from './dtos/process-label.dto';
import { IndicationBaseResponseDto } from '../indications/dtos/indication-base-response.dto';
import { ApiTags, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('labels')
@ApiBearerAuth('access-token')
@Controller('api/labels')
export class LabelsController {
  private readonly logger = new Logger(LabelsController.name);

  constructor(private readonly labelsService: LabelsService) {}

  @Post('process')
  @ApiBody({ type: ProcessLabelDto })
  @ApiResponse({
    status: 200,
    description: 'Processed label',
    type: IndicationBaseResponseDto,
    isArray: true,
  })
  async processLabel(
    @Body() body: ProcessLabelDto,
  ): Promise<IndicationBaseResponseDto[]> {
    const { label } = body;
    this.logger.log(`Request to process label: ${label}`);
    return await this.labelsService.processLabel(label);
  }
}
