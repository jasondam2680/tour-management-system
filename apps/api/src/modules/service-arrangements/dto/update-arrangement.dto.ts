// apps/api/src/modules/service-arrangements/dto/update-arrangement.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateArrangementDto } from './create-arrangement.dto';

export class UpdateArrangementDto extends PartialType(CreateArrangementDto) {}
