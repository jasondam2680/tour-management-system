// apps/api/src/modules/tour-audits/dto/create-audit-line.dto.ts
import {
  IsString, IsOptional, IsNumber, IsEnum, IsInt, Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Currency, AuditSourceType } from '@prisma/client';
import { ToNumber } from '../../../common/decorators/to-number.decorator';

export class CreateAuditLineDto {
  @ApiPropertyOptional({ enum: AuditSourceType, default: AuditSourceType.MANUAL })
  @IsOptional() @IsEnum(AuditSourceType)
  sourceType?: AuditSourceType;

  @ApiPropertyOptional({ description: 'ID của chứng từ nguồn (arrangement/settlement)' })
  @IsOptional() @IsString()
  sourceId?: string;

  @ApiProperty({ description: 'Mô tả dòng chi phí' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Số tiền kê khai' })
  @IsNumber() @Min(0) @ToNumber()
  claimedAmount: number;

  @ApiPropertyOptional({ enum: Currency, default: Currency.VND })
  @IsOptional() @IsEnum(Currency)
  currency?: Currency;

  @ApiPropertyOptional() @IsOptional() @IsString()
  notes?: string;

  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @ToNumber()
  sortOrder?: number;
}
