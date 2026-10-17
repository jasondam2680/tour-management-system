// apps/api/src/modules/tour-audits/dto/review-audit-line.dto.ts
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuditLineStatus } from '@prisma/client';
import { ToNumber } from '../../../common/decorators/to-number.decorator';

export class ReviewAuditLineDto {
  @ApiProperty({ enum: AuditLineStatus, description: 'Kết quả kiểm toán dòng' })
  @IsEnum(AuditLineStatus)
  status: AuditLineStatus;

  @ApiPropertyOptional({ description: 'Số tiền duyệt (bắt buộc khi ADJUSTED)' })
  @IsOptional() @IsNumber() @Min(0) @ToNumber()
  auditedAmount?: number;

  @ApiPropertyOptional() @IsOptional() @IsString()
  notes?: string;
}
