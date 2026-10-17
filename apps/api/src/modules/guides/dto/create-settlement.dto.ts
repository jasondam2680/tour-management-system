import {
  IsString, IsOptional, IsNumber, IsEnum, Min, Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Currency } from '@prisma/client';
import { ToNumber } from '../../../common/decorators/to-number.decorator';

export class CreateSettlementDto {
  @ApiProperty() @IsString()
  guideId: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  tourId?: string;

  @ApiPropertyOptional({ description: 'Số ngày' }) @IsOptional() @IsNumber() @Min(0) @ToNumber()
  days?: number;

  @ApiPropertyOptional({ description: 'Phí/ngày' }) @IsOptional() @IsNumber() @Min(0) @ToNumber()
  dailyRate?: number;

  @ApiPropertyOptional({ description: 'Tiền tip' }) @IsOptional() @IsNumber() @Min(0) @ToNumber()
  tipAmount?: number;

  @ApiPropertyOptional({ description: 'Thu nhập khác' }) @IsOptional() @IsNumber() @Min(0) @ToNumber()
  otherIncome?: number;

  @ApiPropertyOptional({ description: 'Trừ tạm ứng' }) @IsOptional() @IsNumber() @Min(0) @ToNumber()
  advanceDeduction?: number;

  @ApiPropertyOptional({ description: 'Thuế TNCN %', default: 10 }) @IsOptional() @IsNumber() @Min(0) @Max(100) @ToNumber()
  pitRate?: number;

  @ApiPropertyOptional({ enum: Currency, default: Currency.VND }) @IsOptional() @IsEnum(Currency)
  currency?: Currency;

  @ApiPropertyOptional() @IsOptional() @IsString()
  preparedBy?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  approvedBy?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  notes?: string;
}
