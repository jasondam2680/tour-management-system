import {
  IsString, IsEnum, IsOptional, IsInt, IsDateString, IsNumber, Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Currency } from '@prisma/client';
import { Type } from 'class-transformer';

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
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pax: number;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  paxAdult: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
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
  @Type(() => Number)
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
