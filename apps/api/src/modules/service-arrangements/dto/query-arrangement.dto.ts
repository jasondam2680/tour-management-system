// apps/api/src/modules/service-arrangements/dto/query-arrangement.dto.ts
import { IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceType, ArrangementStatus } from '@prisma/client';

export class QueryArrangementDto {
  @ApiPropertyOptional({ enum: ServiceType }) @IsOptional() @IsEnum(ServiceType)
  serviceType?: ServiceType;

  @ApiPropertyOptional({ enum: ArrangementStatus }) @IsOptional() @IsEnum(ArrangementStatus)
  status?: ArrangementStatus;
}
