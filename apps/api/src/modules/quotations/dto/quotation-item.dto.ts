import {
  IsString, IsOptional, IsInt, IsNumber,
  IsBoolean, IsDateString, Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Currency } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class QuotationItemDto {
  @ApiPropertyOptional({ description: 'Day number in tour (1-based)' })
  @IsOptional() @IsInt() @Min(1)
  day?: number;

  @ApiPropertyOptional() @IsOptional() @IsInt()
  sortOrder?: number;

  @ApiProperty({ example: 'hotel', description: 'hotel|restaurant|transport|guide|attraction|other' })
  @IsString()
  category: string;

  @ApiProperty({ example: 'Caravelle Hotel - Deluxe Room' })
  @IsString()
  name: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  description?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  resourceId?: string;

  @ApiProperty({ example: 2 })
  @IsInt() @Min(0)
  quantity: number;

  @ApiPropertyOptional({ default: 'per_person' })
  @IsOptional() @IsString()
  unit?: string;

  @ApiProperty({ example: 120, description: 'Selling price per unit to customer' })
  @IsNumber() @Min(0)
  sellingPrice: number;

  @ApiProperty({ example: 90, description: 'Your cost from supplier' })
  @IsNumber() @Min(0)
  buyingPrice: number;

  @ApiPropertyOptional({ enum: Currency })
  @IsOptional() @IsEnum(Currency)
  currency?: Currency;

  @ApiPropertyOptional() @IsOptional() @IsDateString()
  date?: string;

  @ApiPropertyOptional({ example: '14:00' }) @IsOptional() @IsString()
  startTime?: string;

  @ApiPropertyOptional({ example: '15:30' }) @IsOptional() @IsString()
  endTime?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  notes?: string;

  @ApiPropertyOptional({ default: false }) @IsOptional() @IsBoolean()
  isOptional?: boolean;

  @ApiPropertyOptional({ default: true }) @IsOptional() @IsBoolean()
  isIncluded?: boolean;
}
