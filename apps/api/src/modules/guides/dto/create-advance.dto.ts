import {
  IsString, IsOptional, IsNumber, IsEnum, IsDateString, Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Currency } from '@prisma/client';
import { ToNumber } from '../../../common/decorators/to-number.decorator';

export class CreateAdvanceDto {
  @ApiPropertyOptional({ description: 'Lấy từ URL khi dùng route nested' })
  @IsOptional()
  @IsString()
  guideId?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  tourId?: string;

  @ApiProperty({ description: 'Số tiền tạm ứng' }) @IsNumber() @Min(0) @ToNumber()
  amount: number;

  @ApiPropertyOptional({ enum: Currency, default: Currency.VND }) @IsOptional() @IsEnum(Currency)
  currency?: Currency;

  @ApiPropertyOptional({ description: 'Tỷ giá quy đổi' }) @IsOptional() @IsNumber() @Min(0) @ToNumber()
  exchangeRate?: number;

  @ApiPropertyOptional({ default: 'bank_transfer' }) @IsOptional() @IsString()
  method?: string;

  @ApiPropertyOptional() @IsOptional() @IsDateString()
  advanceDate?: string;

  @ApiPropertyOptional({ description: 'TK cá nhân nhận tạm ứng' }) @IsOptional() @IsString()
  bankAccount?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  notes?: string;
}
