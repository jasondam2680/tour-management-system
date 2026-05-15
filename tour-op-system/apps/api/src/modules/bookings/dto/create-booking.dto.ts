import {
  IsString, IsEnum, IsOptional, IsInt,
  IsNumber, IsDateString, Min, ValidateNested, IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SupplierCategory, Currency } from '@prisma/client';

export class BookingItemDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  resourceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitCost: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateBookingDto {
  @ApiProperty()
  @IsString()
  tourId: string;

  @ApiProperty()
  @IsString()
  supplierId: string;

  @ApiProperty({ enum: SupplierCategory })
  @IsEnum(SupplierCategory)
  category: SupplierCategory;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  serviceDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  checkIn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  checkOut?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitCost?: number;

  @ApiPropertyOptional({ enum: Currency })
  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  paymentDeadline?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  internalNotes?: string;

  @ApiPropertyOptional({ type: [BookingItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BookingItemDto)
  items?: BookingItemDto[];
}
