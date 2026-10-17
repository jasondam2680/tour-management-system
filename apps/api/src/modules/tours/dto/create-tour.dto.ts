import {
  IsString, IsEnum, IsOptional, IsInt, IsDateString, IsNumber, Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Currency } from '@prisma/client';
import { ToNumber } from '../../../common/decorators/to-number.decorator';

export class CreateTourDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Tạo từ báo giá đã duyệt' })
  @IsOptional()
  @IsString()
  quotationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiProperty()
  @ToNumber()
  @IsInt()
  @Min(1)
  pax: number;

  @ApiProperty()
  @ToNumber()
  @IsInt()
  @Min(0)
  paxAdult: number;

  @ApiPropertyOptional()
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(0)
  paxChild?: number;

  @ApiProperty({ example: '2025-06-01' })
  @IsDateString()
  travelDateFrom: string;

  @ApiProperty({ example: '2025-06-07' })
  @IsDateString()
  travelDateTo: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  destination?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @ToNumber()
  @IsNumber()
  sellingPrice?: number;

  @ApiPropertyOptional({ enum: Currency })
  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pickupLocation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pickupTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  specialRequests?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  internalNotes?: string;
}
