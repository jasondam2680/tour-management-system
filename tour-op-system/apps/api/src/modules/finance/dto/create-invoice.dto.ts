import { IsString, IsEnum, IsOptional, IsNumber, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InvoiceType, Currency } from '@prisma/client';

export class CreateInvoiceDto {
  @ApiProperty({ enum: InvoiceType })
  @IsEnum(InvoiceType)
  type: InvoiceType;

  @ApiProperty()
  @IsString()
  customerId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tourId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  subtotal?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  taxPct?: number;

  @ApiPropertyOptional({ enum: Currency })
  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
