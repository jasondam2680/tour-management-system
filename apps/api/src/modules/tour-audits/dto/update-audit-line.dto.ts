// apps/api/src/modules/tour-audits/dto/update-audit-line.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateAuditLineDto } from './create-audit-line.dto';

export class UpdateAuditLineDto extends PartialType(CreateAuditLineDto) {}
