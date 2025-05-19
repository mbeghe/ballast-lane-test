import { PartialType } from '@nestjs/swagger';
import { CreateIndicationDto } from './create-indication.dto';

export class UpdateIndicationDto extends PartialType(CreateIndicationDto) {}