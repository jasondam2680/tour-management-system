import {
  IsString, IsOptional, IsInt, IsNumber,
  IsDateString, IsArray, ValidateNested, IsEnum, Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Currency } from '@prisma/client';
import { QuotationItemDto } from './quotation-item.dto';

export class CreateQuotationDto {
  @ApiProperty({ example: 'Vietnam Classic 7D6N - Hana Travel' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Customer ID' })
  @IsString()
  customerId: string;

  @ApiPropertyOptional({ description: 'Lead ID if created from a lead' })
  @IsOptional() @IsString()
  leadId?: string;

  @ApiProperty({ example: 10, description: 'Total pax' })
  @IsInt() @Min(1)
  pax: number;

  @ApiPropertyOptional({ example: 8 }) @IsOptional() @IsInt() @Min(0)
  paxAdult?: number;

  @ApiPropertyOptional({ example: 2 }) @IsOptional() @IsInt() @Min(0)
  paxChild?: number;

  @ApiPropertyOptional() @IsOptional() @IsDateString()
  travelDateFrom?: string;

  @ApiPropertyOptional() @IsOptional() @IsDateString()
  travelDateTo?: string;

  @ApiPropertyOptional({ example: 7 }) @IsOptional() @IsInt() @Min(1)
  duration?: number;

  @ApiPropertyOptional({ example: 'Vietnam - Hanoi, Halong Bay, Hoi An, Ho Chi Minh' })
  @IsOptional() @IsString()
  destination?: string;

  @ApiPropertyOptional({ example: 'cultural' })
  @IsOptional() @IsString()
  tourType?: string;

  @ApiPropertyOptional({ example: 0 }) @IsOptional() @IsNumber() @Min(0)
  discountAmount?: number;

  @ApiPropertyOptional({ example: 0, description: 'Discount percentage (0-100)' })
  @IsOptional() @IsNumber() @Min(0)
  discountPct?: number;

  @ApiPropertyOptional({ example: 0 }) @IsOptional() @IsNumber() @Min(0)
  taxPct?: number;

  @ApiPropertyOptional({ enum: Currency, default: Currency.USD })
  @IsOptional() @IsEnum(Currency)
  currency?: Currency;

  @ApiPropertyOptional({ description: 'Valid until date' })
  @IsOptional() @IsDateString()
  validUntil?: string;

  @ApiPropertyOptional({ description: 'Notes visible to customer' })
  @IsOptional() @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Internal notes (not shown to customer)' })
  @IsOptional() @IsString()
  internalNotes?: string;

  @ApiPropertyOptional({ type: [QuotationItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuotationItemDto)
  items?: QuotationItemDto[];
}
