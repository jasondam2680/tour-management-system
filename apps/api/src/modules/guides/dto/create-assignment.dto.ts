import {
  IsString, IsOptional, IsNumber, IsEnum, IsDateString, Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Currency } from '@prisma/client';
import { ToNumber } from '../../../common/decorators/to-number.decorator';

export class CreateAssignmentDto {
  @ApiProperty() @IsString()
  tourId: string;

  @ApiPropertyOptional({ default: 'GUIDE' }) @IsOptional() @IsString()
  role?: string;

  @ApiPropertyOptional({ description: 'Giờ lên đoàn' }) @IsOptional() @IsDateString()
  startAt?: string;

  @ApiPropertyOptional({ description: 'Giờ xuống đoàn' }) @IsOptional() @IsDateString()
  endAt?: string;

  @ApiPropertyOptional({ description: 'Số ngày' }) @IsOptional() @IsNumber() @Min(0) @ToNumber()
  days?: number;

  @ApiPropertyOptional({ description: 'Giá/ngày' }) @IsOptional() @IsNumber() @Min(0) @ToNumber()
  dailyRate?: number;

  @ApiPropertyOptional({ enum: Currency, default: Currency.VND }) @IsOptional() @IsEnum(Currency)
  currency?: Currency;

  @ApiPropertyOptional() @IsOptional() @IsString()
  notes?: string;
}
