import { PartialType } from '@nestjs/swagger';
import { CreateSettlementLineDto } from './settlement-line.dto';

export class UpdateSettlementLineDto extends PartialType(CreateSettlementLineDto) {}
